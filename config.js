
// todo
/*
    wait check tweet stream log file
*/

// commit
/*
    >> feature/0.7.3/modular
    Modular start
    fs sync function update
    try-catch
    express Modular done
    command: forgot message fixed
    uploadTask message fixed
    Space format
    change 'var' to 'let'
    update all package
    remote Modular done
    remote disable
    ***lineAlpha***
    import lineAlpha
*/

const config = {
    _version: "0.7.3.7",
    // 主版本號：當你做了不兼容的API修改
    // 次版本號：當你做了向下兼容的功能性新增
    // 修訂號：當你做了向下兼容的問題修正
    // 次修訂號：線上debug

    hostIP: "",
    isLocalHost: false,

    adminstrator: "U9eefeba8c0e5f8ee369730c4f983346b",
    admins: [],
    debugLogger: "U9eefeba8c0e5f8ee369730c4f983346b",

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
    devBot: {
        // https://developers.line.biz/console/channel/1612493892/basic/
        channelId: process.env.LINE_CHANNEL_ID,
        channelSecret: process.env.LINE_CHANNEL_SECRET,
        channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
    },

    // line alpha
    alphaBot: {
        authToken: process.env.LINE_ALPHA_ACCESS_TOKEN,
        certificate: process.env.LINE_ALPHA_CERTIFICATE,
        ID: process.env.LINE_ALPHA_ID,
        email: process.env.LINE_ALPHA_EMAIL,
        password: process.env.LINE_ALPHA_PASSWORD
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
Object.freeze(config.devBot);
Object.freeze(config.twitterCfg);
// config.autoTest = function () {
//     console.log(JSON.stringify(config, null, 4));
// };
module.exports = config;

setTimeout(async function () {
    await require("dns").lookup(require("os").hostname(), function (err, add, fam) {
        config.hostIP = add;
        config.isLocalHost = add.startsWith('192.');
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
