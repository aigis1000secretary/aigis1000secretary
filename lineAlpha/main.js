const Command = require('./command.js');
const config = require('./config.js');
const { Message, OpType, Location, Profile } = require('../curve-thrift/line_types');

class LINE extends Command {
    constructor() {
        super();
        this.receiverID = '';
        this.checkReader = [];
        this.stateStatus = {
            cancel: 0,
            kick: 0,
            qrp: 0, // auto disable QRcode
            invite: 1,
            antikick: 0
        };
        this.messages = new Message();
        this.payload;
        this.stateUpload = {
            file: '',
            name: '',
            group: '',
            sender: ''
        }
    }


    get myBot() {
        const bot = [config.botmid];
        return bot;
    }
    get myAdmin() {
        // const admin = ['ud7c9557e989b1f2a4e71d8f8c6e18153'];
        const admin = [];
        return admin;
    }

    isAdminOrBot(param) {
        return this.myAdmin.includes(param) || this.myBot.includes(param);
    }

    getOprationType(operations) {
        for (let key in OpType) {
            if (operations.type == OpType[key]) {
                if (key !== 'NOTIFIED_UPDATE_PROFILE') {
                    console.info(`[* ${operations.type} ] ${key} `);
                    logToFile(`[${operations.type}] ${key}`, operations), new Date(Date.now());
                }
            }
        }
    }

    poll(operation) {
        this.getOprationType(operation);

        // 'SEND_MESSAGE' : 25, 'RECEIVE_MESSAGE' : 26,
        if (operation.type == OpType['SEND_MESSAGE'] || operation.type == OpType['RECEIVE_MESSAGE']) {
            console.log(operation.message._from, "->", operation.message.to, ":", operation.message.text);
            let message = new Message(operation.message);
            this.receiverID = message.to = (operation.message.to === this.myBot[0]) ? operation.message._from : operation.message.to;
            Object.assign(message, { ct: operation.createdTime.toString() });
            this.textMessage(message)
        }

        // 'NOTIFIED_UPDATE_GROUP' : 11,
        if (operation.type == OpType['NOTIFIED_UPDATE_GROUP'] && !this.isAdminOrBot(operation.param2) && this.stateStatus.qrp == 1) {
            // kick who enable QRcode
            this._kickMember(operation.param1, [operation.param2]);
            this.messages.to = operation.param1;
            // disable QRcode
            this.qrOpenClose();
        }

        // 'NOTIFIED_KICKOUT_FROM_GROUP' : 19,
        if (operation.type == OpType['NOTIFIED_KICKOUT_FROM_GROUP'] && this.stateStatus.antikick == 1) {
            // anti kick
            // param1 = group id
            // param2 = who kick someone
            // param3 = 'someone'
            if (this.isAdminOrBot(operation.param3)) {
                this._invite(operation.param1, [operation.param3]);
            }
            if (!this.isAdminOrBot(operation.param2)) {
                this._kickMember(operation.param1, [operation.param2]);
            }
        }

        // 'NOTIFIED_READ_MESSAGE' : 55,
        if (operation.type == OpType['NOTIFIED_READ_MESSAGE']) {
            //ada reader
            const idx = this.checkReader.findIndex((v) => {
                if (v.group == operation.param1) {
                    return v
                }
            })
            if (this.checkReader.length < 1 || idx == -1) {
                this.checkReader.push({ group: operation.param1, users: [operation.param2], timeSeen: [operation.param3] });
            } else {
                for (var i = 0; i < this.checkReader.length; i++) {
                    if (this.checkReader[i].group == operation.param1) {
                        if (!this.checkReader[i].users.includes(operation.param2)) {
                            this.checkReader[i].users.push(operation.param2);
                            this.checkReader[i].timeSeen.push(operation.param3);
                        }
                    }
                }
            }
        }

        // 'NOTIFIED_INVITE_INTO_GROUP' : 13,
        if (operation.type == OpType['NOTIFIED_INVITE_INTO_GROUP']) { // diinvite
            if (this.stateStatus.cancel == 1) {
                this._cancel(operation.param1, [this.mybot[0]]);
            }

            if (this.stateStatus.invite == 1 || this.isAdminOrBot(operation.param2)) {
                this._acceptGroupInvitation(operation.param1);
            } else {
                // UnhandledPromiseRejectionWarning: TalkException: TalkException
                // this._rejectGroupInvitation(operation.param1);
            }
        }
    }

    async command(msg, reply) {
        if (this.messages.text !== null) {
            // if (this.messages.text === msg.trim()) {
            if (msg.equali(this.messages.text)) {
                console.log("command: " + msg);
                if (typeof reply === 'function') {
                    let result = await reply();
                    if (typeof result !== 'undefined') {
                        this._sendMessage(this.messages, result);
                    }
                    return;
                }
                if (Array.isArray(reply)) {
                    reply.map((v) => {
                        console.log("reply: " + v);
                        this._sendMessage(this.messages, v);
                    })
                    return;
                }
                console.log("reply: " + reply);
                return this._sendMessage(this.messages, reply);
            }
        }
    }

    async textMessage(messages) {
        this.messages = messages;
        let payload = (this.messages.text !== null) ? this.messages.text.split(' ').splice(1).join(' ') : '';
        let receiver = messages.to;
        let sender = messages._from;

        this.command('Hello', ['Hi', 'who is this?']);
        this.command('who is bot', this.getProfile.bind(this));
        this.command('.status', `Your Status: ${JSON.stringify(this.stateStatus)}`);
        this.command('.speed', this.getSpeed.bind(this));
        this.command('.kernel', this.checkKernel.bind(this));   // only for Linux
        this.command(`.set`, this.setReader.bind(this));
        this.command(`.recheck`, this.rechecks.bind(this));
        this.command(`.clearall`, this.clearall.bind(this));
        this.command('.myid', `Your ID: ${sender}`);
        this.command(`.creator`, this.creator.bind(this));

        this.command(`kick ${payload}`, this.OnOff.bind(this));
        this.command(`cancel ${payload}`, this.OnOff.bind(this));
        this.command(`qrp ${payload}`, this.OnOff.bind(this));
        this.command(`invite ${payload}`, this.OnOff.bind(this));
        this.command(`antikick ${payload}`, this.OnOff.bind(this));

        this.command(`.left ${payload}`, this.leftGroupByName.bind(this));
        this.command(`.kickall ${payload}`, this.kickAll.bind(this));
        this.command(`.cancelall ${payload}`, this.cancelMember.bind(this));
        // this.command(`.ip ${payload}`, this.checkIP.bind(this));    // only for Linux
        // this.command(`.ig ${payload}`, this.checkIG.bind(this));    // only for Linux
        this.command(`.qr ${payload}`, this.qrOpenClose.bind(this))
        this.command(`.joinqr ${payload}`, this.joinQr.bind(this));
        this.command(`.spam ${payload}`, this.spamGroup.bind(this));

        this.command(`pap ${payload}`, this.searchLocalImage.bind(this));
        this.command(`.upload ${payload}`, this.prepareUpload.bind(this));
        this.command(`vn ${payload}`, this.vn.bind(this));

        // // repeat mid
        // if (messages.contentType == 13) {
        //     messages.contentType = 0;
        //     if (!this.isAdminOrBot(messages.contentMetadata.mid)) {
        //         this._sendMessage(messages, messages.contentMetadata.mid);
        //     }
        //     return;
        // }

        if (this.stateUpload.group == messages.to && [1, 2, 3].includes(messages.contentType)) {
            if (sender === this.stateUpload.sender) {
                this.doUpload(messages);
                return;
            } else {
                messages.contentType = 0;
                this._sendMessage(messages, 'Wrong Sender !! Reseted');
            }
            this.resetStateUpload();
            return;
        }

        // if(cmd == 'lirik') {
        //     let lyrics = await this._searchLyrics(payload);
        //     this._sendMessage(seq,lyrics);
        // }

    }

}

module.exports = LINE;
