
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
var _version = "0.3.1.11";
// 主版本號：當你做了不兼容的API修改
// 次版本號：當你做了向下兼容的功能性新增
// 修訂號：當你做了向下兼容的問題修正
// 次修訂號：線上debug

// line bot
// 搜尋資料
const searchDataAndReply = function(msg, replyFunc) {
	// 指令:
	if (_debug)	console.log("msg: <" + msg + ">");

	// 分析命令
	//let command = msg.substring(msg.indexOf(" ")).trim();
	let command = msg.replace("安娜", "").replace("ANNA", "").trim();
	if (_debug) console.log("Command: <" + command + ">");

	// debug switch
	if (command.toUpperCase().indexOf("DEBUG") != -1)  {
		_debug = !_debug;
		replyFunc("_debug = " + (_debug ? "on" : "off"));
		return ;
	}

	// 定型文
	if (command.length == 1) {
		if (searchCharacterAndReply(command, false, replyFunc) == 1) {
			return ;

		} else {
			replyFunc("王子太短了，找不到...");
			return ;
		}
	}
	if (command.indexOf("巨根") != -1) {
		replyFunc("王子太小了，找不到...");
		return ;
	}
	// wake
	if (command.indexOf("醒醒") != -1)  {
		replyFunc("呣喵~?");
		return ;
	}
	// help
	if (command.indexOf("指令") != -1 || command.toUpperCase().indexOf("HELP") != -1) {
		var replyMsg = "";

		replyMsg += "狀態: 確認目前版本，資料庫資料筆數。\n";
		replyMsg += "照片: 上傳角色附圖的網路空間(DropBox)。\n";
		replyMsg += "工具: 千年戰爭Aigis實用工具。\n";
		replyMsg += "學習: 用來教會安娜角色的暱稱。\n(>>安娜 學習 NNL:射手ナナリー)。\n";

		replyMsg += "\n";

		replyMsg += "直接輸入稀有度+職業可以搜索角色\n(>>安娜 黑弓)\n";
		replyMsg += "輸入關鍵字可進行模糊搜索&關鍵字搜索\n(>>安娜 NNL)(>>安娜 射手ナナリー)\n";

		if (!_debug)
		{
			replyFunc(replyMsg);
			return ;
		}

		replyMsg += "\n上傳。";

		replyFunc(replyMsg);
		return ;
	}
	// status
	if (command.indexOf("狀態") != -1) {
		//loadAutoResponseList();
		imgur.account.images()
		.then(imgur.dataBase.loadImages)
		.catch(function(error) {
			console.log("Imgur images load error!");
			console.log(error);
		});

		var replyMsg = "";

		replyMsg += "目前版本 v" + _version + "\n";
		replyMsg += "資料庫內有 " + charaDataBase.length + " 筆角色資料\n";
		replyMsg += "　　　　　 " + classDataBase.length + " 筆職業資料";

		replyFunc(replyMsg);
		return ;
	}
	// 圖片空間
	if (command.indexOf("照片") != -1 || command.indexOf("圖片") != -1 || command.indexOf("相片") != -1) {
		replyFunc(createTemplateMsg("圖片空間", ["上傳新照片", "線上圖庫"],
		["https://www.dropbox.com/request/FhIsMnWVRtv30ZL2Ty69",
		"https://www.dropbox.com/sh/vonsrxzy79nkpah/AAD4p6TwZF44GHP5f6gdEh3ba?dl=0"]));
		return ;
	}
	// 手動保存資料庫
	if (command.indexOf("上傳") != -1) {
		clearTimeout(uploadTaskId);
		uploadDataBase();
		return ;
	}
	// 關鍵字學習
	if (command.indexOf("學習") != -1) {
		//var learn = command.substring(msg.indexOf(" ")).trim();
		let learn = command.replace("學習", "").trim().replace("：", ":");
		if (_debug) console.log("learn: <" + learn + ">");

		let keys = learn.split(":"); // NNL:
		if (keys.length < 2)
		{
			replyFunc("[學習] 看不懂...");
			return ;
		}

		let arrayA = searchCharacter(keys[0].trim(), false);	// 精確搜索 Nick
		let arrayB = searchCharacter(keys[1].trim());
		let countA = arrayA.length;
		let countB = arrayB.length;

		if (_debug) console.log("full name: <" + arrayB + ">");
		if (_debug) console.log("new nick: <" + keys[0] + ">");

		if (countA == 1)
		{
			replyFunc("[學習] 安娜知道的！");
			return ;
		}
		else if (countB == 0)
		{
			let replyMsgs = ["不認識的人呢...", "那是誰？"];
			var replyMsg = "[學習] " + replyMsgs[Math.floor(Math.random() * replyMsgs.length)];
			replyFunc(replyMsg);
			return ;
		}
		else if (countB > 1)
		{
			replyFunc("[學習] 太多人了，不知道是誰");
			return ;
		}
		else
		{
			var key = arrayB[0];
			var nick = keys[0];

			let i = checkCharaData(key);
			charaDataBase[i].str_nickname.push(nick);

			// wait 25 min to save
			uploadTask();

			replyFunc("[學習] 嗯！記住了！");
			return ;
		}
	}
	// forgot
	if (command.indexOf("忘記") != -1) {
		var learn = command.replace("忘記", "").trim();
		var target = searchCharacter(learn);
		if (target.length == 1) {
			let i = checkCharaData(target.trim());
			charaDataBase[i].str_nickname = [];
		}
		return ;
	}
	// tool
	if (command.indexOf("工具") != -1) {
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
		return ;
	}



	// 搜索職業
	if (command.indexOf("金") == 0 || command.indexOf("藍") == 0
	 || command.indexOf("白") == 0 || command.indexOf("黑") == 0) {
		// 分割命令
		let _rarity = getRarityString(command[0]);
		let _class = getClassString(command.substring(1).trim());
		if (_debug) console.log("_rarity+_class: <" + command[0] + "+" + command.substring(1).trim() + ">");
		if (_debug) console.log("_rarity+_class: <" + _rarity + "+" + _class + ">");

		var result = "";
		let count = 0;
		// 遍歷
		//for (var i = 0; i < charaDataBase.length; i++) {
		for (let i in charaDataBase) {
			var obj = charaDataBase[i];
			if (obj.data_rarity == _rarity && obj.data_class == _class)
			{
				result += obj.str_name + "\n";
				count++;
			}
		}
		result = result.trim()
		if (_debug) console.log("result: <" + result + ">");

		if (count == 1) {	// only one
			replayCharaData(result, replyFunc);
			return ;

		} else if (count > 0) {	// list
			replyFunc(result);
			return ;
		}
	}

	if (searchCharacterAndReply(command, true, replyFunc) > 0) {
		return ;
	}

	// 404
	let replyMsgs = ["不認識的人呢...", "安娜不知道", "安娜不懂", "那是誰？", "那是什麼？"];
	var replyMsg = replyMsgs[Math.floor(Math.random() * replyMsgs.length)];
	replyFunc(replyMsg);
	return ;
}
// 搜尋腳色&回復
const searchCharacterAndReply = function(command, blurry, replyFunc) {
	if (typeof(blurry) == "undefined")	blurry = true;

	// 搜索名稱
	var resultArray = searchCharacter(command, blurry);
	var count = resultArray.length;
	if (_debug) console.log("resultArray["+ count +"]: <" + resultArray + ">");

	// 遍歷
	/*var result = "";
	for (var i = 0; i < resultArray.length; i++) {
		result += resultArray[i] + "\n";
	}
	result = result.trim();*/
	var result = resultArray.join("\n");

	// only one
	if (count == 1)
	{
		replayCharaData(result, replyFunc);
	}
	else if (count > 0) // list
	{
		replyFunc(result);
	}
	return count;
}
// 回覆單一腳色資料
const replayCharaData = function(charaName, replyFunc) {
	if (_debug)	console.log(charaName);

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
	return ;
}
// 定型文貼圖
const stampReply = function(msg, replyFunc) {
	if (_debug)	console.log(msg);

	var replyMsg = [];

	let imgArray = imgur.dataBase.findImageByTag(msg);
	if (imgArray.length > 0) {
		let i = Math.floor(Math.random() * imgArray.length);
		replyMsg.push(createImageMsg(imgArray[i].imageLink, imgArray[i].thumbnailLink));
		replyFunc(replyMsg);
	}
	return ;
}


// 爬蟲
// 爬蟲函數
const charaDataCrawler = function(urlPath) {

	// callback
	let requestCallBack = function(error, response, body) {
		if (error || !body) {
			console.log(error);
			return null;
		}

		var html = iconv.decode(new Buffer(body, "binary"), "EUC-JP"); // EUC-JP to utf8 // Shift_JIS EUC-JP
		let $ = cheerio.load(html, {decodeEntities: false}); // 載入 body

		var newData = createCharaData();

			// 搜尋所有表格
		$("div").each(function(i, elem) {

			var buffer = $(this).attr("id");
			if(buffer && buffer.indexOf("content_block_") != -1 && buffer.indexOf("-") != -1) {

				//console.log($(this).attr("id"));
				//console.log(">>" + $(this).prev().text().trim() + "<<");
				//console.log($(this).text().trim());
				//console.log("@@@@@@@@@@");

				// 檢查表格標籤
				if ($(this).prev().text().trim() == "ステータス") {
					newData.data_rarity = $(this).children("table").children("tbody").children("tr").eq(2).children("td").eq(0).text().replace(/\s\n/, "").trim();
					newData.str_name = $(this).children("table").children("tbody").children("tr").eq(2).children("td").eq(1).text().replace(/\s\n/, "").trim();
					newData.data_class = $(this).children("table").children("tbody").children("tr").eq(2).children("td").eq(2).text().replace(/\s\n/, "").trim();
					//newData.data_rarity = newData.data_rarity.replace("ゴ｜ルド", "ゴールド");
					if (newData.data_rarity.indexOf("ルド") != -1)	newData.data_rarity = "ゴールド";
				}

				if ($(this).prev().text().trim() == "アビリティ") {
					var _ability = $(this).text().replace(/\s\n/, "\n").trim().replace(/\n\n/, "\n");
					if (_ability != "")
					{
						newData.str_ability = _ability;
					}
				}

				if ($(this).prev().text().trim() == "覚醒アビリティ") {
					var _ability_aw = $(this).text().replace(/\s\n/, "\n").trim().replace(/\n\n/, "\n");
					if (_ability_aw != "")
					{
						newData.str_ability_aw = _ability_aw;
					}
				}

				if ($(this).prev().text().trim() == "スキル") {
					var _skill_name = $(this).children("table").eq(-1).children("tbody").children("tr").eq(2).children("td").eq(0).text().replace(/\n/, " ").replace(/\s\s/, " ").trim();
					var _skill = $(this).children("table").eq(-1).children("tbody").children("tr").eq(-2).children("td").eq(1).text().replace(/\n/, " ").replace(/\s\s/, " ").trim();

					if (_skill == "-")
					{
						_skill = $(this).children("table").children("tbody").children("tr").eq(2).children("td").eq(2).text().replace(/\n/, " ").replace(/\s\s/, " ").trim();
					}
					if (_skill_name != "")
					{
						newData.str_skill = _skill_name + "\n" + _skill;
					}
				}

				if ($(this).prev().text().trim() == "スキル覚醒") {
					var _skill_aw_name = $(this).children("table").children("tbody").children("tr").eq(-1).children("td").eq(1).text().replace(/\n/, " ").replace(/\s\s/, " ").trim();
					var _skill_aw = $(this).children("table").children("tbody").children("tr").eq(-1).children("td").eq(2).text().replace(/\n/, " ").replace(/\s\s/, " ").trim();

					if (_skill_aw == "-")
					{
						_skill_aw_name = $(this).children("table").children("tbody").children("tr").eq(-1).children("td").eq(0).text().replace(/\n/, " ").replace(/\s\s/, " ").trim();
						_skill_aw = $(this).children("table").children("tbody").children("tr").eq(-1).children("td").eq(1).text().replace(/\n/, " ").replace(/\s\s/, " ").trim();
					}
					if (_skill_aw_name != "")
					{
						newData.str_skill_aw = _skill_aw_name + "\n" + _skill_aw;
					}
				}
			}
		});
		// 新增腳色資料
		addCharaData(newData);
	}
	request.get(urlPath, {encoding: "binary"}, requestCallBack);
};
// 爬所有腳色
var delay = 0;
const allCharaDataCrawler = function() {
	console.log("AllCharaData Crawling...");

	// callback
	let requestCallBack = function(error, response, body) {
		if (error || !body) {
			console.log(error);
			return null;
		}

		var html = iconv.decode(new Buffer(body, "binary"), "EUC-JP"); // EUC-JP to utf8 // Shift_JIS EUC-JP
		let $ = cheerio.load(html, {decodeEntities: false}); // 載入 body

		// 搜尋所有超連結
		$("a").each(function(i, elem) {

			var buffer = $(this).attr("href");
			if(buffer && $(this).parent().is("td") && $(this).prev().prev().children().is("img")) {
				//console.log($(this).text());
				// 延遲呼叫腳色爬蟲
				setTimeout(function(){charaDataCrawler(buffer);}, delay * 100);
				delay++;
			}
		});
	}
	request.get("http://seesaawiki.jp/aigis/d/%a5%b4%a1%bc%a5%eb%a5%c9", {encoding: "binary"}, requestCallBack);
	request.get("http://seesaawiki.jp/aigis/d/%a5%b5%a5%d5%a5%a1%a5%a4%a5%a2", {encoding: "binary"}, requestCallBack);
	request.get("http://seesaawiki.jp/aigis/d/%a5%d7%a5%e9%a5%c1%a5%ca", {encoding: "binary"}, requestCallBack);
	request.get("http://seesaawiki.jp/aigis/d/%a5%d6%a5%e9%a5%c3%a5%af", {encoding: "binary"}, requestCallBack);
}
// 爬職業
const classDataCrawler = function() {
	console.log("ClassData Crawling...");

	// callback
	let requestCallBack = function(error, response, body) {
		if (error || !body)
		{
			console.log(error);
			return null;
		}

		var html = iconv.decode(new Buffer(body, "binary"), "EUC-JP"); // EUC-JP to utf8 // Shift_JIS EUC-JP
		let $ = cheerio.load(html, {decodeEntities: false}); // 載入 body

		$("div").each(function(i, elem) {

			let buffer = $(this).attr("id");
			// 搜尋所有表格
			if(buffer && buffer.indexOf("content_block_") != -1 && buffer.indexOf("-") != -1) {

				// 檢查表格標籤
				if ($(this).prev().text().trim() == "一覧") {

					// 遍歷表格內容
					$(this).children().children().children().children().children().each(function(i, elem) {

						var str = $(this).text().trim();
						var i = str.indexOf("\/");
						if (i != -1)
						{
							str = str.substring(0, i);
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
	request.get("http://seesaawiki.jp/aigis/d/class_%b6%e1%c0%dc%b7%bf_%cc%dc%bc%a1", {encoding: "binary"}, requestCallBack);
	request.get("http://seesaawiki.jp/aigis/d/class_%b1%f3%b5%f7%ce%a5%b7%bf_%cc%dc%bc%a1", {encoding: "binary"}, requestCallBack);
};
// 網址編碼
const urlEncode = function(str_utf8, codePage) {
	let buffer = iconv.encode(str_utf8, codePage);
	let str = "";
	for (let i = 0; i < buffer.length; i++) {
		str += "%" + buffer[i].toString(16);
	}
	return str.toUpperCase();
}
const urlEncodeJP = function(str_utf8) {	return urlEncode(str_utf8, "EUC-JP");}
const urlEncodeBIG5 = function(str_utf8) {	return urlEncode(str_utf8, "BIG5");}
const urlEncodeUTF8 = function(str_utf8) {	return urlEncode(str_utf8, "UTF-8");}
var encodeURI_JP = function(url) {
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



// 資料庫
var charaDataBase = [];
// 建構資料函數
const createCharaData = function() {
	var obj = {};
	obj.str_name = "";
	obj.str_nickname = [];
	obj.str_ability = "";
	obj.str_ability_aw = "";
	obj.str_skill = "";
	obj.str_skill_aw = "";

	obj.data_rarity = "";
	obj.data_class = "";

	obj.getMessage = function() {
		var string = "";

		string += this.str_name + "　　" + this.data_rarity + "\n";

		if (this.str_nickname.length > 0) {
			//for (var i = 0; i < this.str_nickname.length; i++) {
			for (let i in this.str_nickname) {
				string += this.str_nickname[i] + " ";
			}
			string += "\n";
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
	obj.getWikiUrl = function() {
		var string = "http://seesaawiki.jp/aigis/d/" + this.str_name;
		return encodeURI_JP(string);
	};
	obj.checkName = function(name) {
		if (name == this.str_name)	return true;

		//for (let i = 0; i < this.str_nickname.length; i++) {
		for (let i in this.str_nickname) {
			if (name.toUpperCase() == this.str_nickname[i].toUpperCase())	return true;
		}
		return false;
	};

	return obj;
}
// 檢查資料
const checkCharaData = function(name) {
	//for (var i = 0; i < charaDataBase.length; i++) {
	for (let i in charaDataBase) {
		if(charaDataBase[i].str_name == name)
			return i;
	}
	return -1;
}
// 儲存資料
const saveCharaDataBase = function() {
	console.log("CharaDataBase saving...");

	// object to json
	var json = JSON.stringify(charaDataBase);

	// callback
	let fsCallBack = function(error, bytesRead, buffer) {
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
const loadCharaDataBase = async function() {
	console.log("CharaDataBase loading...");
	try {
		let data = await asyncReadFile("CharaDataBase.json");

		let count = 0;
		let obj = JSON.parse(data);
		//for (let i = 0; i < obj.length; i++) {
		for (let i in obj) {

			if (obj[i].str_name == "") continue;

			var newData = createCharaData();

			newData.str_name = obj[i].str_name.trim();
			newData.str_nickname = obj[i].str_nickname;
			newData.str_ability = obj[i].str_ability.trim();
			newData.str_ability_aw = obj[i].str_ability_aw.trim();
			newData.str_skill = obj[i].str_skill.trim();
			newData.str_skill_aw = obj[i].str_skill_aw.trim();


			newData.data_rarity = obj[i].data_rarity.trim();
			newData.data_class = obj[i].data_class.trim();

			//for (let j = 0; j < newData.str_nickname.length; j++) {
			for (let j in newData.str_nickname) {
				newData.str_nickname[j] = newData.str_nickname[j].trim();
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
const addCharaData = function(newData) {
	if (newData.str_name == "")	return;

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

		if (obj.str_ability == "")
		{
			charaDataBase[i].str_ability = newData.str_ability;
		}
		if (obj.str_ability_aw == "")
		{
			charaDataBase[i].str_ability_aw = newData.str_ability_aw;
		}
		if (obj.str_skill == "")
		{
			charaDataBase[i].str_skill = newData.str_skill;
		}
		if (obj.str_skill_aw == "")
		{
			charaDataBase[i].str_skill_aw = newData.str_skill_aw;
		}

		if (obj.data_rarity == "")
		{
			charaDataBase[i].data_rarity = newData.data_rarity;
		}
		if (obj.data_class == "")
		{
			charaDataBase[i].data_class = newData.data_class;
		}
		if (_debug) console.log("Character <" + newData.str_name + "> data is existed!");
	}
}
// 上傳備份
const uploadDataBase = function() {
	console.log("CharaDataBase uploading...");

	// object to json
	var binary = new Buffer(JSON.stringify(charaDataBase));
	dbox.fileUpload("\CharaDataBase_.json", binary);

	console.log("CharaDataBase uploaded!");
}
// 延遲上傳
var uploadTaskId;
const uploadTask = function() {
	clearTimeout(uploadTaskId);
	uploadTaskId = setTimeout(uploadDataBase, 25 * 60 * 1000);
}
// 模糊搜尋
const searchCharacter = function(key, blurry) {
	if (typeof(blurry) == "undefined")	blurry = true;

	// 加權陣列
	let array_metrics = [];
	//for (let charaIndex = 0; charaIndex < charaDataBase.length; charaIndex++) {
	for (let charaIndex in charaDataBase) {
		let obj = charaDataBase[charaIndex];

		if (obj.checkName(key)) { // 精確符合
			if (_debug)	console.log("return : <" + [obj.str_name] + ">");
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
				if (typeof(array_metrics[metrics]) == "undefined") {
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
		if (_debug)	console.log("metricsMax: <" + metricsMax + ">");
		if (_debug)	console.log("metricsMin: <" + metricsMin + ">");

		for (let charaIndex = metricsMax; charaIndex >= metricsMin; charaIndex--) {
			if (typeof(array_metrics[charaIndex]) == "undefined")	continue;	// 檢查搜尋結果

			// 遍歷搜尋結果
			//for (let i = 0; i < array_metrics[charaIndex].length; i++) {
			for (let i in array_metrics[charaIndex]) {
				let index = array_metrics[charaIndex][i];
				//result += charaDataBase[index].str_name + "\n";
				//result += i + ": " + charaDataBase[index].str_name + "\n";

				if (_debug)	console.log("array_metrics : <" + charaIndex + ": " + charaDataBase[index].str_name + ">");
				result.push(charaDataBase[index].str_name);
			}
		}
	}
	return result;
}


// 職業資料庫
var classDataBase = [];
// 建構資料函數
const createClassData = function() {
	var obj = {};
	obj.className = "";
	obj.index = [];
	obj.type = "";

	return obj;
}
// 檢查資料
const checkClassData = function(name) {
	//for (var i = 0; i < classDataBase.length; i++) {
	for (let i in classDataBase) {
		if(classDataBase[i].className == name)
			return i;
	}
	return -1;
}
// 儲存資料
const saveClassDataBase = function() {
	console.log("ClassDataBase saving...");

	// object to json
	var json = JSON.stringify(classDataBase);

	// callback
	let fsCallBack = function(error, bytesRead, buffer) {
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
const loadClassDataBase = async function() {
	console.log("ClassDataBase loading...");
	try {
		let data = await asyncReadFile("ClassDataBase.json");

		let count = 0;
		var obj = JSON.parse(data);
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
const addClassData = function(newClass) {
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
const getRarityString = function(str) {
	if		(str == "金")	return "ゴールド";
	else if (str == "藍")	return "サファイア";
	else if (str == "白")	return "プラチナ";
	else if (str == "黑")	return "ブラック";
	else					return "NULL";
}
// 搜尋職業
const getClassString = function(str) {
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
const createTextMsg = function(_text) {
	return {
		type: "text",
		text: _text.trim()
	};
}
// 圖片訊息
// url = https://aigis1000secretary.updog.co/刻詠の風水士リンネ/6230667.png encodeURI(img) (utf8 to %utf8 )
const createImageMsg = function(image, thumbnail) {
	return {
		type: "image",
		originalContentUrl: image,
		previewImageUrl: (typeof(image) == "undefined" ? image : thumbnail)
	};
}
// 超連結選項
// altText = "Wiki 連結"
// label = str_Name
// url = "https://seesaawiki.jp/aigis/d/刻詠の風水士リンネ"	encodeURI_JP(url)
const createTemplateMsg = function(altText, label, url) {
	if (label.length != url.length)	return "";
	if (label.length <= 0 || 4 < label.length)	return "";
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
// 定型文清單
//var autoResponseList = [];
// 讀取清單
/*const loadAutoResponseList = function() {
	autoResponseList = [];

	dbox.listDir("AutoResponse", "folder")
	.then(function(msgArray) {
		for (var i = 0; i <msgArray.length; i++) {
			autoResponseList.push(msgArray[i]);
		}
	});
}*/




// readfile
const asyncReadFile = function(filePath){
    return new Promise(function(resolve, reject) {
        fs.readFile(filePath, function(err, data) {
            if(err){
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}



// 外部呼叫
module.exports = {
	init: async function() {

		let p1 = loadClassDataBase();
		let p2 = loadCharaDataBase();
		await Promise.all([p1, p2]);

		return;
	},

	classDataCrawler: function() { return classDataCrawler(); },
	charaDataCrawler: function(urlPath) { return charaDataCrawler(urlPath); },
	allCharaDataCrawler: function() { return allCharaDataCrawler(); },

	saveClassDataBase: function() { return saveClassDataBase(); },
	saveCharaDataBase: function() { return saveCharaDataBase(); },

	searchDataAndReply: function(msg, replyFunc) { return searchDataAndReply(msg, replyFunc); },
	stampReply: function(msg, replyFunc) { return stampReply(msg, replyFunc); },

	_debug: function() { return _debug; }
};





/*
const debugFunc = async function() {

	_debug = true;
}



setTimeout(debugFunc, 1 * 1000);*/










