
// todo
/*
    database api input
    LineAPI.setTHttpClient();
    push method
*/

// commit
/*
    >> feature/0.8.0/lineAlphatJS
    lineAlphatJS online
    twitter webhook offline
    alphat bot push tweet image
    bugs fixed
    >> feature/0.8.0/DiscordApi
    discord bot api test online

    0.8.1.1
    imgur bug fixed

    0.8.1.2
    anna.replyAI rebuild for discord api
    
    0.8.1.3
    discord bot bug fix

    0.8.1.4
    anna help msg fix

    0.8.1.5
    change push method

    0.8.1.6
    twitter image push fix
    twitter text push fix
    multithreading rebuild test done
*/

const config = {
    _version: "0.8.1.6",
    // 主版本號：當你做了不兼容的API修改
    // 次版本號：當你做了向下兼容的功能性新增
    // 修訂號：當你做了向下兼容的問題修正
    // 次修訂號：線上debug

    hostIP: "",
    isLocalHost: false,

    adminstrator: "U9eefeba8c0e5f8ee369730c4f983346b",
    admins: [],
    botLogger: "U9eefeba8c0e5f8ee369730c4f983346b",
    abotLogger: "u33a9a527c6ac1b24e0e4e35dde60c79d",

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
        ID: process.env.LINE_ALPHAT_ID,
        email: "",
        password: ""
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
        logRequestToFile: process.env.LOG_REQUEST_TO_FILE,
        logStreamToFile: process.env.LOG_STREAM_TO_FILE,
        logLineBotPush: process.env.LOG_LINE_BOT_PUSH
    }
};


Object.freeze(config.dropbox);
Object.freeze(config.imgur);
Object.freeze(config.devbot);
Object.freeze(config.twitterCfg);
config.autoTest = function () {
    console.log(JSON.stringify(config, null, 4));
};
module.exports = config;

const fs = require("fs");
setTimeout(function () {
    require("dns").lookup(require("os").hostname(), function (err, address, fam) {
        config.hostIP = address;
        config.isLocalHost = fs.existsSync("./debug.js")
        Object.freeze(config);
    });

}, 1);

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