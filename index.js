
const config = require("./config.js");

const anna = require("./anna.js");

const discord = require("./discord.js");
const line = require("./line.js")
const express = require("./express.js")
const twitter = require("./twitter2.js");

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
        // https://aigis1000secretary.fly.dev/seesaawiki/刻詠の風水士リンネ
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

                if (Array.isArray(rMsg.embeds) && rMsg.embeds[0].data?.image?.url) {
                    dMsg.suppressEmbeds(true).catch(() => { });
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

            // ai done something
            let rMsg = await anna.replyAI(cmd, isAdmin);
            if (rMsg !== false) {
                replyFunc(rMsg);
                return;
            }

            let rStamp = anna.replyStamp(cmd, { isAdmin, isGif: true });
            if (rStamp !== false) {
                replyFunc(rStamp);
                return;
            }

            if (rMsg !== null) {
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
        let lines = optionsEmbed.description.split(/\s*\n\s*/);
        let i = lines.indexOf(`\`${label}:\``);

        let isAdmin = discord.isAdmin(interaction.user.id);
        let cmd = lines[i + 1];
        if (/^ANNA /i.test(cmd)) { cmd = cmd.replace(/^ANNA /i, ''); }

        // define reply function
        let replyFunc = async function (rMsg) {
            rMsg = discord.formatReply(rMsg);
            try {
                if (!config.isLocalHost || isAdmin) { await message.channel.send(rMsg); }
                else { console.log("[DC] " + rMsg); }
            } catch (e) { console.log(e); }
            return;
        };

        // mute reply
        interaction.reply({ content: ' ' }).catch(() => { });

        // ask ai
        let rMsg = await anna.replyAI(cmd, isAdmin);

        // ai done something real reply
        if (rMsg !== false) {
            replyFunc(rMsg);
        }
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

            // ai done something
            let rMsg = await anna.replyAI(cmd, isAdmin);
            if (rMsg !== false) {
                replyFunc(rMsg);
                return;
            }

            let rStamp = anna.replyStamp(cmd, { isAdmin, isGif: false });
            if (rStamp !== false) {
                replyFunc(rStamp);
                return;
            }

            if (rMsg !== null) {
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
const twitterBotOn = async function () {

    // debug method
    {
        /*
        // Log every rule ID
        await twitter.client.v2.streamRules()
            .then((_rules) => console.log(_rules.data?.map(rule => rule) || _rules));//*/
        /*
        // force delete all online rules (for debug bearer_token)
        await twitter.client.v2.updateStreamRules({
            delete: {
                ids: (await twitter.getStreamRules())
                    .filter((rule) => rule.tag == 'twitterListener')
                    .map(rule => rule.id)
            }
        })
            .then(console.log)
            .catch(console.log);//*/
    }


    if (config.isLocalHost) { return; }


    // collect configs
    // get client id
    const meID = await twitter.getUserID('Aigis1000Anna');
    if (!meID) { return; }
    // get target ids
    const usernames = await twitter.getFollowingIDs(meID);


    // setup rule
    const ruleTag = 'aigis1000image';
    let localRules = [];
    if (usernames.length > 0) {
        let localRule = '(';
        const ruleEnd = ') -is:retweet has:images';  // -is:reply -is:quote

        for (let username of usernames) {
            // skip same keyword
            if (localRule.includes(username) ||
                localRules.find((rule) => (rule.value.includes(username)))) { continue; }

            // temp
            let temp = '';
            if (localRule.length <= 1) { // temp =           `(#hashA`
                temp = `(from:${username}`;
            } else {                     // temp = `(#hash0 OR #hashA`
                temp = `${localRule} OR from:${username}`;
            }

            // set keyword
            if (temp.length < 512 - ruleEnd.length) {
                localRule = temp;
            } else {
                localRule = `${localRule}${ruleEnd}`;
                localRules.push({ value: localRule, tag: ruleTag });
                localRule = `(from:${username}`;
            }
        }
        // set last keyword
        localRule = `${localRule}${ruleEnd} `;
        localRules.push({ value: localRule, tag: ruleTag });
    }


    // check online rules
    let onlineRules = (await twitter.getStreamRules()).filter((rule) => rule.tag == ruleTag);

    // check online rule valid or not
    let deleteIDs = [];
    for (let { value, id, tag } of onlineRules) {
        // same rule exist
        if (localRules.find((rule) => (rule.value == value))) { continue; }
        // keep id for delete
        deleteIDs.push(id);
    }
    // delete all old rules
    if (deleteIDs.length > 0) {
        console.log(`[TL2] updateStreamRules delete`);
        await twitter.client.v2.updateStreamRules({ delete: { ids: deleteIDs } }).then(console.log);
    }

    // check lost rules & set append list
    let appendRuels = [];
    for (let { value, tag } of localRules) {
        // same rule exist
        if (onlineRules.find((rule) => (rule.value == value))) { continue; }
        // keep id for delete
        appendRuels.push({ value, tag });
    }
    // update rules
    if (appendRuels.length > 0) {
        await twitter.client.v2.updateStreamRules({ add: appendRuels }).then((res) => {
            console.log(`[TL2] updateStreamRules add`);
            if (res.errors) { console.log({ add: appendRuels }) }
            // console.log(res)
        });
    }

    // // Log every rule ID
    // await twitter.client.v2.streamRules()
    //     .then((_rules) => console.log(_rules.data?.map(rule => rule) || _rules));


    // listen 
    const callback = async (eventData) => {
        if (!eventData.data?.id) { return; }

        // check match rule
        let matchRuleValues = [];
        for (let match of eventData.matching_rules) {
            let rule = onlineRules.find((onlineRule) => (onlineRule.id == match.id && onlineRule.tag == ruleTag));
            if (rule && !matchRuleValues.includes(rule.value)) { matchRuleValues.push(rule.value); }
        } // value = `(#hashA OR #hashB) -is:retweet`
        if (matchRuleValues.length <= 0) { return; }

        // get really tweet
        let tweetID = eventData.data?.id || null;
        let tweet = await twitter.getTweet(tweetID);
        if (!tweet) { return; }

        twitter.getTweetImages(tweet);

        // console.log(`====Twitter has sent something: ${tweet.includes?.users[0]?.username} ${eventData.data?.id}`);
        // console.log(new Date(eventData.data?.created_at));
        // console.log(JSON.stringify(eventData, null, 2));
        // console.log(JSON.stringify(tweet, null, 2));
        // for (let media of tweet.includes?.media || []) {
        //     console.log(media.url || null);
        // }
        // console.log(`https://twitter.com/${tweet.includes?.users[0]?.username}/status/${tweetID}`);
        // console.log('====');
    }
    await twitter.listen(callback);

}