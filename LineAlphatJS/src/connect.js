const LineAPI = require('./api');
var config = require('./config');
var moment = require('moment');
const fs = require("fs");

class LineConnect extends LineAPI {

    constructor(options) {
        super();

        if (typeof options !== 'undefined') {
            this.authToken = options.authToken;
            this.email = options.email;
            this.password = options.password;
            this.certificate = options.certificate;
            this.config.Headers['X-Line-Access'] = (options.authToken ? options.authToken : "");
        }
    }

    getQrFirst() {
        return new Promise((resolve, reject) => {
            this._qrCodeLogin().then(async (res) => {
                this.authToken = res.authToken;
                this.certificate = res.certificate;
                console.info(`[*] Token: ${this.authToken}`);
                console.info(`[*] Certificate: ${res.certificate}`);
                let { mid, displayName } = await this._client.getProfile();
                console.info(`[*] ID: ${mid}`);
                console.info(`[*] Name: ${displayName}`);
                await this._tokenLogin(this.authToken, this.certificate);
                await this._chanConn();
                let icH = await this._channel.issueChannelToken("1341209950"); config.chanToken = icH.channelAccessToken;
                let xxc = icH.expiration; let xcc = xxc.toString().split(" "); let xc = xcc.toString();
                let expireCH = moment("/Date(" + xc + "-0700)/").toString();
                console.info("[*] ChannelToken: " + icH.channelAccessToken);
                console.info("[*] ChannelTokenExpire: " + expireCH + "\n");
                console.info(`NOTE: Dont forget , put your mid and admin on variable 'myBot' in main.js \n`);
                console.info(`Regrads Alfathdirk and thx for TCR Team \n`);
                console.info(`Fixed by Ervan R.F @LD TEAM\n`);

                // 加密 to dropbox
                let alphatBot = {
                    authToken: aesEncrypt(this.authToken),
                    certificate: aesEncrypt(res.certificate),
                    email: aesEncrypt(this.email),
                    password: aesEncrypt(this.password),
                }
                require('../../config.js').saveConfigToDbox(alphatBot);

                // let auth = "module.exports = " + JSON.stringify({ authToken: this.authToken, certificate: res.certificate, ID: mid, email: '', password: '' }, null, 4);
                // fs.writeFile("./src/auth.js", auth, "utf8", function (err, bytesRead, buffer) {
                //     if (err) { console.log(err); }
                // });

                console.info(`=======BOT RUNNING======\n`);
                resolve();
            });
        });
    }

    async startx() {
        let res;
        if (this.authToken) {
            try {
                res = await this.authTokenLogin();
                console.log("authTokenLogin");
                let { mid } = await this._client.getProfile(); config.botmid = mid;
                return res;
            } catch (e) {
                console.log("authToken Login fail");
            }
        }

        if (this.password && this.email) {
            try {
                res = await this.emailLogin();
                console.log("emailLogin");
                let { mid } = await this._client.getProfile(); config.botmid = mid;
                return res;
            } catch (e) {
                console.log("email Login fail");
            }
        }

        try {
            res = await this.manualLogin();
            console.log("manualLogin");
            let { mid } = await this._client.getProfile(); config.botmid = mid;
            return res;
        } catch (e) {
            console.log("manual Login fail");
        }

        return;
    }

    async authTokenLogin() {
        return new Promise((resolve, reject) => {
            this._tokenLogin(this.authToken, this.certificate);
            this._chanConn();
            this._channel.issueChannelToken("1341209950", (err, result) => {
                if (typeof (result) == "undefined") {
                    reject();
                } else {
                    config.chanToken = result.channelAccessToken;
                    this._client.getLastOpRevision((err, result) => {
                        let xrx = result.toString().split(" ");
                        this.revision = xrx[0].toString() - 1;
                        console.info(`=======BOT RUNNING======\n`);
                        resolve(this.longpoll());
                    })
                }
            });
        });
    }

    async emailLogin() {
        return new Promise((resolve, reject) => {
            this._xlogin(this.email, this.password).then(() => {
                this._chanConn();
                console.info("Success Login!");
                console.info(`\n[*] Token: ${config.tokenn}`);
                this.config.Headers['X-Line-Access'] = config.tokenn;
                this._channel.issueChannelToken("1341209950", (err, result) => {
                    config.chanToken = result.channelAccessToken;
                    this._client.getLastOpRevision((err, result) => {
                        let xrx = result.toString().split(" ");
                        this.revision = xrx[0].toString() - 1;
                        resolve(this.longpoll());
                    })
                });

                // 加密 to dropbox
                let alphatBot = {
                    authToken: config.tokenn,
                    certificate: "undefined",
                    email: this.email,
                    password: this.password
                }
                require('../../config.js').saveConfigToDbox(alphatBot);

            }).catch(() => {
                reject();
            });
        });
    }

    async manualLogin() {
        return new Promise((resolve, reject) => {
            this.getQrFirst().then(async (res) => {
                this._client.getLastOpRevision((err, result) => {
                    let xrx = result.toString().split(" ");
                    this.revision = xrx[0].toString() - 1;
                    resolve(this.longpoll());
                })
            });
        })
    }

    async fetchOps(rev) {
        return this._fetchOps(rev, 5);
    }

    async fetchOperations(rev) {
        return this._fetchOperations(rev, 5);

    }

    longpoll() {
        return new Promise((resolve, reject) => {
            this._fetchOps(this.revision, 5).then((operations) => {
                if (!operations) {
                    console.log('No operations');
                    reject('No operations');
                    return;
                }
                return operations.map((operation) => {
                    if (operation.revision.toString() != -1) {
                        let revisionNum = operation.revision.toString();
                        resolve({ revisionNum, operation });
                    }
                });
            });
        });
    }

}

module.exports = LineConnect;
