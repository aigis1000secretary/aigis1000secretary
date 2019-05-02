
// line bot
const linebot = require("linebot");
const config = require("./config.js");
const devbot = linebot(Object.assign({}, config.devbot));
const debugLogger = config.debugLogger;


module.exports = {
    bot: devbot,
    botPush: async function (userId, msg) {
        if (typeof (msg) != "string") {
            msg = msg.toString() + JSON.stringify(msg, null, 2)
        }
        if (!config.isLocalHost) {
            await devbot.push(userId, msg);
        } else {
            console.log(">> " + msg);
        }
    },
    botPushLog: async function (msg) {
        if (typeof (msg) != "string") {
            msg = msg.toString() + JSON.stringify(msg, null, 2)
        }
        if (!config.isLocalHost) {
            await devbot.push(debugLogger, "@" + msg);
        } else {
            console.log("@> " + msg);
        }
    },
    botPushError: async function (msg) {
        if (typeof (msg) != "string") {
            msg = msg.toString() + JSON.stringify(msg, null, 2)
        }
        if (!config.isLocalHost) {
            await devbot.push(debugLogger, "#" + msg);
        } else {
            console.log("#> " + msg);
        }
    },

    // Line Message element
    // 文字訊息
    createTextMsg: function (_text) {
        return {
            type: "text",
            text: _text.trim()
        };
    },
    // 圖片訊息
    // url = https://aigis1000secretary.updog.co/刻詠の風水士リンネ/6230667.png encodeURI(img) (utf8 to %utf8 )
    createImageMsg: function (image, thumbnail) {
        return {
            type: "image",
            originalContentUrl: image,
            previewImageUrl: (!thumbnail ? image : thumbnail)
        };
    },
    // 超連結選項
    // altText = "Wiki 連結"
    // label = Name
    // url = "https://seesaawiki.jp/aigis/d/刻詠の風水士リンネ"	encodeURI_JP(url)
    createTemplateMsg: function (altText, label, url) {
        if (label.length != url.length) return "";
        if (label.length <= 0 || 4 < label.length) return "";
        var replyMsg = {
            type: "template",
            altText: altText,
            template: {
                type: "buttons",
                text: altText,
                actions: []
            }
        };
        for (let i = 0; i < label.length; i++) {
            var buttons = {
                type: "uri",
                label: label[i],
                uri: url[i]
            };
            replyMsg.template.actions.push(buttons);
        }
        return replyMsg;
    }
    // DROPBOX: encodeURI(url);
    // Wiki   : encodeURI_JP(url);

};

botPush = module.exports.botPush;
botPushLog = module.exports.botPushLog;
botPushError = module.exports.botPushError;



