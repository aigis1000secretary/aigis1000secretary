
// 初始化
const config = require("./config.js");
const _anna = module.exports = {};    // 循環依賴對策
// 爬蟲
const request = require("request");
const iconv = require("iconv-lite");
const cheerio = require("cheerio");

const imgur = require("./imgur.js");
const dbox = require("./dbox.js");
const line = require("./line.js");
const twitter = require("./twitter.js");
const imgUploader = require("./image.js");
// 資料庫
const database = require("./database.js");


// Init
const init = _anna.init = async function () {

    await charaDatabase.init().catch(console.log);
    await nickDatabase.init().catch(console.log);
    await classDatabase.init().catch(console.log);

    return;
};


// bot
// reply
const replyAI = _anna.replyAI = async function (rawMsg, sourceId, userId) {
    debugLog()("rawMsg: <" + rawMsg + ">");

    // flag
    let _isAdmin = isAdmin(userId);

    // 分析命令
    rawMsg.replaceAll("\n\n", "\n");
    let msg1 = rawMsg.indexOf("\n") == -1 ? rawMsg.trim() : rawMsg.split("\n")[0].trim();   // line 1
    let msg2 = rawMsg.indexOf("\n") == -1 ? "" : rawMsg.substring(rawMsg.indexOf("\n") + 1).trim(); // line 2~
    let msgs = msg1.split(" ");
    msgs = msgs.filter(function (n) { return (n && (n != "")) });   // delete null data
    // >> <command>		<arg1>			<arg2>
    // >> 學習			NNL:黑弓
    // >> 資料庫		CharaDatabase	NNL.ability_aw
    let command = ("" + msgs[0].toUpperCase()).trim();
    let arg1 = ("" + msgs[1]).trim();
    let arg2 = ("" + msgs[2]).trim();
    // <command>
    if (command == "undefined") { return false; }
    debugLog()("Args: <" + command + "> <" + arg1 + "> <" + arg2 + ">");

    // reply    
    if (command == "DEBUG") {		// debug switch
        config.switchVar.debug = !config.switchVar.debug;
        return "debug = " + (config.switchVar.debug ? "on" : "off");
    } else if (command == "DEBUGP") {		// debug switch
        config.switchVar.debugPush = !config.switchVar.debugPush;
        config.switchVar.debug = config.switchVar.debugPush;
        return "debug push = " + (config.switchVar.debugPush ? "on" : "off");

    } else if (command.length == 1) {		// 定型文
        // 同步執行
        let result = nickDatabase.indexOf(command);
        if (result != -1) {
            command = nickDatabase.data[result].target;
        } else {
            // return "王子太短了，找不到...";
            return false;
        }

    } else if (command == "巨根") {
        return "王子太小了，找不到...";

    } else if (command == "醒醒" || command == "WAKE") {
        return "呣喵~?";    // wake

    } else if (command == "指令" || command == "HELP") {
        // help
        let replyMsg = "歡迎使用政務官小安娜 v" + config._version + "\n\n";

        replyMsg += "狀態: 確認目前版本，資料庫資料筆數。\n(>>安娜 狀態)\n\n";
        replyMsg += "照片: 上傳角色附圖的網路空間(DropBox)。\n(>>安娜 照片)\n\n";
        replyMsg += "工具: 千年戰爭Aigis實用工具。\n(>>安娜 工具)\n\n";
        replyMsg += "職業: 列出/搜尋資料庫現有職業。\n(>>安娜 職業 恋)\n\n";
        replyMsg += "學習: 用來教會安娜角色的暱稱。\n(>>安娜 學習 NNL:射手ナナリー)\n\n";
        replyMsg += "上傳: 手動上傳資料庫。\n\n";
        replyMsg += "更新: 讀取 wiki 進行資料庫更新。\n\n";

        replyMsg += "\n";
        replyMsg += "直接輸入稀有度+職業可以搜索角色\n(>>安娜 黑弓) *推薦使用\n\n";
        replyMsg += "輸入關鍵字可進行暱稱搜索&模糊搜索\n(>>安娜 NNL)\n(>>安娜 射手ナナリー)\n\n";

        if (isAdmin(sourceId)) {
            replyMsg += "忘記: 刪除特定暱稱。\n(>>安娜 忘記 NNL)\n\n";
            replyMsg += "資料庫: 直接修改資料庫內容。\n(>>資料庫 CharaDatabase NNL.ability_aw)\n\n";
            replyMsg += "NEW: 線上圖庫手動新增TAG。\n\n";
            replyMsg += "NEWIMG: dropbox 圖庫同步至 imgur。\n\n";
        }

        return replyMsg.trim();

    } else if (command == "狀態" || command == "STATUS") {
        // status
        await imgur.init();

        let replyMsg = "";
        replyMsg += "目前版本 v" + config._version + "\n";
        replyMsg += "資料庫內有 " + charaDatabase.data.length + " 筆角色資料\n";
        replyMsg += "　　　　　 " + classDatabase.data.length + " 筆職業資料\n";
        replyMsg += "　　　　　 " + imgur.database.images.length + " 筆貼圖資料";

        return replyMsg;

    } else if (command == "照片" || command == "圖片" || command == "相片" || command == "PICTURE") {
        // 圖片空間
        return line.createUriButtons("圖片空間",
            ["上傳新照片", "角色圖庫", "貼圖圖庫"],
            ["https://www.dropbox.com/request/FhIsMnWVRtv30ZL2Ty69",
                "https://www.dropbox.com/sh/ij3wbm64ynfs7n7/AACmNemWzDhjUBycEMcmos6ha?dl=0",
                "https://www.dropbox.com/sh/w9pxyrmldc676hp/AAAT7bYRtrYLlPrpFWwMb7Zsa?dl=0"]);

    } else if (command == "工具" || command == "TOOL") {
        // tool
        let templateMsgA, templateMsgB;

        let tagArray = [];
        let urlArray = [];
        tagArray.push("特殊合成表");
        urlArray.push("https://seesaawiki.jp/aigis/d/%C6%C3%BC%EC%B9%E7%C0%AE%C9%BD");
        tagArray.push("經驗值計算機");
        urlArray.push("http://aigistool.html.xdomain.jp/EXP.html");
        tagArray.push("體魅計算機");
        urlArray.push("http://aigistool.html.xdomain.jp/ChariSta.html");
        templateMsgA = line.createUriButtons("實用工具 (1)", tagArray, urlArray);

        tagArray = [];
        urlArray = [];
        tagArray.push("DPS 一覽表 (日)");
        urlArray.push("http://www116.sakura.ne.jp/~kuromoji/aigis_dps.htm");
        tagArray.push("Buff 試算表");
        urlArray.push("https://aki-m.github.io/aigistools/buff.html");
        tagArray.push("Youtube 攻略頻道");
        urlArray.push("https://www.youtube.com/channel/UC8RlGt22URJuM0yM0pUyWBA");
        // tagArray.push("千年戦争アイギス攻略ブログ");
        // urlArray.push("http://sennenaigis.blog.fc2.com/");
        templateMsgB = line.createUriButtons("實用工具 (2)", tagArray, urlArray);

        let replyMsg = [templateMsgA, templateMsgB];
        return replyMsg;

    } else if (command == "職業") {
        let classDB = (arg1 == "undefined" ? classDatabase.data :
            classDatabase.data.filter(function (classData) {
                if (arg1 == "近" && classData.type == "近接型") return true;
                if (arg1 == "遠" && classData.type == "遠距離型") return true;
                return (classData.name.indexOf(arg1) != -1);
            }));

        classDB.sort(function (A, B) { return A.type.localeCompare(B.type) })

        let replyMsg = "";
        for (let i in classDB) {
            replyMsg += classDB[i].index.join(",\t") + "\n";
        }
        replyMsg = replyMsg.trim();
        return (replyMsg == "" ? "找不到呢..." : replyMsg);

    } else if (command == "學習") {
        // 關鍵字學習
        // <arg1>
        if (arg1 == "undefined") {
            return "[學習] 要學甚麼?\n(>>安娜 學習 NNL:射手ナナリー)";
        }
        let learn = arg1.replace("：", ":");
        debugLog()("learn: <" + learn + ">");

        let keys = learn.split(":"); // NNL:黑弓
        if (keys.length < 2) {
            return "[學習] 看不懂...";
        }
        keys[0] = keys[0].trim();
        keys[1] = keys[1].trim();

        let arrayA = searchCharacter(keys[0], true);	// 精確搜索 Nickname
        let arrayClass = searchByClass(keys[1]);
        let arrayB = arrayClass.length == 1 ? arrayClass : searchCharacter(keys[1]).concat(arrayClass);
        let countA = arrayA.length;
        let countB = arrayB.length;

        debugLog()("new nick: <" + keys[0] + ">");
        debugLog()("full name: <" + arrayB + ">");

        if (countA == 1) {
            return "[學習] 安娜知道的！";

        } else if (countB == 0) {
            let replyMsgs = ["不認識的人呢...", "那是誰？"];
            let replyMsg = "[學習] " + replyMsgs[Math.floor(Math.random() * replyMsgs.length)];
            return replyMsg;

        } else if (countB > 1) {
            return "[學習] 太多人了，不知道是誰";

        } else {
            let key = arrayB[0];
            let nick = keys[0];

            // 異步執行
            nickDatabase.addData(key, nick);
            // wait 10 min to save
            nickDatabase.uploadTask();

            return "[學習] 嗯！記住了！";
        }
    } else if (command == "上傳" || command == "UPLOAD") {

        // 異步執行
        try {
            await charaDatabase.saveDB()
            await charaDatabase.uploadDB()

            await nickDatabase.saveDB()
            await nickDatabase.uploadDB()

            await classDatabase.saveDB()
            await classDatabase.uploadDB()

        } catch (error) {
            return "上傳異常!\n" + error;
        }

        return "上傳完成!";

    } else if (command == "更新" || command == "UPDATE") {
        allCharaDataCrawler(sourceId);
        classDataCrawler();
        return "更新中...";

    } else if (_isAdmin && command == "忘記") {
        // forgot
        // <arg1>
        if (arg1 == "undefined") {
            return "";  // forgot what?
        }
        let learn = arg1;
        debugLog()("forgot: <" + learn + ">");

        // 同步執行
        let i = nickDatabase.indexOf(learn.trim());
        if (i > -1) {
            nickDatabase.data.splice(i, 1);
        }
        // wait 10 min to save
        nickDatabase.uploadTask();

        return "[學習] 忘記了!";

    } else if (_isAdmin && (command == "資料庫" || command == "DB")) {

        // >> ANNA <command>	<arg1>			<arg2>
        // >> ANNA 資料庫		CharaDatabase	NNL.ability_aw

        if (arg1 == "undefined") {
            return "請選擇資料庫:\nCharaDatabase\nNickDatabase\nClassDatabase\n\n(>>資料庫 CharaDatabase NNL.ability_aw)";
        } else if (arg2 == "undefined") {
            return "請輸入項目: \n(>>資料庫 CharaDatabase NNL.ability_aw)";
        }

        let targetDBName = arg1;
        let indexStr = arg2.split(".")[0];
        let propertyStr = arg2.split(".")[1];
        let index;

        let targetDB;
        if (targetDBName == "CharaDatabase") {
            targetDB = charaDatabase;
            index = charaDatabase.indexOf(searchCharacter(indexStr)[0]);
        } else if (targetDBName == "NickDatabase") {
            targetDB = nickDatabase;
            index = nickDatabase.indexOf(indexStr);
        } else if (targetDBName == "ClassDatabase") {
            targetDB = classDatabase;
            index = classDatabase.indexOf(indexStr);
        } else {
            return "不明的資料庫!";
        }

        if (index == -1) {
            return "不明的目標!";
        }
        if (msg2 == "DEL") {
            let name = targetDB.data[index].name;
            targetDB.data.splice(index, 1);
            return targetDB.name + "." + name + " 刪除成功!";
        }

        if (!targetDB.data[index][propertyStr]) {
            let reply = "不明的成員! 請選擇成員:\n";
            for (let key in targetDB.data[index]) {
                if (typeof (targetDB.data[index][key]) != "function") {
                    reply += key + "\n";
                }
            }

            return reply.trim();
        }
        if (msg2 == "undefined" || msg2 == "") {
            let replyMsg = [];
            replyMsg.push(line.createTextMsg("請換行輸入項目內容."));
            replyMsg.push(line.createTextMsg(targetDB.data[index][propertyStr]));
            return replyMsg;

        } else {
            targetDB.data[index][propertyStr] = (msg2 == "CLEAR" ? "" : msg2);
            targetDB.uploadTask();
            return "修改成功";

        }
    } else if (_isAdmin && (command == "初始化" || command == "INIT")) {
        await init();
        return "初始化完成!";

    } else if (_isAdmin && (command == "NEWIMG")) {
        imgUploader.upload();
        return "上傳圖檔中...";

    } else if (_isAdmin && (command == "NEW")) {
        if (arg1 == "undefined") {
            let imgArray = imgur.database.findImageData({ tag: "NewImages" });

            let replyMsg = [];
            if (imgArray.length > 0) {
                let i = Math.floor(Math.random() * imgArray.length);
                let img = imgArray[i];

                const _regex1 = /^Aigis1000-\d{18,19}-\d{8}_\d{6}/;
                if (_regex1.test(img.fileName)) {
                    // image from Aigis1000 twitter
                    const _regex2 = /\d{18,19}/;
                    let tweetId = _regex2.exec(img.fileName);
                    let data = await twitter.api.getTweet(tweetId);
                    let array = searchCharacter(data.text);

                    if (array.length > 0) {
                        replyMsg.push(line.createImageMsg(img.imageLink, img.thumbnailLink));
                        replyMsg.push(line.createTextMsg("new " + img.md5 + " "));

                        let labels = [], msgs = [];
                        for (let j in array) {
                            labels.push(array[j]);
                            msgs.push("new " + img.md5 + " " + array[j]);
                        }
                        labels.push("next");
                        msgs.push("new");

                        replyMsg.push(line.createMsgButtons("[" + i + "/" + imgArray.length + "]", labels, msgs));
                        // console.log(JSON.stringify(replyMsg));
                        if (replyMsg[2] != '') {
                            return replyMsg;
                        }
                    }
                }

                replyMsg = [];
                replyMsg.push(line.createImageMsg(img.imageLink, img.thumbnailLink));
                replyMsg.push(line.createTextMsg("[" + i + "/" + imgArray.length + "]"));
                replyMsg.push(line.createTextMsg("new " + img.md5 + " "));
                // console.log(img.md5 + " [" + i + "/" + imgArray.length + "]");
                return replyMsg;

            } else {
                replyMsg = "沒有新照片";
            }

        } else {
            let imgArray = imgur.database.findImageData({ md5: arg1, tag: "NewImages" });
            if (imgArray.length != 1) { return "md5錯誤! " + imgArray.length + " result!"; }

            if (arg2 == "undefined") {
                return line.createImageMsg(imgArray[0].imageLink, imgArray[0].thumbnailLink);

            } else if (arg2 != "undefined") {
                let classArray = searchByClass(arg2);
                let charaArray = classArray.length == 1 ? classArray : searchCharacter(arg2).concat(classArray);
                if (charaArray.length > 1) {
                    return "搜尋不明確: " + charaArray.join("\n");
                }
                if (charaArray.length == 1) {
                    target = charaArray[0].trim();
                    // move image file
                    try {
                        await dbox.fileMove(
                            "Images/NewImages/" + imgArray[0].fileName,
                            "Images/Character/" + target + "/" + imgArray[0].fileName,
                            true);
                    } catch (error) {
                        console.log("分類錯誤!");
                        console.log(error);
                        return "分類錯誤!";
                    }

                    // set taglist
                    imgur.api.image.updateImage({ imageHash: imgArray[0].id, tagList: "Character," + target });

                    let albumHash = imgur.database.findAlbumData({ title: "Character" })[0].id;
                    imgur.api.album.addAlbumImages({ albumHash: albumHash, ids: [imgArray[0].id] });

                    albumHash = imgur.database.findAlbumData({ title: "NewImages" })[0].id;
                    imgur.api.album.removeAlbumImages({ albumHash: albumHash, ids: [imgArray[0].id] });

                    // update imgur database
                    imgur.database.deleteImageData({ id: imgArray[0].id });

                    // return "分類完成";
                    return line.createMsgButtons("分類完成", ["next"], ["new"]);
                }
            }
        }
        return "";

    } else if (_isAdmin && (command == "ABOTINIT")) {
        line.alphatbotInit();
        return "";
    } else if (command.indexOf("://LINE.ME/R/") != -1) {
        line.abot.joinQr(msgs[0].trim());
        return "";
    }

    // 搜尋資料
    let result = false;
    result = searchData(command);
    if (result != false) {
        return result;
    }

    // 404
    // let replyMsgs = ["不認識的人呢...", "安娜不知道", "安娜不懂", "那是誰？", "那是什麼？"];
    // let replyMsg = replyMsgs[Math.floor(Math.random() * replyMsgs.length)];
    // return replyMsg;
    return false;
}

// 搜尋&回復
const searchData = function (command) {
    let resultArray = []
    let count = 0

    // class?
    // 搜索職業
    resultArray = searchByClass(command);
    count = resultArray.length;
    debugLog()("classResult[" + count + "]: <" + resultArray + ">");
    if (count == 1) {
        // found 1
        return generateCharaData(resultArray[0]);
    } else if (count > 1) {
        // found list
        return resultArray.join("\n");
    }

    // not class or not found
    // 搜索名稱
    resultArray = searchCharacter(command);
    count = resultArray.length;
    debugLog()("charaResult[" + count + "]: <" + resultArray + ">");
    if (count == 1) {
        // found 1
        return generateCharaData(resultArray[0]);
    } else if (count > 1) {
        // found list
        return resultArray.join("\n");
    }

    return false;
}
// 搜索職業
const searchByClass = function (command) {
    // 搜索職業
    // 分割命令
    let _rarity = getRarityString(command[0]);
    if (_rarity == "NULL") { return []; }
    let _class = command.indexOf("白金") == 0 ? searchClass(command.substring(2).trim()) : searchClass(command.substring(1).trim());
    debugLog()("_rarity + _class: <" + _rarity + " + " + _class + ">");

    let result = [];
    // 遍歷角色資料庫
    for (let i in charaDatabase.data) {
        let obj = charaDatabase.data[i];
        if (obj.rarity == _rarity && obj.class == _class) {
            result.push(obj.name);
        }
    }
    return result;
}
// 建立回覆: 單一角色資料
const generateCharaData = function (charaName) {
    debugLog()("generateCharaData(" + charaName + ")");

    let i = charaDatabase.indexOf(charaName);
    let obj = charaDatabase.data[i];

    if (i != -1) {
        let replyMsg = [];
        replyMsg.push(line.createTextMsg(obj.getMessage()));

        let imgArray = imgur.database.findImageData({ tag: charaName });
        if (imgArray.length > 0) {
            let i = Math.floor(Math.random() * imgArray.length);
            replyMsg.push(line.createImageMsg(imgArray[i].imageLink, imgArray[i].thumbnailLink));
        }

        replyMsg.push(line.createUriButtons("Wiki 連結", [obj.name], [obj.getWikiUrl()]));

        return replyMsg;
    }

    debugLog()("generateCharaData error! can not found chara!");
    return false;
}
// 定型文貼圖
const replyStamp = _anna.replyStamp = function (msg) {
    debugLog()("replyStamp(" + msg + ")");

    let replyMsg = [];

    let imgArray = imgur.database.findImageData({ tag: msg });
    if (imgArray.length > 0) {
        let i = Math.floor(Math.random() * imgArray.length);
        replyMsg.push(line.createImageMsg(imgArray[i].imageLink, imgArray[i].thumbnailLink));
        return replyMsg;
    }

    imgArray = imgArray.concat(imgur.database.findImageData({ fileName: msg }));
    imgArray = imgArray.concat(imgur.database.findImageData({ md5: msg }));
    if (imgArray.length > 0) {
        replyMsg.push(line.createImageMsg(imgArray[0].imageLink, imgArray[0].thumbnailLink));
        return replyMsg;
    }

    let cdTime = process.env.CDTIME;
    if (msg.equali("Rush!!") && (!cdTime || Date.now() - cdTime > 30 * 1000)) {
        process.env.CDTIME = Date.now();

        let imgArray = imgur.database.findImageData({ tag: "images" });
        if (imgArray.length > 0) {
            let i = Math.floor(Math.random() * imgArray.length);
            let j = Math.floor(Math.random() * i);
            let k = Math.floor(Math.random() * (imgArray.length - i)) + i;
            replyMsg.push(line.createImageMsg(imgArray[i].imageLink, imgArray[i].thumbnailLink));
            replyMsg.push(line.createImageMsg(imgArray[j].imageLink, imgArray[j].thumbnailLink));
            replyMsg.push(line.createImageMsg(imgArray[k].imageLink, imgArray[k].thumbnailLink));
            return replyMsg;
        }
    }

    return false;
}



// 爬蟲
// 爬蟲函數
const charaDataCrawler = function (urlPath, sourceId) {
    return new Promise(function (resolve, reject) {
        request.get(urlPath, { encoding: "binary" }, function (error, response, body) {
            if (error || !body) {
                console.log(error);
                reject(error);
                // return null;
            }

            let html = iconv.decode(Buffer.from(body, "binary"), "EUC-JP"); // EUC-JP to utf8 // Shift_JIS EUC-JP
            let $ = cheerio.load(html, { decodeEntities: false }); // 載入 body

            // init new data obj
            let newData = charaDatabase.newData();
            let skillList = [], awSkillList = [];
            // 搜尋所有表格
            $("div").each(function (i, iElem) {
                let title = $(this).children("h4").text().trim() || $(this).children("h3").text().trim() || "NULL";

                // ステータス
                if (title == "ステータス") {
                    // get table data
                    let statusTable = $(this).next("div").children("table").html().replaceAll("<br>", "").tableToArray();
                    // 名前 & クラス & 
                    for (let i = 0; i < statusTable.length; i++) {
                        for (let j = 0; j < statusTable[i].length; j++) {
                            let text = statusTable[i][j];
                            let data = statusTable[i + 1] ? statusTable[i + 1][j] : "";
                            if (data) {
                                data = data.replace(/&ref\([\s\S]*?\)/g, "");
                                if (text == "名前") { newData.name = data; }
                                if (text == "クラス" && data != "クラス名") { newData.class = data; }
                                if (text == "レア") { newData.rarity = data.replace("｜", "ー"); }
                            }
                        }
                    }
                }

                // アビリティ
                if (title == "アビリティ" || title == "覚醒アビリティ" || title.indexOf("追加アビリティ") != -1) {    // check block tag
                    // get html data
                    let temp = $(this).next("div").children("ul").html().replaceAll("<br>", "\n").replace(/<p[\s\S]*?\/p>/g, "").replace(/<[\s\S]*?>/g, "").replace(/\s*\n\s*/g, "\n").trim();
                    let name = temp.slice(0, temp.indexOf('\n'));
                    let effect = temp.slice(temp.indexOf('\n') + 1);

                    name = name.replaceAll("(", "（").replaceAll(")", "）");
                    effect = effect.replace(/\*\d+/g, "").replace(/[?？]/g, "").replace(/[ 　]+/g, "、");
                    effect = effect.replaceAll("(", "（").replaceAll(")", "）").replaceAll("＋", "+").replaceAll("%", "％");
                    effect = effect.replace(/いるだけで[、\n]+/, "いるだけで").replace(/配置中[のみ、\n]+/, "配置中").replace(/の[、\n]+/, "の").replace(/さらに[、\n]+/, "さらに")
                        .replace(/ランダムで?発動/, "ランダムで発動：").replace(/確率で?発動/, "確率で発動：").replace(/：[、\n]+/, "：")
                        .replaceAll("、/、", "/").replaceAll("防御力、魔法耐性", "防御力と魔法耐性")

                    if (/発動：/.test(effect)) { effect = effect.replaceAll("、", "/") }
                    effect = effect.replaceAll("\n", "、")

                    if (effect.indexOf("説明") != -1) { return; }
                    if ($(this).children().text().trim() == "アビリティ") {
                        newData.ability = name + "\n" + effect;
                    } else {
                        newData.ability_aw = name + "\n" + effect;
                    }
                }

                // スキル & スキル覚醒
                if (title == "スキル" || title == "スキル覚醒") {
                    let isAwTable = (title == "スキル覚醒");
                    if (isAwTable) skillList = [];
                    // get table data
                    let skilTable = $(this).next("div").children("table").html().replaceAll("<br>", "\n").tableToArray();

                    // get data index
                    let nameRow = isAwTable ? 1 : skilTable[0].indexOf("スキル名");
                    let effectRow = isAwTable ? 2 : skilTable[0].indexOf("効果");
                    if (nameRow == -1 || effectRow == -1) { return; }

                    // スキル名  & 効果
                    for (let i in skilTable) {
                        let name = skilTable[i][nameRow];
                        let effect = skilTable[i][effectRow];
                        let isAw = isAwTable ? (skilTable[i][0] == "通常" ? 1 : (skilTable[i][0] == "覚醒" ? 2 : 0)) : 1
                        if (effect.indexOf("説明") != -1) { continue; }

                        if (name && effect && !(/スキル名+/.test(name) || /備考+/.test(name))) {
                            // format
                            name = name.replaceAll("(", "（").replaceAll(")", "）")
                            effect = effect.replace(/\*\d+/g, "").replace(/[?？]/g, "").replace(/[\s　、]+/g, "\n");
                            effect = effect.replaceAll("(", "（").replaceAll(")", "）").replaceAll("＋", "+").replaceAll("%", "％");
                            effect = effect.replaceAll("\n+", "+").replaceAll("\n", "、").replace(/さらに、/, "さらに")
                            // console.log(name, effect);

                            if (isAw == 1) {
                                skillList[name] = effect;
                            } else if (isAw == 2) {
                                awSkillList[name] = effect;
                            }
                        }
                    }
                }
            });

            // put array into skill data
            let temp = "";
            for (let key in skillList) {
                temp += "\n▹" + key + "\n" + skillList[key];
            }
            newData.skill = temp.trim();
            temp = "";
            for (let key in awSkillList) {
                temp += "\n▸" + key + "\n" + awSkillList[key];
            }
            newData.skill_aw = temp.trim();

            // put url data into newdata
            newData.urlName = urlPath.replace("https://seesaawiki.jp/aigis/d/", "");

            // format 王子 data
            if (newData.urlName.indexOf("%b2%a6%bb%d2") != -1) {
                if (newData.urlName == "%b2%a6%bb%d2") newData.name = "王子【通常】";
                newData.skill_aw = newData.skill;
                newData.skill = "";
                newData.ability_aw = newData.ability;
                newData.ability = "";
                newData.class = newData.name;
            }

            // console.log(JSON.stringify(newData, null, 4));
            // 新增角色資料
            let msg = charaDatabase.addData(newData);
            if (msg != "") {
                abotPushLog(msg);
            }
            resolve();
        });
    });
};
// 爬所有角色
let allCharaUrl = [];
const allCharaDataCrawler = async function (sourceId) {
    console.log("AllCharaData Crawling...");

    // callback
    let _requestGetUrl = function (url) {
        return new Promise(function (resolve, reject) {
            request.get(url, { encoding: "binary" }, function (error, response, body) {
                if (error || !body) {
                    console.log(error);
                    reject();
                }

                let html = iconv.decode(Buffer.from(body, "binary"), "EUC-JP"); // EUC-JP to utf8 // Shift_JIS EUC-JP
                let $ = cheerio.load(html, { decodeEntities: false }); // 載入 body

                // 搜尋所有超連結
                $("a").each(function (i, elem) {

                    let buffer = $(this).attr("href");
                    if (buffer && $(this).parent().is("td") &&
                        buffer.indexOf("http") == 0 &&
                        buffer.indexOf("seesaawiki.jp/aigis/d/") != -1 &&
                        buffer.indexOf("/class") == -1 &&
                        buffer.indexOf("#") == -1 &&
                        allCharaUrl.indexOf(buffer) == -1) {
                        // console.log($(this).text());
                        allCharaUrl.push(buffer);
                    }
                });
                resolve();
            });
        });
    }

    await Promise.all([
        _requestGetUrl("http://seesaawiki.jp/aigis/d/%a5%b4%a1%bc%a5%eb%a5%c9"),
        _requestGetUrl("http://seesaawiki.jp/aigis/d/%a5%b5%a5%d5%a5%a1%a5%a4%a5%a2"),
        _requestGetUrl("http://seesaawiki.jp/aigis/d/%a5%d7%a5%e9%a5%c1%a5%ca"),
        _requestGetUrl("http://seesaawiki.jp/aigis/d/%a5%d6%a5%e9%a5%c3%a5%af"),

        _requestGetUrl("https://seesaawiki.jp/aigis/d/%cc%be%c1%b0%bd%e7%b0%ec%cd%f7"),
        _requestGetUrl("https://seesaawiki.jp/aigis/d/%bc%c2%c1%f5%bd%e7%b0%ec%cd%f7"),
        _requestGetUrl("https://seesaawiki.jp/aigis/d/%c2%b0%c0%ad%ca%cc%b0%ec%cd%f7")
    ]);

    let urlList = Object.assign([], allCharaUrl);
    while (urlList.length > 0) {
        let pArray = [];
        // 50 thread
        for (let i = 0, pop; i < 50 && (pop = urlList.pop()); ++i) {
            pArray.push(charaDataCrawler(pop));
        }
        await Promise.all(pArray);
    }

    // save Database
    charaDatabase.uploadTask();

}
// 爬職業
const classDataCrawler = _anna.classDataCrawler = async function () {
    console.log("ClassData Crawling...");

    let _requestClass = function (url) {
        return new Promise(function (resolve, reject) {
            request.get(url, { encoding: "binary" }, function (error, response, body) {
                if (error || !body) {
                    console.log(error);
                    reject(error);
                    // return null;
                }

                let html = iconv.decode(Buffer.from(body, "binary"), "EUC-JP"); // EUC-JP to utf8 // Shift_JIS EUC-JP
                let $ = cheerio.load(html, { decodeEntities: false }); // 載入 body

                $("div").each(function (i, elem) {

                    let buffer = $(this).attr("id");
                    // 搜尋所有表格
                    if (buffer && buffer.indexOf("content_block_") != -1 && buffer.indexOf("-") != -1) {

                        // 檢查表格標籤
                        if ($(this).prev().text().trim() == "一覧") {

                            // 遍歷表格內容
                            $(this).children().children().children().children().children().each(function (i, elem) {

                                let str = $(this).text().trim();
                                let str_i = str.indexOf("\/");
                                if (str_i != -1) {
                                    str = str.substring(0, str_i);
                                }

                                if (str.trim() == "" || str.indexOf("編集") != -1) {
                                    return;
                                }

                                let newData = classDatabase.newData();
                                newData.name = str;
                                newData.index.push(str);
                                if ($("title").text().indexOf("近接型") != -1) {
                                    newData.type = "近接型";
                                } else if ($("title").text().indexOf("遠距離型") != -1) {
                                    newData.type = "遠距離型";
                                } else {
                                    newData.type = "UNKNOWN";
                                }

                                // 新增職業資料
                                classDatabase.addData(newData);
                            });
                        }
                    }
                });//*/
                // $("table[class=edit]").each(function (i, elem) {
                //     let table = $(this).html().replaceAll("、", "/").replaceAll("<br>", "").tableToArray();
                // });
                // console.log("done!");
                resolve();
            });
        });
    }
    await _requestClass("http://seesaawiki.jp/aigis/d/class_%b6%e1%c0%dc%b7%bf_%cc%dc%bc%a1");
    await _requestClass("http://seesaawiki.jp/aigis/d/class_%b1%f3%b5%f7%ce%a5%b7%bf_%cc%dc%bc%a1");

    classDatabase.uploadTask();

};
// HTML table to array
String.prototype.tableToArray = function () {
    let result = [];
    let html = this;
    let i;

    // regexp
    const tbody = /<tbody>[\s\S]*?<\/tbody>/;
    const tr = /<tr[\s\S]*?<\/tr>/;
    const td = /<t[dh][\s\S]*?<\/t[dh]>/;

    if (tbody.test(html)) {
        // get tbody
        html = tbody.exec(html)[0];
        // init table array data
        i = -1;
        while ((i = html.indexOf("<tr>", i + 1)) != -1) {
            result.push([]);
        }

        // get all Column body
        let col = 0;
        while (tr.test(html)) {
            // get single Column body
            let columnBody = tr.exec(html)[0];
            html = html.replace(tr, "");

            // get all Row body
            let row = 0;
            while (td.test(columnBody)) {
                while (result[col][row] == "@") { row++; }
                // split single Cell body
                let cellBody = td.exec(columnBody)[0];
                let cellStyle = /<t[dh][\s\S]*?>/.exec(cellBody)[0]
                // let cellText = cellBody.replace(/<t[dh][\s\S]*?>/, "").replace(/<\/t[dh]>/, "");
                let cellText = cellBody.replace(/<[\s\S]*?>/g, "");
                columnBody = columnBody.replace(td, "");

                // set cell text
                result[col][row] = cellText.trim();
                // set span cell text/flag
                let style = cellStyle.split(" ");
                for (let l in style) {
                    if (style[l].indexOf("rowspan") != -1) {
                        let rowspan = parseInt(/\d+/.exec(style[l]));
                        for (let span = 1; span < rowspan; span++) {
                            result[col + span][row] = "@";
                        }
                    }
                    if (style[l].indexOf("colspan") != -1) {
                        let colspan = parseInt(/\d+/.exec(style[l]));
                        for (let span = 1; span < colspan; span++) {
                            row++;
                            result[col][row] = cellText.trim();
                        }
                    }
                }

                row++;
            }

            // set span cell text
            for (row in result[col]) {
                if (result[col][row] == "@") {
                    result[col][row] = result[col - 1][row];
                }
            }

            col++;
        }
    }
    return result;
}



// 資料庫
// Character
let charaDatabase = database.charaDatabase;
// 模糊搜尋
const searchCharacter = _anna.searchCharacter = function (key, accurate) {
    accurate = !!accurate;
    debugLog()("searchCharacter(" + key + ", " + accurate + ")");

    // search from twitter text
    if (key.length > 20) {
        let result = [];
        for (let charaIndex in charaDatabase.data) {
            let name = charaDatabase.data[charaIndex].name;
            if (key.indexOf(name) != -1) {
                result.push(name);
            }
        }
        return result;
    }

    let t;
    if ((t = charaDatabase.indexOf(key)) != -1) {
        return [key];
    } else if ((t = nickDatabase.indexOf(key)) != -1) {
        return [nickDatabase.data[t].target];
    } else if (accurate) {
        return [];
    }

    // 加權陣列
    let array_metrics = [];
    for (let charaIndex in charaDatabase.data) {
        let obj = charaDatabase.data[charaIndex];

        // 模糊加權
        const metricsA = 8;	// 同字
        const metricsB = 1;	// 同順
        const metricsC = 2;	// 連接
        let metrics = -5 * key.length;

        let keyMetrics = new Array(key.length);
        let sourceName = "@" + obj.name;
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
                metrics += metricsA;	// 同字元

                if (i > 0) {
                    if (keyMetrics[i] > keyMetrics[i - 1]) {
                        metrics += metricsB;	// 字元同順
                    }
                    if (keyMetrics[i] == (keyMetrics[i - 1] + 1)) {
                        metrics += metricsC;	// 同sub字串
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
        debugLog()("_metricsMax: <" + metricsMax + ">");
        debugLog()("_metricsMin: <" + metricsMin + ">");

        for (let charaIndex = metricsMax; charaIndex >= metricsMin; charaIndex--) {
            if (!array_metrics[charaIndex]) continue;	// 檢查搜尋結果

            // 遍歷搜尋結果
            for (let i in array_metrics[charaIndex]) {
                let index = array_metrics[charaIndex][i];

                debugLog()("_array_metrics : <" + charaIndex + ": " + charaDatabase.data[index].name + ">");
                result.push(charaDatabase.data[index].name);
            }
        }
    }
    return result;
}

// Nickname
let nickDatabase = database.nickDatabase;

// Class
let classDatabase = database.classDatabase;
// 搜尋職業
const searchClass = function (str) {
    debugLog()("searchClass(" + str + ")");
    // for (let i = 0; i < classDatabase.length; ++i) {
    for (let i in classDatabase.data) {

        for (let j in classDatabase.data[i].index) {
            if (str == classDatabase.data[i].index[j]) {
                return classDatabase.data[i].name;
            }
        }
    }
    return "NULL";
}
// value to key
const getRarityString = function (str) {
    if (str == "鐵") return "アイアン";
    else if (str == "銅") return "ブロンズ";
    else if (str == "銀") return "シルバー";
    else if (str == "金") return "ゴールド";
    else if (str == "藍") return "サファイア";
    else if (str == "白" || str == "鉑") return "プラチナ";
    else if (str == "黑") return "ブラック";
    else return "NULL";
}



// 管理用參數
const debugLog = _anna.debugLog = function () {
    if (config.switchVar.debug) {
        if (config.switchVar.debugPush && !config.isLocalHost) {
            return (msg) => {
                console.log(msg);
                abotPushLog(msg);
            };
        } else {
            return console.log;
        }

    } else {
        return () => { };
    }
}
const debugConsoleLog = _anna.debugConsoleLog = function () {
    // debug = T; debugPush = F
    if (config.switchVar.debug) {
        return console.log;
    }

    return () => { };
}

const isAdmin = _anna.isAdmin = function (userId) {
    return (userId == config.adminstrator || config.admins.indexOf(userId) != -1)
}

_anna.autoTest = async function () {
    // await init();
    // await imgur.init();

    // let sourceId = "U9eefeba8c0e5f8ee369730c4f983346b";
    // let userId = "U9eefeba8c0e5f8ee369730c4f983346b";
    // // config.switchVar.debug = true;

    // await replyAI("狀態", sourceId, userId).then(console.log);
    // await replyAI("職業", sourceId, userId).then(console.log);
    // await replyAI("職業 ナ", sourceId, userId).then(console.log);

    // await replyAI("學習 NNLK:白射手ナナリー", sourceId, userId).then(console.log);

    // await replyAI("NNLK", sourceId, userId).then(console.log);
    // await replyAI("黑弓", sourceId, userId).then(console.log);
    // await replyAI("忘記 NNLK", sourceId, userId).then(console.log);
    // await replyAI("NNLK", sourceId, userId).then(console.log);

    // await replyAI("射", sourceId, userId).then(obj => console.log(JSON.stringify(obj, null, 4)));
    // await replyAI("シャル", sourceId, userId).then(obj => console.log(obj));
    // await replyAI("白き射手ナナリー", sourceId, userId).then(obj => console.log(JSON.stringify(obj, null, 4)));
    // await replyAI("王子通常", sourceId, userId).then(obj => console.log(JSON.stringify(obj, null, 4)));
    // await replyAI("1528476371865.JPEG", sourceId, userId).then(obj => console.log(JSON.stringify(obj, null, 4)));
    // await replyAI("0ab61ce0f94dc2f81b38a08f150a17fb", sourceId, userId).then(obj => console.log(JSON.stringify(obj, null, 4)));
    // await replyAI("刻詠の風水士リンネ", sourceId, userId).then(obj => console.log(JSON.stringify(obj, null, 4)));

    // replyAI("update", sourceId, userId).then(console.log);

    // replyAI("new ", sourceId, userId).then(console.log);
    // replyAI("new 0f96ddbcf983dc854b3bb803c4159d5b ", sourceId, userId).then(console.log);
    // replyAI("new 0f96ddbcf983dc854b3bb803c4159d5b NNL", sourceId, userId).then(console.log);
}











