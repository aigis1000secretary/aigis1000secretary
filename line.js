
// line bot
const linebot = require("linebot");
const config = require("./config.js");
const devbot = linebot(Object.assign({}, config.devbot));
const debugLogger = config.debugLogger;


module.exports = {
    bot: devbot,
    botPush: async function (userId, msg) {
        if (typeof (msg) != "string") {
            msg = msg.toString() + JSON.stringify(msg, null, 2)
        }
        if (!config.isLocalHost) {
            await devbot.push(userId, msg);
        } else {
            console.log(">> " + msg);
        }
    },
    botPushLog: async function (msg) {
        if (typeof (msg) != "string") {
            msg = msg.toString() + JSON.stringify(msg, null, 2)
        }
        if (!config.isLocalHost) {
            await devbot.push(debugLogger, "@" + msg);
        } else {
            console.log("@> " + msg);
        }
    },
    botPushError: async function (msg) {
        if (typeof (msg) != "string") {
            msg = msg.toString() + JSON.stringify(msg, null, 2)
        }
        if (!config.isLocalHost) {
            await devbot.push(debugLogger, "#" + msg);
        } else {
            console.log("#> " + msg);
        }
    }
};

botPush = module.exports.botPush;
botPushLog = module.exports.botPushLog;
botPushError = module.exports.botPushError;



