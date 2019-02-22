
// line bot
const linebot = require("linebot");
const bot = linebot({
    channelId: 1612493892,
    channelSecret: "ea71aeca4c54c6aa270df537fbab3ee3",
    channelAccessToken: "GMunTSrUWF1vRwdNxegvepxHEQWgyaMypbtyPluxqMxoTqq8QEGJWChetLPvlV0DJrY4fvphSUT58vjVQVLhndlfk2JKQ/sbzT6teG1qUUUEVpVfqs5KGzzn3NUngYMw9/lvvU0QZVGBqPS6wKVxrQdB04t89/1O/w1cDnyilFU="
});
const debugLogger = "U9eefeba8c0e5f8ee369730c4f983346b";


module.exports = {
    bot: bot,
    botPush: async function (userId, msg) {
        if (typeof (msg) == "string") {
            await bot.push(userId, msg);
        } else /*if (typeof (msg) == "object") */ {
            await bot.push(userId, msg.toString() + JSON.stringify(msg, null, 2));
        }
    },
    botPushLog: async function (msg) {
        if (typeof (msg) == "string") {
            await bot.push(debugLogger, msg);
        } else /*if (typeof (msg) == "object") */ {
            await bot.push(debugLogger, msg.toString() + JSON.stringify(msg, null, 2));
        }
    },
    botPushError: async function (msg) {
        if (typeof (msg) == "string") {
            await bot.push(debugLogger, "@" + msg);
        } else /*if (typeof (msg) == "object") */ {
            await bot.push(debugLogger, "@" + msg.toString() + JSON.stringify(msg, null, 2));
        }
    }
}



