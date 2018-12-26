
// 初始化
// 爬蟲
const request = require("request");
const iconv = require("iconv-lite");
const cheerio = require("cheerio");
// 資料庫
const fs = require("fs");
const dbox = require("./dbox.js");
const imgur = require("./imgur.js");

var _debug = false;
var _version = "0.4.3.4";
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
const searchDataAndReply = async function (msg, replyFunc) {
	// 指令:
	if (_debug) console.log("msg: <" + msg + ">");

	// 分析命令
	let msgs = msg.split(" ");
	if (msgs.length < 2) {
		return false;
	}
	let command = msgs[1].toUpperCase().trim();
	if (_debug) console.log("Command: <" + command + ">");

	// debug switch
	if (command == "DEBUG") {
		_debug = !_debug;
		replyFunc("_debug = " + (_debug ? "on" : "off"));
		return true;
	}

	// 定型文
	if (command.length == 1) {
		if (searchCharacterAndReply(command, false, replyFunc) == 1) {
			return true;
		} else if (stampReply(command, replyFunc)) {
			// 呼叫定型文圖片
			return true;
		} else {
			replyFunc("王子太短了，找不到...");
			return true;
		}

	} else if (command == "巨根") {
		replyFunc("王子太小了，找不到...");
		return true;

	} else if (command == "醒醒") {
		// wake
		replyFunc("呣喵~?");
		return true;

	} else if (command == "指令" || command == "HELP") {
		// help
		var replyMsg = "";

		replyMsg += "狀態: 確認目前版本，資料庫資料筆數。\n(>>安娜 狀態)。\n\n";
		replyMsg += "照片: 上傳角色附圖的網路空間(DropBox)。\n(>>安娜 照片)。\n\n";
		replyMsg += "工具: 千年戰爭Aigis實用工具。\n(>>安娜 工具)。\n\n";
		replyMsg += "職業: 列出資料庫現有職業。\n\n";
		replyMsg += "學習: 用來教會安娜角色的暱稱。\n(>>安娜 學習 NNL:射手ナナリー)。\n\n";

		replyMsg += "\n";

		replyMsg += "直接輸入稀有度+職業可以搜索角色\n(>>安娜 黑弓)\n\n";
		replyMsg += "輸入關鍵字可進行模糊搜索&關鍵字搜索\n(>>安娜 NNL)\n(>>安娜 射手ナナリー)";

		if (!_debug) {
			replyFunc(replyMsg);
			return true;
		}

		replyMsg += "\n上傳。";

		replyFunc(replyMsg);
		return true;

	} else if (command == "狀態") {
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
		replyMsg += "資料庫內有 " + charaDataBase.length + " 筆角色資料\n";
		replyMsg += "　　　　　 " + classDataBase.length + " 筆職業資料\n";
		replyMsg += "　　　　　 " + imgur.dataBase.images.length + " 筆貼圖資料";

		replyFunc(replyMsg);
		return true;

	} else if (command == "照片" || command == "圖片" || command == "相片") {
		// 圖片空間
		replyFunc(createTemplateMsg("圖片空間", ["上傳新照片", "線上圖庫"],
			["https://www.dropbox.com/request/FhIsMnWVRtv30ZL2Ty69",
				"https://www.dropbox.com/sh/vonsrxzy79nkpah/AAD4p6TwZF44GHP5f6gdEh3ba?dl=0"]));
		return true;

	} else if (command == "上傳") {
		// 手動保存資料庫
		clearTimeout(uploadTaskId);
		uploadDataBase();
		return true;

	} else if (command == "忘記") {
		// forgot
		if (msgs.length < 3) {
			msgs.push("");
		}
		let learn = msgs[2].trim();
		if (_debug) console.log("forgot: <" + learn + ">");

		var target = searchCharacter(learn);
		if (target.length == 1) {
			let i = checkCharaData(target[0].trim());
			charaDataBase[i].str_nickname = [];
		}
		return true;

	} else if (command == "工具") {
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
		let classDB = classDataBase
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
			msgs.push("");
		}
		let learn = msgs[2].trim().replace("：", ":");
		if (_debug) console.log("learn: <" + learn + ">");

		let keys = learn.split(":"); // NNL:黑弓
		if (keys.length < 2) {
			replyFunc("[學習] 看不懂...");
			return true;
		}

		let arrayA = searchCharacter(keys[0].trim(), false);	// 精確搜索 Nickname
		let arrayB = searchCharacter(keys[1].trim());
		let countA = arrayA.length;
		let countB = arrayB.length;

		if (_debug) console.log("full name: <" + arrayB + ">");
		if (_debug) console.log("new nick: <" + keys[0] + ">");

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

			let i = checkCharaData(key);
			charaDataBase[i].str_nickname.push(nick);

			// wait 25 min to save
			uploadTask();

			replyFunc("[學習] 嗯！記住了！");
			return true;
		}
	}

	if (searchClassAndReply(command, replyFunc) > 0) {
		return true;
	}

	if (searchCharacterAndReply(command, true, replyFunc) > 0) {
		return true;
	}

	// 呼叫定型文圖片
	if (stampReply(command, replyFunc)) {
		return true;
	}

	// 404
	let replyMsgs = ["不認識的人呢...", "安娜不知道", "安娜不懂", "那是誰？", "那是什麼？"];
	var replyMsg = replyMsgs[Math.floor(Math.random() * replyMsgs.length)];
	replyFunc(replyMsg);
	return false;
}

// 搜尋職業&回復
const searchClassAndReply = function (command, replyFunc) {

	// 搜索職業
	if (command.indexOf("金") == 0 || command.indexOf("藍") == 0 || command.indexOf("白") == 0
		|| command.indexOf("鉑") == 0 || command.indexOf("白金") == 0 || command.indexOf("黑") == 0) {
		// 分割命令
		let _rarity = getRarityString(command[0]);
		let _class = command.indexOf("白金") == 0 ? getClassString(command.substring(2).trim()) : getClassString(command.substring(1).trim());
		if (_debug) console.log("_rarity+_class: <" + _rarity + "+" + _class + ">");

		var result = "";
		let count = 0;
		// 遍歷
		for (let i in charaDataBase) {
			var obj = charaDataBase[i];
			if (obj.data_rarity == _rarity && obj.data_class == _class) {
				result += obj.str_name + "\n";
				count++;
			}
		}
		result = result.trim()
		if (_debug) console.log("result: <" + result + ">");

		if (count == 1) {	// only one
			replayCharaData(result, replyFunc);
			return true;

		} else if (count > 0) {	// list
			replyFunc(result);
			return true;
		}
	}
}

// 搜尋腳色&回復
const searchCharacterAndReply = function (command, blurry, replyFunc) {
	if (typeof (blurry) == "undefined") blurry = true;

	// 搜索名稱
	var resultArray = searchCharacter(command, blurry);
	var count = resultArray.length;
	if (_debug) console.log("resultArray[" + count + "]: <" + resultArray + ">");

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
// 回覆單一腳色資料
const replayCharaData = function (charaName, replyFunc) {
	if (_debug) console.log("replayCharaData(" + charaName + ")");

	let i = checkCharaData(charaName);
	var obj = charaDataBase[i];

	var replyMsg = [];
	replyMsg.push(createTextMsg(obj.getMessage()));

	let imgArray = imgur.dataBase.findImageByTag(charaName);
	if (imgArray.length > 0) {
		let i = Math.floor(Math.random() * imgArray.length);
		replyMsg.push(createImageMsg(imgArray[i].imageLink, imgArray[i].thumbnailLink));
	}

	replyMsg.push(createTemplateMsg("Wiki 連結", [obj.str_name], [obj.getWikiUrl()]));

	replyFunc(replyMsg);
	return;
}
// 定型文貼圖
const stampReply = function (msg, replyFunc) {
	if (typeof (msg) == "undefined") return false;
	if (_debug) console.log("stampReply(" + msg + ")");

	var replyMsg = [];

	let imgArray = imgur.dataBase.findImageByTag(msg);
	if (imgArray.length > 0) {
		let i = Math.floor(Math.random() * imgArray.length);
		replyMsg.push(createImageMsg(imgArray[i].imageLink, imgArray[i].thumbnailLink));
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

			var newData = createCharaData();
			let rarity = ["ゴールド", "サファイア", "プラチナ", "ブラック", "ゴ｜ルド"];

			// 搜尋所有表格
			$("div").each(function (i, iElem) {

				var buffer = $(this).attr("id");
				if (buffer && buffer.indexOf("content_block_") != -1 && buffer.indexOf("-") != -1) {

					//console.log($(this).attr("id"));
					//console.log($(this).children("table").eq(0).attr("id"));

					// ステータス
					if ($(this).prev().children().text().trim() == "ステータス") {
						$(this).children("table").eq(0).children("tbody").children("tr").children().children().each(function (j, jElem) {
							// 名前
							if ($(this).attr("href") == urlPath) {
								newData.str_name = $(this).text().trim();
							}
							// クラス
							let temp = $(this).attr("href");
							if (typeof (temp) != "undefined" && temp.indexOf("class") != -1) {
								newData.data_class = $(this).text().trim();
							}
							// レア
							if (rarity.indexOf($(this).text().trim()) != -1) {
								let temp = $(this).text().trim();
								newData.data_rarity = temp == "ゴ｜ルド" ? "ゴールド" : temp;
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
							newData.str_ability = temp;
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
							newData.str_ability_aw = temp;
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
							if (skilList[i].indexOf("スキル名") != -1 || skilList[i].indexOf("効果説明") != -1) {
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
							textList.push(skilList[i][0] + "\n" + temp);
						}
						//if (_debug) console.log(skilList);

						// put array into skill data
						if (textList.length != 0) {
							newData.str_skill = textList.join("\n");
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
							if (skilList[i].indexOf("スキル名") != -1 || skilList[i].indexOf("覚醒スキル名") != -1 || skilList[i].indexOf("効果説明") != -1) {
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
							if (skilList[i][0] == "通常") {
								textList.push(skilList[i][1] + "\n" + temp);
							}
							else if (skilList[i][0] == "覚醒") {
								textList_aw.push(skilList[i][1] + "\n" + temp);
							}
						}

						// put array into skill data
						if (textList.length != 0) {
							newData.str_skill = textList.join("\n");
						}
						if (textList_aw.length != 0) {
							newData.str_skill_aw = textList_aw.join("\n");
						}
					}

					// 統一格式
					newData.str_skill = newData.str_skill.replaceAll("＋", "+").replaceAll("、+", "+").replaceAll("さらに、", "さらに").replaceAll("の、", "の").replaceAll("配置中のみ", "配置中").replaceAll("配置中、", "配置中").replaceAll("防御力、魔法耐性", "防御力と魔法耐性");
					newData.str_skill_aw = newData.str_skill_aw.replaceAll("＋", "+").replaceAll("、+", "+").replaceAll("さらに、", "さらに").replaceAll("の、", "の").replaceAll("配置中のみ", "配置中").replaceAll("配置中、", "配置中").replaceAll("防御力、魔法耐性", "防御力と魔法耐性");
					newData.str_ability = newData.str_ability.replaceAll("＋", "+").replaceAll("、+", "+").replaceAll("さらに、", "さらに").replaceAll("の、", "の").replaceAll("いるだけで、", "いるだけで").replaceAll("配置中のみ", "配置中").replaceAll("配置中、", "配置中").replaceAll("防御力、魔法耐性", "防御力と魔法耐性");
					newData.str_ability_aw = newData.str_ability_aw.replaceAll("＋", "+").replaceAll("、+", "+").replaceAll("さらに、", "さらに").replaceAll("の、", "の").replaceAll("いるだけで、", "いるだけで").replaceAll("配置中のみ", "配置中").replaceAll("配置中、", "配置中").replaceAll("防御力、魔法耐性", "防御力と魔法耐性");

					if (newData.str_ability.indexOf("ランダム") != -1) {
						newData.str_ability = newData.str_ability.replaceAll("、/、", "、");
						newData.str_ability = newData.str_ability.replaceAll("発動、", "発動：");
						newData.str_ability = newData.str_ability.replaceAll("回復、", "回復/");
						newData.str_ability = newData.str_ability.replaceAll("回避、", "回避/");
						newData.str_ability = newData.str_ability.replaceAll("攻撃、", "攻撃/");
						newData.str_ability = newData.str_ability.replaceAll("連射、", "連射/");
						newData.str_ability = newData.str_ability.replaceAll("無視、", "無視/");
						newData.str_ability = newData.str_ability.replaceAll("入手、", "入手/");
						newData.str_ability = newData.str_ability.replaceAll("倍、", "倍/");
						newData.str_ability = newData.str_ability.replaceAll("硬直なし、", "硬直なし/");
					}
					if (newData.str_ability_aw.indexOf("ランダム") != -1) {
						newData.str_ability_aw = newData.str_ability_aw.replaceAll("、/、", "、");
						newData.str_ability_aw = newData.str_ability_aw.replaceAll("発動、", "発動：");
						newData.str_ability_aw = newData.str_ability_aw.replaceAll("回復、", "回復/");
						newData.str_ability_aw = newData.str_ability_aw.replaceAll("回避、", "回避/");
						newData.str_ability_aw = newData.str_ability_aw.replaceAll("攻撃、", "攻撃/");
						newData.str_ability_aw = newData.str_ability_aw.replaceAll("連射、", "連射/");
						newData.str_ability_aw = newData.str_ability_aw.replaceAll("無視、", "無視/");
						newData.str_ability_aw = newData.str_ability_aw.replaceAll("入手、", "入手/");
						newData.str_ability_aw = newData.str_ability_aw.replaceAll("倍、", "倍/");
						newData.str_ability_aw = newData.str_ability_aw.replaceAll("硬直なし、", "硬直なし/");
					}
				}
			});
			if (_debug) console.log(newData);
			// 新增腳色資料
			addCharaData(newData);
			resolve();
		}
		request.get(urlPath, { encoding: "binary" }, requestCallBack);
	});
};
// 爬所有腳色
var allCharaUrl = [];
const allCharaDataCrawler = function () {
	console.log("AllCharaData Crawling...");

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

			var buffer = $(this).attr("href");
			if (buffer && $(this).parent().is("td") && $(this).prev().prev().children().is("img")) {
				//console.log($(this).text());
				// 延遲呼叫腳色爬蟲
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
		// 50 thread
		for (let i = 0; i < 50; i++) {
			promiseArray.push(charaDataCrawlerBot());
		}
		await Promise.all(promiseArray);

		// save database
		saveCharaDataBase();
	}, 3000);
}
// 爬蟲BOT
const charaDataCrawlerBot = function () {
	return new Promise(async function (resolve, reject) {
		while (allCharaUrl.length > 0) {
			try {
				var urlPath = allCharaUrl.pop();
				await charaDataCrawler(urlPath);
			}
			catch (err) {
				reject(err);
			}
		}
		resolve();
	});
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

						var newData = createClassData();
						newData.className = str;
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
var encodeURI_JP = function (url) {
	var result = "";

	let jpEncode = "";
	let big5Encode = "";
	let uriEncode = "";

	for (var i = 0; i < url.length; i++) {
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
	var html = this.replaceAll("<br>", "\n");
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
var charaDataBase = [];
// 建構資料函數
const createCharaData = function () {
	var obj = {};
	obj.str_name = "";
	obj.str_nickname = [];
	obj.str_ability = "";
	obj.str_ability_aw = "";
	obj.str_skill = "";
	obj.str_skill_aw = "";

	obj.data_rarity = "";
	obj.data_class = "";

	obj.getMessage = function () {
		var string = "";

		string += this.str_name + "　　" + this.data_rarity + "\n";

		if (this.str_nickname.length > 0) {
			//for (var i = 0; i < this.str_nickname.length; i++) {
			let buffer = "";
			for (let i in this.str_nickname) {
				buffer += this.str_nickname[i] + " ";
			}
			buffer = buffer.trim();
			if (buffer != "") {
				string += buffer + "\n";
			}
		}

		if (this.str_ability != "") {
			string += "◇特：" + this.str_ability + "\n";
		}

		if (this.str_skill != "") {
			string += "◇技：" + this.str_skill + "\n";
		}

		if (this.str_ability_aw != "") {
			string += "◆特：" + this.str_ability_aw + "\n";
		}

		if (this.str_skill_aw != "") {
			string += "◆技：" + this.str_skill_aw + "\n";
		}

		return string;
	};
	obj.getWikiUrl = function () {
		if (this.str_name.indexOf("王子") != -1) {
			var string = "http://seesaawiki.jp/aigis/d/王子";
			return encodeURI_JP(string);
		}
		var string = "http://seesaawiki.jp/aigis/d/" + this.str_name;
		return encodeURI_JP(string);
	};
	obj.checkName = function (name) {
		if (name == this.str_name) return true;

		//for (let i = 0; i < this.str_nickname.length; i++) {
		for (let i in this.str_nickname) {
			if (name.toUpperCase() == this.str_nickname[i].toUpperCase()) return true;
		}
		return false;
	};

	return obj;
}
// 檢查資料
const checkCharaData = function (name) {
	//for (var i = 0; i < charaDataBase.length; i++) {
	for (let i in charaDataBase) {
		if (charaDataBase[i].str_name == name)
			return i;
	}
	return -1;
}
// 儲存資料
const saveCharaDataBase = function () {
	console.log("CharaDataBase saving...");

	// sort
	charaDataBase.sort(function (A, B) {
		return A.str_name.localeCompare(B.str_name)
	})

	// object to json
	var json = JSON.stringify(charaDataBase);

	// callback
	let fsCallBack = function (error, bytesRead, buffer) {
		if (error) {
			console.log(error);
			return;
		}
	}
	// json to file
	fs.writeFile("CharaDataBase_.json", json, "utf8", fsCallBack);

	console.log("CharaDataBase saved!");
}
// 讀取資料
const loadCharaDataBase = async function (charaDB) {
	if (typeof (charaDB) == "undefined") charaDB = "CharaDataBase.json";
	console.log("CharaDataBase loading...");
	try {
		let data = await asyncReadFile(charaDB);

		let count = 0;
		let obj = [];
		try {
			obj = JSON.parse(data);
		} catch (e) {
			obj = eval("(" + data + ")");
		}

		//for (let i = 0; i < obj.length; i++) {
		for (let i in obj) {

			if (obj[i].str_name == "") continue;

			var newData = createCharaData();

			newData.str_name = obj[i].str_name.trim();
			//newData.str_nickname = obj[i].str_nickname;
			newData.str_ability = obj[i].str_ability.trim();
			newData.str_ability_aw = obj[i].str_ability_aw.trim();
			newData.str_skill = obj[i].str_skill.trim();
			newData.str_skill_aw = obj[i].str_skill_aw.trim();


			newData.data_rarity = obj[i].data_rarity.trim();
			newData.data_class = obj[i].data_class.trim();

			//for (let j = 0; j < newData.str_nickname.length; j++) {
			for (let j in obj[i].str_nickname) {
				if (obj[i].str_nickname[j] != "") {
					newData.str_nickname.push(obj[i].str_nickname[j].trim());
				}
			}

			addCharaData(newData);
			count++;
		}
		console.log(count + " CharaData loaded!");
		return;
	} catch (error) {
		console.log(error);
	}
}
// 新增資料
const addCharaData = function (newData) {
	if (newData.str_name == "") return;

	if (_debug) console.log("New character data add...");

	if (checkCharaData(newData.str_name) == -1) {
		charaDataBase.push(newData);
		console.log("New character <" + newData.str_name + "> data add complete!");

	} else {
		let i = checkCharaData(newData.str_name);
		let obj = charaDataBase[i];

		// if (obj.str_nickname = [])
		// {
		// }

		if (obj.str_ability == "") {
			charaDataBase[i].str_ability = newData.str_ability;
		}
		if (obj.str_ability_aw == "") {
			charaDataBase[i].str_ability_aw = newData.str_ability_aw;
		}
		if (obj.str_skill == "") {
			charaDataBase[i].str_skill = newData.str_skill;
		}
		if (obj.str_skill_aw == "") {
			charaDataBase[i].str_skill_aw = newData.str_skill_aw;
		}

		if (obj.data_rarity == "") {
			charaDataBase[i].data_rarity = newData.data_rarity;
		}
		if (obj.data_class == "") {
			charaDataBase[i].data_class = newData.data_class;
		}
		if (_debug) console.log("Character <" + newData.str_name + "> data is existed!");
	}
}
// 上傳備份
const uploadDataBase = function () {
	console.log("CharaDataBase uploading...");

	// object to json
	var binary = new Buffer(JSON.stringify(charaDataBase));
	dbox.fileUpload("\CharaDataBase_.json", binary);

	console.log("CharaDataBase uploaded!");
}
// 延遲上傳
var uploadTaskId;
const uploadTask = function () {
	clearTimeout(uploadTaskId);
	uploadTaskId = setTimeout(uploadDataBase, 25 * 60 * 1000);
}
// 模糊搜尋
const searchCharacter = function (key, blurry) {
	if (typeof (blurry) == "undefined") blurry = true;

	// 加權陣列
	let array_metrics = [];
	//for (let charaIndex = 0; charaIndex < charaDataBase.length; charaIndex++) {
	for (let charaIndex in charaDataBase) {
		let obj = charaDataBase[charaIndex];

		if (obj.checkName(key)) { // 精確符合
			if (_debug) console.log("return : <" + [obj.str_name] + ">");
			return [obj.str_name];

		} else if (blurry) { // 模糊加權
			const metricsA = 8;	// 同字
			const metricsB = 1;	// 同順
			const metricsC = 2;	// 連接
			let k = -2, l = -1;
			let metrics = -15;
			//array_metrics[(metricsA + metricsB) * key.length] = [];

			for (var i = 0; i < key.length; i++) {
				l = obj.str_name.indexOf(key[i], Math.max(k, 0));

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
	}

	// 模糊加權結果
	var result = [];
	if (blurry && array_metrics.length > 0) {
		// 權值大到小
		let metricsMax = array_metrics.length - 1;
		let metricsMin = Math.floor(metricsMax * 0.9);
		if (_debug) console.log("metricsMax: <" + metricsMax + ">");
		if (_debug) console.log("metricsMin: <" + metricsMin + ">");

		for (let charaIndex = metricsMax; charaIndex >= metricsMin; charaIndex--) {
			if (typeof (array_metrics[charaIndex]) == "undefined") continue;	// 檢查搜尋結果

			// 遍歷搜尋結果
			//for (let i = 0; i < array_metrics[charaIndex].length; i++) {
			for (let i in array_metrics[charaIndex]) {
				let index = array_metrics[charaIndex][i];
				//result += charaDataBase[index].str_name + "\n";
				//result += i + ": " + charaDataBase[index].str_name + "\n";

				if (_debug) console.log("array_metrics : <" + charaIndex + ": " + charaDataBase[index].str_name + ">");
				result.push(charaDataBase[index].str_name);
			}
		}
	}
	return result;
}


// 職業資料庫
var classDataBase = [];
// 建構資料函數
const createClassData = function () {
	var obj = {};
	obj.className = "";
	obj.index = [];
	obj.type = "";

	return obj;
}
// 檢查資料
const checkClassData = function (name) {
	//for (var i = 0; i < classDataBase.length; i++) {
	for (let i in classDataBase) {
		if (classDataBase[i].className == name)
			return i;
	}
	return -1;
}
// 儲存資料
const saveClassDataBase = function () {
	console.log("ClassDataBase saving...");

	// sort
	classDataBase.sort(function (A, B) {
		return A.className.localeCompare(B.className)
	})

	// object to json
	var json = JSON.stringify(classDataBase);

	// callback
	let fsCallBack = function (error, bytesRead, buffer) {
		if (error) {
			console.log(error);
			return;
		}
	}
	// json to file
	fs.writeFile("ClassDataBase_.json", json, "utf8", fsCallBack);

	console.log("ClassDataBase saved!");
}
// 讀取資料
const loadClassDataBase = async function () {
	console.log("ClassDataBase loading...");
	try {
		let data = await asyncReadFile("ClassDataBase.json");

		let count = 0;
		let obj = [];
		try {
			obj = JSON.parse(data);
		} catch (e) {
			obj = eval("(" + data + ")");
		}

		//for (let i = 0; i < obj.length; i++) {
		for (let i in obj) {
			addClassData(obj[i]);
			count++;
		}
		console.log(count + " ClassData loaded!");
		//resolve();
		return;
	} catch (error) {
		//reject(error);
		console.log(error);
	}
}
// 新增資料
const addClassData = function (newClass) {
	if (_debug) console.log("New <" + newClass.className + "> Class data add...");

	if (checkClassData(newClass.className) == -1) {
		classDataBase.push(newClass);
		console.log("New Class <" + newClass.className + "> add complete!");

	} else {
		//var i = checkClassData(newClass.className);
		//classDataBase[i].type = newClass.type;
		if (_debug) console.log("Class <" + newClass.className + "> is existed!");
	}
}
// value to key
const getRarityString = function (str) {
	if (str == "金") return "ゴールド";
	else if (str == "藍") return "サファイア";
	else if (str == "白") return "プラチナ";
	else if (str == "黑") return "ブラック";
	else return "NULL";
}
// 搜尋職業
const getClassString = function (str) {
	//for (let i = 0; i < classDataBase.length; i++) {
	for (let i in classDataBase) {

		//for (let j = 0; j < classDataBase[i].index.length; j++) {
		for (let j in classDataBase[i].index) {
			if (str == classDataBase[i].index[j]) {
				return classDataBase[i].className;
			}
		}
	}
	return "NULL";
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
// label = str_Name
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
const debugPush = function (pMsg) {
	let linebot = require("linebot");
	linebot({
		channelId: 1612493892,
		channelSecret: "ea71aeca4c54c6aa270df537fbab3ee3",
		channelAccessToken: "GMunTSrUWF1vRwdNxegvepxHEQWgyaMypbtyPluxqMxoTqq8QEGJWChetLPvlV0DJrY4fvphSUT58vjVQVLhndlfk2JKQ/sbzT6teG1qUUUEVpVfqs5KGzzn3NUngYMw9/lvvU0QZVGBqPS6wKVxrQdB04t89/1O/w1cDnyilFU="
	}).push("U9eefeba8c0e5f8ee369730c4f983346b", pMsg);
}



// readfile
const asyncReadFile = function (filePath) {
	return new Promise(function (resolve, reject) {
		fs.readFile(filePath, function (err, data) {
			if (err) {
				reject(err);
			} else {
				resolve(data);
			}
		});
	});
}



// 外部呼叫
module.exports = {
	init: async function (charaDB) {

		let p1 = loadClassDataBase();
		let p2 = loadCharaDataBase(charaDB);
		await Promise.all([p1, p2]);

		return;
	},

	classDataCrawler: function () { return classDataCrawler(); },
	saveClassDataBase: function () { return saveClassDataBase(); },

	//charaDataCrawler: function (urlPath) { return charaDataCrawler(urlPath); },
	allCharaDataCrawler: function () { return allCharaDataCrawler(); },
	//saveCharaDataBase: function () { return saveCharaDataBase(); },

	searchDataAndReply: function (msg, replyFunc) { return searchDataAndReply(msg, replyFunc); },
	stampReply: function (msg, replyFunc) { return stampReply(msg, replyFunc); },

	_debug: function () { return _debug; },
	_encodeURI_JP: function (url) { return encodeURI_JP(url); }
};



/*
const debugFunc = async function () {
	await module.exports.init();
	await imgur.init();
	_debug = true;
	searchDataAndReply("安娜 蛇霊の呪術師オロチヒメ", function(obj) {
		console.log(obj);
	});
}

setTimeout(debugFunc, 1 * 100);//*/










