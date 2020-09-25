
// line bot
const config = require("./config.js");
const linebot = require("linebot");
const linebotAlphat = require("./LineAlphatJS/src/bot.js");

class LineMessage {
    constructor(rawData) {
        Object.assign(this, rawData);
    };
}

const _line = module.exports = {
    bot: null,
    abot: null,

    init() {
        _line.devbotInit();
        _line.alphatbotInit();
    },
    devbotInit() {
        _line.bot = linebot(Object.assign({ channelId: '', channelSecret: '', channelAccessToken: '' }, config.devbot));
        require("./express.js").app.post("/linebot/", _line.bot.parser());
    },
    alphatbotInit() {
        // let auth = Object.assign({ authToken: '', certificate: '', email: '', password: '' }, config.alphatBot);
        _line.abot = linebotAlphat(config.alphatBot.auth['uf0073964d53b22f4f404a8fb8f7a9e3e']);
    },

    botPush(userId, msg, type = "") {
        if (!config.isLocalHost) {
            _line.bot.push(userId, msg).then(function (result) {
                if (config.switchVar.logLineBotPush) {
                    // log to dropbox
                    let logObject = { to: userId, type: type, messages: msg, result: result };
                    let name = (result.message == "You have reached your monthly limit." ? "linePushFail" : "linePush");
                    require("./dbox.js").logToFile("line/", name, logObject);
                }
            });
        } else {
            console.log(type + ">> " + JSON.stringify(msg, null, 2));
        }
    },
    // botPushLog(msg) {
    //     module.exports.botPush(config.botLogger, msg, "log");
    // },
    // botPushError(msg) {
    //     module.exports.botPush(config.botLogger, msg, "logError");
    // },

    abotPush(userId, msg) {
        _line.abot.push(userId, msg);
    },
    abotPushLog(msg) {
        _line.abot.push(config.abotLogger, msg);
    },


    // Line Message element
    // 文字訊息
    createTextMsg(_text) {
        return new LineMessage({
            type: "text",
            text: _text.trim()
        });
    },

    // 圖片訊息
    // url = https://aigis1000secretary.updog.co/刻詠の風水士リンネ/6230667.png encodeURI(img) (utf8 to %utf8 )
    createImageMsg(image, thumbnail) {
        return new LineMessage({
            type: "image",
            originalContentUrl: image,
            previewImageUrl: (thumbnail || image)
        });
    },

    // 超連結選項
    // altText = "Wiki 連結"
    // label = Name
    // msg = "https://seesaawiki.jp/aigis/d/刻詠の風水士リンネ"	encodeURI_JP(url)
    createMsgButtons(altText, label, msg) {
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
            let buttons = {};
            if (msg[i].indexOf("http") == 0) {
                buttons.type = "uri";
                buttons.label = label[i];
                buttons.uri = msg[i];
            } else {
                buttons.type = "message";
                buttons.label = label[i];
                buttons.text = msg[i];
            }
            replyMsg.template.actions.push(buttons);
        }
        return new LineMessage(replyMsg);
    },

    // 代傳訊息選項


    // DROPBOX: encodeURI(url);
    // Wiki   : encodeURI_JP(url);

};

// botPush = module.exports.botPush;
// botPushLog = module.exports.botPushLog;
// botPushError = module.exports.botPushError;
abotPushLog = module.exports.abotPushLog;