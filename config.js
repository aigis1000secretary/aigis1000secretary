
/*
    // todo
*/

/*
    // commit 
*/

const crypto = require("./crypto.js");
const _config = module.exports = {
    _version: "0.9.0.4",
    // 主版本號：當你做了不兼容的API修改
    // 次版本號：當你做了向下兼容的功能性新增
    // 修訂號：當你做了向下兼容的問題修正
    // 次修訂號：線上debug

    hostIP: "",
    isLocalHost: require("fs").existsSync("./debug.js"),

    adminstrator: "U9eefeba8c0e5f8ee369730c4f983346b",
    admins: ["U9eefeba8c0e5f8ee369730c4f983346b", "U29eb83d36306f3af14a088c3d43fa713"],
    botLogger: "U9eefeba8c0e5f8ee369730c4f983346b",
    abotLogger: "u33a9a527c6ac1b24e0e4e35dde60c79d",

    // 黑田
    // U9eefeba8c0e5f8ee369730c4f983346b
    // u33a9a527c6ac1b24e0e4e35dde60c79d
    // 小安娜傳聲筒
    // U29eb83d36306f3af14a088c3d43fa713
    // ub926d3162aab1d3fbf975d2c56be69aa
    // 小安娜
    // 
    // u759a433ed5a22b3f2daa405ab2363a67

    // dropbox
    dropbox: {
        // https://www.dropbox.com/developers/apps
        DROPBOX_ACCESS_TOKEN: process.env.DROPBOX_ACCESS_TOKEN,
        DROPBOX_ROOT: "/"
    },

    // imgur 
    imgur: {
        // https://imgur.com/account/settings/apps
        IMGUR_CLIENT_ID: process.env.IMGUR_CLIENT_ID,
        IMGUR_CLIENT_SECRET: process.env.IMGUR_CLIENT_SECRET,
        // vist site: https://api.imgur.com/oauth2/authorize?client_id=84f351fab201d5a&response_type=token
        // check REFRESH_TOKEN variable from url
        IMGUR_REFRESH_TOKEN: process.env.IMGUR_REFRESH_TOKEN
    },

    // line
    devbot: {
        // https://developers.line.biz/console/channel/1612493892/basic/
        channelId: process.env.LINE_CHANNEL_ID,
        channelSecret: process.env.LINE_CHANNEL_SECRET,
        channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
    },

    alphatBot: {},

    // discord
    discordbot: {
        token: process.env.DISCORD_BOT_TOKEN
    },

    // twitter
    twitterCfg: {
        // https://developer.twitter.com/en/apps
        TWITTER_CONSUMER_KEY: process.env.TWITTER_CONSUMER_KEY,
        TWITTER_CONSUMER_SECRET: process.env.TWITTER_CONSUMER_SECRET,
        TWITTER_ACCESS_TOKEN: process.env.TWITTER_ACCESS_TOKEN,
        TWITTER_ACCESS_TOKEN_SECRET: process.env.TWITTER_ACCESS_TOKEN_SECRET,
        devLabel: "aigis1000secretary",
        hookId: "1106006997298761728",
        webhookUrl: "https://aigis1000secretary.herokuapp.com/twitterbot/"
        //expressWatchPath: "/twitterbot/"
    },

    switchVar: {
        debug: false,
        debugPush: false,
        logRequestToFile: (process.env.LOG_REQUEST_TO_FILE == "true"),
        logStreamToFile: (process.env.LOG_STREAM_TO_FILE == "true"),
        logLineBotPush: (process.env.LOG_LINE_BOT_PUSH == "true")
    },

    // autoTest() {
    //     let result = [];
    //     let testlog = Object.keys(_config);
    //     for (let i in testlog) {
    //         let key = testlog[i];
    //         if (typeof (_config[key]) == "object") {
    //             result.push(key + ":");
    //             result.push(Object.keys(_config[key]));
    //         } else if (typeof (_config[key]) == "function") {
    //             result.push(key + "()");
    //         } else {
    //             result.push(key);
    //         }
    //     }
    //     console.log(JSON.stringify(result, null, 4).replace(/\"/g, "").replace(/:,/g, ":"));
    // },

    async init() {
        // Object.freeze(_config.dropbox);
        // Object.freeze(_config.imgur);
        // Object.freeze(_config.devbot);
        // Object.freeze(_config.twitterCfg);
        setTimeout(function () {
            require("dns").lookup(require("os").hostname(), function (err, address, fam) {
                _config.hostIP = address;
            });
        }, 1);
        await _config.loadConfigFromDbox();
        await _config.saveConfigToDbox();
    },
    async loadConfigFromDbox() {
        try {
            let rawData = Buffer.from(await require("./dbox.js").fileDownload("AntiKick.json"), "binary").toString();
            // 解密
            let key = process.env.LINE_ALPHAT_JSONKEY;
            let data = crypto.decrypt(rawData, key);

            // data = require('fs').readFileSync("AntiKickRaw.json").toString();

            // encode
            let obj;
            try { obj = JSON.parse(data); } catch (e) { }

            console.log("Update auth token from dropbox");
            Object.assign(_config.alphatBot, obj);
        } catch (e) {
            // error
            console.log(e);
        }
    },
    async saveConfigToDbox() {
        // 加密 to dropbox
        let key = process.env.LINE_ALPHAT_JSONKEY;
        let data = crypto.encrypt(JSON.stringify(_config.alphatBot, null, 2), key);

        console.log("Upload auth token to dropbox");
        // console.log(key)
        // console.log(data)

        require("./dbox.js").fileUpload("AntiKick.json", data);

        require('fs').writeFileSync("AntiKickRaw.json", JSON.stringify(_config.alphatBot, null, 2));
    }
};

String.prototype.replaceAll = function (s1, s2) {
    let source = this;
    while ((temp = source.replace(s1, s2)) != source) {
        source = temp;
    }
    return source.toString();
}
String.prototype.equali = function (s1) {
    let source = this;
    if (!s1) s1 = "";
    return (source.toUpperCase().trim() == s1.toUpperCase().trim());
}

// sleep
global.sleep = function (ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

// 網址編碼
const iconv = require("iconv-lite");
const urlEncode = function (str_utf8, codePage) {
    let buffer = iconv.encode(str_utf8, codePage);
    let str = "";
    for (let i = 0; i < buffer.length; ++i) {
        str += "%" + buffer[i].toString(16);
    }
    return str.toUpperCase();
}
global.urlEncodeJP = function (str_utf8) { return urlEncode(str_utf8, "EUC-JP"); }
global.urlEncodeBIG5 = function (str_utf8) { return urlEncode(str_utf8, "BIG5"); }
global.urlEncodeUTF8 = function (str_utf8) { return urlEncode(str_utf8, "UTF-8"); }
global.encodeURI_JP = function (url) {
    let result = "";

    let jpEncode = "";
    let big5Encode = "";
    let uriEncode = "";

    for (let i = 0; i < url.length; ++i) {
        jpEncode = urlEncodeJP(url[i]);
        big5Encode = urlEncodeBIG5(url[i]);
        uriEncode = encodeURI(url[i]);

        if (jpEncode == big5Encode) {
            result += uriEncode;
        } else {
            result += jpEncode;
        }
    }
    return result;
}