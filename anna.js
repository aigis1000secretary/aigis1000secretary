
// 初始化
const config = require("./config.js");
// 爬蟲
const request = require("request");
const iconv = require("iconv-lite");
const cheerio = require("cheerio");

const imgur = require("./imgur.js");
const line = require("./line.js");
// 資料庫
const database = require("./database.js");


String.prototype.replaceAll = function (s1, s2) {
	var source = this;
	while ((temp = source.replace(s1, s2)) != source) {
		source = temp;
	}
	return source.toString();
}



// bot
// 搜尋資料
const replyAI = async function (rawMsg, sourceId, userId) {
	debugLog("rawMsg: <" + rawMsg + ">");

	// flag
	let _isAdmin = isAdmin(sourceId);
	let callAnna = (rawMsg.toUpperCase().indexOf("ANNA ") == 0 || rawMsg.indexOf("安娜 ") == 0);
	if (!callAnna) {
		rawMsg = "ANNA " + rawMsg;
	}

	// 分析命令
	let msg1 = ("" + rawMsg.split("\n")[0]).trim();
	let msg2 = rawMsg.indexOf("\n") != -1 ? rawMsg.substring(rawMsg.indexOf("\n") + 1).trim() : "";
	let msgs = msg1.split(" ");
	msgs = msgs.filter(function (n) { return (n && (n != "")) });
	// >> ANNA <command>	<arg1>			<arg2>
	// >> ANNA 學習			NNL:黑弓
	// >> ANNA 資料庫		CharaDatabase	NNL.ability_aw
	let command = ("" + msgs[1].toUpperCase()).trim();
	let arg1 = ("" + msgs[2]).trim();
	let arg2 = ("" + msgs[3]).trim();
	// <command>
	if (command == "undefined") {
		return false;
	}
	debugLog("Args: <" + command + "> <" + arg1 + "> <" + arg2 + ">");

	// reply
	if (callAnna) {
		if (command == "DEBUG") {		// debug switch
			config.switchVar.debug = !config.switchVar.debug;
			config.switchVar.debugPush = config.switchVar.debug;
			return "debug = " + (config.switchVar.debug ? "on" : "off");

		} else if (command.length == 1) {		// 定型文
			var result = replyStamp(command);
			if (result != false) {
				return result;
			} else {
				return "王子太短了，找不到...";
			}

		} else if (command == "巨根") {
			return "王子太小了，找不到...";

		} else if (command == "醒醒" || command == "WAKE") {
			// wake
			return "呣喵~?";

		} else if (command == "指令" || command == "HELP") {
			// help
			var replyMsg = "歡迎使用政務官小安娜 v" + config._version + "\n\n";

			replyMsg += "狀態: 確認目前版本，資料庫資料筆數。\n(>>安娜 狀態)\n\n";
			replyMsg += "照片: 上傳角色附圖的網路空間(DropBox)。\n(>>安娜 照片)\n\n";
			replyMsg += "工具: 千年戰爭Aigis實用工具。\n(>>安娜 工具)\n\n";
			replyMsg += "職業: 列出資料庫現有職業。\n\n";
			replyMsg += "廣播: 開關廣播功能，廣播內容有官方推特即時轉播以及週四定期維護前提醒。\n\n";
			replyMsg += "學習: 用來教會安娜角色的暱稱。\n(>>安娜 學習 NNL:射手ナナリー)\n\n";

			replyMsg += "\n";
			replyMsg += "直接輸入稀有度+職業可以搜索角色\n(>>安娜 黑弓) *推薦使用\n\n";
			replyMsg += "輸入關鍵字可進行暱稱搜索&模糊搜索\n(>>安娜 NNL)\n(>>安娜 射手ナナリー)";

			if (!_isAdmin) {
				return replyMsg;
			}

			replyMsg += "\n";
			replyMsg += "忘記: 刪除特定暱稱。\n(>>安娜 忘記 NNL)\n\n";
			replyMsg += "資料庫: 直接修改資料庫內容。\n(>>資料庫 CharaDatabase NNL.ability_aw)\n\n";
			replyMsg += "上傳: 手動上傳資料庫更新。\n\n";
			replyMsg += "更新: 手動上傳資料庫更新。";

			return replyMsg;

		} else if (command == "狀態" || command == "STATU") {
			// status
			await imgur.account.allImages()
				.then(imgur.database.loadImages)
				.catch(function (error) {
					console.log("Imgur images load error!");
					console.log(error);
				});

			var replyMsg = "";

			replyMsg += "目前版本 v" + config._version + "\n";
			replyMsg += "資料庫內有 " + charaDatabase.data.length + " 筆角色資料\n";
			replyMsg += "　　　　　 " + classDatabase.data.length + " 筆職業資料\n";
			replyMsg += "　　　　　 " + imgur.database.images.length + " 筆貼圖資料";

			return replyMsg;

		} else if (command == "照片" || command == "圖片" || command == "相片" || command == "PICTURE") {
			// 圖片空間
			return createTemplateMsg("圖片空間",
				["上傳新照片", "線上圖庫"],
				["https://www.dropbox.com/request/FhIsMnWVRtv30ZL2Ty69",
					"https://www.dropbox.com/sh/vonsrxzy79nkpah/AAD4p6TwZF44GHP5f6gdEh3ba?dl=0"]);

		} else if (command == "工具" || command == "TOOL") {
			// tool
			var templateMsgA, templateMsgB;

			var tagArray = [];
			var urlArray = [];
			tagArray.push("特殊合成表");
			urlArray.push("https://seesaawiki.jp/aigis/d/%C6%C3%BC%EC%B9%E7%C0%AE%C9%BD");
			tagArray.push("經驗值計算機");
			urlArray.push("http://aigistool.html.xdomain.jp/EXP.html");
			tagArray.push("體魅計算機");
			urlArray.push("http://aigistool.html.xdomain.jp/ChariSta.html");
			templateMsgA = createTemplateMsg("實用工具 (1)", tagArray, urlArray);

			tagArray = [];
			urlArray = [];
			tagArray.push("DPS一覽表 (日)");
			urlArray.push("http://www116.sakura.ne.jp/~kuromoji/aigis_dps.htm");
			tagArray.push("千年戦争アイギス バフ試算表");
			urlArray.push("https://aki-m.github.io/aigistools/buff.html");
			tagArray.push("攻略頻道: Sennen");
			urlArray.push("https://www.youtube.com/channel/UC8RlGt22URJuM0yM0pUyWBA");
			// tagArray.push("千年戦争アイギス攻略ブログ");
			// urlArray.push("http://sennenaigis.blog.fc2.com/");
			templateMsgB = createTemplateMsg("實用工具 (2)", tagArray, urlArray);

			var replyMsg = [templateMsgA, templateMsgB];

			return replyMsg;

		} else if (command == "職業") {
			let classDB = classDatabase.data;
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
			return replyMsgA + "\n" + replyMsgB;

		} else if (command == "廣播") {

			let i = database.groupDatabase.indexOf(sourceId)
			if (i != -1) {
				var alarm = !database.groupDatabase.data[i].alarm;
				database.groupDatabase.data[i].alarm = alarm;

				let func = async function () {
					await database.groupDatabase.saveDB();
					database.groupDatabase.uploadDB(false);
				}; func();	// 異步儲存

				return "切換廣播開關，目前為: " + (alarm ? "開" : "關");
			}
			return false;

		} else if (command == "學習") {
			// 關鍵字學習
			// <arg1>
			if (arg1 == "undefined") {
				return "[學習] 要學甚麼?";
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
				var replyMsg = "[學習] " + replyMsgs[Math.floor(Math.random() * replyMsgs.length)];
				return replyMsg;

			} else if (countB > 1) {
				return "[學習] 太多人了，不知道是誰";

			} else {
				var key = arrayB[0];
				var nick = keys[0];

				// 異步執行
				nickDatabase.addData(key, nick);
				// wait 10 min to save
				nickDatabase.uploadTask();

				return "[學習] 嗯！記住了！";
			}
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
				var name = targetDB.data[index].name;
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
				var replyMsg = [];
				replyMsg.push(createTextMsg("請換行輸入項目內容."));
				replyMsg.push(createTextMsg(targetDB.data[index][propertyStr]));
				return replyMsg;

			} else {
				targetDB.data[index][propertyStr] = (msg2 == "CLEAR" ? "" : msg2);
				targetDB.uploadTask();
				return "修改成功";

			}
		} else if (command == "上傳" || command == "UPLOAD") {

			// 異步執行
			let func = async function () {
				try {
					await charaDatabase.saveDB();
					await charaDatabase.uploadDB(true);

					await nickDatabase.saveDB();
					await nickDatabase.uploadDB(true);

					await classDatabase.saveDB();
					await classDatabase.uploadDB(true);

					botPushLog("上傳完成!");
				} catch (error) {
					botPushError("上傳異常! " + error.toString());
				}
			}; func();

			return "上傳中...";

		} else if (command == "更新" || command == "UPDATE") {
			allCharaDataCrawler();
			classDataCrawler();
			return "更新中...";

		} else if (_isAdmin && (command == "初始化" || command == "INIT")) {
			await annaCore.init();
			return "初始化完成!";

		}

		// 搜尋資料
		var result = false;
		result = searchData(command);
		if (result != false) {
			return result;

		}
	}

	// 呼叫定型文圖片
	var result = false;
	result = replyStamp(command);
	if (result != false) {
		return result;
	}

	if (callAnna) {
		// 404
		let replyMsgs = ["不認識的人呢...", "安娜不知道", "安娜不懂", "那是誰？", "那是什麼？"];
		var replyMsg = replyMsgs[Math.floor(Math.random() * replyMsgs.length)];
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
	if (command.indexOf("金") != 0 && command.indexOf("藍") != 0 && command.indexOf("白") != 0 &&
		command.indexOf("鉑") != 0 && command.indexOf("白金") != 0 && command.indexOf("黑") != 0) {
		return [];
	}
	// 分割命令
	let _rarity = getRarityString(command[0]);
	let _class = command.indexOf("白金") == 0 ? searchClass(command.substring(2).trim()) : searchClass(command.substring(1).trim());
	debugLog("_rarity + _class: <" + _rarity + " + " + _class + ">");

	var result = [];
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
		var replyMsg = [];
		replyMsg.push(createTextMsg(obj.getMessage()));

		let imgArray = imgur.database.findImageByTag(charaName);
		if (imgArray.length > 0) {
			let i = Math.floor(Math.random() * imgArray.length);
			replyMsg.push(createImageMsg(imgArray[i].imageLink, imgArray[i].thumbnailLink));
		}

		replyMsg.push(createTemplateMsg("Wiki 連結", [obj.name], [obj.getWikiUrl()]));

		return replyMsg;
	}

	debugLog("generateCharaData error! can not found chara!");
	return false;
}
// 定型文貼圖
const replyStamp = function (msg) {
	debugLog("replyStamp(" + msg + ")");

	var replyMsg = [];

	let imgArray = imgur.database.findImageByTag(msg);
	if (imgArray.length > 0) {
		let i = Math.floor(Math.random() * imgArray.length);
		replyMsg.push(createImageMsg(imgArray[i].imageLink, imgArray[i].thumbnailLink));
		return replyMsg;
	}

	imgArray = imgArray.concat(imgur.database.findImageByFileName(msg));
	imgArray = imgArray.concat(imgur.database.findImageByMd5(msg));
	if (imgArray.length > 0) {
		replyMsg.push(createImageMsg(imgArray[0].imageLink, imgArray[0].thumbnailLink));
		return replyMsg;
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

			var newData = charaDatabase.newData();
			let rarity = ["ゴールド", "サファイア", "プラチナ", "ブラック", "ゴ｜ルド"];

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
				}
			});
			// debugLog(newData);
			// 新增角色資料
			charaDatabase.addData(newData);
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
				// console.log($(this).text());
				allCharaUrl.push(buffer);
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
		botPushLog("角色更新完成!");
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

						var newData = classDatabase.newData();
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
var charaDatabase = database.charaDatabase;
// 模糊搜尋
const searchCharacter = function (key, accurate) {
	accurate = !!accurate;
	debugLog("searchCharacter(" + key + ", " + accurate + ")");

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
		let j = 0, k = -2, l = -1;
		let metrics = -15;
		// array_metrics[(metricsA + metricsB) * key.length] = [];

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
			// array_metrics.push([i, metrics]);
			// array_metrics[i] = metrics;
			// array_metrics[metrics].push(i);
			if (!array_metrics[metrics]) {
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
		debugLog("_metricsMax: <" + metricsMax + ">");
		debugLog("_metricsMin: <" + metricsMin + ">");

		for (let charaIndex = metricsMax; charaIndex >= metricsMin; charaIndex--) {
			if (!array_metrics[charaIndex]) continue;	// 檢查搜尋結果

			// 遍歷搜尋結果
			// for (let i = 0; i < array_metrics[charaIndex].length; i++) {
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
var nickDatabase = database.nickDatabase;

// Class
var classDatabase = database.classDatabase;
// 搜尋職業
const searchClass = function (str) {
	debugLog("searchClass(" + str + ")");
	// for (let i = 0; i < classDatabase.length; i++) {
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
	if (str == "金") return "ゴールド";
	else if (str == "藍") return "サファイア";
	else if (str == "白" || str == "鉑") return "プラチナ";
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
		previewImageUrl: (!thumbnail ? image : thumbnail)
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

// 管理用參數
const debugLog = function (msg) {
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



// 外部呼叫
const annaCore = {
	init: async function () {

		charaDatabase.data = [];
		nickDatabase.data = [];
		classDatabase.data = [];

		try {
			await charaDatabase.init();
			await nickDatabase.init();
			await classDatabase.init();

		} catch (err) {
			debugLog(err);
		}

		return;
	},

	// index,js
	replyAI: replyAI,
	replyStamp: replyStamp,

	// update.js
	// charaDataCrawler: charaDataCrawler,
	// allCharaDataCrawler: allCharaDataCrawler,
	// classDataCrawler: classDataCrawler,

	// debug
	debugLog: debugLog,

	isAdmin: isAdmin,
}; module.exports = annaCore;

module.exports.autoTest = async function () {

	await annaCore.init();
	await imgur.init();

	let sourceId = "U9eefeba8c0e5f8ee369730c4f983346b";
	let userId = "U9eefeba8c0e5f8ee369730c4f983346b";
	// config.switchVar.debug = true;

	// await annaCore.replyAI("anna 狀態", sourceId, userId).then(console.log);

	// await annaCore.replyAI("anna 學習 NNLK:白ナナリー", sourceId, userId).then(console.log);

	// await annaCore.replyAI("anna NNLK", sourceId, userId).then(console.log);
	// await annaCore.replyAI("anna 黑弓", sourceId, userId).then(console.log);
	// await annaCore.replyAI("anna 忘記 NNLK", sourceId, userId).then(console.log);
	// await annaCore.replyAI("anna NNLK", sourceId, userId).then(console.log);

	// await annaCore.replyAI("647051929ed6333312951134c63323a1", sourceId, userId).then(console.log);

	await annaCore.replyAI("anna update", sourceId, userId).then(console.log);

};










