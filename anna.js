
const fs = require("fs");
const path = require("path");

const dbox = require("./dbox.js");
const imgur = require("./imgur.js");
const twitter = require("./twitter.js");
const database = require("./database.js");
const discord = require("./discord.js");

module.exports = {
    config: null,

    async init(config) {
        this.config = config;
        // await dbox.init(config.dropbox);
        // await imgur.init(config.imgur);
        // await twitter.init(config.twitter);
        // await database.init(config.isLocalHost);

        await Promise.all([
            imgur.init(config.imgur),
            twitter.init(config.twitter),
            database.init(config.isLocalHost)
        ]);

        _anna._version = config._version;
        _anna.isLocalHost = config.isLocalHost;

        _anna.log = config.isLocalHost ? console.log : _anna.onlineLog;
    },

    async replyAI(rawMsg, isAdmin) {
        // console.log(`rawMsg: <${rawMsg}>`)
        rawMsg = rawMsg.trim();
        if (rawMsg.length == 0) return null;

        // for local debug
        // isAdmin |= _anna.isLocalHost;

        // 分析命令
        let msgLine = rawMsg.split(/\n+/);
        let msgs = msgLine[0].split(/\s+/);

        // >> <command>     <arg1>          <arg2>
        // >> 學習          NNL:黑弓
        // >> 資料庫        CharaDatabase   NNL.ability_aw
        let command = msgs[0] ? msgs[0].toUpperCase() : null;
        let arg1 = (msgs[1] || null);
        let arg2 = (msgs[2] || null);
        let arg3 = (msgs[3] || null);
        // no command
        if (!command) { return null; }

        _anna.log(`Args: <${command}> <${arg1}> <${arg2}> <${arg3}>`);

        // reply
        if (isAdmin && command == "DEBUG") { // debug switch
            _anna.switchVar.debug = !_anna.switchVar.debug;
            return `debug = ${_anna.switchVar.debug ? "on" : "off"}`;

        } else if (command.length == 1) {		// 定型文
            // 同步執行
            let result = _anna.getFullnameByNick(command);
            if (result != false) {
                command = result;
            } else {
                // return "王子太短了，找不到...";
                return false;
            }
        } else if (command == "巨根") {
            return "王子太小了，找不到...";

        } else if (command == "醒醒" || command == "WAKE") {
            return "呣喵~?"; // wake

        } else if (command == "指令" || command == "HELP") {
            // help
            let replyMsg = [
                `歡迎使用政務官小安娜 v${_anna._version}`,
                "",
                "狀態: 確認目前版本，資料庫資料筆數。\n(>>安娜 狀態)",
                "",
                "照片: 上傳角色附圖的網路空間(DropBox)。\n(>>安娜 照片)",
                "",
                "工具: 千年戰爭Aigis實用工具。\n(>>安娜 工具)",
                "",
                "職業: 列出/搜尋資料庫現有職業。\n(>>安娜 職業 デモンサ)",
                "",
                "學習: 用來教會安娜角色的暱稱。\n(>>安娜 學習 NNL:射手ナナリー)",
                "",
                "上傳: 手動上傳資料庫。",
                "",
                "更新: 讀取 wiki 進行資料庫更新。",
                "",
                "",
                "直接輸入稀有度+職業可以搜索角色\n(>>安娜 黑弓) *推薦使用",
                "",
                "輸入關鍵字可進行暱稱搜索&模糊搜索\n(>>安娜 NNL)\n(>>安娜 射手ナナリー)"
            ].join("\n");

            if (isAdmin) {
                replyMsg += "\n\n";
                replyMsg += [
                    "忘記: 刪除特定暱稱。\n(>>安娜 忘記 NNL)",
                    "",
                    "資料庫: 直接修改資料庫內容。\n(>>資料庫 CharaDatabase NNL.ability_aw)",
                    "",
                    "NEW: 線上圖庫手動新增TAG。",
                    "",
                    "NEWIMG: dropbox 圖庫同步至 imgur。"
                ].join("\n");
            }

            return replyMsg;

        } else if (command == "狀態" || command == "STATUS") {
            // status
            await imgur.api.account.getAllAlbums();

            replyMsg = [
                `目前版本 ${_anna._version}`,
                `資料庫內有 ${charaDatabase.data.length} 筆角色資料`,
                `　　　　　 ${classDatabase.data.length} 筆職業資料`,
                `　　　　　 ${imgur.database.images.length} 筆貼圖資料`
            ].join("\n");

            return replyMsg;

        } else if (command == "照片" || command == "圖片" || command == "相片" || command == "PICTURE") {
            return {
                type: "option",
                title: "圖片空間",
                labels: [
                    "上傳新照片",
                    "角色圖庫",
                    "貼圖圖庫"
                ], msgs: [
                    "https://www.dropbox.com/request/FhIsMnWVRtv30ZL2Ty69",
                    "https://www.dropbox.com/sh/ij3wbm64ynfs7n7/AACmNemWzDhjUBycEMcmos6ha?dl=0",
                    "https://www.dropbox.com/sh/w9pxyrmldc676hp/AAAT7bYRtrYLlPrpFWwMb7Zsa?dl=0"
                ]
            };
        } else if (command == "工具" || command == "TOOL") {
            // return [{
            //     type: "option",
            //     title: "實用工具 (1)",
            //     labels: [
            //         "特殊合成表",
            //         "經驗值計算機",
            //         "體魅計算機",
            //         "千年戦争アイギス 作戦図＋"
            //     ], msgs: [
            //         "https://seesaawiki.jp/aigis/d/%C6%C3%BC%EC%B9%E7%C0%AE%C9%BD",
            //         "http://aigistool.html.xdomain.jp/EXP.html",
            //         "http://aigistool.html.xdomain.jp/ChariSta.html",
            //         "https://aigis1000secretary.github.io/AigisTools/html/AigisTactics.html"
            //     ]
            // }, {
            //     type: "option",
            //     title: "實用工具 (2)",
            //     labels: [
            //         "DPS 一覽表 (日)",
            //         "Buff 試算表 (暫)",
            //         "Youtube 攻略頻道"
            //     ], msgs: [
            //         "http://www116.sakura.ne.jp/~kuromoji/aigis_dps.htm",
            //         "https://vprjct.github.io/aigistools/buff.html",
            //         "https://www.youtube.com/channel/UC8RlGt22URJuM0yM0pUyWBA"
            //     ]
            // }];
            return {
                type: "option",
                title: "實用工具",
                labels: [
                    "作戦図＋",
                    "所持チェッカー＋",
                    "経験値計算機＋ BETA",

                    "特殊合成表",
                    "DPS 一覽表 (日)",
                    "體魅計算機",

                    "Buff 試算表 (暫)",
                    "經驗值計算機 (旧)",
                    "Youtube 攻略頻道"
                ], msgs: [
                    "https://aigis1000secretary.github.io/AigisTools/html/AigisTactics.html",
                    "https://aigis1000secretary.github.io/AigisTools/html/AigisChecker.html",
                    "https://aigis1000secretary.github.io/AigisTools/html/AigisEXP.html",

                    "https://seesaawiki.jp/aigis/d/%C6%C3%BC%EC%B9%E7%C0%AE%C9%BD",
                    "http://www116.sakura.ne.jp/~kuromoji/aigis_dps.htm",
                    "http://aigistool.html.xdomain.jp/ChariSta.html",

                    "https://vprjct.github.io/aigistools/buff.html",
                    "http://aigistool.html.xdomain.jp/EXP.html",
                    "https://www.youtube.com/channel/UC8RlGt22URJuM0yM0pUyWBA"
                ]
            };
        } else if (command == "職業") {
            let classDB = (arg1 == null ? classDatabase.data :
                classDatabase.data.filter(function (classData) {
                    if (arg1[0] == "近" && classData.type == "近接型") return true;
                    if (arg1[0] == "遠" && classData.type == "遠距離型") return true;
                    if (arg1[0] == "兩" && classData.type == "両用型") return true;
                    return (classData.name.indexOf(arg1) != -1);
                }));

            classDB.sort(function (A, B) { return A.type.localeCompare(B.type) })

            let replyMsg = [];
            for (let classData of classDB) {
                replyMsg.push(classData.index.join(",  "));
            }
            replyMsg = replyMsg.join("\n");
            return (replyMsg == "" ? "找不到呢..." : replyMsg);

        } else if (command == "學習" || command == "LEARN") {
            // 關鍵字學習
            // <arg1>
            if (arg1 == null) { return "[學習] 要學甚麼?\n(>>安娜 學習 NNL:射手ナナリー)"; }

            let learn = arg1.replace("：", ":");
            _anna.log(`learn: <${learn}>`)

            let keys = learn.split(":"); // NNL:黑弓
            if (keys.length < 2) { return "[學習] 看不懂..."; }

            // get nick & target
            keys[0] = keys[0].trim();
            keys[1] = keys[1].trim();

            // search
            let target;
            target = _anna.getFullnameByNick(keys[0]);
            if (target != false) { return `[學習] 安娜知道是 <${target}>`; }

            target = _anna.getFullnamesByClass(keys[1]);
            if (target.length != 1) {
                target = target.concat(_anna.getFullnamesByIndex(keys[1]));
                // del same element
                target = target.filter((el, i, arr) => arr.indexOf(el) === i);
            }

            _anna.log(`new nick : <${keys[0]}>`);
            _anna.log(`full name: <${target}>`);

            // reply
            if (target.length == 0) {
                return `[學習] ${randomPick(["不認識的人呢...", "那是誰？"])}`;

            } else if (target.length > 1) {
                return "[學習] 太多人了，不知道是誰";

            } else {
                // 搜索成功
                // 異步執行
                nickDatabase.addData(target[0], keys[0]);
                // wait 10 min to save
                nickDatabase.uploadTask();

                // log to dc dm
                discord.pushLog(`學習 ${target[0]} ${keys[0]}`);
                return "[學習] 嗯！記住了！";
            }

        } else if (command == "上傳" || command == "UPLOAD") {

            // 異步執行
            try {
                await charaDatabase.saveDB();
                await charaDatabase.uploadDB();

                await nickDatabase.saveDB();
                await nickDatabase.uploadDB();

                await classDatabase.saveDB();
                await classDatabase.uploadDB();

            } catch (error) {
                return `上傳異常!\n${JSON.stringify(error, null, 2)}`;
            }

            return "上傳完成!";

        } else if (command == "更新" || command == "UPDATE") {

            await charaDatabase.init().catch(_anna.log);
            await classDatabase.init().catch(_anna.log);

            return "更新中...";

        } else if (isAdmin && command == "忘記") {
            // forgot
            // <arg1>
            if (arg1 == null) {
                return "[忘記] 沒有目標"; // forgot what?
            }

            let learn = arg1;
            _anna.log(`forgot: <${learn}>`);

            // 同步執行
            let i = nickDatabase.indexOf(learn.trim());
            if (i > -1) {
                nickDatabase.data.splice(i, 1);
            }
            // wait 10 min to save
            nickDatabase.uploadTask();

            return "[忘記] 忘記了!";

        } else if (isAdmin && (command == "初始化" || command == "INIT")) {
            await this.init(this.config);
            return "初始化完成!";

        } else if (command == "NEWIMG") {
            // imgUploader.upload();
            _anna.uploadImages();
            return "上傳圖檔中...";

        } else if (isAdmin && (command == "NEW" || command == "NEW8")) {
            if (arg1 == null || arg2 == null) {
                // >> NEW
                // >> NEW <#1>
                // >> NEW <md5>
                let imgArray = imgur.database.image.findData(
                    /\S{32}/.test(arg1) ? { md5: arg1 } : { tag: "NewImages" }
                );

                let replyMsg = [];
                if (imgArray.length > 0) {
                    let i = 0;
                    if (/#\d+/.test(arg1)) {
                        i = parseInt(/\d+/.exec(arg1).toString());  // >> NEW #1
                    } else {
                        i = Math.floor(Math.random() * imgArray.length);    // >> NEW
                    }

                    if (imgArray.length == 0) { return "md5錯誤!"; }
                    else if (i >= imgArray.length) { return "index錯誤!"; }

                    let img = imgArray[i];
                    _anna.log(`img: <${img.fileName}>`);

                    // is twitter image
                    if (/^[A-Za-z0-9_]{5,15}-\d{18,19}-\d{8}_\d{6}/.test(img.fileName)) {
                        // get tweet id
                        let tweetId = /\d{18,19}/.exec(img.fileName).toString();
                        // get tweet text
                        let tweet_data = await twitter.api.getTweet(tweetId)
                        if (tweet_data == null || !tweet_data.data) tweet_data = { data: { text: false } };
                        // get cards in text
                        let array = _anna.getFullnamesFromText(tweet_data.data.text);

                        if (array.length > 0) {

                            replyMsg.push({
                                type: "image",
                                imageLink: img.imageLink,
                                thumbnailLink: img.thumbnailLink
                            });
                            replyMsg.push(`new ${img.md5} `);

                            let labels = [], msgs = [];
                            for (let name of array) {
                                labels.push(name);
                                msgs.push("new " + img.md5 + " " + name);
                            }
                            labels.push("next");
                            msgs.push("new");

                            replyMsg.push({
                                type: "option",
                                title: `[${i}/${imgArray.length}]`,
                                labels,
                                msgs
                            });

                            // _anna.log(JSON.stringify(replyMsg));
                            return replyMsg;
                        }
                    }

                    replyMsg.push({
                        type: "image",
                        imageLink: img.imageLink,
                        thumbnailLink: img.thumbnailLink
                    });
                    replyMsg.push(`[${i}/${imgArray.length}]`);
                    replyMsg.push(`new ${img.md5} `);

                    return replyMsg;

                } else {
                    return (arg1 == null ? "沒有新照片" : "md5錯誤!");
                }

            } else {
                // >> NEW <md5> <name>
                let imgArray = [];
                if (/#\d+/.test(arg1)) {
                    // >> NEW #3
                    imgArray = imgur.database.image.findData({ tag: "NewImages" });

                    let index = parseInt(/\d+/.exec(arg1).toString());
                    if (index >= imgArray.length) { return "index錯誤!"; }

                    imgArray = [imgArray[index]];
                } else {
                    imgArray = imgur.database.image.findData({ md5: arg1, tag: "NewImages" });
                }

                if (imgArray.length != 1) { return `md5錯誤! (${imgArray.length} results!)`; }

                if (arg2 != null) {

                    let charaArray = _anna.searchName(arg2);
                    if (charaArray.length == 0) {
                        return "搜尋失敗!";

                    } else if (charaArray.length > 1) {
                        return `搜尋不明確: \n${charaArray.join("\n")}`;

                    } else if (charaArray.length == 1) {
                        let target = charaArray[0].trim();
                        let newTag = `/Images/Character/${target}/${imgArray[0].fileName}`;
                        if (command == "NEW8") { newTag = `/Images/8周年賀圖/Character/${target}/${imgArray[0].fileName}`; }

                        // move image file
                        try {
                            await dbox.fileMove(imgArray[0].tagList, newTag);
                        } catch (error) {
                            _anna.log("分類錯誤!");
                            _anna.log(error);
                            return "分類錯誤!";
                        }

                        // set new taglist
                        await imgur.api.image.updateImage({ imageHash: imgArray[0].id, tagList: newTag });

                        // // update imgur database
                        // imgur.database.deleteImageData({ id: imgArray[0].id });
                        // imgur.api.image.image({ imageHash: imgArray[0].id });

                        // return "分類完成";
                        return {
                            type: "option",
                            title: `分類完成`,
                            labels: [`>> ${target}`, "next"],
                            msgs: [`https://aigis1000secretary.herokuapp.com/images/${target}`, "new"]
                        };

                    }
                }
            }

        } else if (isAdmin && (command == "DELIMG")) {
            let key = (arg1.equali("new") ? arg2 : arg1);
            if (key != null) {
                let imgArray = /[\S]{32}/.test(key) ?
                    imgur.database.image.findData({ md5: key, isGif: true }) :
                    /\//.test(key) ?
                        imgur.database.image.findData({ tagList: key, isGif: true }) :
                        imgur.database.image.findData({ tag: key, isGif: true });

                if (imgArray.length != 1) {
                    _anna.log(`刪除錯誤: 目標異常! (${imgArray.length} results!)`);
                    return `刪除錯誤: 目標異常! (${imgArray.length} results!)`;
                }

                try {
                    let fileName = imgArray[0].fileName;
                    let tagList = imgArray[0].tagList;
                    await imgur.api.image.imageDeletion({ imageHash: imgArray[0].id });
                    await dbox.fileMove(tagList, "/DelImages/" + fileName);
                } catch (error) {
                    _anna.log("刪除錯誤!");
                    _anna.log(error);
                    return "刪除錯誤 (API Error)!";
                }
                return "刪除成功";
            }
            return "刪除錯誤: 空目標!";

        } else if (isAdmin && (command == "HOTFIX")) {
            try {
                let rawData = await dbox.fileDownload("/hotfix.js");
                rawData = Buffer.from(rawData, "binary").toString();
                return eval(rawData)();

            } catch (e) {
                // return null;           
                return e.message.toString();

            }

        } else if (false && (command == "ABOTINIT") && false) {
            // line.alphatbotInit();
            return "";
        } else if (false && command.indexOf("://LINE.ME/R/") != -1 && false) {
            // line.abot.LINE.joinQr(msgs[0].trim());
            return "";
        } else if (command.indexOf("HTTP") == 0) {
            // tweet image to dropbox
            let url = command;

            if (/(\/)(\d{18,19})(\?|\/|$)/.test(url)) {
                let tweetId = /\d{18,19}/.exec(url).toString();
                let tweet_data = await twitter.api.getTweet(tweetId);
                if (!tweet_data) { return false; }

                twitter.api.getTweetImages(tweet_data, isAdmin);

                let replyMsg = [];
                if (tweet_data.includes && Array.isArray(tweet_data.includes.media) && tweet_data.includes.media.length > 0) {
                    for (let media of tweet_data.includes.media) {
                        if (media.type == "photo") {
                            replyMsg.push({
                                type: "image",
                                imageLink: media.url,
                                thumbnailLink: media.url
                            });
                        }
                    }
                }
                return replyMsg;
            }
            return false;

        } else if (command == "推特" || command == "TWITTER") {

            if (arg1 == null) { //  || !isNaN(Date.parse(arg1))
                // search tweet list
                let tweets = await twitter.api.getTweetList("Aigis1000");
                // filter today tweet
                tweets = tweets.filter((tweet) => {
                    let now = new Date(Date.now());
                    let date = new Date(tweet.created_at);
                    return (now.getDate() == date.getDate()
                        && now.getMonth() == date.getMonth()
                        && now.getFullYear() == date.getFullYear());
                })
                // sort
                tweets.sort(function (a, b) {
                    let idA = a.id_str;
                    let idB = b.id_str;
                    if (idA < idB) { return -1; }
                    if (idA > idB) { return 1; }
                    return 0;
                })

                let replyMsg = {
                    type: "twitter",
                    // columns
                    data: []
                }
                // set tweet
                for (let tweet of tweets) {
                    let tweetId = tweet.id_str;
                    let tweet_data = await twitter.api.getTweet(tweetId);
                    if (!tweet_data) { continue; }
                    try {
                        let column = {
                            text: tweet_data.data.text,
                            twitterId: tweetId,
                            media: false,
                            created_at: tweet_data.created_at,
                            includes: Object.assign({ media: [], users: [{ id: null, name: null, username: null }] }, tweet_data.includes)
                        };
                        if (column.includes.media.length > 0) { column.media = true; }
                        replyMsg.data.push(column);
                        // console.json(column)
                    } catch (e) {
                    }
                }
                return replyMsg;

            }

            let cdTime = process.env.CDTIME;
            if (/\d{18,19}/.test(arg1) && (isAdmin || !cdTime || Date.now() - cdTime > 30 * 1000)) {
                let replyMsg = [];

                // get tweet id
                let tweetId = arg1;
                let tweet_data = await twitter.api.getTweet(tweetId);
                if (!tweet_data) { return false; }

                // get tweet text
                let text = tweet_data.data.text;
                replyMsg.push(text);

                if (tweet_data.includes &&
                    Array.isArray(tweet_data.includes.media) &&
                    tweet_data.includes.media.length > 0) {

                    for (let media of tweet_data.includes.media) {
                        if (media.type == "photo") {
                            replyMsg.push({
                                type: "image",
                                imageLink: media.url,
                                thumbnailLink: media.url
                            });
                        }
                    }
                }
                return replyMsg;
            }
            return "";

        } else if (/^(\s|\dD\d|\d|[\+\-\*\/\(\)])+$/i.test(msgLine[0].trim())) {
            // dice cmd            
            let result = msg1.replace(/\s/g, "");
            result = result.replace(/(\d{1,6})(D)(\d{1,6})/ig, (m, p1, p2, p3) => {
                let nums = [];
                for (let i = 0; i < p1; ++i) { nums.push(Math.ceil(Math.random() * p3)); }
                return `(${nums.join('+')})`;
            });
            try {
                return `${result} = \n${eval(result)}`;
            } catch (e) {
                _anna.log(e.message);
                return "這個東西怪怪的...";
            }
        }

        // 搜尋資料
        let result = false;
        result = _anna.searchData(command);
        if (result != false) {
            return result;
        }

        return false;
    },

    // 定型文貼圖
    replyStamp(msg, { isAdmin = false, isGif = false }) {
        if (!msg) return false;
        _anna.log(`replyStamp(${msg})`);

        // Rush!!
        let cdTime = process.env.CDTIME;
        if (msg.equali("Rush!!") && (isAdmin || !cdTime || Date.now() - cdTime > 30 * 1000)) {
            process.env.CDTIME = Date.now();

            let imgArray = imgur.database.image.findData({ tag: "images", isGif });
            if (imgArray.length > 0) {
                let i = Math.floor(Math.random() * imgArray.length);
                let j = Math.floor(Math.random() * i);
                let k = Math.floor(Math.random() * (imgArray.length - i)) + i;
                return [
                    { type: "image", imageLink: imgArray[i].imageLink, thumbnailLink: imgArray[i].thumbnailLink },
                    { type: "image", imageLink: imgArray[j].imageLink, thumbnailLink: imgArray[j].thumbnailLink },
                    { type: "image", imageLink: imgArray[k].imageLink, thumbnailLink: imgArray[k].thumbnailLink }
                ];
            }
        }

        // by tag
        let imgArray = imgur.database.image.findData({ tag: msg, isGif });
        // by filename or md5
        if (imgArray.length < 1) {
            imgArray = imgArray.concat(imgur.database.image.findData({ fileName: msg, isGif }));
            imgArray = imgArray.concat(imgur.database.image.findData({ md5: msg, isGif }));
        }

        let forceIndex;
        if (/ #\d+/.test(msg)) {
            let index = / #\d+/.exec(msg).toString();
            msg = msg.replace(index, "");
            forceIndex = parseInt(index.replace(" #", ""));
        }
        if (imgArray.length > 0) {
            let i = (imgArray.length == 1 ? 0 :
                forceIndex < imgArray.length ? forceIndex :
                    Math.floor(Math.random() * imgArray.length));

            return { type: "image", imageLink: imgArray[i].imageLink, thumbnailLink: imgArray[i].thumbnailLink };
        }

        return false;
    },

    getFullnameByNick(command) {
        return _anna.getFullnameByNick(command);
    },

    async autoTest(cmd) {
        await sleep(1000);

        // console.clear();

        let testCmds = [
            // "狀態",
            // "職業",
            // "職業 ナ",

            // "學習 NNLK:白射手ナナリー",

            // "NNLK",
            // "黑弓",
            // "忘記 NNLK",
            "NNLK",

            "射",
            "シャル",
            "白き射手ナナリー",
            "王子通常",
            "刻詠の風水士リンネ",

            "update",

            "new ",
            "new 0f96ddbcf983dc854b3bb803c4159d5b ",
            "new 0f96ddbcf983dc854b3bb803c4159d5b NNL"
        ];
        let testLog = (msg) => { ["boolean", "string"].includes(typeof (msg)) ? console.log(msg) : console.json(msg) }

        for (let cmd of testCmds) {
            await this.replyAI(cmd, true).then(testLog);
            console.log("");
            await sleep(1000);
        }
    }
}

let nickDatabase = database.nickDatabase;
let charaDatabase = database.charaDatabase;
let classDatabase = database.classDatabase;
const _anna = {
    _version: null,
    isLocalHost: null,
    switchVar: {
        debug: false
    },

    log: () => { },
    onlineLog(msg) {
        if (!_anna.switchVar.debug) return;

        console.log(msg);
    },


    // 搜尋&回復
    // return [name1, name2]
    searchName(command) {
        let results = [];
        let count = 0;

        // is nickname?
        // 搜索暱稱
        results = this.getFullnameByNick(command);
        _anna.log(" nick Result: <" + results + ">");
        if (results != false) {
            // found 1
            return [results];
        }

        // is class?
        // 搜索職業
        results = this.getFullnamesByClass(command);
        count = results.length;
        _anna.log(" class Result[" + count + "]: <" + results + ">");
        if (count >= 1) {
            return results;
        }

        // 模糊搜索名稱
        results = this.getFullnamesByIndex(command);
        count = results.length;
        _anna.log(" chara Result[" + count + "]: <" + results + ">");
        if (count >= 1) {
            return results;
        }

        return [];
    },
    // return name
    // return name1 \n name2
    searchData(command) {
        let results = this.searchName(command);

        if (results.length == 1) {
            // found 1
            return this.generateCharaData(results[0]);
        } else if (results.length > 1) {
            // found list
            return results.join("\n");
        }

        return false;
    },
    // 建立回覆: 單一角色資料
    generateCharaData(charaName) {
        _anna.log(`generateCharaData(${charaName})`);

        let i = charaDatabase.indexOf(charaName);
        if (i != -1) {
            let obj = charaDatabase.data[i];

            let replyMsg = {
                type: "character",
                title: obj.getTitle(),
                data: obj.getMessage(),

                label: obj.name,
                url: obj.getWikiUrl()
            }
            // card image
            let imgArray = imgur.database.image.findData({ tag: charaName });
            if (imgArray && imgArray.length > 0) {
                img = randomPick(imgArray);

                replyMsg.imageLink = img.imageLink;
                replyMsg.thumbnailLink = img.thumbnailLink;
            }
            return replyMsg;
        }

        _anna.log("generateCharaData error! can not found chara!");
        return false;
    },


    // 模糊搜尋 (非暱稱)
    getFullnamesByIndex(key) {
        _anna.log(`getFullnamesByIndex(${key})`);

        let t;
        if ((t = charaDatabase.indexOf(key)) != -1) {
            return [key]; // 精確符合全名
        }

        // 加權陣列
        let array_metrics = [];
        for (let charaIndex in charaDatabase.data) {
            let obj = charaDatabase.data[charaIndex];

            // 模糊加權
            const metricsA = 8; // 同字
            const metricsB = 1; // 同順
            const metricsC = 3; // 連接
            let metrics = -5 * key.length;

            let keyMetrics = new Array(key.length);
            let sourceName = `@${obj.name}`;
            // 逐字搜尋
            for (let i = 0; i < key.length; ++i) {
                keyMetrics[i] = sourceName.indexOf(key[i]);
                if (keyMetrics[i] != -1) {
                    sourceName = sourceName.replace(sourceName[keyMetrics[i]], "@");
                }
            }
            // 計算權重
            for (let i = 0; i < keyMetrics.length; ++i) {
                if (keyMetrics[i] != -1) {
                    metrics += metricsA; // 同字元

                    if (i > 0) {
                        if (keyMetrics[i] > keyMetrics[i - 1]) {
                            metrics += metricsB; // 字元同順
                        }
                        if (keyMetrics[i] == (keyMetrics[i - 1] + 1)) {
                            metrics += metricsC; // 同sub字串
                        }
                    }
                }
            }
            // array_metrics[ 權重值 ] = [ 角色index, 角色index, ... ]
            if (metrics > 0) {
                if (!array_metrics[metrics]) { array_metrics[metrics] = []; }
                array_metrics[metrics].push(charaIndex);
            }
        }

        // 模糊加權結果
        let result = [];
        if (array_metrics.length > 0) {
            // 權值大到小
            let metricsMax = array_metrics.length - 1;
            let metricsMin = Math.floor(metricsMax * 0.75);
            // let metricsMin = 0;
            _anna.log(`_metricsMax: <${metricsMax}>`);
            _anna.log(`_metricsMin: <${metricsMin}>`);

            for (let charaIndex = metricsMax; charaIndex >= metricsMin; charaIndex--) {
                if (!array_metrics[charaIndex]) continue; // 檢查搜尋結果

                // 遍歷搜尋結果
                for (let index of array_metrics[charaIndex]) {
                    // let index = array_metrics[charaIndex][i];

                    _anna.log(`_array_metrics : <${charaIndex}: ${charaDatabase.data[index].name}>`);
                    result.push(charaDatabase.data[index].name);
                }
            }
        }
        return result;
    },

    getFullnamesFromText(text) {
        if (!text) { return []; }
        _anna.log("getFullnamesFromText( text... )");
        let result = [];
        let result2 = [];
        for (let card of charaDatabase.data) {
            // let name = charaDatabase.data[charaIndex].name;
            // let subName = charaDatabase.data[charaIndex].subName;
            let name = card.name;
            let subName = card.subName || "NULL";
            if (text.indexOf(name) != -1) { result.push(name); }
            if (text.indexOf(subName) != -1) { result2.push(name); }
        }

        return result.length != 0 ? result : result2;
    },
    // 搜尋暱稱 (nickname to fullname)
    getFullnameByNick(str) {
        // _anna.log(`getFullnameByNick(${str})`);

        // 搜尋暱稱
        let result = nickDatabase.indexOf(str);
        if (result != -1) { return nickDatabase.data[result].target; }

        // 搜尋全名
        result = charaDatabase.indexOf(str);
        if (result != -1) { return str; }
        return false;
    },
    // 搜索職業
    getFullnamesByClass(command) {
        _anna.log(` getFullnamesByClass(${command})`);
        // 搜索職業
        // 分割命令
        let _rarity = this.getRarityString(command[0]);
        if (_rarity == false) { return []; }

        let _class = (command.indexOf("白金") == 0 ? command.substring(2) : command.substring(1)).trim();
        _class = this.getClassnameByIndex(_class);
        if (_class == false) { return []; }

        _anna.log(`_rarity + _class: <${_rarity} + ${_class}>`);

        let result = [];
        // 遍歷角色資料庫
        for (let obj of charaDatabase.data) {
            // let obj = charaDatabase.data[i];
            if (obj.rarity == _rarity && obj.class == _class) {
                result.push(obj.name);
            }
        }
        return result;
    },
    getRarityString(str) {
        if (str == "鐵") return "アイアン";
        else if (str == "銅") return "ブロンズ";
        else if (str == "銀") return "シルバー";
        else if (str == "金") return "ゴールド";
        else if (str == "藍") return "サファイア";
        else if (str == "白" || str == "鉑") return "プラチナ";
        else if (str == "黑") return "ブラック";
        else return false;
    },
    // 搜尋職業 (index to full classname)
    getClassnameByIndex(str) {
        _anna.log(`getClassnameByIndex(${str})`);
        // // for (let i = 0; i < classDatabase.length; {
        // for (let i in classDatabase.data) {
        //     for (let j in classDatabase.data[i].index) {
        //         if (str == classDatabase.data[i].index[j]) {
        //             return classDatabase.data[i].name;
        //         }
        //     }
        // }
        for (let classData of classDatabase.data) {
            for (let index of classData.index) {
                if (str == index) {
                    return classData.name;
                }
            }
        }
        return false;
    },


    // imgUploader
    // upload dbox images to imgur
    async uploadImages() {
        let localHost = _anna.isLocalHost;
        // let localHost = false;

        console.log(`Image Upload ${localHost ? "(Local) " : ""}Script`);

        // let loaclPath = "C:/Users/HUANG/Dropbox/應用程式/aigis1000secretary";
        let loaclPath = "C:/Users/Mirror/Dropbox/應用程式/aigis1000secretary";
        const md5f = (str) => { return require('crypto').createHash('md5').update(str).digest('hex'); }

        // get file list
        const getFileList = async (mainFolder) => {
            return localHost ?
                await getOfflineFileList(`${loaclPath}/${mainFolder}`) :
                await getOnlineFileList(`/${mainFolder}`)
        }
        // get local file list
        const getOfflineFileList = (dirPath) => {
            return new Promise(async (resolve, reject) => {
                let result = [];
                let apiResult = fs.readdirSync(dirPath);
                for (let i in apiResult) {
                    let resultPath = `${dirPath}/${apiResult[i]}`;
                    if (fs.lstatSync(resultPath).isDirectory()) {
                        result = result.concat(await getOfflineFileList(resultPath));
                    } else {
                        result.push(resultPath);
                    }
                }
                resolve(result);
            });
        };
        // get dropbox file list
        const getOnlineFileList = async function (mainFolder) {

            let files = [];
            let _result = await dbox.listDir(mainFolder).catch(console.log);

            let _files = _result.filter((obj) => (obj[".tag"] == "file"));
            for (let obj of _files) { files.push(obj.path_display); }

            // files.sort();

            return files;
        }

        // get dropbox image list
        let pathArray = [];

        let albumList = ["AutoResponse", "Images"];
        for (let albumName of albumList) {
            // check album
            let albums = imgur.database.album.findData({ title: albumName });
            if (albums.length == 0) {
                // await imgur.api.album.albumCreation({ title: albumName, cover: "vtHXE4B" });
                _anna.log(`cant found albums ${albumName}`);
                return;
            }
            // get filelist
            pathArray = pathArray.concat(await getFileList(albumName).catch(console.log));
            // pathArray = pathArray.concat(await getOnlineFileList(`/${albumName}`).catch(console.log));
        }

        // loop
        console.log("GET DBox Images count: " + pathArray.length);
        for (let filePath of pathArray) {
            // image var
            let tagList = localHost ? filePath.replace(loaclPath, "") : filePath;
            let fileName = path.parse(filePath).base;
            // album id
            let albumHash = "";
            let albums = imgur.database.album.findData({ title: tagList.substring(1, tagList.indexOf("/", 1)) });
            if (albums.length == 0) continue;
            else { albumHash = albums[0].id; }

            // console.log(filePath)
            // console.log(fileName)
            // console.log("")
            // console.log(`\n[${pathArray.indexOf(filePath)}/${pathArray.length}]`);
            // console.log(`\n[${pathArray.indexOf(filePath)}/${pathArray.length}] ${fileName}`);
            // get online image data
            let resultImage = imgur.database.image.findData({ tagList, isGif: true });

            // cant found image from imgur (by tag)
            if (resultImage.length == 0) {
                // get image data
                let imageBinary = localHost ? fs.readFileSync(filePath) : await dbox.fileDownload(tagList);
                let md5 = md5f(imageBinary);  // get MD5 for check

                // find again
                resultImage = imgur.database.image.findData({ md5, tag: fileName, isGif: true });

                // found image from imgur (by md5)
                if (resultImage.length == 1) {
                    console.log(`\n[${pathArray.indexOf(filePath)}/${pathArray.length}]`);

                    // if dropbox file moved, update image params
                    await imgur.api.image.updateImage({ imageHash: resultImage[0].id, tagList });
                    continue;
                }

                console.log(`\n[${pathArray.indexOf(filePath)}/${pathArray.length}]`);
                // found some images from imgur
                if (resultImage.length >= 1) {
                    // delete same images
                    for (let imageHash of resultImage) { await imgur.api.image.imageDeletion({ imageHash }) }
                }
                // now no image in imgur, upload new
                let result = await imgur.api.image.imageUpload({ imageBinary, fileName, md5, albumHash, tagList });
                if (result == null) break;

                let timeout = 40;
                if (!localHost) { await sleep(timeout * 1000); }
                else { for (let i = timeout; i > 0; --i) { await sleep(1000); console.log(`await... @${i}`) }; }
                continue;
            }


            // found image from imgur 
            if (resultImage.length == 1) {
                // check md5 if on local
                if (localHost) {
                    // get image data
                    let imageBinary = fs.readFileSync(filePath);
                    let md5 = md5f(imageBinary);  // get MD5 for check

                    // check md5, if not same
                    if (!resultImage[0].md5.equali(md5) ||
                        // !resultImage[0].fileName.equali(fileName)
                        fileName.indexOf(resultImage[0].fileName) != 0// filename too long
                    ) {
                        console.log(`\n[${pathArray.indexOf(filePath)}/${pathArray.length}]`);
                        console.log(`${resultImage[0].md5} => ${md5}`);
                        console.log(`${resultImage[0].fileName} => ${fileName}`);

                        await imgur.api.image.imageDeletion({ imageHash: resultImage[0].id })
                        let result = await imgur.api.image.imageUpload({ imageBinary, fileName, md5, albumHash, tagList });
                        if (result == null) break;

                        let timeout = 40;
                        if (!localHost) { await sleep(timeout * 1000); }
                        else { for (let i = timeout; i > 0; --i) { await sleep(1000); console.log(`await... @${i}`) }; }
                    }
                }

                continue;
            }


            // found many image from imgur
            if (resultImage.length > 1) {
                console.log(`\n[${pathArray.indexOf(filePath)}/${pathArray.length}] result.length > 1`);

                // del online images 
                for (let imageHash of resultImage) { await imgur.api.image.imageDeletion({ imageHash }) }

                // image data
                let imageBinary = localHost ? fs.readFileSync(filePath) : await dbox.fileDownload(tagList);
                let md5 = md5f(imageBinary);  // get MD5 for check
                // re-upload            
                let result = await imgur.api.image.imageUpload({ imageBinary, fileName, md5, albumHash, tagList });
                if (result == null) break;

                let timeout = 40;
                if (!localHost) { await sleep(timeout * 1000); }
                else { for (let i = timeout; i > 0; --i) { await sleep(1000); console.log(`await... @${i}`) }; }

                continue;
            }
        }


        // check dbox img status
        const checkImages = async function () {
            await imgur.init(module.exports.config.imgur);

            // get dropbox image list
            let pathArray = [];

            try {
                // check album
                let albumList = ["AutoResponse", "Images"];
                for (let albumName of albumList) {
                    // get filelist
                    pathArray = pathArray.concat(await getOnlineFileList(`/${albumName}`));
                }
            } catch (err) {
                console.log(`checkImages error: ${err}`);
                return;
            }

            // for (let img of imgur.database.images) {
            for (let img of imgur.database.image.findData({ isGif: true })) {
                let path = img.tagList;
                let filename = img.fileName;
                let pathInDbox = pathArray.find((p) => path.equali(p));
                if (!pathInDbox) {
                    console.log(`${path} not exist in drpbox`);
                    // await dbox.fileUpload(`/DelImages/${filename}`, body);

                    await new Promise((resolve, reject) => {
                        require("request").get(img.imageLink, { encoding: 'binary' }, async (error, response, body) => {
                            if (body) {
                                fs.writeFileSync("./" + filename, body, { encoding: 'binary' });
                                body = fs.readFileSync("./" + filename);
                                await dbox.fileUpload("/DelImages/" + filename, body);
                                fs.unlinkSync("./" + filename);
                                await imgur.api.image.imageDeletion({ imageHash: img.id });
                                resolve();
                            }
                            // if (error || !body) { return console.log(error); }
                        });
                    });
                }
            }
            console.log("checkImages done!")
        }


        // annaWebHook("status");
        // anna.replyAI("status");
        checkImages();
        console.log("done!")
        return;
    }
}



