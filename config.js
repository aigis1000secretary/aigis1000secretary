
// todo
/*
*/

// commit
/*
    tweet object add media
*/

const config = {
    _version: "0.7.0.3",
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
    accessToken: 'UOrWCnsUR3AAAAAAAAAIrYde0tdaFqjsTny15tb_ip-nCpnKdlvKYl7iRNe5vtru',
    dropBoxRoot: "/應用程式/updog/aigis1000secretary/",

    // imgur 
    // vist site: https://api.imgur.com/oauth2/authorize?client_id=84f351fab201d5a&response_type=token
    // get var from url
    IMGUR_REFRESH_TOKEN: "67d3f69b6ee6fd17f0c77a8df78cc87748fa7c68",
    IMGUR_USERNAME: "z1022001jp",
    // https://imgur.com/account/settings/apps
    IMGUR_CLIENT_ID: "84f351fab201d5a",
    IMGUR_CLIENT_SECRET: "72ac198eaeb6edd3748a805f68fb9b9f741a9884",

    // line
    devbot: {
        channelId: 1612493892,
        channelSecret: "ea71aeca4c54c6aa270df537fbab3ee3",
        channelAccessToken: "GMunTSrUWF1vRwdNxegvepxHEQWgyaMypbtyPluxqMxoTqq8QEGJWChetLPvlV0DJrY4fvphSUT58vjVQVLhndlfk2JKQ/sbzT6teG1qUUUEVpVfqs5KGzzn3NUngYMw9/lvvU0QZVGBqPS6wKVxrQdB04t89/1O/w1cDnyilFU="
    },

    // twitter
    twitterCfg: {
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
    },
};

Object.freeze(config.devbot);   // Object.assign({}, config.devbot)
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


