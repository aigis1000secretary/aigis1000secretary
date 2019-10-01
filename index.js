// 初始化
const config = require("./config.js");
const anna = require("./anna.js");
const imgur = require("./imgur.js");
const dbox = require("./dbox.js");
const express = require("./express.js");
const line = require("./line.js");
const twitter = require("./twitter.js");
let tweetMediaCache = [];
const discord = require("./discord.js");

// groupDatabase
const database = require("./database.js");
let groupDatabase = database.groupDatabase;

// line bot 監聽
const lineBotOn = function () {

    // wellcome msg
    line.bot.on("memberJoined", function (event) {
        if (config.switchVar.logRequestToFile && event) {
            dbox.logToFile("webhook/", "memberJoined", event);
        }
        // anna.debugLog(event);

        let userId = event.source.userId || config.adminstrator;	// Line API bug?
        let sourceId = event.source.groupId || event.source.roomId || userId;

        // 呼叫定型文
        let result = anna.replyStamp("新人");
        if (result == false) {
            result = "歡迎使用政務官小安娜 v" + config._version + ", 輸入(安娜 HELP)以取得更多訊息";
        }
        line.push(sourceId, result);
        return true;
    });// */

    // normal msg
    line.bot.on("message", async function (event) {
        if (config.switchVar.logRequestToFile && event) {
            dbox.logToFile("webhook/", "message", event);
        }

        // 文字事件
        if (event.message.type == "text") {
            anna.debugLog(event);

            // 取出文字內容
            let msg = event.message.text.trim()

            // get source id
            let userId = event.source.userId || config.adminstrator;	// Line API bug?
            let sourceId = event.source.groupId || event.source.roomId || userId;
            if (sourceId[0] != "U") {
                groupDatabase.addData(sourceId, msg.split("\n")[0].trim(), event.timestamp);
            }

            // define reply function
            let replyFunc = function (rMsg) {
                anna.debugLog(rMsg);
                event.reply(rMsg).then(anna.debugLog).catch(anna.debugLog);
                return true;
            };
            // reply tweet image
            for (let key in tweetMediaCache) {
                if (msg.indexOf(key) != -1) {
                    let medias = [];
                    for (let i in tweetMediaCache[key]) {
                        let link = tweetMediaCache[key][i];
                        medias.push(line.createImageMsg(link, link));
                    }

                    // reply media
                    if (medias.length <= 3) {
                        replyFunc(medias);
                    } else if (msg != key) {
                        replyFunc(medias.slice(0, 3));
                    } else {
                        replyFunc(medias.slice(3));
                    }
                    return;
                }
            }

            // bot mode
            // normal response
            if (msg == "安娜") {
                replyFunc("是的！王子？");
                return;
            }
            // 身分驗證
            if (userId == "U9eefeba8c0e5f8ee369730c4f983346b") {
                if (msg == "我婆") {
                    msg = "刻詠の風水士リンネ";
                }
            }
            // in user chat
            if (event.source.type == "user" && msg.toUpperCase().indexOf("ANNA ") == -1 && msg.indexOf("安娜 ") == -1) {
                msg = "ANNA " + msg;
            }

            //
            let result = await anna.replyAI(msg, sourceId, userId)
            if (result != false) {
                replyFunc(result);
                return;
            }

            // egg
            if (Math.floor(Math.random() * 10000) == 0) {
                replyFunc("ちくわ大明神");
                return;
            }

            // 無視...
            // anna.debugLog("Not a command");
            return;
        }
    });
}
// twitter bot 監聽
const twitterBotOn = function () {

    if (!config.isLocalHost) {
        let callback = async function (tweet_data) {
            let aIDs = (await line.alphatbot.getContacts()).split("\n");
            for (let i in aIDs) {
                let aid = aIDs[i];

                // if (!groupDatabase.data[i].alarm) continue;
                // // 14 days no ant msg idle group	3 * 24 * 60 * 60 * 1000
                // if (Date.now() - groupDatabase.data[i].timestamp > 259200000) {
                //     groupDatabase.data[i].alarm = false;
                //     groupDatabase.uploadTask();
                //     continue;
                // }

                let text = tweet_data.text;
                let mediaUrl = "";

                // push image data
                if (tweet_data.medias.length > 0) {
                    // check keyword in text
                    mediaUrl = tweet_data.medias[0].url;
                    if (mediaUrl && text.indexOf(mediaUrl) == -1) {
                        text += "\n" + mediaUrl;
                    }

                    // map keyword => media.link
                    tweetMediaCache[mediaUrl] = [];
                    for (let j in tweet_data.medias) {
                        let media = tweet_data.medias[j];
                        if (media.type == "photo") {
                            tweetMediaCache[mediaUrl].push(media.link);
                        }
                    }
                }

                line.alphatbot.push(aid, text);
                if (tweetMediaCache[mediaUrl].length > 3) {
                    line.alphatbot.push(aid, mediaUrl);
                }
            }
        }
        twitter.stream.litsen("Aigis1000", "", callback);
    }
}
// discord bot 監聽
const discordBotOn = function () {
    discord.bot.on('message', async function (dMsg) {
        if (dMsg.author.id == 628127387657175040) {
            return;
        }

        // define reply function
        let replyFunc = async function (rMsg) {
            try {
                await dMsg.reply(rMsg);
            } catch (e) { console.log(e); }
            return;
        };
        let msg = dMsg.content;

        if (msg == "安娜") {
            replyFunc("是的！王子？");
            return;
        }

        //
        if (msg.indexOf("安娜") == 0 || msg.toLocaleLowerCase().indexOf("anna") == 0) {
            let result = await anna.replyAI(msg)
            if (result != false) {
                let linemsgToString = function (linemsg) {
                    if (linemsg.type == "text") {
                        return linemsg.text;
                    } else if (linemsg.type == "image") {
                        return linemsg.originalContentUrl;
                    } else if (linemsg.type == "template") {
                        let str = "";
                        for (let i in linemsg.template.actions) {
                            let msg = linemsg.template.actions[i];
                            str += msg.label + ": " + msg.uri + "\n";
                        }
                        return str;
                    }
                }

                if (Array.isArray(result)) {
                    for (let i in result) {
                        let res = result[i];
                        if (res.constructor.name == "LineMessage") {
                            result[i] = linemsgToString(result[i]);
                        };
                    }
                } else {
                    if (result.constructor.name == "LineMessage") {
                        result = linemsgToString(result);
                    };
                }
                replyFunc(result);
                return;
            }
        }
    });
}

const timerBotOn = function () {

    let timer = async function () {
        let nd = new Date(Date.now());
        if (nd.getMinutes() < 5) {

            let dayList = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"]
            let str = "";
            str += nd.getFullYear() + "/";
            str += (nd.getMonth() + 1) + "/";
            str += nd.getDate() + " ";
            str += dayList[nd.getDay()] + " ";

            str += nd.getHours() + ":";
            str += nd.getMinutes() + ":";
            str += nd.getSeconds();

            // botPushLog(str);
            await sleep(2 * 60 * 1000);
        }
        setTimeout(timer, 3 * 60 * 1000);
    };
    timer();
}



const main = async function () {
    express.init();

    // 讀取資料
    await anna.init();
    await imgur.init();

    await Promise.all([
        groupDatabase.init()
    ]).catch((error) => { console.log("database init error:\n"); console.log(error); });

    // 開始監聽
    lineBotOn();
    twitterBotOn();
    discordBotOn();
    timerBotOn();

    console.log("=====*****Anna secretary online*****=====");
    // botPushLog("Anna secretary online");

}; main();



/*
const debugFunc = async function () {
	let sourceId = "U9eefeba8c0e5f8ee369730c4f983346b";
	let userId = "U9eefeba8c0e5f8ee369730c4f983346b";
	let replyFunc = function (str) { console.log(">>" + str + "<<"); return str != "" && str && str != "undefined" };
	config.switchVar.debug = true;
}



// Test function
setTimeout(debugFunc, 5 * 1000);// */















