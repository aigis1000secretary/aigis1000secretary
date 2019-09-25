
// 初始化
const config = require("./config.js");
module.exports = {};    // 循環依賴對策
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
const init = module.exports.init = async function () {

    charaDatabase.data = [];
    nickDatabase.data = [];
    classDatabase.data = [];

    await charaDatabase.init().catch(console.log);
    await nickDatabase.init().catch(console.log);
    await classDatabase.init().catch(console.log);

    return;
};


// bot
// reply
const replyAI = module.exports.replyAI = async function (rawMsg, sourceId, userId) {
    debugLog("rawMsg: <" + rawMsg + ">");

    // flag
    let _isAdmin = isAdmin(userId);
    let callAnna = (rawMsg.toUpperCase().indexOf("ANNA ") == 0 || rawMsg.indexOf("安娜 ") == 0);
    if (!callAnna) { rawMsg = "ANNA " + rawMsg; }

    // 分析命令
    rawMsg.replaceAll("\n\n", "\n");
    let msg1 = rawMsg.indexOf("\n") == -1 ? rawMsg.trim() : rawMsg.split("\n")[0].trim();
    let msg2 = rawMsg.indexOf("\n") == -1 ? "" : rawMsg.substring(rawMsg.indexOf("\n") + 1).trim();
    let msgs = msg1.split(" ");
    msgs = msgs.filter(function (n) { return (n && (n != "")) });   // delete null data
    // >> ANNA <command>	<arg1>			<arg2>
    // >> ANNA 學習			NNL:黑弓
    // >> ANNA 資料庫		CharaDatabase	NNL.ability_aw
    let command = ("" + msgs[1].toUpperCase()).trim();
    let arg1 = ("" + msgs[2]).trim();
    let arg2 = ("" + msgs[3]).trim();
    // <command>
    if (command == "undefined") { return false; }
    debugLog("Args: <" + command + "> <" + arg1 + "> <" + arg2 + ">");

    // reply
    if (callAnna) {
        if (command == "DEBUG") {		// debug switch
            config.switchVar.debug = !config.switchVar.debug;
            config.switchVar.debugPush = config.switchVar.debug;
            return "debug = " + (config.switchVar.debug ? "on" : "off");

        } else if (command.length == 1) {		// 定型文
            // 同步執行
            let result = nickDatabase.indexOf(command);
            if (result != -1) {
                command = nickDatabase.data[result].target;
            } else {
                result = replyStamp(command);
                if (result != false) {
                    return result;
                } else {
                    return "王子太短了，找不到...";
                }
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
            replyMsg += "廣播: 開關廣播功能，廣播內容有官方推特即時轉播以及週四定期維護前提醒。\n\n";
            replyMsg += "學習: 用來教會安娜角色的暱稱。\n(>>安娜 學習 NNL:射手ナナリー)\n\n";
            replyMsg += "上傳: 手動上傳資料庫。\n\n";
            replyMsg += "更新: 讀取 wiki 進行資料庫更新。\n\n";

            replyMsg += "\n";
            replyMsg += "直接輸入稀有度+職業可以搜索角色\n(>>安娜 黑弓) *推薦使用\n\n";
            replyMsg += "輸入關鍵字可進行暱稱搜索&模糊搜索\n(>>安娜 NNL)\n(>>安娜 射手ナナリー)\n\n";

            if (!isAdmin(sourceId)) { return replyMsg; }

            replyMsg += "忘記: 刪除特定暱稱。\n(>>安娜 忘記 NNL)\n\n";
            replyMsg += "資料庫: 直接修改資料庫內容。\n(>>資料庫 CharaDatabase NNL.ability_aw)\n\n";
            replyMsg += "NEW: 線上圖庫手動新增TAG。\n\n";
            replyMsg += "NEWIMG: dropbox 圖庫同步至 imgur。\n\n";

            return replyMsg.trim();

        } else if (command == "狀態" || command == "STATU") {
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

        } else if (command == "廣播") {

            let i = database.groupDatabase.indexOf(sourceId)
            if (i != -1) {
                let alarm = !database.groupDatabase.data[i].alarm;
                database.groupDatabase.data[i].alarm = alarm;

                let asyncFunc = async function () {
                    try {
                        await database.groupDatabase.saveDB();
                        await database.groupDatabase.uploadDB();
                    } catch (error) {
                        console.log("上傳異常!" + error);
                    }
                }; asyncFunc();

                return "切換廣播開關，目前為: " + (alarm ? "開" : "關");
            }
            return false;

        } else if (command == "學習") {
            // 關鍵字學習
            // <arg1>
            if (arg1 == "undefined") {
                return "[學習] 要學甚麼?\n(>>安娜 學習 NNL:射手ナナリー)";
            }
            let learn = arg1.replace("：", ":");
            debugLog("learn: <" + learn + ">");

            let keys = learn.split(":"); // NNL:黑弓
            if (keys.length < 2) {
                return "[學習] 看不懂...";
            }

            let arrayA = searchCharacter(keys[0].trim(), true);	// 精確搜索 Nickname
            let arrayB = searchCharacter(keys[1].trim()).concat(searchByClass(keys[1].trim()));
            let countA = arrayA.length;
            let countB = arrayB.length;

            debugLog("new nick: <" + keys[0] + ">");
            debugLog("full name: <" + arrayB + ">");

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
            let asyncFunc = async function () {
                try {
                    await charaDatabase.saveDB()
                    await charaDatabase.uploadDB()

                    await nickDatabase.saveDB()
                    await nickDatabase.uploadDB()

                    await classDatabase.saveDB()
                    await classDatabase.uploadDB()

                    botPushLog("上傳完成!");
                } catch (error) {
                    botPushError("上傳異常!\n" + error);
                }
            }; asyncFunc();

            return "上傳中...";

        } else if (command == "更新" || command == "UPDATE") {
            allCharaDataCrawler(sourceId);
            classDataCrawler();
            return "更新中...";

        } else if (_isAdmin && command == "忘記") {
            // forgot
            // <arg1>
            if (arg1 == "undefined") {
                return false;
            }
            let learn = arg1;
            debugLog("forgot: <" + learn + ">");

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
            await annaCore.init();
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
                            let labels = [], msgs = [];
                            for (let j in array) {
                                labels.push(array[j]);
                                msgs.push("anna new " + img.md5 + " " + array[j]);
                            }
                            labels.push("anna new");
                            msgs.push("anna new");

                            replyMsg.push(line.createMsgButtons(img.md5, labels, msgs));
                            // console.log(JSON.stringify(replyMsg));
                            return replyMsg;
                        }
                        return false;

                    } else {
                        replyMsg.push(line.createImageMsg(img.imageLink, img.thumbnailLink));
                        replyMsg.push(line.createTextMsg("[" + i + "/" + imgArray.length + "]"));
                        replyMsg.push(line.createTextMsg("new " + img.md5 + " "));
                        // console.log(img.md5 + " [" + i + "/" + imgArray.length + "]");
                        return replyMsg;
                    }

                } else {
                    replyMsg = "沒有新照片";
                }

            } else {
                let imgArray = imgur.database.findImageData({ md5: arg1, tag: "NewImages" });
                if (imgArray.length != 1) { return "md5錯誤! " + imgArray.length + " result!"; }

                if (arg2 == "undefined") {
                    return line.createImageMsg(imgArray[0].imageLink, imgArray[0].thumbnailLink);

                } else if (arg2 != "undefined") {
                    let charaArray = searchCharacter(arg2).concat(searchByClass(arg2.trim()));
                    if (charaArray.length > 1) {
                        return "搜尋不明確: " + charaArray;
                    }
                    if (charaArray.length == 1) {
                        target = charaArray[0].trim();
                        // move image file
                        try {
                            dbox.fileMove(
                                "NewImages/NewImages/" + imgArray[0].fileName,
                                "Character/" + target + "/" + imgArray[0].fileName);
                        } catch (error) {
                            console.log("分類錯誤! " + error);
                        }

                        // set taglist
                        imgur.api.image.updateImage({ imageHash: imgArray[0].id, tagList: "Character," + target });

                        let albumHash = imgur.database.findAlbumData({ title: "Character" })[0].id;
                        imgur.api.album.addAlbumImages({ albumHash: albumHash, ids: [imgArray[0].id] });

                        albumHash = imgur.database.findAlbumData({ title: "NewImages" })[0].id;
                        imgur.api.album.removeAlbumImages({ albumHash: albumHash, ids: [imgArray[0].id] });

                        // update imgur database
                        imgur.database.deleteImageData({ id: imgArray[0].id });

                        return "分類完成";
                    }
                }
            }
            return false;

        }

        // 搜尋資料
        let result = false;
        result = searchData(command);
        if (result != false) {
            return result;
        }
    }

    // 呼叫定型文圖片
    let result = false;
    result = replyStamp(command);
    if (result != false) {
        return result;
    }

    if (callAnna) {
        // 404
        let replyMsgs = ["不認識的人呢...", "安娜不知道", "安娜不懂", "那是誰？", "那是什麼？"];
        let replyMsg = replyMsgs[Math.floor(Math.random() * replyMsgs.length)];
        return replyMsg;
    }
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
    debugLog("classResult[" + count + "]: <" + resultArray + ">");
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
    debugLog("charaResult[" + count + "]: <" + resultArray + ">");
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
    debugLog("_rarity + _class: <" + _rarity + " + " + _class + ">");

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
    debugLog("generateCharaData(" + charaName + ")");

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

    debugLog("generateCharaData error! can not found chara!");
    return false;
}
// 定型文貼圖
const replyStamp = module.exports.replyStamp = function (msg) {
    debugLog("replyStamp(" + msg + ")");

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

    return false;
}



// 爬蟲
// 爬蟲函數
const charaDataCrawler = function (urlPath, sourceId) {
    return new Promise(function (resolve, reject) {
        // callback
        let requestCallBack = function (error, response, body) {
            if (error || !body) {
                console.log(error);
                reject(error);
                return null;
            }

            let html = iconv.decode(Buffer.from(body, "binary"), "EUC-JP"); // EUC-JP to utf8 // Shift_JIS EUC-JP
            let $ = cheerio.load(html, { decodeEntities: false }); // 載入 body

            let newData = charaDatabase.newData();
            let rarity = ["アイアン", "ブロンズ", "シルバー", "ゴールド", "サファイア", "プラチナ", "ブラック", "シルバ｜", "ゴ｜ルド"];

            // 搜尋所有表格
            $("div").each(function (i, iElem) {

                let buffer = $(this).attr("id");
                if (buffer && buffer.indexOf("content_block_") != -1 && buffer.indexOf("-") != -1) {

                    // console.log($(this).attr("id"));
                    // console.log($(this).children("table").eq(0).attr("id"));

                    // ステータス
                    if ($(this).prev().children().text().trim() == "ステータス") {
                        $(this).children("table").eq(0).children("tbody").children("tr").children().children().each(function (j, jElem) {
                            // 名前
                            if ($(this).attr("href") == urlPath) {
                                newData.name = $(this).text().trim();
                            }
                            // クラス
                            let temp = $(this).attr("href");
                            if (temp && temp.indexOf("class") != -1) {
                                newData.class = $(this).text().trim();
                            }
                            // レア
                            if (rarity.indexOf($(this).text().trim()) != -1) {
                                let temp = $(this).text().trim().replace("｜", "ー");
                                newData.rarity = temp;
                            }
                        });
                    }

                    // アビリティ
                    if ($(this).prev().children().text().trim() == "アビリティ") {
                        let temp = $(this).children("ul").text().trim().replaceAll("\n\n", "\n").replaceAll("?", "").replaceAll("？", "");
                        // format
                        temp = temp.replaceAll(" ", "、").replaceAll("\s", "、").replaceAll("\r", "、").replaceAll("　", "、");
                        temp = temp.replace("\n", "@").replaceAll("\n", "、").replaceAll("@", "\n").replaceAll("、、", "、").replaceAll("%", "％");
                        temp = temp.replaceAll("*1", "*").replaceAll("*2", "*").replaceAll("*3", "*").replaceAll("*4", "*").replaceAll("*5", "*");
                        temp = temp.replaceAll("*6", "*").replaceAll("*7", "*").replaceAll("*8", "*").replaceAll("*9", "*").replaceAll("*0", "*").replaceAll("*", "");
                        if (temp.indexOf("説明") == -1) {
                            newData.ability = temp;
                        }
                    }

                    // 覚醒アビリティ
                    if ($(this).prev().children().text().trim() == "覚醒アビリティ") {
                        let temp = $(this).children("ul").text().trim().replaceAll("\n\n", "\n").replaceAll("?", "").replaceAll("？", "");
                        // format
                        temp = temp.replaceAll(" ", "、").replaceAll("\s", "、").replaceAll("\r", "、").replaceAll("　", "、");
                        temp = temp.replace("\n", "@").replaceAll("\n", "、").replaceAll("@", "\n").replaceAll("、、", "、").replaceAll("%", "％");
                        temp = temp.replaceAll("*1", "*").replaceAll("*2", "*").replaceAll("*3", "*").replaceAll("*4", "*").replaceAll("*5", "*")
                        temp = temp.replaceAll("*6", "*").replaceAll("*7", "*").replaceAll("*8", "*").replaceAll("*9", "*").replaceAll("*0", "*").replaceAll("*", "");
                        if (temp.indexOf("説明") == -1) {
                            newData.ability_aw = temp;
                        }
                    }

                    // スキル
                    if ($(this).prev().children().text().trim() == "スキル") {
                        let skilList = [], textList = [];
                        skilList = $(this).children("table").html().tableToArray();

                        // get skill name & effect
                        for (let i in skilList) {
                            for (let j in skilList[i]) {
                                if (skilList[i][j] == "") {
                                    skilList[i][j] = "-";
                                }
                                if (skilList[i][j] == "編\n集" ||
                                    skilList[i][j].toUpperCase() == "LV" ||
                                    skilList[i][j] == "備考" ||
                                    skilList[i][j].indexOf("使用までの") != -1 ||
                                    skilList[i][j] == "所持ユニット" ||
                                    skilList[0][j] == "!" ||
                                    skilList[i][0] == "!") {
                                    skilList[i][j] = "!";
                                }
                            }
                        }
                        // remove non-skill
                        for (let i in skilList) {
                            if (skilList[i].indexOf("スキル名") != -1) {
                                skilList[i] = [];
                            }
                            let j;
                            while ((j = skilList[i].indexOf("!")) != -1) {
                                skilList[i].splice(j, 1);
                            }
                        }
                        // remove empty
                        for (let i = 0; i < skilList.length; ++i) {
                            if (skilList[i].length == 0) {
                                skilList.splice(i, 1);
                                i--;
                            }
                        }
                        // remove same skill (lv1~lv4)
                        for (let i = 0; i < skilList.length; ++i) {
                            if (i < skilList.length - 1 && skilList[i][0] == skilList[i + 1][0]) {
                                skilList.splice(i, 1);
                                i--;
                            }
                        }
                        // set textList
                        for (let i in skilList) {
                            let temp = skilList[i][1].trim().replaceAll("?", "").replaceAll("？", "");
                            temp = temp.replaceAll(" ", "、").replaceAll("\s", "、").replaceAll("\r", "、").replaceAll("\n", "、").replaceAll("　", "、").replaceAll("、、", "、").replaceAll("%", "％");
                            temp = temp.replaceAll("*1", "*").replaceAll("*2", "*").replaceAll("*3", "*").replaceAll("*4", "*").replaceAll("*5", "*").replaceAll("*6", "*").replaceAll("*7", "*").replaceAll("*8", "*").replaceAll("*9", "*").replaceAll("*0", "*").replaceAll("*", "");
                            if (temp.indexOf("効果説明") == -1 && temp != "-") {
                                textList.push(skilList[i][0] + "\n" + temp);
                            }
                        }
                        // debugLog(skilList);

                        // put array into skill data
                        if (textList.length != 0) {
                            newData.skill = textList.join("\n");
                        }
                    }

                    // スキル覚醒
                    if ($(this).prev().children().text().trim() == "スキル覚醒") {
                        let skilList = [], textList = [], textList_aw = [];
                        skilList = $(this).children("table").html().tableToArray();

                        // get skill name & effect
                        for (let i in skilList) {
                            for (let j in skilList[i]) {
                                if (skilList[i][j] == "") {
                                    skilList[i][j] = "-";
                                }
                                if (skilList[i][j] == "編\n集" ||
                                    skilList[i][j].toUpperCase() == "LV" ||
                                    skilList[i][j] == "備考" ||
                                    skilList[i][j].indexOf("使用までの") != -1 ||
                                    skilList[i][j] == "所持ユニット" ||
                                    skilList[0][j] == "!" ||
                                    skilList[i][0] == "!") {
                                    skilList[i][j] = "!";
                                }
                            }
                        }
                        // remove non-skill
                        for (let i in skilList) {
                            if (skilList[i].indexOf("スキル名") != -1 || skilList[i].indexOf("覚醒スキル名") != -1) {
                                skilList[i] = [];
                            }
                            let j;
                            while ((j = skilList[i].indexOf("!")) != -1) {
                                skilList[i].splice(j, 1);
                            }
                        }
                        // remove empty
                        for (let i = 0; i < skilList.length; ++i) {
                            if (skilList[i].length == 0) {
                                skilList.splice(i, 1);
                                i--;
                            }
                        }
                        // remove same skill (lv1~lv4)
                        for (let i = 0; i < skilList.length; ++i) {
                            if (i < skilList.length - 1 && skilList[i][1] == skilList[i + 1][1]) {
                                skilList.splice(i, 1);
                                i--;
                            }
                        }
                        // set textList
                        for (let i in skilList) {
                            let temp = skilList[i][2].trim().replaceAll("?", "").replaceAll("？", "");
                            temp = temp.replaceAll(" ", "、").replaceAll("\s", "、").replaceAll("\r", "、").replaceAll("\n", "、").replaceAll("　", "、").replaceAll("、、", "、").replaceAll("%", "％");
                            temp = temp.replaceAll("*1", "*").replaceAll("*2", "*").replaceAll("*3", "*").replaceAll("*4", "*").replaceAll("*5", "*").replaceAll("*6", "*").replaceAll("*7", "*").replaceAll("*8", "*").replaceAll("*9", "*").replaceAll("*0", "*").replaceAll("*", "");
                            if (temp.indexOf("効果説明") == -1 && temp != "-") {
                                if (skilList[i][0] == "通常") {
                                    textList.push(skilList[i][1] + "\n" + temp);
                                } else if (skilList[i][0] == "覚醒") {
                                    textList_aw.push(skilList[i][1] + "\n" + temp);
                                }
                            }
                        }

                        // put array into skill data
                        if (textList.length != 0) {
                            newData.skill = textList.join("\n");
                        }
                        if (textList_aw.length != 0) {
                            newData.skill_aw = textList_aw.join("\n");
                        }
                    }

                    // 統一格式
                    newData.skill = newData.skill.replaceAll("＋", "+").replaceAll("、+", "+").replaceAll("(", "（").replaceAll(")", "）").replaceAll("さらに、", "さらに").replaceAll("の、", "の").replaceAll("配置中のみ", "配置中").replaceAll("配置中、", "配置中").replaceAll("防御力、魔法耐性", "防御力と魔法耐性");
                    newData.skill_aw = newData.skill_aw.replaceAll("＋", "+").replaceAll("、+", "+").replaceAll("(", "（").replaceAll(")", "）").replaceAll("さらに、", "さらに").replaceAll("の、", "の").replaceAll("配置中のみ", "配置中").replaceAll("配置中、", "配置中").replaceAll("防御力、魔法耐性", "防御力と魔法耐性");
                    newData.ability = newData.ability.replaceAll("＋", "+").replaceAll("、+", "+").replaceAll("(", "（").replaceAll(")", "）").replaceAll("さらに、", "さらに").replaceAll("の、", "の").replaceAll("いるだけで、", "いるだけで").replaceAll("配置中のみ", "配置中").replaceAll("配置中、", "配置中").replaceAll("防御力、魔法耐性", "防御力と魔法耐性");
                    newData.ability_aw = newData.ability_aw.replaceAll("＋", "+").replaceAll("、+", "+").replaceAll("(", "（").replaceAll(")", "）").replaceAll("さらに、", "さらに").replaceAll("の、", "の").replaceAll("いるだけで、", "いるだけで").replaceAll("配置中のみ", "配置中").replaceAll("配置中、", "配置中").replaceAll("防御力、魔法耐性", "防御力と魔法耐性");

                    if (newData.ability.indexOf("ランダム") != -1) {
                        newData.ability = newData.ability.replaceAll("、/、", "、");
                        newData.ability = newData.ability.replaceAll("発動、", "発動：");
                        newData.ability = newData.ability.replaceAll("回復、", "回復/");
                        newData.ability = newData.ability.replaceAll("回避、", "回避/");
                        newData.ability = newData.ability.replaceAll("攻撃、", "攻撃/");
                        newData.ability = newData.ability.replaceAll("連射、", "連射/");
                        newData.ability = newData.ability.replaceAll("無視、", "無視/");
                        newData.ability = newData.ability.replaceAll("入手、", "入手/");
                        newData.ability = newData.ability.replaceAll("倍、", "倍/");
                        newData.ability = newData.ability.replaceAll("硬直なし、", "硬直なし/");
                    }
                    if (newData.ability_aw.indexOf("ランダム") != -1) {
                        newData.ability_aw = newData.ability_aw.replaceAll("、/、", "、");
                        newData.ability_aw = newData.ability_aw.replaceAll("発動、", "発動：");
                        newData.ability_aw = newData.ability_aw.replaceAll("回復、", "回復/");
                        newData.ability_aw = newData.ability_aw.replaceAll("回避、", "回避/");
                        newData.ability_aw = newData.ability_aw.replaceAll("攻撃、", "攻撃/");
                        newData.ability_aw = newData.ability_aw.replaceAll("連射、", "連射/");
                        newData.ability_aw = newData.ability_aw.replaceAll("無視、", "無視/");
                        newData.ability_aw = newData.ability_aw.replaceAll("入手、", "入手/");
                        newData.ability_aw = newData.ability_aw.replaceAll("倍、", "倍/");
                        newData.ability_aw = newData.ability_aw.replaceAll("硬直なし、", "硬直なし/");
                    }

                    newData.urlName = urlPath.replace("https://seesaawiki.jp/aigis/d/", "");
                }
            });
            // debugLog(newData);
            // 新增角色資料
            let msg = charaDatabase.addData(newData);
            if (msg != "") {
                botPush(sourceId, msg);
            }
            resolve();
        }
        request.get(urlPath, { encoding: "binary" }, requestCallBack);
    });
};
// 爬所有角色
let allCharaUrl = [];
const allCharaDataCrawler = function (sourceId) {
    console.log("AllCharaData Crawling...");

    // callback
    let requestCallBack = function (error, response, body) {
        if (error || !body) {
            console.log(error);
            return null;
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
                allCharaUrl.indexOf(buffer) == -1 &&
                buffer.indexOf("%b2%a6%bb%d2") == -1) {
                // console.log($(this).text());
                allCharaUrl.push(buffer);
            }
        });
    }
    request.get("http://seesaawiki.jp/aigis/d/%a5%b4%a1%bc%a5%eb%a5%c9", { encoding: "binary" }, requestCallBack);
    request.get("http://seesaawiki.jp/aigis/d/%a5%b5%a5%d5%a5%a1%a5%a4%a5%a2", { encoding: "binary" }, requestCallBack);
    request.get("http://seesaawiki.jp/aigis/d/%a5%d7%a5%e9%a5%c1%a5%ca", { encoding: "binary" }, requestCallBack);
    request.get("http://seesaawiki.jp/aigis/d/%a5%d6%a5%e9%a5%c3%a5%af", { encoding: "binary" }, requestCallBack);

    request.get("https://seesaawiki.jp/aigis/d/%cc%be%c1%b0%bd%e7%b0%ec%cd%f7", { encoding: "binary" }, requestCallBack);
    request.get("https://seesaawiki.jp/aigis/d/%bc%c2%c1%f5%bd%e7%b0%ec%cd%f7", { encoding: "binary" }, requestCallBack);
    request.get("https://seesaawiki.jp/aigis/d/%c2%b0%c0%ad%ca%cc%b0%ec%cd%f7", { encoding: "binary" }, requestCallBack);

    setTimeout(async function () {
        let promiseArray = [];
        while (allCharaUrl.length > 0) {
            // 50 thread
            for (let i = 0; i < 50; ++i) {
                if (allCharaUrl.length > 0) {
                    promiseArray.push(charaDataCrawler(allCharaUrl.pop(), sourceId));
                }
            }
            await Promise.all(promiseArray);
        }
        botPush(sourceId, "角色更新完成!");
        // save Database
        charaDatabase.uploadTask();
    }, 3000);

}
// 爬職業
const classDataCrawler = function () {
    console.log("ClassData Crawling...");

    // callback
    let requestCallBack = function (error, response, body) {
        if (error || !body) {
            console.log(error);
            return null;
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
        });
    }
    request.get("http://seesaawiki.jp/aigis/d/class_%b6%e1%c0%dc%b7%bf_%cc%dc%bc%a1", { encoding: "binary" }, requestCallBack);
    request.get("http://seesaawiki.jp/aigis/d/class_%b1%f3%b5%f7%ce%a5%b7%bf_%cc%dc%bc%a1", { encoding: "binary" }, requestCallBack);

    setTimeout(async function () {
        // save Database
        classDatabase.uploadTask();
    }, 3000);

};
// HTML table to array
String.prototype.tableToArray = function () {
    let result = [];
    let html = this.replaceAll("<br>", "\n");
    let i, j, k;

    if ((i = html.indexOf("<tbody>")) != -1 && (j = html.indexOf("</tbody>")) != -1) {
        // get tbody
        html = html.substring(i + 7, j);

        // init table data
        i = -1;
        while ((i = html.indexOf("<tr>", i + 1)) != -1) {
            result.push([]);
        }

        // get single Column body
        let col = 0;
        while ((i = html.indexOf("<tr>")) != -1 && (j = html.indexOf("</tr>")) != -1) {
            if (i > j) continue;
            // split All Row body
            let columnBody = html.substring(i + 4, j);
            html = html.substring(j + 5);

            // get single Cell body
            let row = 0;
            while ((i = columnBody.indexOf("<td") + 3) != -1 && (j = columnBody.indexOf(">")) != -1 && (k = columnBody.indexOf("</td>")) != -1) {
                if (i > j || j > k || i > k) continue;
                while (result[col][row] == "@") { row++; }

                // split Cell body
                let cellStyle = columnBody.substring(i + 1, j);
                let cellBody = columnBody.substring(j + 1, k).trim();;
                columnBody = columnBody.substring(k + 5);

                // remove <a> </a>
                while ((i = cellBody.indexOf("<")) != -1 && (j = cellBody.indexOf(">")) != -1) {
                    cellBody = cellBody.replace(cellBody.substring(i, j + 1), "");
                }

                // set table text
                result[col][row] = cellBody;

                // check span cell
                let style = cellStyle.split(" ");
                for (let l in style) {
                    if (style[l].indexOf("rowspan") != -1) {
                        let rowspan = parseInt(style[l].replaceAll("\"", "").replace("rowspan=", ""));
                        for (let span = 1; span < rowspan; span++) {
                            // result[col][row] = cellBody;
                            result[col + span][row] = "@";
                        }
                    }
                    if (style[l].indexOf("colspan") != -1) {
                        let colspan = parseInt(style[l].replaceAll("\"", "").replace("colspan=", ""));
                        for (let span = 1; span < colspan; span++) {
                            row++;
                            result[col][row] = cellBody;
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
const searchCharacter = module.exports.searchCharacter = function (key, accurate) {
    accurate = !!accurate;
    debugLog("searchCharacter(" + key + ", " + accurate + ")");

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
        debugLog("_metricsMax: <" + metricsMax + ">");
        debugLog("_metricsMin: <" + metricsMin + ">");

        for (let charaIndex = metricsMax; charaIndex >= metricsMin; charaIndex--) {
            if (!array_metrics[charaIndex]) continue;	// 檢查搜尋結果

            // 遍歷搜尋結果
            for (let i in array_metrics[charaIndex]) {
                let index = array_metrics[charaIndex][i];

                debugLog("_array_metrics : <" + charaIndex + ": " + charaDatabase.data[index].name + ">");
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
    debugLog("searchClass(" + str + ")");
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
const debugLog = module.exports.debugLog = function (msg) {
    if (!config.switchVar.debug) {
        return;
    }
    console.log(msg);
    debugPush(msg);
}
const debugPush = function (msg) {
    if (config.switchVar.debugPush) {
        botPushError(msg);
    }
}
const isAdmin = function (userId) {
    return (userId == config.adminstrator || config.admins.indexOf(userId) != -1)
}

module.exports.autoTest = async function () {
    // await init();
    // await imgur.init();

    let sourceId = "U9eefeba8c0e5f8ee369730c4f983346b";
    let userId = "U9eefeba8c0e5f8ee369730c4f983346b";
    // config.switchVar.debug = true;

    // await replyAI("anna 狀態", sourceId, userId).then(console.log);
    // await replyAI("anna 職業", sourceId, userId).then(console.log);
    // await replyAI("anna 職業 ナ", sourceId, userId).then(console.log);

    // await replyAI("anna 學習 NNLK:白ナナリー", sourceId, userId).then(console.log);

    // await replyAI("anna NNLK", sourceId, userId).then(console.log);
    // await replyAI("anna 黑弓", sourceId, userId).then(console.log);
    // await replyAI("anna 忘記 NNLK", sourceId, userId).then(console.log);
    // await replyAI("anna NNLK", sourceId, userId).then(console.log);

    // await replyAI("anna 射", sourceId, userId).then(obj => console.log(JSON.stringify(obj, null, 4)));
    // await replyAI("anna シャル", sourceId, userId).then(obj => console.log(obj));
    // await replyAI("anna 白き射手ナナリー", sourceId, userId).then(obj => console.log(JSON.stringify(obj, null, 4)));
    // await replyAI("anna 王子通常", sourceId, userId).then(obj => console.log(JSON.stringify(obj, null, 4)));
    // await replyAI("1528476371865.JPEG", sourceId, userId).then(obj => console.log(JSON.stringify(obj, null, 4)));
    // await replyAI("0ab61ce0f94dc2f81b38a08f150a17fb", sourceId, userId).then(obj => console.log(JSON.stringify(obj, null, 4)));
    // await replyAI("刻詠の風水士リンネ", sourceId, userId).then(obj => console.log(JSON.stringify(obj, null, 4)));

    // replyAI("anna update", sourceId, userId).then(console.log);

    // replyAI("anna new ", sourceId, userId).then(console.log);
    // replyAI("anna new 0f96ddbcf983dc854b3bb803c4159d5b ", sourceId, userId).then(console.log);
    // replyAI("anna new 0f96ddbcf983dc854b3bb803c4159d5b NNL", sourceId, userId).then(console.log);
}











