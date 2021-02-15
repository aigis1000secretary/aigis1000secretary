
const config = require("./config.js");

const anna = require("./anna.js");

const discord = require("./discord.js");
const line = require("./line.js")
const express = require("./express.js")

const main = async function () {
    // config
    await config.init();
    // core
    await anna.init(config);

    // io
    express.init();
    discord.init(config.discord);
    line.init(config.devbot, config.isLocalHost);

    console.clear();
    console.log(config.hostIP);
    // let cmd = "new";
    // anna.autoTest();

    expressOn();
    discordBotOn();
    lineBotOn();

    console.log("=====*****Anna secretary online*****=====");

}; main();


const expressOn = function () {

    express.app.get("/anna/:command", async (request, response) => {

        let command = request.params.command;
        // console.log(command);

        let result = await anna.replyAI(command, false);

        let responseBody = (typeof (result) == "string" ? result : JSON.stringify(result, null, 2));
        responseBody = responseBody.replaceAll("\n", "<br>");
        response.send(responseBody);
    });
    express.app.get("/stamp/:command", async (request, response) => {

        let command = request.params.command;
        // console.log(command);

        let result = anna.replyStamp(command, true);

        let responseBody = (typeof (result) == "string" ? result : JSON.stringify(result, null, 2));
        responseBody = responseBody.replaceAll("\n", "<br>");
        response.send(responseBody);
    });
    express.app.get("/images/:command", async (request, response) => {

        let command = request.params.command;
        // console.log(command);

        let result = require("./imgur.js").database.image.findData({ tag: command, isGif: true });

        let responseBody = "reply false!";
        if (result.length != 0) {
            result.sort(function (A, B) { return A.tagList.localeCompare(B.tagList) })

            responseBody = "";
            for (let res of result) {
                responseBody += `<blockquote class="imgur-embed-pub" lang="en" data-id="${res.id}"><a href="//imgur.com/${res.id}">${res.tagList}</a></blockquote><script async src="//s.imgur.com/min/embed.js" charset="utf-8"></script><br>`
                responseBody += `<a href="${res.imageLink}">${res.tagList}</a><br><br>`;
            }
        }
        response.send(responseBody);
    });
}

// discord bot 監聽
const discordBotOn = function () {
    // bot.on
    discord.bot.on('message', async function (dMsg) {
        // if (dMsg.author.id == 628127387657175040) {
        if (dMsg.author.id == discord.bot.user.id) { return; }
        let inChat = dMsg.guild ? dMsg.guild.name : "Chat";
        console.log(`{${inChat}} <${dMsg.channel.name}> [${dMsg.author.id}] :\n${dMsg.content.trim()}`);

        // define reply function
        let replyFunc = async function (rMsg) {
            rMsg = discord.formatReply(rMsg);

            try {
                if (!config.isLocalHost) {
                    await dMsg.reply(rMsg);
                } else {
                    console.log("[DC] " + rMsg);
                }
            } catch (e) { console.log(e); }
            return;
        };

        // 取出文字內容
        let msg = dMsg.content.trim();
        let isAdmin = discord.isAdmin(dMsg.author.id);
        let cmd = msg;

        // in user chat
        let callAnna = false;
        if (/^(ANNA |安娜 )/i.test(msg) || inChat == "Chat") {
            callAnna = true;
            cmd = cmd.replace(/^(ANNA |安娜 )/i, "");
        }

        // ask ai
        if (callAnna) {
            if (cmd.length == 0) { // normal response
                replyFunc("是的！王子？");
                return;
            }

            let rMsg = await anna.replyAI(cmd, isAdmin);
            let rStamp = anna.replyStamp(cmd, true);

            // ai done something
            if (rMsg !== false) {
                replyFunc(rMsg);
                return;
            } else if (rStamp !== false) {
                replyFunc(rStamp);
                return;
            } else if (rMsg !== null) {
                // not found]
                let res = cmd.length == 1 ? "王子太短了，找不到..." : randomPick(["不認識的人呢...", "安娜不知道", "安娜不懂", "那是誰？", "那是什麼？"]);
                replyFunc(res);
                return;
            }
        } else if (cmd != "") {

            let target = anna.getFullnameByNick(msg);
            if (msg != target) return;

            let rStamp = anna.replyStamp(target, true);
            if (rStamp !== false) {
                replyFunc(rStamp);
                return;
            }
        }
    });
}

// line bot 監聽
const lineBotOn = function () {
    // bot.on
    line.bot.on("message", async function (event) {
        if (!event) return;

        // define reply function
        let replyFunc = async function (rMsg) {
            rMsg = line.formatReply(rMsg);

            try {
                if (!config.isLocalHost) {
                    await event.reply(rMsg);
                } else {
                    console.log("[LI] " + rMsg);
                }
            } catch (e) { console.log(e); }
            return;
        };

        // 取出文字內容
        let msg = event.message.text.trim()
        let isAdmin = line.isAdmin(event.source.userId);
        let cmd = msg;

        // in user chat
        let callAnna = false;
        if (/^(ANNA |安娜 )/i.test(msg) || event.source.type == "user") {
            callAnna = true;
            cmd = cmd.replace(/^(ANNA |安娜 )/i, "");
        }

        // ask ai
        if (callAnna) {
            if (cmd.length == 0) { // normal response
                replyFunc("是的！王子？");
                return;
            }

            let rMsg = await anna.replyAI(cmd, isAdmin);
            let rStamp = anna.replyStamp(cmd, true);

            // ai done something
            if (rMsg !== false) {
                replyFunc(rMsg);
                return;
            } else if (rStamp !== false) {
                replyFunc(rStamp);
                return;
            } else if (rMsg !== null) {
                // not found]
                let res = cmd.length == 1 ? "王子太短了，找不到..." : randomPick(["不認識的人呢...", "安娜不知道", "安娜不懂", "那是誰？", "那是什麼？"]);
                replyFunc(res);
                return;
            }
        } else if (cmd != "") {

            let target = anna.getFullnameByNick(msg);
            if (msg != target) { target = cmd; }

            let rStamp = anna.replyStamp(target, true);
            if (rStamp !== false) {
                replyFunc(rStamp);
                return;
            }
        }
    });

    // wellcome msg
    line.bot.on("memberJoined", function (event) {
        if (!event) return;

        // define reply function
        let replyFunc = async function (rMsg) {
            rMsg = line.formatReply(rMsg);

            try {
                if (!config.isLocalHost) {
                    await event.reply(rMsg);
                } else {
                    console.log("[LI] " + rMsg);
                }
            } catch (e) { console.log(e); }
            return;
        };

        // 呼叫定型文
        let result = anna.replyStamp("新人", true);
        if (result == false) {
            result = "歡迎使用政務官小安娜 v" + config._version + ", 輸入(安娜 HELP)以取得更多訊息";
        }

        replyFunc(result);
        return true;
    });// */
}