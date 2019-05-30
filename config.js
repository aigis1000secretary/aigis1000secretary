
// todo
/*
*/

// commit
/*
    >>feature/twitterConfig
    twitter oauth rebuild done
*/

const config = {
    _version: "0.7.1.2",
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
        // check REFRESH_TOKEN var from url
        IMGUR_REFRESH_TOKEN: process.env.IMGUR_REFRESH_TOKEN
    },
    
    // line
    devbot: {
        // https://developers.line.biz/console/channel/1612493892/basic/
        channelId: process.env.LINE_CHANNEL_ID,
        channelSecret: process.env.LINE_CHANNEL_SECRET,
        channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
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
        logStreamToFile: true
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

setTimeout(async function () {
    await require("dns").lookup(require("os").hostname(), function (err, add, fam) {
        config.hostIP = add;
        config.isLocalHost = add.startsWith('192.');
        Object.freeze(config);
    });
}, 1);


