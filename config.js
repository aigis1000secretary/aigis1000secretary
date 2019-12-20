
/*
    // todo
    database api input
    character search method rebuild
    newimg error msg
    error msg push
    tidy bot push msg

    config update from dbox
*/

/*
    // commit 
    >> feature/0.8.3/initialMethodRebuild
    fix abot autologin
    disable log msg
    initial Method Rebuild
*/

const _config = module.exports = {
    _version: "0.8.3.0",
    // 主版本號：當你做了不兼容的API修改
    // 次版本號：當你做了向下兼容的功能性新增
    // 修訂號：當你做了向下兼容的問題修正
    // 次修訂號：線上debug

    hostIP: "",
    isLocalHost: require("fs").existsSync("./debug.js"),

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
        IMGUR_CLIENT_ID: "",
        IMGUR_CLIENT_SECRET: "",
        // vist site: https://api.imgur.com/oauth2/authorize?client_id=84f351fab201d5a&response_type=token
        // check REFRESH_TOKEN variable from url
        IMGUR_REFRESH_TOKEN: ""
    },

    // line
    devbot: {
        // https://developers.line.biz/console/channel/1612493892/basic/
        channelId: "",
        channelSecret: "",
        channelAccessToken: ""
    },

    alphatBot: {
        authToken: "",
        certificate: "",
        email: "",
        password: "",
        botId: ""
    },

    // discord
    discordbot: {
        token: ""
    },

    // twitter
    twitterCfg: {
        // https://developer.twitter.com/en/apps
        TWITTER_CONSUMER_KEY: "",
        TWITTER_CONSUMER_SECRET: "",
        TWITTER_ACCESS_TOKEN: "",
        TWITTER_ACCESS_TOKEN_SECRET: "",
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

    autoTest() {
        console.log(JSON.stringify(_config, null, 4));
    },

    init() {
        // Object.freeze(_config.dropbox);
        // Object.freeze(_config.imgur);
        // Object.freeze(_config.devbot);
        // Object.freeze(_config.twitterCfg);


        // imgur 
        _config.imgur.IMGUR_CLIENT_ID = process.env.IMGUR_CLIENT_ID;
        _config.imgur.IMGUR_CLIENT_SECRET = process.env.IMGUR_CLIENT_SECRET;
        _config.imgur.IMGUR_REFRESH_TOKEN = process.env.IMGUR_REFRESH_TOKEN;


        _config.devbot.channelId = process.env.LINE_CHANNEL_ID;
        _config.devbot.channelSecret = process.env.LINE_CHANNEL_SECRET;
        _config.devbot.channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

        _config.alphatBot.authToken = process.env.LINE_ALPHAT_AUTHTOKEN;
        _config.alphatBot.certificate = process.env.LINE_ALPHAT_CERTIFICATE;

        // discord
        _config.discordbot.token = process.env.DISCORD_BOT_TOKEN;

        // twitter
        _config.twitterCfg.TWITTER_CONSUMER_KEY = process.env.TWITTER_CONSUMER_KEY;
        _config.twitterCfg.TWITTER_CONSUMER_SECRET = process.env.TWITTER_CONSUMER_SECRET;
        _config.twitterCfg.TWITTER_ACCESS_TOKEN = process.env.TWITTER_ACCESS_TOKEN;
        _config.twitterCfg.TWITTER_ACCESS_TOKEN_SECRET = process.env.TWITTER_ACCESS_TOKEN_SECRET;


        console.log(JSON.stringify(_config.dropbox, null, 4));
    }
};

setTimeout(function () {
    require("dns").lookup(require("os").hostname(), function (err, address, fam) {
        _config.hostIP = address;
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