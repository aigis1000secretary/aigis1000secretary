
// 初始化
// 爬蟲
const request = require("request");
const iconv = require("iconv-lite");
const cheerio = require("cheerio");
// 資料庫
const fs = require("fs");
const dbox = require("./dbox.js");

var _debug = true;
var _version = "0.1";

// line bot
// bot 搜尋
const searchData = function(msg, replyFunc) {
	// 指令:
	if (_debug)	console.log("msg: <" + msg + ">");

	// 分析命令
	//var command = msg.substring(msg.indexOf(" ")).trim();
	var command = msg.replace("安娜", "").replace("ANNA", "").trim();
	if (_debug) console.log("Command: <" + command + ">");
	
	// debug switch
	if (command.toUpperCase().indexOf("DEBUG") != -1) 
	{
		_debug = !_debug;
		replyFunc("_debug = " + _debug ? "on" : "off");
		return "_debug = " + _debug ? "on" : "off";
	}

	// 定型文
	if (command.length == 1)
	{
		replyFunc("王子太短了，找不到...");
		return "王子太短了，找不到...";
	}
	if (command.indexOf("巨根") != -1)
	{
		replyFunc("王子太小了，找不到...");
		return "王子太小了，找不到...";
	}
	if (command.indexOf("醒醒") != -1) 
	{
		replyFunc("呣喵~?");
		return "呣喵~?";
	}
	// help
	if (command.indexOf("指令") != -1 || command.toUpperCase().indexOf("HELP") != -1)
	{
		var replyMsg = "";
		
		replyMsg += "狀態: 確認目前版本，資料庫資料筆數。\n";
		replyMsg += "照片: 上傳角色附圖的網路空間(DropBox)。\n";
		replyMsg += "學習: 用來教會安娜角色的暱稱。\n(>>安娜 學習 NNL:射手ナナリー)。\n";
		
		replyMsg += "\n";
		
		replyMsg += "直接輸入稀有度+職業可以搜索角色\n(>>安娜 黑弓)\n";
		replyMsg += "輸入關鍵字可進行模糊搜索&關鍵字搜索\n(>>安娜 NNL)(>>安娜 射手ナナリー)";
		
		if (!_debug)
		{
			replyFunc(replyMsg);
			return replyMsg;
		}
		
		replyMsg += "\n上傳資料庫。";
		
		replyFunc(replyMsg);
		return replyMsg;
	}
	// status
	if (command.indexOf("狀態") != -1)
	{
		var replyMsg = "";
		
		replyMsg += "目前版本 v" + _version + "\n";
		replyMsg += "資料庫內有 " + charaDataBase.length + " 筆角色資料\n";
		replyMsg += "　　　　　 " + classDataBase.length + " 筆職業資料";
		
		replyFunc(replyMsg);
		return replyMsg;
	}
	// 圖片空間
	if (command.indexOf("照片") != -1 && command.indexOf("圖片") != -1)
	{
		/*return createTemplateMsg("圖片空間", ["上傳新照片", "線上圖庫"],
		["https://www.dropbox.com/request/FhIsMnWVRtv30ZL2Ty69", 
		"https://www.dropbox.com/sh/vonsrxzy79nkpah/AAD4p6TwZF44GHP5f6gdEh3ba?dl=0"]);*/
		replyFunc(createTemplateMsg("圖片空間", ["上傳新照片", "線上圖庫"],
		["https://www.dropbox.com/request/FhIsMnWVRtv30ZL2Ty69", 
		"https://www.dropbox.com/sh/vonsrxzy79nkpah/AAD4p6TwZF44GHP5f6gdEh3ba?dl=0"]));
	}
	// 手動保存資料庫
	if (command.indexOf("上傳資料庫") != -1)
	{
		clearTimeout(uploadTaskId);
		uploadDataBase();
		return "";
	}
	// 關鍵字學習
	if (command.indexOf("學習") != -1)
	{
		//var learn = command.substring(msg.indexOf(" ")).trim();
		var learn = command.replace("學習", "").trim();
		if (_debug) console.log("learn: <" + learn + ">");
		
		var keys = learn.split(':'); // NNL:
		if (keys.length < 2)
		{
			replyFunc("[學習] 看不懂...");
			return "[學習] 看不懂...";
		}
		
		var arrayA = searchCharacter(keys[0].trim(), false);	// 精確搜索 Nick
		var arrayB = searchCharacter(keys[1].trim());
		var countA = arrayA.length;
		var countB = arrayB.length;
		
		if (_debug) console.log("full name: <" + arrayB + ">");
		if (_debug) console.log("new nick: <" + keys[0] + ">");
		
		if (countA == 1)
		{
			replyFunc("[學習] 安娜知道的！");
			return "[學習] 安娜知道的！";
		}
		else if (countB == 0)
		{
			var replyMsgs = ["不認識的人呢...", "那是誰？"];
			var replyMsg = "[學習] " + replyMsgs[Math.floor(Math.random() * replyMsgs.length)];
			replyFunc(replyMsg);
			return replyMsg;
		}
		else if (countB > 1)
		{
			replyFunc("[學習] 太多人了，不知道是誰");
			return "[學習] 太多人了，不知道是誰";
		}
		else
		{
			var key = arrayB[0];
			var nick = keys[0];
			
			var i = checkCharaData(key);
			charaDataBase[i].str_nickname.push(nick);
			
			// wait 29 min to save
			uploadTask();

			replyFunc("[學習] 嗯！記住了！");
			return "[學習] 嗯！記住了！";
		}
	}
	if (command.indexOf("忘記") != -1)
	{
		var learn = command.replace("忘記", "").trim();
		var target = searchCharacter(learn);
		if (target.length == 1) {
			var i = checkCharaData(target.trim());
			charaDataBase[i].str_nickname = [];
		}
		return "";
	}
	
	
	
	// 搜索職業
	if(command.indexOf("金") == 0
	|| command.indexOf("藍") == 0
	|| command.indexOf("白") == 0
	|| command.indexOf("黑") == 0)
	{
		// 分割命令
		var _rarity = getRarityString(command[0]);
		var _class = getClassString(command.substring(1).trim());
		if (_debug) console.log("_rarity+_class: <" + command[0] + "+" + command.substring(1).trim() + ">");
		if (_debug) console.log("_rarity+_class: <" + _rarity + "+" + _class + ">");
		
		var result = "";
		var count = 0;
		// 遍歷
		for(var i = 0; i < charaDataBase.length; i++) {
			var obj = charaDataBase[i];
			if (obj.data_rarity == _rarity && obj.data_class == _class)
			{
				result += obj.str_name + "\n";
				count++;
			}
		}
		result = result.trim()
		if (_debug) console.log("result: <" + result + ">");
		
		// only one
		if (count == 1)
		{
			var i = checkCharaData(result);
			var obj = charaDataBase[i];
			
			/*var replyMsg = "";
			replyMsg = obj.getMessage();
			return replyMsg.trim();*/

			listDir(obj.str_name)
			.then(function(msgArray) {
				var i = Math.floor(Math.random() * msgArray.length)
				;
				var replyMsg = [];
				replyMsg =+ createTextMsg(obj.getMessage());
				replyMsg =+ createImageMsg(msgArray[i]);
				replyMsg += createTemplateMsg("Wiki 連結", [obj.str_name], [obj.getWikiUrl()]);
				replyFunc(replyMsg);
			});
			
			return "";
		}
		else if (count > 0) // list
		{
			replyFunc(result);
			return result;
		}
	}
	
	// 搜索名稱
	var resultArray = searchCharacter(command);
	var count = resultArray.length;
	var result = "";
	if (_debug) console.log("resultArray: <" + resultArray + ">");
	
	// 遍歷
	for(var i = 0; i < resultArray.length; i++) {
		result += resultArray[i] + "\n";
	}
	result = result.trim();
	
	// only one
	if (count == 1)
	{
		var i = checkCharaData(result);
		var obj = charaDataBase[i];
		
		listDir(obj.str_name)
		.then(function(msgArray) {
			var i = Math.floor(Math.random() * msgArray.length)
			;
			var replyMsg = [];
			replyMsg =+ createTextMsg(obj.getMessage());
			replyMsg =+ createImageMsg(msgArray[i]);
			replyMsg += createTemplateMsg("Wiki 連結", [obj.str_name], [obj.getWikiUrl()]);
			replyFunc(replyMsg);
		});
		
		return "";
	}
	else if (count > 0) // list
	{
		replyFunc(result);
		return result;
	}
	
	// 404
	var replyMsgs = ["不認識的人呢...", "安娜不知道", "安娜不懂", "那是誰？", "那是什麼？"];
	var replyMsg = replyMsgs[Math.floor(Math.random() * replyMsgs.length)];
	replyFunc(replyMsg);
	return replyMsg;
}



// 爬蟲
// 爬蟲函數
const charaDataCrawler = function(urlPath) {

	// callback
	var requestCallBack = function(error, response, body) {
		if (error || !body)
		{
			console.log(error);
			return null;
		}

		var html = iconv.decode(new Buffer(body, "binary"), "EUC-JP"); // EUC-JP to utf8 // Shift_JIS EUC-JP
		var $ = cheerio.load(html, {decodeEntities: false}); // 載入 body

		var newData = createCharaData();

			// 搜尋所有表格
		$("div").each(function(i, elem) {
			var buffer = $(this).attr("id");
			if(buffer && buffer.indexOf("content_block_") != -1
					&& buffer.indexOf("-") != -1)
			{

				//console.log($(this).attr("id"));
				//console.log(">>" + $(this).prev().text().trim() + "<<");
				//console.log($(this).text().trim());
				//console.log("@@@@@@@@@@");
						
				// 檢查表格標籤
				if ($(this).prev().text().trim() == "ステータス")
				{
					newData.data_rarity = $(this).children("table").children("tbody").children("tr").eq(2).children("td").eq(0).text().replace(/\s\n/, "").trim();
					newData.str_name = $(this).children("table").children("tbody").children("tr").eq(2).children("td").eq(1).text().replace(/\s\n/, "").trim();
					newData.data_class = $(this).children("table").children("tbody").children("tr").eq(2).children("td").eq(2).text().replace(/\s\n/, "").trim();
					//newData.data_rarity = newData.data_rarity.replace("ゴ｜ルド", "ゴールド");
					if (newData.data_rarity.indexOf("ルド") != -1)	newData.data_rarity = "ゴールド";
				}

				if ($(this).prev().text().trim() == "アビリティ")
				{
					var _ability = $(this).text().replace(/\s\n/, "\n").trim().replace(/\n\n/, "\n");
					if (_ability != "")
					{
						newData.str_ability = _ability;
					}
				}

				if ($(this).prev().text().trim() == "覚醒アビリティ")
				{
					var _ability_aw = $(this).text().replace(/\s\n/, "\n").trim().replace(/\n\n/, "\n");
					if (_ability_aw != "")
					{
						newData.str_ability_aw = _ability_aw;
					}
				}

				if ($(this).prev().text().trim() == "スキル")
				{
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

				if ($(this).prev().text().trim() == "スキル覚醒")
				{
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
	var requestCallBack = function(error, response, body) {
		if (error || !body)
		{
			console.log(error);
			return null;
		}

		var html = iconv.decode(new Buffer(body, "binary"), "EUC-JP"); // EUC-JP to utf8 // Shift_JIS EUC-JP
		var $ = cheerio.load(html, {decodeEntities: false}); // 載入 body

		var newData = createCharaData();

		// 搜尋所有超連結
		$("a").each(function(i, elem) {
			var buffer = $(this).attr("href");
			if(buffer && $(this).parent().is("td")
					&& $(this).prev().prev().children().is("img"))
				{
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
	var requestCallBack = function(error, response, body) {
		if (error || !body)
		{
			console.log(error);
			return null;
		}

		var html = iconv.decode(new Buffer(body, "binary"), "EUC-JP"); // EUC-JP to utf8 // Shift_JIS EUC-JP
		var $ = cheerio.load(html, {decodeEntities: false}); // 載入 body

		$("div").each(function(i, elem) {
			var buffer = $(this).attr("id");
				// 搜尋所有表格
			if(buffer && buffer.indexOf("content_block_") != -1
				 && buffer.indexOf("-") != -1)
				{
					// 檢查表格標籤
			if ($(this).prev().text().trim() == "一覧")
			{
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
						})
					}
			}
		});
	}
	request.get("http://seesaawiki.jp/aigis/d/class_%b6%e1%c0%dc%b7%bf_%cc%dc%bc%a1", {encoding: "binary"}, requestCallBack);
	request.get("http://seesaawiki.jp/aigis/d/class_%b1%f3%b5%f7%ce%a5%b7%bf_%cc%dc%bc%a1", {encoding: "binary"}, requestCallBack);
};
// 網址編碼
const urlEncode = function(str_utf8, codePage) {
	var buffer = iconv.encode(str_utf8, codePage);
	var str = "";
	for(var i = 0; i < buffer.length; i++) {
		str += "%" + buffer[i].toString(16);
	}
	return str.toUpperCase();
}
const urlEncodeJP = function(str_utf8) {	return urlEncode(str_utf8, "EUC-JP");}
const urlEncodeBIG5 = function(str_utf8) {	return urlEncode(str_utf8, "BIG5");}
const urlEncodeUTF8 = function(str_utf8) {	return urlEncode(str_utf8, "UTF-8");}
var encodeURI_JP = function(url) {
	var result = "";
	
	var jpEncode = "";
	var big5Encode = "";
	var uriEncode = "";

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

		string += this.str_name + "\n";

		if (this.str_nickname.length > 0)
		{
			for(var i = 0; i < this.str_nickname.length; i++) {
				string += this.str_nickname[i] + " ";
			}
			string += "\n";
		}

		if (this.str_ability != "")
		{
			string += "◇特：" + this.str_ability + "\n";
		}
		
		if (this.str_skill != "")
		{
			string += "◇技：" + this.str_skill + "\n";
		}
		
		if (this.str_ability_aw != "")
		{
			string += "◆特：" + this.str_ability_aw + "\n";
		}
		
		if (this.str_skill_aw != "")
		{
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
		
		for (var i = 0; i < this.str_nickname.length; i++) {
			if (name.toUpperCase() == this.str_nickname[i].toUpperCase())	return true;
		}
		return false;
	};
	
	return obj;
}
// 檢查資料
const checkCharaData = function(name) {
	for(var i = 0; i < charaDataBase.length; i++) {
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
	var fsCallBack = function(error, bytesRead, buffer) {
		if (error)
		{
			console.log(error);
			return;
		}
	}
	// json to file
	fs.writeFile("CharaDataBase_.json", json, "utf8", fsCallBack);

	console.log("CharaDataBase saved!");
}
// 讀取資料
const loadCharaDataBase = function() {
	console.log("CharaDataBase loading...");

	var fsCallBack = function(err, data){
		if (err)
		{
			console.log(err);
		}
		else
		{
			var count = 0;
			var obj = JSON.parse(data);
			for(var i = 0; i < obj.length; i++) {
				
				if (obj.str_name == "") continue;
				
				var newData = createCharaData();
				
				newData.str_name = obj[i].str_name.trim();
				newData.str_nickname = obj[i].str_nickname;
				newData.str_ability = obj[i].str_ability.trim();
				newData.str_ability_aw = obj[i].str_ability_aw.trim();
				newData.str_skill = obj[i].str_skill.trim();
				newData.str_skill_aw = obj[i].str_skill_aw.trim();
				
				
				newData.data_rarity = obj[i].data_rarity.trim();
				newData.data_class = obj[i].data_class.trim();

				for(var j = 0; j < newData.str_nickname.length; j++) {
					newData.str_nickname[j] = newData.str_nickname[j].trim();
				}
				
				addCharaData(newData);
				count++;
			}
			console.log(count + " CharaData loaded!");
		}
	}
	fs.readFile("CharaDataBase.json", fsCallBack);
}
// 新增資料
const addCharaData = function(newData) {
	if (newData.str_name == "")	return;
	
	if (_debug) console.log("New character data add...");

	if (checkCharaData(newData.str_name) == -1)
	{
		charaDataBase.push(newData);
		if (_debug) console.log("New character <" + newData.str_name + "> data add complete!");
	}
	else
	{
		var i = checkCharaData(newData.str_name);
		var obj = charaDataBase[i];
		
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
	var array_metrics = [];
	for(var i = 0; i < charaDataBase.length; i++) {
		var obj = charaDataBase[i];
		
		if (obj.checkName(key)) // 精確符合
		{
			if (_debug)	console.log("return : <" + [obj.str_name] + ">");
			return [obj.str_name];
		}
		else if (blurry) // 模糊加權
		{
			const metricsA = 8;
			const metricsB = 2;
			const metricsC = 1;
			var k = -2, l = -1;
			var metrics = -15;
			//array_metrics[(metricsA + metricsB) * key.length] = [];
			
			for(var j = 0; j < key.length; j++) {
				l = obj.str_name.indexOf(key[j], Math.max(k, 0));
				
				if (l > -1)	// find key[j] in source
					metrics += metricsA;
				
				if (l > k)	// find key[j] after key[j - 1]
					metrics += metricsB;
					
				if (l == k + 1)	// find key[j] just after key[j - 1]
					metrics += metricsC;
				
				k = l;
				
			}
			if (metrics > 0)
			{
				//array_metrics.push([i, metrics]);
				//array_metrics[i] = metrics;
				//array_metrics[metrics].push(i);
				if (typeof(array_metrics[metrics]) == "undefined")
				{
					array_metrics[metrics] = [i];
				}
				else
				{
					array_metrics[metrics].push(i);
				}
			}
		}
	}
	
	// 模糊加權結果
	var result = [];
	if (blurry)
	{
		// 權值大到小
		if (_debug)	console.log("for(array_metrics) i : <" + array_metrics.length - 1 + ">");
		if (_debug)	console.log("for(array_metrics) limit : <" + Math.floor((array_metrics.length - 1) * 0.9) + ">");
		
		for(var i = array_metrics.length - 1; i >= Math.floor((array_metrics.length - 1) * 0.9); i--) {
			if (typeof(array_metrics[i]) == "undefined")	continue;	// 檢查搜尋結果
			
			// 遍歷搜尋結果
			for(var j = 0; j < array_metrics[i].length; j++) {
				var index = array_metrics[i][j];
				//result += charaDataBase[index].str_name + "\n";
				//result += i + ": " + charaDataBase[index].str_name + "\n";
				
				if (_debug)	console.log("array_metrics : <" + i + ": " + charaDataBase[index].str_name + ">");
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
	for(var i = 0; i < classDataBase.length; i++) {
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
	var fsCallBack = function(error, bytesRead, buffer) {
		if (error)
		{
			console.log(error);
			return;
		}
	}
	// json to file
	fs.writeFile("ClassDataBase_.json", json, "utf8", fsCallBack);

	console.log("ClassDataBase saved!");
}
// 讀取資料
const loadClassDataBase = function() {
	console.log("ClassDataBase saving...");

	var fsCallBack = function(err, data){
		if (err)
		{
			console.log(err);
		}
		else
		{
			var count = 0;
			var obj = JSON.parse(data);
			for(var i = 0; i < obj.length; i++) {
				addClassData(obj[i]);
				count++;
			}
			console.log(count + " ClassData loaded!");
		}
	}
	fs.readFile("ClassDataBase.json", fsCallBack);

}
// 新增資料
const addClassData = function(newClass) {
	if (_debug) console.log("New <" + newClass.className + "> Class data add...");

	if (checkClassData(newClass.className) == -1)
	{
		classDataBase.push(newClass);
		if (_debug) console.log("New Class <" + newClass.className + "> add complete!");
	}
	else
	{
		//var i = checkClassData(newClass.className);
		//classDataBase[i].type = newClass.type;
		if (_debug) console.log("Class <" + newClass.className + "> is existed!");
	}
}
// value to key
const getRarityString = function(str) {
	if   (str == "金")	return "ゴールド";
	else if (str == "藍")	return "サファイア";
	else if (str == "白")	return "プラチナ";
	else if (str == "黑")	return "ブラック";
	else					return "NULL";
}
// 搜尋職業
const getClassString = function(str) {
	for(var i = 0; i < classDataBase.length; i++) {
		for(var j = 0; j < classDataBase[i].index.length; j++) {
			if (str == classDataBase[i].index[j])
			{
				return classDataBase[i].className;
			}
		}
	}
	return "NULL";
}



// Line Message element
// 文字訊息
const createTextMsg = function(text) {
	return {
		type: "text",
		text: "Test msg"
	};
}
// 圖片訊息
// url = https://aigis1000secretary.updog.co/刻詠の風水士リンネ/6230667.png encodeURI(img) (utf8 to %utf8 )
const createImageMsg = function(img) {
	return {
		type: "image",
		originalContentUrl: img,
		previewImageUrl: img
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
	for (var i = 0; i < label.length; i++) {
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





// 外部呼叫
module.exports = {
	loadClassDataBase: function() { return loadClassDataBase(); },
	loadCharaDataBase: function() { return loadCharaDataBase(); },
	
	classDataCrawler: function() { return classDataCrawler(); },
	allCharaDataCrawler: function() { return allCharaDataCrawler(); },
	
	saveClassDataBase: function() { return saveClassDataBase(); },
	saveCharaDataBase: function() { return saveCharaDataBase(); },
	
	searchData: function(msg, replyFunc) { return searchData(msg, replyFunc); },
	
	_debug: function() { return _debug; }
};





/*
const debugFunc = function() {

	var url = "";
	url = "https://seesaawiki.jp/aigis/d/刻詠の風水士リンネ";
	console.log(encodeURI_JP(url));
	url = "https://aigis1000secretary.updog.co/刻詠の風水士リンネ/6230667.png";
	console.log(encodeURI(url));

}



setTimeout(debugFunc, 1 * 1000);

*/









