
// 初始化
// line bot
var linebot = require("linebot");
var express = require("express");
// 爬蟲
var request = require("request");
var iconv = require("iconv-lite");
var cheerio = require("cheerio");
// 資料庫
var fs = require("fs");

// line bot
// 登入參數
var bot = linebot({
	channelId: 1612493892,
	channelSecret: "ea71aeca4c54c6aa270df537fbab3ee3",
	channelAccessToken: "GMunTSrUWF1vRwdNxegvepxHEQWgyaMypbtyPluxqMxoTqq8QEGJWChetLPvlV0DJrY4fvphSUT58vjVQVLhndlfk2JKQ/sbzT6teG1qUUUEVpVfqs5KGzzn3NUngYMw9/lvvU0QZVGBqPS6wKVxrQdB04t89/1O/w1cDnyilFU="
});

const app = express();
const linebotParser = bot.parser();
app.post("/", linebotParser);
//因為 express 預設走 port 3000，而 heroku 上預設卻不是，要透過下列程式轉換
var server = app.listen(process.env.PORT || 8080, function() {
	var port = server.address().port;
	console.log("App now running on port", port);
});

// bot監聽
var bot_on = function() {
	bot.on("message", function(event) {
		if (event.message.type == "text") {
			var msg = event.message.text;
			var replyMsg = "";
			
			if (msg == "nullpo") {
				replyMsg = "ga";
			}

			event.reply(replyMsg).then(function(data) {
				console.log(replyMsg);
			}).catch(function(error) {
				console.log("error");
			});
		}
	});
}



// 爬蟲
// 爬蟲函數
var charaDataCrawler = function(urlPath) {

	// callback
	var requestCallBack = function(error, response, body) {
		if (error || !body)
			{
			console.log(error);
			return null;
		}

		var html = iconv.decode(new Buffer(body, "binary"), "EUC-JP"); // EUC-JP to utf8 // Shift_JIS EUC-JP
		var $ = cheerio.load(html, {decodeEntities: false}); // 載入 body

		var newData = creatCharaData();

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
				newData.data_rarity = $(this).children("table").children("tbody").children("tr").eq(2).children("td").eq(0).text();
				newData.str_name = $(this).children("table").children("tbody").children("tr").eq(2).children("td").eq(1).text();
				newData.data_class = $(this).children("table").children("tbody").children("tr").eq(2).children("td").eq(2).text();
			}

			if ($(this).prev().text().trim() == "アビリティ")
			{
				newData.str_ability = $(this).text().trim().replace(/\s\n/, "\n");
			}

			if ($(this).prev().text().trim() == "覚醒アビリティ")
			{
				newData.str_ability_aw = $(this).text().trim().replace(/\s\n/, "\n");
			}

			if ($(this).prev().text().trim() == "スキル覚醒")
			{
				newData.str_skill = $(this).children("table").children("tbody").children("tr").eq(0).children("td").eq(1).text() + "\n";
				newData.str_skill += $(this).children("table").children("tbody").children("tr").eq(0).children("td").eq(2).text();
				newData.str_skill_aw = $(this).children("table").children("tbody").children("tr").eq(-1).children("td").eq(1).text() + "\n";
				newData.str_skill_aw += $(this).children("table").children("tbody").children("tr").eq(-1).children("td").eq(2).text();
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
var allCharaDataCrawler = function() {
	
	// callback
	var requestCallBack = function(error, response, body) {
		if (error || !body)
			{
			console.log(error);
			return null;
		}

		var html = iconv.decode(new Buffer(body, "binary"), "EUC-JP"); // EUC-JP to utf8 // Shift_JIS EUC-JP
		var $ = cheerio.load(html, {decodeEntities: false}); // 載入 body

		var newData = creatCharaData();

		// 搜尋所有超連結
		$("a").each(function(i, elem) {
			var buffer = $(this).attr("href");
			if(buffer && $(this).parent().is("td")
					&& $(this).prev().prev().children().is("img"))
				{
					//console.log($(this).text());
					// 延遲呼叫腳色爬蟲
					setTimeout(function(){charaDataCrawler(buffer);}, delay * 200);
					delay++;
				}
		});
	}
	request.get("http://seesaawiki.jp/aigis/d/%a5%b4%a1%bc%a5%eb%a5%c9", {encoding: "binary"}, requestCallBack);
	request.get("http://seesaawiki.jp/aigis/d/%a5%b5%a5%d5%a5%a1%a5%a4%a5%a2", {encoding: "binary"}, requestCallBack);
	request.get("http://seesaawiki.jp/aigis/d/%a5%d7%a5%e9%a5%c1%a5%ca", {encoding: "binary"}, requestCallBack);
	request.get("http://seesaawiki.jp/aigis/d/%a5%d6%a5%e9%a5%c3%a5%af", {encoding: "binary"}, requestCallBack);
}
var classDataCrawler = function() {

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
							//console.log();
							var str = $(this).text();
							var i = str.indexOf("\/");
							if (i != -1)
							{
								str = str.substring(0, i);
							}
							// 新增職業資料
							addClassData(str);
						})
					}
			}
		});
	}
	request.get("http://seesaawiki.jp/aigis/d/class_%b6%e1%c0%dc%b7%bf_%cc%dc%bc%a1", {encoding: "binary"}, requestCallBack);
	request.get("http://seesaawiki.jp/aigis/d/class_%b1%f3%b5%f7%ce%a5%b7%bf_%cc%dc%bc%a1", {encoding: "binary"}, requestCallBack);
};
var urlEncode = function(str_utf8) {
	return iconv.encode(str_utf8, "EUC-JP");
}



// 資料庫
var charaDataBase = [];
// 建構資料函數
var creatCharaData = function() {
	var obj = {};
	obj.str_name = "";
	obj.str_nickname = [];
	obj.str_ability = "";
	obj.str_ability_aw = "";
	obj.str_skill = "";
	obj.str_skill_aw = "";

	obj.data_rarity = "";
	obj.data_class = "";

	obj.messageA = function() {
		var string = "";

		string += this.str_name + "\n";

		for(var i = 0; i < this.str_nickname.length; i++) {
			string += this.str_nickname[i] + " ";
		} string += "\n";

		string += str_ability;
		string += str_skill;

		return string;
	};
	obj.messageB = function() {
		var string = "";

		string += str_ability_aw;
		string += str_skill_aw;

		return string;
	};

	return obj;
}
// 檢查資料
var checkCharaData = function(name) {
	for(var i = 0; i < charaDataBase.length; i++) {
		if(charaDataBase[i].str_name == name)
			return true;
	}
	return false;
}
// 儲存資料
var saveCharaDataBase = function() {
	console.log("CharaDataBase save...");

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
	fs.writeFile("charaDataBase.json", json, "utf8", fsCallBack);

	console.log("CharaDataBase saved!");
}
// 讀取資料
var loadCharaDataBase = function() {
	console.log("CharaDataBase load...");

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
				addCharaData(obj[i]);
				count++;
			}
			console.log(count + " CharaData loaded!");
		}
	}
	fs.readFile("CharaDataBase.json", fsCallBack);
}
// 新增資料
var addCharaData = function(newData) {
	console.log("New character data add...");

	if (!checkCharaData(newData.str_name))
	{
		charaDataBase.push(newData);
		console.log("New character " + newData.str_name + " data add complete!");
	}
	else
	{
		console.log("Character " + newData.str_name + " data is existed!");
	}
}
// value to key
var getRarityString = function(str) {
	if   (str == "金")	return "ゴールド";
	else if (str == "藍")	return "サファイア";
	else if (str == "白")	return "プラチナ";
	else if (str == "黑")	return "ブラック";
	else					return "NULL";
}
// 職業資料庫
var classDataBase = [];
// 檢查資料
var checkClassData = function(name) {
	for(var i = 0; i < classDataBase.length; i++) {
		if(classDataBase[i][0] == name)
			return true;
	}
	return false;
}
// 儲存資料
var saveClassDataBase = function() {
	console.log("ClassDataBase save...");

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
	fs.writeFile("ClassDataBase.json", json, "utf8", fsCallBack);

	console.log("ClassDataBase saved!");
}
// 讀取資料
var loadClassDataBase = function() {
	console.log("ClassDataBase load...");

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
var addClassData = function(newClass) {
	console.log("New Class data add...");

	if (!checkClassData(newClass))
	{
		var temp = [newClass];
		classDataBase.push(temp);
		console.log("New Class " + newClass + " add complete!");
	}
	else
	{
		console.log("Class " + newClass + " is existed!");
	}
}















// 進入點 main();

// 讀取資料
loadCharaDataBase();
loadClassDataBase();
// 開始監聽
bot_on();

// 爬蟲: 1min 後更新資料
//setTimeout(function(){classDataCrawler();}, 1 * 60 * 1000);
//setTimeout(function(){allCharaDataCrawler();}, 1 * 60 * 1000);

// 3min 後儲存資料庫
//setTimeout(saveCharaDataBase, 3 * 60 * 1000);
//setTimeout(saveClassDataBase, 3 * 60 * 100);
