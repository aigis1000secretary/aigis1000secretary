
const config = require("./config.js");

const anna = require("./anna.js");

const discord = require("./discord.js");
const line = require("./line.js")
const express = require("./express.js")
const twitter = require("./twitter.js");

const main = async function () {
    // config
    await config.init();
    // core
    await anna.init(config);

    // io
    express.init();
    discord.init(config.discord);
    line.init(config.devbot, config.isLocalHost);

    // console.clear();
    console.log(`[main] ${config.hostIP}`);
    // let cmd = "new";
    // anna.autoTest();

    expressOn();
    discordBotOn();
    lineBotOn();
    twitterBotOn();

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

        let result = anna.replyStamp(command, { isGif: true });

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

    express.app.get("/seesaawiki/:command", async (request, response) => {

        let command = request.params.command;
        // console.log(`<${command}>`);

        let newUrl = require("./urlEncoder.js").urlEncodeJP(`https://seesaawiki.jp/aigis/d/${command}`);
        response.redirect(301, newUrl);
        // http://127.0.0.1:8080/seesaawiki/刻詠の風水士リンネ
        // https://aigis1000secretary.herokuapp.com/seesaawiki/刻詠の風水士リンネ
    });
}

// discord bot 監聽
const discordBotOn = function () {
    // bot.on
    discord.bot.on('messageCreate', async function (dMsg) {
        // if (dMsg.author.id == 628127387657175040) {
        if (dMsg.author.id == discord.bot.user.id) { return; }
        let inChat = dMsg.guild ? dMsg.guild.name : "Chat";
        // console.log(`{${inChat}} <${dMsg.channel.name}> [${dMsg.author.id}] :\n${dMsg.content.trim()}`);
        // console.log(`{${inChat}} <${dMsg.channel.name}> [${dMsg.author.username}] :\n${dMsg.content.trim()}`);

        // define reply function
        let replyFunc = async function (rMsg) {
            rMsg = discord.formatReply(rMsg);
            try {
                if (!config.isLocalHost || isAdmin) { await dMsg.reply(rMsg); }
                else { console.log("[DC] " + rMsg); }
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
            let rStamp = anna.replyStamp(cmd, { isAdmin, isGif: true });

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

            let rStamp = anna.replyStamp(target, { isAdmin, isGif: true });
            if (rStamp !== false) {
                replyFunc(rStamp);
                return;
            }
        }
    });
    discord.bot.on('interactionCreate', async function (interaction) {
        if (!interaction.isButton()) { return; }
        if (!interaction.customId.startsWith("option")) { return; }

        // get message
        let message = interaction.message;
        let label;
        for (let row of message.components) {
            for (let btn of row.components) {
                if (btn.customId != interaction.customId) { continue; }
                label = btn.label;
                break;
            }
        }
        // get options label:cmd
        let optionsEmbed = message.embeds.find(embed => embed.description && embed.description.includes(`\`${label}:\``));
        let lines = optionsEmbed.description.split('\n');
        let i = lines.indexOf(`\`${label}:\``);

        let isAdmin = discord.isAdmin(interaction.user.id);
        let cmd = lines[i + 1];

        // define reply function
        let replyFunc = async function (rMsg) {
            rMsg = discord.formatReply(rMsg);
            try {
                if (!config.isLocalHost || isAdmin) { await message.channel.send(rMsg); }
                else { console.log("[DC] " + rMsg); }
            } catch (e) { console.log(e); }
            return;
        };

        // ask ai
        let rMsg = await anna.replyAI(cmd, isAdmin);

        // ai done something
        if (rMsg !== false) {
            replyFunc(rMsg);
        }

        // mute reply
        interaction.reply({ content: ' ' }).catch(() => { });
    });
}

// line bot 監聽
const lineBotOn = function () {
    // bot.on
    let textMessage = async (event) => {
        if (!event || !["message", "postback"].includes(event.type)) return;
        let message = event.message || event.postback || null;
        if (!message) return;

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
        let msg = (message.text || message.data || "").trim();
        let isAdmin = line.isAdmin(event.source.userId);
        let cmd = msg;

        // in user chat
        let callAnna = false;
        if (/^(ANNA |安娜 )/i.test(msg) || event.source.type == "user" || event.type == "postback") {
            callAnna = true;
            cmd = cmd.replace(/^(ANNA |安娜 )/i, "");
        }

        // ask ai
        if (callAnna && msg != "") {
            if (cmd.length == 0) { // normal response
                replyFunc("是的！王子？");
                return;
            }

            let rMsg = await anna.replyAI(cmd, isAdmin);
            let rStamp = anna.replyStamp(cmd, { isAdmin, isGif: false });

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

            let rStamp = anna.replyStamp(target, { isAdmin, isGif: false });
            if (rStamp !== false) {
                replyFunc(rStamp);
                return;
            }
        }
    };
    line.bot.on("message", textMessage);
    line.bot.on("postback", textMessage);

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
        let result = anna.replyStamp("新人", { isAdmin: false, isGif: false });
        if (result == false) {
            result = "歡迎使用政務官小安娜 v" + config._version + ", 輸入(安娜 HELP)以取得更多訊息";
        }

        replyFunc(result);
        return true;
    });// */
}


// twitter bot 監聽 Aigis1000
const twitterBotOn = function () {

    if (config.isLocalHost) { return; }

    let callback = async function (tweet_data) {
        // // get tweet text & media keyword
        // let text = tweet_data.data.text;
        // let mediaKey = "";

        // if source is Aigis1000
        if (tweet_data.includes.users[0].username == "Aigis1000") {

            // // push image data to tweetMediaCache if there are some media
            // if (tweet_data.includes &&
            //     Array.isArray(tweet_data.includes.media) &&
            //     tweet_data.includes.media.length > 0) {

            //     // get keyword in text
            //     mediaKey = text.split('/t.co/').splice(-1);
            //     // map keyword => media.url
            //     tweetMediaCache[mediaKey] = [];
            //     for (let media of tweet_data.includes.media) {
            //         if (media.type == "photo") {
            //             tweetMediaCache[mediaKey].push(media.url);
            //         }
            //     }
            // }

            // // get all announce target
            // let aIDs = await line.abot.LINE._getGroupsJoined();
            // for (let aid of aIDs) {
            //     // // check announce switch
            //     // if (!groupDatabase.data[i].alarm) continue;
            //     // // 14 days no ant msg idle group	3 * 24 * 60 * 60 * 1000
            //     // if (Date.now() - groupDatabase.data[i].timestamp > 259200000) {
            //     //     groupDatabase.data[i].alarm = false;
            //     //     groupDatabase.uploadTask();
            //     //     continue;
            //     // }

            //     line.abot.LINE.push(aid, text);
            // }

            // image to dropbox
            twitter.api.getTweetImages(tweet_data, true);
        } else {
            // // send tweet with media to pushlog
            // if (tweet_data.includes &&
            //     Array.isArray(tweet_data.includes.media) &&
            //     tweet_data.includes.media.length > 0) {
            //     // abotPushLog(`https://twitter.com/${tweet_data.includes.users[0].username}/status/${tweet_data.data.id}`)
            // }

            twitter.api.getTweetImages(tweet_data, false);
        }
    }
    twitter.listen(callback);
}