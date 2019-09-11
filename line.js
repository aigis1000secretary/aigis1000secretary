
const dbox = require("./dbox.js");
// line bot
const linebot = require("linebot");
const config = require("./config.js");
const devbot = linebot(Object.assign({}, config.devbot));
const debugLogger = config.debugLogger;

class LineMessage {
    constructor(rawData) {
        for (let key in rawData) {
            this[key] = rawData[key];
        }
    };
}

module.exports = {
    bot: devbot,
    botPush: async function (userId, msg) {
        if (msg.constructor.name != "LineMessage" && typeof (msg) != "string") {
            msg = msg.toString() + JSON.stringify(msg, null, 2)
        }

        await module.exports.pushMsg(userId, msg);
    },
    botPushLog: async function (msg) {
        if (msg.constructor.name != "LineMessage" && typeof (msg) != "string") {
            msg = msg.toString() + JSON.stringify(msg, null, 2)
        }

        await module.exports.pushMsg(debugLogger, "@" + msg);
    },
    botPushError: async function (msg) {
        if (msg.constructor.name != "LineMessage" && typeof (msg) != "string") {
            msg = msg.toString() + JSON.stringify(msg, null, 2)
        }

        await module.exports.pushMsg(debugLogger, "#" + msg);
    },
    pushMsg: async function (userId, msg) {
        if (!config.isLocalHost) {
            let result = await devbot.push(userId, msg);

            if (config.switchVar.logLineBotPush) {
                let logObject = {};
                logObject.to = userId;
                logObject.messages = msg;
                logObject.result = result;

                // log to dropbox
                dbox.logToFile("linePush/", (result.message == "You have reached your monthly limit." ? "linePushFail" : "linePush"), logObject);
            }
        } else {
            console.log(">> " + msg);
        }
    },

    // Line Message element
    // 文字訊息
    createTextMsg: function (_text) {
        return new LineMessage({
            type: "text",
            text: _text.trim()
        });
    },
    // 圖片訊息
    // url = https://aigis1000secretary.updog.co/刻詠の風水士リンネ/6230667.png encodeURI(img) (utf8 to %utf8 )
    createImageMsg: function (image, thumbnail) {
        return new LineMessage({
            type: "image",
            originalContentUrl: image,
            previewImageUrl: (!thumbnail ? image : thumbnail)
        });
    },
    // 超連結選項
    // altText = "Wiki 連結"
    // label = Name
    // url = "https://seesaawiki.jp/aigis/d/刻詠の風水士リンネ"	encodeURI_JP(url)
    createTemplateMsg: function (altText, label, url) {
        if (label.length != url.length) return "";
        if (label.length <= 0 || 4 < label.length) return "";
        let replyMsg = {
            type: "template",
            altText: altText,
            template: {
                type: "buttons",
                text: altText,
                actions: []
            }
        };
        for (let i = 0; i < label.length; ++i) {
            let buttons = {
                type: "uri",
                label: label[i],
                uri: url[i]
            };
            replyMsg.template.actions.push(buttons);
        }
        return new LineMessage(replyMsg);
    }
    // DROPBOX: encodeURI(url);
    // Wiki   : encodeURI_JP(url);

};

botPush = module.exports.botPush;
botPushLog = module.exports.botPushLog;
botPushError = module.exports.botPushError;