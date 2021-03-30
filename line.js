
const linebot = require("linebot");

const _line = {
    bot: null,
    isLocalHost: false,
    devbotCfg: {},

    devbotInit() {
        _line.bot = linebot(Object.assign({ channelId: '', channelSecret: '', channelAccessToken: '' }, this.devbotCfg));
        require("./express.js").app.post("/linebot/", _line.bot.parser());
    },


    // Line Message element
    // 文字訊息
    createTextMsg(_text) {
        return {
            type: "text",
            text: _text.trim()
        };
    },

    // 圖片訊息
    // url = https://aigis1000secretary.updog.co/刻詠の風水士リンネ/6230667.png encodeURI(img) (utf8 to %utf8 )
    createImageMsg(image, thumbnail) {
        return {
            type: "image",
            originalContentUrl: image,
            previewImageUrl: (thumbnail || image)
        };
    },

    // 超連結選項
    // altText = "Wiki 連結"
    // label = Name
    // msg = "https://seesaawiki.jp/aigis/d/刻詠の風水士リンネ"	encodeURI_JP(url)
    createMsgButtons(altText, labels, msgs) {
        // check data
        if (labels.length != msgs.length || labels.length <= 0) return "";

        if (labels.length <= 4) {
            let replyMsg = {
                type: "template",
                altText: altText,
                template: {
                    type: "buttons",
                    text: altText,
                    actions: []
                }
            };
            for (let i = 0; i < labels.length; ++i) {
                // build action obj
                let act = {
                    type: msgs[i].indexOf("http") == 0 ? "uri" : "message",
                    label: labels[i],
                    text: msgs[i],
                    uri: msgs[i]
                }

                // push act to col
                replyMsg.template.actions.push(act);
            }
            return replyMsg;

        } else if (labels.length <= 30) {
            let replyMsg = {
                type: "template",
                altText: altText,
                template: {
                    type: "carousel",
                    columns: []
                }
            };

            let c = -1, i = 0;
            for (i = 0; i < labels.length; ++i) {
                // build action obj
                let act = {
                    type: msgs[i].indexOf("http") == 0 ? "uri" : "message",
                    label: labels[i],
                    text: msgs[i],
                    uri: msgs[i]
                }

                // build new columns pre 3 act
                if (i % 3 == 0) {
                    ++c;
                    replyMsg.template.columns.push({
                        text: `${parseInt(i / 3)}/${1 + parseInt(labels.length / 3)}`,
                        actions: []
                    });
                }

                // push act to col
                replyMsg.template.columns[c].actions.push(act);
            }

            // fill actions
            for (let column of replyMsg.template.columns) {
                while (column.actions.length != 3) {
                    column.actions.push({
                        type: "message",
                        label: " ",
                        text: " ",
                    })
                }
            }

            return replyMsg;

        }
        return "";
    },

    createTwitterButtons(dataArray) {

        let replyMsg = {
            type: "template",
            altText: "今日官方推特",
            template: {
                type: "carousel",
                columns: []
            }
        }

        for (let data of dataArray) {
            let text = data.text;
            if (text.length > 120) text = text.substring(0, 119) + "…";
            let label = data.media ? "圖文詳細" : "全文";
            // let url = `https://twitter.com/Aigis1000/status/${data.twitterId}`;

            let column = {
                text: text,
                actions: [{
                    type: "postback",
                    label: label,
                    data: `twitter ${data.twitterId}`
                }, {
                    type: "uri",
                    label: "原文連結",
                    uri: `https://twitter.com/Aigis1000/status/${data.twitterId}`
                }]
            }
            replyMsg.template.columns.push(column);
        }

        return replyMsg;
    }
}

module.exports = {
    bot: null,
    admin: [],

    init(devbot, isLocalHost) {
        _line.isLocalHost = isLocalHost;
        _line.devbotCfg = devbot;
        _line.devbotInit();
        this.bot = _line.bot;
        this.admin = devbot.admin;
    },

    isAdmin(id) {
        return this.admin.includes(id);
    },

    enable() {
        if (_line.bot != null) return true;
        console.log("[line] Line DevBot unable...");
        return false;
    },

    async botPush(userId, msg, type = "") {
        if (!this.enable()) return null;

        if (!_line.isLocalHost && userId != "") {
            let result = await _line.bot.push(userId, msg);

            if (_line.devbotCfg.logLineBotPush) {
                // // log to dropbox
                // let logObject = { to: userId, type: type, messages: msg, result: result };
                // let name = (result.message == "You have reached your monthly limit." ? "linePushFail" : "linePush");
                // require("./dbox.js").logToFile("line/", name, logObject);
                return result; // need to logToFile
            }
            return true;

        } else {
            console.log(`[line] ${type} >> ${JSON.stringify(msg, null, 2)}`);
            return true;
        }
    },

    formatReply(msgs) {
        if (Array.isArray(msgs)) {
            for (let i = 0; i < msgs.length; ++i) {
                msgs[i] = this.replyObj(msgs[i]);
            }
            return msgs;
        } else {
            return this.replyObj(msgs);
        }
    },
    replyObj(msg) {
        let type = typeof (msg);

        if (type == "string") {
            return _line.createTextMsg(msg);

        } else if (type == "object") {
            // console.json(msg);
            type = msg.type;

            if (type == "image") {
                return _line.createImageMsg(msg.imageLink, msg.thumbnailLink);

            } else if (type == "option") {
                return _line.createMsgButtons(msg.title, msg.labels, msg.msgs);

            } else if (type == "twitter") {
                if (msg.data.length <= 10) {
                    return _line.createTwitterButtons(msg.data);

                } else {
                    let res = [];
                    while (msg.data.length > 0) {
                        res.push(_line.createTwitterButtons(msg.data.splice(0, 10)));
                    }

                    return res;
                }

            }
            return msg;
        }
    },
}






