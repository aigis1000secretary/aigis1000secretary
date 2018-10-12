
// todo
/*
	工具超連結
	自動貼圖
*/

// commit
/*
	push 測試 ok
	搜尋附圖功能上線
	wiki 超連結上線
	忘記暱稱
*/

// 初始化
const anna = require("./anna.js");
const express = require("express");
// line bot
const linebot = require("linebot");

// line bot
// 登入參數
const bot = linebot({
	channelId: 1612493892,
	channelSecret: "ea71aeca4c54c6aa270df537fbab3ee3",
	channelAccessToken: "GMunTSrUWF1vRwdNxegvepxHEQWgyaMypbtyPluxqMxoTqq8QEGJWChetLPvlV0DJrY4fvphSUT58vjVQVLhndlfk2JKQ/sbzT6teG1qUUUEVpVfqs5KGzzn3NUngYMw9/lvvU0QZVGBqPS6wKVxrQdB04t89/1O/w1cDnyilFU="
});
const app = express();
const linebotParser = bot.parser();
app.post("/", linebotParser);
//因為 express 預設走 port 3000，而 heroku 上預設卻不是，要透過下列程式轉換
const server = app.listen(process.env.PORT || 8080, function() {
	var port = server.address().port;
	console.log("App now running on port", port);
});

// bot監聽
const bot_on = function() {
	bot.on("message", function(event) {
		
		if (event.message.type == "text") {
			if (anna._debug())	console.log(event);
			var msg = event.message.text;

			// repply
			var replyFunc = function(rMsg) {
				event.reply(rMsg)
				.then(function(data) {
					if (anna._debug())	console.log(data);
				})
				.catch(function(error) {
					if (anna._debug())	console.log(error);
				});
			};
			
			if (msg == "安娜")
			{
				replyFunc("是的！王子？");
			}
			else if (msg.toUpperCase().indexOf("DEBUG") != -1)
			{
				// 身分驗證
				if (event.source.type == "user" && 
				event.source.userId == "U9eefeba8c0e5f8ee369730c4f983346b")
				
				var replyMsg = anna.searchData("ANNA DEBUG", replyFunc);
				//replyFunc(replyMsg);
			}
			else if (msg.toUpperCase().indexOf("ANNA ") == 0 || msg.indexOf("安娜 ") == 0)
			{
				// 判讀指令
				var replyMsg = anna.searchData(msg, replyFunc);
				// 檢查回覆內容
				//if (typeof(replyMsg) == "undefined" && replyMsg != [] && replyMsg != "")
					//replyFunc(replyMsg);
			}
			
			// 無視...
			//if (_debug) console.log("Not a command");
			//return "";
			
			if (Math.floor(Math.random() * 10000) == 0)
				replyFunc("ちくわ大明神");
		}
	});
}





// 讀取資料
anna.loadClassDataBase();
anna.loadCharaDataBase();
// 開始監聽
bot_on();





/*
const debugFunc = function() {
}



// Test function
setTimeout(debugFunc, 1 * 1000);*/















