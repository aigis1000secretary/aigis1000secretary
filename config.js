
/*
    // todo
    database api input
    newimg error msg?
    class Database

    R18 switch
    
*/

/*
    // commit 
    >> feature/0.8.7/twitterApiRebuild
    new twitter api
    new method for new api
    new stream listener

    0.8.8.1
    new twitter api online test bug fixed
    
    0.8.8.2
    dbox listdir api exception handling

    0.8.8.3
    twitter bot img to dbox

    0.8.8.4
    delimg command upgrade
*/

const crypto = require("./crypto.js");
const _config = module.exports = {
    _version: "0.8.8.4",
    // 主版本號：當你做了不兼容的API修改
    // 次版本號：當你做了向下兼容的功能性新增
    // 修訂號：當你做了向下兼容的問題修正
    // 次修訂號：線上debug

    hostIP: "",
    isLocalHost: require("fs").existsSync("./debug.js"),

    adminstrator: "U9eefeba8c0e5f8ee369730c4f983346b",
    admins: ["U9eefeba8c0e5f8ee369730c4f983346b", "Ub211d6652fb860935febc6473d1f9ffc"],
    botLogger: "U9eefeba8c0e5f8ee369730c4f983346b",
    abotLogger: "u33a9a527c6ac1b24e0e4e35dde60c79d",

    // 黑田
    // U9eefeba8c0e5f8ee369730c4f983346b
    // u33a9a527c6ac1b24e0e4e35dde60c79d
    // 小安娜傳聲筒
    // Ub211d6652fb860935febc6473d1f9ffc
    // uf0073964d53b22f4f404a8fb8f7a9e3e
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

    alphatBot: {
        authToken: process.env.LINE_ALPHAT_AUTHTOKEN,
        certificate: process.env.LINE_ALPHAT_CERTIFICATE,
        email: process.env.LINE_ALPHAT_EMAIL,
        password: process.env.LINE_ALPHAT_PASSWORD,
        botId: process.env.LINE_ALPHAT_BOTID,
        jsonKey: process.env.LINE_ALPHAT_JSONKEY
    },

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
        logRequestToFile: false,
        logStreamToFile: false,
        logLineBotPush: true
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
    },
    async loadConfigFromDbox() {
        try {
            let rawData = await require("./dbox.js").fileDownload("AlphatBot.json");
            let data = Buffer.from(rawData, "binary");

            let obj; try { obj = JSON.parse(data); } catch (e) { obj = eval("(" + data + ")"); }

            // 解密
            let key = _config.alphatBot.jsonKey;
            obj.authToken = crypto.decrypt(obj.authToken, key);
            obj.certificate = crypto.decrypt(obj.certificate, key);
            obj.email = crypto.decrypt(obj.email, key);
            obj.password = crypto.decrypt(obj.password, key);

            if (!!obj.authToken) {
                console.log("Update auth token from dropbox, EMail: " + obj.email);
                Object.assign(_config.alphatBot, obj);
            }
        } catch (e) {
            // error
            console.log(e);
        }

    },
    async saveConfigToDbox(raw) {

        // 加密 to dropbox
        let key = _config.alphatBot.jsonKey;
        let alphatBot = {
            authToken: crypto.encrypt(raw.authToken, key),
            certificate: crypto.encrypt(raw.certificate, key),
            email: crypto.encrypt(raw.email, key),
            password: crypto.encrypt(raw.password, key),
        }
        console.log("Upload auth token to dropbox, EMail: " + alphatBot.email);

        require("./dbox.js").fileUpload("AlphatBot.json", JSON.stringify(alphatBot, null, 4));
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