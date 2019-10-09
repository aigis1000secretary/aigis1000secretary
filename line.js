
const dbox = require("./dbox.js");
const express = require("./express.js");
// line bot
const config = require("./config.js");

const linebot = require("linebot");
let devbot = linebot(Object.assign({ channelId: '', channelSecret: '', channelAccessToken: '' }, config.devbot));

const linebotAlphat = require("./LineAlphatJS/src/bot.js");
let alphatbot = linebotAlphat(Object.assign({ authToken: '', certificate: '', ID: '', email: '', password: '' }, config.alphatBot));

class LineMessage {
    constructor(rawData) {
        Object.assign(this, rawData);
    };
}

module.exports = {
    devbotInit: function () {
        devbot = linebot(Object.assign({ channelId: '', channelSecret: '', channelAccessToken: '' }, config.devbot));
        express.app.post("/linebot/", devbot.parser());
    },
    alphatbotInit: function () {
        alphatbot = linebotAlphat(Object.assign({ authToken: '', certificate: '', ID: '', email: '', password: '' }, config.alphatBot));
    },

    bot: devbot,
    abot: alphatbot,

    botPush: function (userId, msg) {
        module.exports.pushMsg(userId, "", msg);
    },
    botPushLog: function (msg) {
        module.exports.pushMsg(config.botLogger, "log", msg);
    },
    botPushError: function (msg) {
        module.exports.pushMsg(config.botLogger, "logError", msg);
    },
    pushMsg: function (userId, type, msg) {
        if (!config.isLocalHost) {
            devbot.push(userId, msg).then(function (result) {
                if (config.switchVar.logLineBotPush) {
                    let logObject = { to: userId, type: type, messages: msg, result: result };
                    let name = (result.message == "You have reached your monthly limit." ? "linePushFail" : "linePush");
                    // log to dropbox
                    dbox.logToFile("linePush/", name, logObject);
                }
            });
        } else {
            console.log(type + ">> " + JSON.stringify(msg, null, 2));
        }
    },

    abotPush(userId, msg) {
        alphatbot.push(userId, msg);
    },
    abotPushLog(msg) {
        alphatbot.push(config.abotLogger, msg);
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
            previewImageUrl: (thumbnail || image)
        });
    },

    // 超連結選項
    // altText = "Wiki 連結"
    // label = Name
    // url = "https://seesaawiki.jp/aigis/d/刻詠の風水士リンネ"	encodeURI_JP(url)
    createUriButtons: function (altText, label, url) {
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
    },

    // 代傳訊息選項
    // altText = "Wiki 連結"
    // label = Name
    // url = "https://seesaawiki.jp/aigis/d/刻詠の風水士リンネ"	encodeURI_JP(url)
    createMsgButtons: function (altText, label, msg) {
        if (label.length != msg.length) return "";
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
            let messages = {
                type: "message",
                label: label[i],
                text: msg[i]
            };
            replyMsg.template.actions.push(messages);
        }
        return new LineMessage(replyMsg);
    }
    // DROPBOX: encodeURI(url);
    // Wiki   : encodeURI_JP(url);

};

botPush = module.exports.botPush;
botPushLog = module.exports.botPushLog;
botPushError = module.exports.botPushError;