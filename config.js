
/*
    // todo
    database api input
    character search method rebuild?
    error msg push
    newimg error msg?
    class Database

    config update from dbox
*/

/*
    // commit 
    >> feature/0.8.3/initialMethodRebuild
    fix abot autologin
    disable log msg
    initial Method Rebuild
    abot login token auto upload/update
    crawler fix
    tidy bot push msg
    newimg error msg
    abot timer on

    0.8.4.1
    cfg Update method Catch dbox error
*/

const _config = module.exports = {
    _version: "0.8.4.1",
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
        email: "",
        password: "",
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

        // 加密
        // let key = _config.alphatBot.jsonKey;
        // function aesEncrypt(data) {
        //     let cipher = require('crypto').createCipher('aes192', key)
        //     let crypted = cipher.update(data, 'utf8', 'hex')
        //     crypted += cipher.final('hex');
        //     return crypted;
        // }
        // let alphatBot = {
        //     authToken: aesEncrypt(_config.alphatBot.authToken),
        //     certificate: aesEncrypt(_config.alphatBot.certificate),
        // }
        // require("./dbox.js").fileUpload("AlphatBot.json", JSON.stringify(alphatBot));

        try {
            let data = await require("./dbox.js").fileDownload("AlphatBot.json");
            let obj;
            try { obj = JSON.parse(data); }
            catch (e) { obj = eval("(" + data + ")"); }

            // 解码
            let key = _config.alphatBot.jsonKey;
            function aesDecrypt(encrypt) {
                let decipher = require('crypto').createDecipher('aes192', key);
                let decrypted = decipher.update(encrypt, 'hex', 'utf8');
                decrypted += decipher.final('utf8');
                return decrypted;
            }
            obj.authToken = aesDecrypt(obj.authToken);
            obj.certificate = aesDecrypt(obj.certificate);

            if (!!obj.authToken && !!obj.certificate) {
                Object.assign(_config.alphatBot, obj);
            }
        } catch (e) {
            // error
            console.log(e);
        }
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