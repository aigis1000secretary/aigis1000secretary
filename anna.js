
// 初始化
// 爬蟲
const request = require("request");
const iconv = require("iconv-lite");
const cheerio = require("cheerio");
// 資料庫
//const fs = require("fs");
//const dbox = require("./dbox.js");
const database = require("./database.js");
const imgur = require("./imgur.js");

var _debug = false;
var _debugPush = false;
var _version = "0.5.5.0";
// 主版本號：當你做了不兼容的API修改
// 次版本號：當你做了向下兼容的功能性新增
// 修訂號：當你做了向下兼容的問題修正
// 次修訂號：線上debug

String.prototype.replaceAll = function (s1, s2) {
	var source = this;
	while ((temp = source.replace(s1, s2)) != source) {
		source = temp;
	}
	return source.toString();
}



// line bot
// 搜尋資料
const replyAI = async function (rawMsg, userId, replyFunc) {
	// 指令:
	let msg2 = rawMsg.indexOf("\n") == -1 ? "" : rawMsg.substring(rawMsg.indexOf("\n") + 1);
	rawMsg = rawMsg.split("\n")[0];
	let isAdmin = module.exports.isAdmin(userId);

	debugLog("rawMsg: <" + rawMsg + ">");

	// 分析命令
	let msgs = rawMsg.split(" ");
	if (msgs.length < 2) {
		return false;
	}
	let command = msgs[1].toUpperCase().trim();
	debugLog("Command: <" + command + ">");

	// debug switch
	if (command == "DEBUG") {
		_debug = !_debug;
		_debugPush = !_debugPush;
		replyFunc("_debug = " + (_debug ? "on" : "off"));
		return true;
	}

	// 定型文
	if (command.length == 1) {
		if (searchCharacterReply(command, false, replyFunc) == 1) {
			return true;
		} else if (replyStamp(command, replyFunc)) {
			// 呼叫定型文圖片
			return true;
		} else {
			replyFunc("王子太短了，找不到...");
			return true;
		}

	} else if (command == "巨根") {
		replyFunc("王子太小了，找不到...");
		return true;

	} else if (command == "醒醒" || command == "WAKE") {
		// wake
		replyFunc("呣喵~?");
		return true;

	} else if (command == "指令" || command == "HELP") {
		// help
		var replyMsg = "";

		replyMsg += "狀態: 確認目前版本，資料庫資料筆數。\n(>>安娜 狀態)\n\n";
		replyMsg += "照片: 上傳角色附圖的網路空間(DropBox)。\n(>>安娜 照片)\n\n";
		replyMsg += "工具: 千年戰爭Aigis實用工具。\n(>>安娜 工具)\n\n";
		replyMsg += "職業: 列出資料庫現有職業。\n\n";
		replyMsg += "學習: 用來教會安娜角色的暱稱。\n(>>安娜 學習 NNL:射手ナナリー)\n\n";

		replyMsg += "\n";
		replyMsg += "直接輸入稀有度+職業可以搜索角色\n(>>安娜 黑弓) *推薦使用\n\n";
		replyMsg += "輸入關鍵字可進行暱稱搜索&模糊搜索\n(>>安娜 NNL)\n(>>安娜 射手ナナリー)";

		if (!_debug) {
			replyFunc(replyMsg);
			return true;
		}

		replyMsg += "\n";
		replyMsg += "忘記: 刪除特定暱稱。\n(>>安娜 忘記 NNL)\n\n";
		replyMsg += "資料庫: 直接修改資料庫內容。\n(>>資料庫 CharaDataBase NNL.ability_aw)\n\n";
		replyMsg += "上傳: 手動上傳資料庫更新。\n\n";
		replyMsg += "更新: 手動上傳資料庫更新。\n\n";

		replyFunc(replyMsg);
		return true;

	} else if (command == "狀態" || command == "STATU") {
		// status
		//loadAutoResponseList();
		await imgur.account.allImages()
			.then(imgur.dataBase.loadImages)
			.catch(function (error) {
				console.log("Imgur images load error!");
				console.log(error);
			});

		var replyMsg = "";

		replyMsg += "目前版本 v" + _version + "\n";
		replyMsg += "資料庫內有 " + charaDataBase.data.length + " 筆角色資料\n";
		replyMsg += "　　　　　 " + classDataBase.data.length + " 筆職業資料\n";
		replyMsg += "　　　　　 " + imgur.dataBase.images.length + " 筆貼圖資料";

		replyFunc(replyMsg);
		return true;

	} else if (command == "照片" || command == "圖片" || command == "相片" || command == "PICTURE") {
		// 圖片空間
		replyFunc(createTemplateMsg("圖片空間", ["上傳新照片", "線上圖庫"],
			["https://www.dropbox.com/request/FhIsMnWVRtv30ZL2Ty69",
				"https://www.dropbox.com/sh/vonsrxzy79nkpah/AAD4p6TwZF44GHP5f6gdEh3ba?dl=0"]));
		return true;

	} else if (command == "工具" || command == "TOOL") {
		// tool
		var templateMsgA, templateMsgB;

		var laleArray = [];
		var urlArray = [];
		laleArray.push("特殊合成表");
		urlArray.push("https://seesaawiki.jp/aigis/d/%C6%C3%BC%EC%B9%E7%C0%AE%C9%BD");
		laleArray.push("經驗值計算機");
		urlArray.push("http://aigistool.html.xdomain.jp/EXP.html");
		laleArray.push("體魅計算機");
		urlArray.push("http://aigistool.html.xdomain.jp/ChariSta.html");
		templateMsgA = createTemplateMsg("實用工具 (1)", laleArray, urlArray);

		laleArray = [];
		urlArray = [];
		laleArray.push("DPS一覽表 (日)");
		urlArray.push("http://www116.sakura.ne.jp/~kuromoji/aigis_dps.htm");
		laleArray.push("攻略頻道: Sennen");
		urlArray.push("https://www.youtube.com/channel/UC8RlGt22URJuM0yM0pUyWBA");
		laleArray.push("千年戦争アイギス攻略ブログ");
		urlArray.push("http://sennenaigis.blog.fc2.com/");
		templateMsgB = createTemplateMsg("實用工具 (2)", laleArray, urlArray);

		var replyMsg = [templateMsgA, templateMsgB];

		replyFunc(replyMsg);
		return true;

	} else if (command == "職業") {
		let classDB = classDataBase.data
		var replyMsgA = "";
		var replyMsgB = "";
		for (let i in classDB) {
			if (classDB[i].type == "近接型") {
				replyMsgA += classDB[i].index.join(",\t") + "\n";
			} else if (classDB[i].type == "遠距離型") {
				replyMsgB += classDB[i].index.join(",\t") + "\n";
			}
		}
		replyMsgA = replyMsgA.trim();
		replyMsgB = replyMsgB.trim();
		replyFunc(replyMsgA + "\n" + replyMsgB);
		return true;

	} else if (command == "學習") {
		// 關鍵字學習
		if (msgs.length < 3) {
			replyFunc("[學習] 要學甚麼?");
			return true;
		}
		let learn = msgs[2].trim().replace("：", ":");
		debugLog("learn: <" + learn + ">");

		let keys = learn.split(":"); // NNL:黑弓
		if (keys.length < 2) {
			replyFunc("[學習] 看不懂...");
			return true;
		}

		let arrayA = searchCharacter(keys[0].trim(), false);	// 精確搜索 Nickname
		let arrayB = searchCharacter(keys[1].trim());
		let countA = arrayA.length;
		let countB = arrayB.length;

		debugLog("full name: <" + arrayB + ">");
		debugLog("new nick: <" + keys[0] + ">");

		if (countA == 1) {
			replyFunc("[學習] 安娜知道的！");
			return true;

		} else if (countB == 0) {
			let replyMsgs = ["不認識的人呢...", "那是誰？"];
			var replyMsg = "[學習] " + replyMsgs[Math.floor(Math.random() * replyMsgs.length)];
			replyFunc(replyMsg);
			return true;

		} else if (countB > 1) {
			replyFunc("[學習] 太多人了，不知道是誰");
			return true;

		} else {
			var key = arrayB[0];
			var nick = keys[0];

			addNickData(key, nick);

			// wait 25 min to save
			nickDataBase.uploadTask().catch(debugLog);

			replyFunc("[學習] 嗯！記住了！");
			return true;
		}
	} else if (isAdmin && command == "忘記") {
		// forgot
		if (msgs.length < 3) {
			return false;
		}
		let learn = msgs[2].trim();
		debugLog("forgot: <" + learn + ">");

		let i = nickDataBase.indexOf(learn.trim());
		if (i > -1) {
			nickDataBase.data.splice(i, 1);
		}

		// wait 25 min to save
		nickDataBase.uploadTask().catch(debugLog);;

		replyFunc("[學習] 忘記了!");
		return true;

	} else if (isAdmin && (command == "資料庫" || command == "DB")) {

		if (msgs.length < 3) {
			replyFunc("請選擇資料庫:\nCharaDataBase\nNickDataBase\nClassDataBase\n\n(>>資料庫 CharaDataBase NNL.ability_aw)");
			return true;
		} else if (msgs.length < 4) {
			replyFunc("請輸入項目: \n(>>資料庫 CharaDataBase NNL.ability_aw)");
			return true;
		}

		let targetString = msgs[2];
		let indexString = msgs[3].split(".")[0];
		let property = msgs[3].split(".")[1];
		let index;

		let targetDB;
		if (targetString == "CharaDataBase") {
			targetDB = charaDataBase;
			index = charaDataBase.indexOf(searchCharacter(indexString)[0]);
		} else if (targetString == "NickDataBase") {
			targetDB = nickDataBase;
			index = nickDataBase.indexOf(indexString);
		} else if (targetString == "ClassDataBase") {
			targetDB = classDataBase;
			index = classDataBase.indexOf(indexString);
		} else {
			replyFunc("不明的資料庫!");
			return true;
		}

		if (index == -1) {
			replyFunc("找不到目標!");
			return true;

		} else if (msg2 = "DEL") {
			targetDB.data.splice(index, 1);
			replyFunc("刪除成功!");
			return true;

		} else if (typeof (property) == "undefined" || typeof (targetDB.data[index][property]) == "undefined") {
			let reply = "成員不明! 請選擇成員:\n";

			for (let key in targetDB.data[index]) {
				if (typeof (targetDB.data[index][key]) != "function") {
					reply += key + "\n";
				}
			}

			replyFunc(reply.trim());
			return true;

		} else if (msg2 == "") {
			var replyMsg = [];
			replyMsg.push(createTextMsg("請換行輸入項目內容."));
			replyMsg.push(createTextMsg(targetDB.data[index][property]));
			replyFunc(replyMsg);
			return true;

		} else {
			targetDB.data[index][property] = msg2;
			replyFunc("修改成功");
			targetDB.uploadTask().catch(debugLog);;
			return true;

		}

		return false;
	} else if (command == "上傳" || command == "UPLOAD") {

		try {
			replyFunc("上傳中...");

			await charaDataBase.saveDB();
			await charaDataBase.uploadDB();

			await nickDataBase.saveDB();
			await nickDataBase.uploadDB();

			await classDataBase.saveDB();
			await classDataBase.uploadDB();

			botPush("上傳完成!");
			return true;
		} catch (error) {
			botPush("上傳異常! " + error);
			return true;
		}

	} else if (command == "更新" || command == "UPDATA") {
		allCharaDataCrawler();
		classDataCrawler();
		replyFunc("更新中...");
		return true;

	} else if (isAdmin && (command == "初始化" || command == "INIT")) {
		await module.exports.init();
		replyFunc("初始化完成!");
		return true;

	}

	if (searchClassReply(command, replyFunc) > 0) {
		return true;
	}

	if (searchCharacterReply(command, true, replyFunc) > 0) {
		return true;
	}

	// 呼叫定型文圖片
	if (replyStamp(command, replyFunc)) {
		return true;
	}

	// 404
	let replyMsgs = ["不認識的人呢...", "安娜不知道", "安娜不懂", "那是誰？", "那是什麼？"];
	var replyMsg = replyMsgs[Math.floor(Math.random() * replyMsgs.length)];
	replyFunc(replyMsg);
	return false;
}

// 搜尋職業&回復
const searchClassReply = function (command, replyFunc) {

	// 搜索職業
	if (command.indexOf("金") == 0 || command.indexOf("藍") == 0 || command.indexOf("白") == 0
		|| command.indexOf("鉑") == 0 || command.indexOf("白金") == 0 || command.indexOf("黑") == 0) {
		// 分割命令
		let _rarity = getRarityString(command[0]);
		let _class = command.indexOf("白金") == 0 ? searchClass(command.substring(2).trim()) : searchClass(command.substring(1).trim());
		debugLog("_rarity+_class: <" + _rarity + "+" + _class + ">");

		var result = "";
		let count = 0;
		// 遍歷角色資料
		for (let i in charaDataBase.data) {
			let obj = charaDataBase.data[i];
			if (obj.rarity == _rarity && obj.class == _class) {
				result += obj.name + "\n";
				count++;
			}
		}
		result = result.trim()
		debugLog("result: <" + result + ">");

		if (count == 1) {	// only one
			replayCharaData(result, replyFunc);
			return true;

		} else if (count > 0) {	// list
			replyFunc(result);
			return true;
		}
	}
	return false;
}

// 搜尋角色&回復
const searchCharacterReply = function (command, blurry, replyFunc) {
	if (typeof (blurry) == "undefined") blurry = true;

	// 搜索名稱
	let resultArray = searchCharacter(command, blurry);
	var count = resultArray.length;
	debugLog("resultArray[" + count + "]: <" + resultArray + ">");

	// 遍歷
	var result = resultArray.join("\n");

	// only one
	if (count == 1) {
		replayCharaData(result, replyFunc);
	}
	else if (count > 0) // list
	{
		replyFunc(result);
	}
	return count;
}

// 回覆單一角色資料
const replayCharaData = function (charaName, replyFunc) {
	debugLog("replayCharaData(" + charaName + ")");

	let i = charaDataBase.indexOf(charaName);
	let obj = charaDataBase.data[i];

	var replyMsg = [];
	replyMsg.push(createTextMsg(obj.getMessage()));

	let imgArray = imgur.dataBase.findImageByTag(charaName);
	if (imgArray.length > 0) {
		let i = Math.floor(Math.random() * imgArray.length);
		replyMsg.push(createImageMsg(imgArray[i].imageLink, imgArray[i].thumbnailLink));
	}

	replyMsg.push(createTemplateMsg("Wiki 連結", [obj.name], [obj.getWikiUrl()]));

	replyFunc(replyMsg);
	return;
}

// 定型文貼圖
const replyStamp = function (msg, replyFunc) {
	if (typeof (msg) == "undefined") return false;
	debugLog("stampReply(" + msg + ")");

	var replyMsg = [];

	let imgArray = imgur.dataBase.findImageByTag(msg);
	if (imgArray.length > 0) {
		let i = Math.floor(Math.random() * imgArray.length);
		replyMsg.push(createImageMsg(imgArray[i].imageLink, imgArray[i].thumbnailLink));
		replyFunc(replyMsg);
		return true;
	}

	imgArray = imgur.dataBase.findImageByFileName(msg);
	if (imgArray.length > 0) {
		replyMsg.push(createImageMsg(imgArray[0].imageLink, imgArray[0].thumbnailLink));
		replyFunc(replyMsg);
		return true;
	}

	return false;
}



// 爬蟲
// 爬蟲函數
const charaDataCrawler = function (urlPath) {
	return new Promise(function (resolve, reject) {
		// callback
		let requestCallBack = function (error, response, body) {
			if (error || !body) {
				console.log(error);
				reject(error);
				return null;
			}

			var html = iconv.decode(new Buffer(body, "binary"), "EUC-JP"); // EUC-JP to utf8 // Shift_JIS EUC-JP
			let $ = cheerio.load(html, { decodeEntities: false }); // 載入 body

			var newData = charaDataBase.newData();
			let rarity = ["ゴールド", "サファイア", "プラチナ", "ブラック", "ゴ｜ルド"];

			// 搜尋所有表格
			$("div").each(function (i, iElem) {

				let buffer = $(this).attr("id");
				if (buffer && buffer.indexOf("content_block_") != -1 && buffer.indexOf("-") != -1) {

					//console.log($(this).attr("id"));
					//console.log($(this).children("table").eq(0).attr("id"));

					// ステータス
					if ($(this).prev().children().text().trim() == "ステータス") {
						$(this).children("table").eq(0).children("tbody").children("tr").children().children().each(function (j, jElem) {
							// 名前
							if ($(this).attr("href") == urlPath) {
								newData.name = $(this).text().trim();
							}
							// クラス
							let temp = $(this).attr("href");
							if (typeof (temp) != "undefined" && temp.indexOf("class") != -1) {
								newData.class = $(this).text().trim();
							}
							// レア
							if (rarity.indexOf($(this).text().trim()) != -1) {
								let temp = $(this).text().trim();
								newData.rarity = temp == "ゴ｜ルド" ? "ゴールド" : temp;
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
								if (skilList[i][j] == "編\n集" || skilList[i][j].toUpperCase() == "LV" || skilList[i][j] == "" || skilList[i][j] == "備考"
									|| skilList[i][j].indexOf("使用までの") != -1 || skilList[i][j] == "所持ユニット"
									|| skilList[0][j] == "!" || skilList[i][0] == "!") {
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
						for (let i = 0; i < skilList.length; i++) {
							if (skilList[i].length == 0) {
								skilList.splice(i, 1);
								i--;
							}
						}
						// remove same skill (lv1~lv4)
						for (let i = 0; i < skilList.length; i++) {
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
							if (temp.indexOf("効果説明") == -1) {
								textList.push(skilList[i][0] + "\n" + temp);
							}
						}
						//debugLog(skilList);

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
								if (skilList[i][j] == "編\n集" || skilList[i][j].toUpperCase() == "LV" || skilList[i][j] == "" || skilList[i][j] == "備考"
									|| skilList[i][j].indexOf("使用までの") != -1 || skilList[i][j].indexOf("初動まで") != -1 || skilList[i][j].indexOf("回復まで") != -1 || skilList[i][j] == "所持ユニット"
									|| skilList[0][j] == "!" || skilList[i][0] == "!") {
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
						for (let i = 0; i < skilList.length; i++) {
							if (skilList[i].length == 0) {
								skilList.splice(i, 1);
								i--;
							}
						}
						// remove same skill (lv1~lv4)
						for (let i = 0; i < skilList.length; i++) {
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
							if (temp.indexOf("効果説明") == -1) {
								if (skilList[i][0] == "通常") {
									textList.push(skilList[i][1] + "\n" + temp);
								}
								else if (skilList[i][0] == "覚醒") {
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
					newData.skill = newData.skill.replaceAll("＋", "+").replaceAll("、+", "+").replaceAll("さらに、", "さらに").replaceAll("の、", "の").replaceAll("配置中のみ", "配置中").replaceAll("配置中、", "配置中").replaceAll("防御力、魔法耐性", "防御力と魔法耐性");
					newData.skill_aw = newData.skill_aw.replaceAll("＋", "+").replaceAll("、+", "+").replaceAll("さらに、", "さらに").replaceAll("の、", "の").replaceAll("配置中のみ", "配置中").replaceAll("配置中、", "配置中").replaceAll("防御力、魔法耐性", "防御力と魔法耐性");
					newData.ability = newData.ability.replaceAll("＋", "+").replaceAll("、+", "+").replaceAll("さらに、", "さらに").replaceAll("の、", "の").replaceAll("いるだけで、", "いるだけで").replaceAll("配置中のみ", "配置中").replaceAll("配置中、", "配置中").replaceAll("防御力、魔法耐性", "防御力と魔法耐性");
					newData.ability_aw = newData.ability_aw.replaceAll("＋", "+").replaceAll("、+", "+").replaceAll("さらに、", "さらに").replaceAll("の、", "の").replaceAll("いるだけで、", "いるだけで").replaceAll("配置中のみ", "配置中").replaceAll("配置中、", "配置中").replaceAll("防御力、魔法耐性", "防御力と魔法耐性");

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
				}
			});
			//debugLog(newData);
			// 新增角色資料
			addCharaData(newData);
			resolve();
		}
		request.get(urlPath, { encoding: "binary" }, requestCallBack);
	});
};
// 爬所有角色
const allCharaDataCrawler = function () {
	console.log("AllCharaData Crawling...");
	let allCharaUrl = [];

	// callback
	let requestCallBack = function (error, response, body) {
		if (error || !body) {
			console.log(error);
			return null;
		}

		var html = iconv.decode(new Buffer(body, "binary"), "EUC-JP"); // EUC-JP to utf8 // Shift_JIS EUC-JP
		let $ = cheerio.load(html, { decodeEntities: false }); // 載入 body

		// 搜尋所有超連結
		$("a").each(function (i, elem) {

			let buffer = $(this).attr("href");
			if (buffer && $(this).parent().is("td") && $(this).prev().prev().children().is("img")) {
				//console.log($(this).text());
				// 延遲呼叫角色爬蟲
				// setTimeout(function () { charaDataCrawler(buffer); }, delay * 50);
				allCharaUrl.push(buffer);
				//delay++;
			}
		});
	}
	request.get("http://seesaawiki.jp/aigis/d/%a5%b4%a1%bc%a5%eb%a5%c9", { encoding: "binary" }, requestCallBack);
	request.get("http://seesaawiki.jp/aigis/d/%a5%b5%a5%d5%a5%a1%a5%a4%a5%a2", { encoding: "binary" }, requestCallBack);
	request.get("http://seesaawiki.jp/aigis/d/%a5%d7%a5%e9%a5%c1%a5%ca", { encoding: "binary" }, requestCallBack);
	request.get("http://seesaawiki.jp/aigis/d/%a5%d6%a5%e9%a5%c3%a5%af", { encoding: "binary" }, requestCallBack);

	setTimeout(async function () {
		let promiseArray = [];
		while (allCharaUrl.length > 0) {
			// 50 thread
			for (let i = 0; i < 50; i++) {
				if (allCharaUrl.length > 0) {
					promiseArray.push(charaDataCrawler(allCharaUrl.pop()));
				}
			}
			await Promise.all(promiseArray);
		}
		botPush("角色更新完成!");
		// save database
		charaDataBase.uploadTask().catch(debugLog);;
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

		var html = iconv.decode(new Buffer(body, "binary"), "EUC-JP"); // EUC-JP to utf8 // Shift_JIS EUC-JP
		let $ = cheerio.load(html, { decodeEntities: false }); // 載入 body

		$("div").each(function (i, elem) {

			let buffer = $(this).attr("id");
			// 搜尋所有表格
			if (buffer && buffer.indexOf("content_block_") != -1 && buffer.indexOf("-") != -1) {

				// 檢查表格標籤
				if ($(this).prev().text().trim() == "一覧") {

					// 遍歷表格內容
					$(this).children().children().children().children().children().each(function (i, elem) {

						var str = $(this).text().trim();
						var i = str.indexOf("\/");
						if (i != -1) {
							str = str.substring(0, i);
						}

						if (str.trim() == "" || str.indexOf("編集") != -1) {
							return;
						}

						var newData = classDataBase.newData();
						newData.name = str;
						newData.index.push(str);
						if ($("title").text().indexOf("近接型") != -1)
							newData.type = "近接型";
						else if ($("title").text().indexOf("遠距離型") != -1)
							newData.type = "遠距離型";
						else
							newData.type = "UNKNOWN";

						// 新增職業資料
						addClassData(newData);
					});
				}
			}
		});
	}
	request.get("http://seesaawiki.jp/aigis/d/class_%b6%e1%c0%dc%b7%bf_%cc%dc%bc%a1", { encoding: "binary" }, requestCallBack);
	request.get("http://seesaawiki.jp/aigis/d/class_%b1%f3%b5%f7%ce%a5%b7%bf_%cc%dc%bc%a1", { encoding: "binary" }, requestCallBack);

	setTimeout(async function () {
		// save database
		classDataBase.uploadTask().catch(debugLog);;
	}, 3000);

};
// 網址編碼
const urlEncode = function (str_utf8, codePage) {
	let buffer = iconv.encode(str_utf8, codePage);
	let str = "";
	for (let i = 0; i < buffer.length; i++) {
		str += "%" + buffer[i].toString(16);
	}
	return str.toUpperCase();
}
const urlEncodeJP = function (str_utf8) { return urlEncode(str_utf8, "EUC-JP"); }
const urlEncodeBIG5 = function (str_utf8) { return urlEncode(str_utf8, "BIG5"); }
const urlEncodeUTF8 = function (str_utf8) { return urlEncode(str_utf8, "UTF-8"); }
const encodeURI_JP = function (url) {
	var result = "";

	let jpEncode = "";
	let big5Encode = "";
	let uriEncode = "";

	for (let i = 0; i < url.length; i++) {
		jpEncode = urlEncodeJP(url[i]);
		big5Encode = urlEncodeBIG5(url[i]);
		uriEncode = encodeURI(url[i]);

		if (jpEncode == big5Encode)
			result += uriEncode;
		else
			result += jpEncode;
	}
	return result;
}
// HTML table to array
String.prototype.tableToArray = function () {
	var result = [];
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
							//result[col][row] = cellBody;
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
var charaDataBase = database.createNewDataBase("CharaDataBase");
// 建構資料函數
charaDataBase.newData = function () {
	var obj = {};
	obj.name = "";
	obj.ability = "";
	obj.ability_aw = "";
	obj.skill = "";
	obj.skill_aw = "";

	obj.rarity = "";
	obj.class = "";

	obj.getMessage = function () {
		var string = "";

		string += this.name + "　　" + this.rarity + "\n";

		let nickList = [];
		for (let i in nickDataBase.data) {
			if (nickDataBase.data[i].target == this.name) {
				nickList.push(nickDataBase.data[i].name);
			}
		}
		if (nickList.length > 0) {
			string += nickList.join(" ") + "\n";
		}

		if (this.ability != "") {
			string += "◇特：" + this.ability + "\n";
		}

		if (this.skill != "") {
			string += "◇技：" + this.skill + "\n";
		}

		if (this.ability_aw != "") {
			string += "◆特：" + this.ability_aw + "\n";
		}

		if (this.skill_aw != "") {
			string += "◆技：" + this.skill_aw + "\n";
		}

		return string;
	};
	obj.getWikiUrl = function () {
		if (this.name.indexOf("王子") != -1) {
			var string = "http://seesaawiki.jp/aigis/d/王子";
			return encodeURI_JP(string);
		}
		var string = "http://seesaawiki.jp/aigis/d/" + this.name;
		return encodeURI_JP(string);
	};

	return obj;
}
// 新增資料
const addCharaData = function (newData) {
	if (newData.name == "") return;
	//debugLog("New character <" + newData.name + "> data add...");

	if (charaDataBase.indexOf(newData.name) == -1) {
		charaDataBase.data.push(newData);
		console.log("New character <" + newData.name + "> data add complete!");
		botPush("anna " + newData.name + " New character data add complete!");

	} else {
		let i = charaDataBase.indexOf(newData.name);

		if (charaDataBase.data[i].ability == "") {
			charaDataBase.data[i].ability = newData.ability;
		}
		if (charaDataBase.data[i].ability_aw == "") {
			charaDataBase.data[i].ability_aw = newData.ability_aw;
		}
		if (charaDataBase.data[i].skill == "") {
			charaDataBase.data[i].skill = newData.skill;
		}
		if (charaDataBase.data[i].skill_aw == "") {
			charaDataBase.data[i].skill_aw = newData.skill_aw;
		}

		if (charaDataBase.data[i].rarity == "") {
			charaDataBase.data[i].rarity = newData.rarity;
		}
		if (charaDataBase.data[i].class == "") {
			charaDataBase.data[i].class = newData.class;
		}
		console.log("Character <" + newData.name + "> data is existed!");
	}
}
// 模糊搜尋
const searchCharacter = function (key, blurry) {
	if (typeof (blurry) == "undefined") blurry = true;
	debugLog("searchCharacter key: <" + key + ">");

	let t;
	if ((t = charaDataBase.indexOf(key)) != -1) {
		return [key];
	} else if ((t = nickDataBase.indexOf(key)) != -1) {
		return [nickDataBase.data[t].target];
	} else if (!blurry) {
		return [];
	}

	// 加權陣列
	let array_metrics = [];
	for (let charaIndex in charaDataBase.data) {
		let obj = charaDataBase.data[charaIndex];

		// 模糊加權
		const metricsA = 8;	// 同字
		const metricsB = 1;	// 同順
		const metricsC = 2;	// 連接
		let j = 0, k = -2, l = -1;
		let metrics = -15;
		//array_metrics[(metricsA + metricsB) * key.length] = [];

		for (let i = 0; j < key.length; j++) {
			l = obj.name.indexOf(key[j], Math.max(k, 0));

			if (l > -1)	// find key[j] in source
				metrics += metricsA;

			if (l > k)	// find key[j] after key[j - 1]
				metrics += metricsB;

			if (l == k + 1)	// find key[j] just after key[j - 1]
				metrics += metricsC;

			k = l;
		}

		if (metrics > 0) {
			//array_metrics.push([i, metrics]);
			//array_metrics[i] = metrics;
			//array_metrics[metrics].push(i);
			if (typeof (array_metrics[metrics]) == "undefined") {
				array_metrics[metrics] = [charaIndex];
			} else {
				array_metrics[metrics].push(charaIndex);
			}
		}
	}

	// 模糊加權結果
	var result = [];
	if (array_metrics.length > 0) {
		// 權值大到小
		let metricsMax = array_metrics.length - 1;
		let metricsMin = Math.floor(metricsMax * 0.9);
		debugLog("metricsMax: <" + metricsMax + ">");
		debugLog("metricsMin: <" + metricsMin + ">");

		for (let charaIndex = metricsMax; charaIndex >= metricsMin; charaIndex--) {
			if (typeof (array_metrics[charaIndex]) == "undefined") continue;	// 檢查搜尋結果

			// 遍歷搜尋結果
			//for (let i = 0; i < array_metrics[charaIndex].length; i++) {
			for (let i in array_metrics[charaIndex]) {
				let index = array_metrics[charaIndex][i];

				debugLog("array_metrics : <" + charaIndex + ": " + charaDataBase.data[index].name + ">");
				result.push(charaDataBase.data[index].name);
			}
		}
	}
	return result;
}

// Nickname
var nickDataBase = database.createNewDataBase("NickDataBase");
// 建構資料函數
nickDataBase.newData = function () {
	var obj = {};
	obj.name = "";
	obj.target = "";

	return obj;
}
// 新增資料
const addNickData = function (name, nick) {
	if (name == "" || nick == "") return;

	if (nickDataBase.indexOf(nick) == -1) {
		var newData = nickDataBase.newData();
		newData.name = nick;
		newData.target = name;
		nickDataBase.data.push(newData);
	}
}

// Class
var classDataBase = database.createNewDataBase("ClassDataBase");
// 建構資料函數
classDataBase.newData = function () {
	var obj = {};
	obj.name = "";
	obj.index = [];
	obj.type = "";

	return obj;
}
// 新增資料
const addClassData = function (newClass) {
	if (newClass.name == "") return;
	//console.log("New <" + newClass.name + "> Class data add...");

	if (classDataBase.indexOf(newClass.name) == -1) {
		classDataBase.data.push(newClass);
		console.log("New Class <" + newClass.name + "> add complete!");
		debugPush("New Class <" + newClass.name + "> add complete!");

	} else {
		console.log("Class <" + newClass.name + "> is existed!");
	}
}
// 搜尋職業
const searchClass = function (str) {
	//for (let i = 0; i < classDataBase.length; i++) {
	for (let i in classDataBase.data) {

		for (let j in classDataBase.data[i].index) {
			if (str == classDataBase.data[i].index[j]) {
				return classDataBase.data[i].name;
			}
		}
	}
	return "NULL";
}

// value to key
const getRarityString = function (str) {
	if (str == "金") return "ゴールド";
	else if (str == "藍") return "サファイア";
	else if (str == "白") return "プラチナ";
	else if (str == "黑") return "ブラック";
	else return "NULL";
}



// Line Message element
// 文字訊息
const createTextMsg = function (_text) {
	return {
		type: "text",
		text: _text.trim()
	};
}
// 圖片訊息
// url = https://aigis1000secretary.updog.co/刻詠の風水士リンネ/6230667.png encodeURI(img) (utf8 to %utf8 )
const createImageMsg = function (image, thumbnail) {
	return {
		type: "image",
		originalContentUrl: image,
		previewImageUrl: (typeof (image) == "undefined" ? image : thumbnail)
	};
}
// 超連結選項
// altText = "Wiki 連結"
// label = Name
// url = "https://seesaawiki.jp/aigis/d/刻詠の風水士リンネ"	encodeURI_JP(url)
const createTemplateMsg = function (altText, label, url) {
	if (label.length != url.length) return "";
	if (label.length <= 0 || 4 < label.length) return "";
	var replyMsg = {
		type: "template",
		altText: altText,
		template: {
			type: "buttons",
			text: altText,
			actions: []
		}
	};
	for (let i = 0; i < label.length; i++) {
		var buttons = {
			type: "uri",
			label: label[i],
			uri: url[i]
		};
		replyMsg.template.actions.push(buttons);
	}
	return replyMsg;
}
// DROPBOX: encodeURI(url);
// Wiki   : encodeURI_JP(url);
// line debug function
const linebot = require("linebot");
// 登入參數
const bot = linebot({
	channelId: 1612493892,
	channelSecret: "ea71aeca4c54c6aa270df537fbab3ee3",
	channelAccessToken: "GMunTSrUWF1vRwdNxegvepxHEQWgyaMypbtyPluxqMxoTqq8QEGJWChetLPvlV0DJrY4fvphSUT58vjVQVLhndlfk2JKQ/sbzT6teG1qUUUEVpVfqs5KGzzn3NUngYMw9/lvvU0QZVGBqPS6wKVxrQdB04t89/1O/w1cDnyilFU="
});
// 管理用參數
const adminstrator = "U9eefeba8c0e5f8ee369730c4f983346b";
const admins = [];
const debugLogger = "U9eefeba8c0e5f8ee369730c4f983346b";
const debugLog = function (msg) {
	if (!_debug) {
		return;
	}
	console.log(msg);
	debugPush(msg);
}
const debugPush = function (msg) {
	if (_debugPush) {
		botPush(msg);
	}
}
const botPush = function (msg) {
	bot.push(debugLogger, msg);
}



// 外部呼叫
module.exports = {
	init: async function () {

		charaDataBase.data = [];
		nickDataBase.data = [];
		classDataBase.data = [];

		try {
			await charaDataBase.downloadDB();
			await charaDataBase.loadDB();

			await nickDataBase.downloadDB();
			await nickDataBase.loadDB();

			await classDataBase.downloadDB();
			await classDataBase.loadDB();

		} catch (err) {
			debugLog(err);
		}

		return;
	},

	// index,js
	replyAI: replyAI,
	replyStamp: replyStamp,

	// updata.js
	//charaDataCrawler: function (urlPath) { return charaDataCrawler(urlPath); },
	allCharaDataCrawler: allCharaDataCrawler,
	classDataCrawler: classDataCrawler,
	_encodeURI_JP: encodeURI_JP,

	// debug
	_debug: _debug,
	debugLog: debugLog,

	isAdmin: function (userId) { return (userId == adminstrator || admins.indexOf(userId) != -1) },
	adminstrator: adminstrator,
	//admins: function () { return admins },
	debugLogger: debugLogger
};



/*
const debugFunc = async function () {
	//await module.exports.init();
	//await imgur.init();

	try {
		await charaDataBase.downloadDB()
	} catch (err) {
		console.log(err);
	}

	//_debug = true;
	//replyAI("anna upload", debugLog);


	// userId = "U9eefeba8c0e5f8ee369730c4f983346b";
	// profile = await bot.getUserProfile(userId);
	// console.log(profile);

	// groupId = "C576ad7f8e2d943f7a6f07d043391dab3";
	// profile = await bot.getGroupMember(groupId);
	// console.log(profile);

	// groupId = "C906808294426cdd7d8077301b11fe95f";
	// profile = await bot.getGroupMember(groupId);
	// console.log(profile);

}

setTimeout(debugFunc, 1 * 100);//*/










