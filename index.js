
// todo
/*
	工具超連結
*/

// commit
/*
0.3.0 更換圖床 Imgur
      程式碼重構&格式整理
*/

// 初始化
const anna = require("./anna.js");
const imgur = require("./imgur.js");
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
const server = app.listen(process.env.PORT || 8080, function() {
	//因為 express 預設走 port 3000，而 heroku 上預設卻不是，要透過下列程式轉換
	let port = server.address().port;
	console.log("App now running on port", port);
});

// bot監聽
const bot_on = function() {
	bot.on("message", function(event) {

		// 文字事件
		if (event.message.type == "text") {
			if (anna._debug())	console.log(event);
			// 取出文字內容
			var msg = event.message.text;

			// reply
			var replyFunc = function(rMsg) {
				if (anna._debug())	console.log(data);
				event.reply(rMsg)
				.then(function(data) {
					if (anna._debug())	console.log(data);
				})
				.catch(function(error) {
					if (anna._debug())	console.log(error);
				});
			};

			if (msg == "安娜") {

				replyFunc("是的！王子？");
				return;

			} else if (msg.toUpperCase().indexOf("DEBUG") != -1) {

				// 身分驗證
				if (event.source.type == "user" &&
				event.source.userId == "U9eefeba8c0e5f8ee369730c4f983346b")

				anna.searchDataAndReply("ANNA DEBUG", replyFunc);
				return;

			} else if (msg.toUpperCase().indexOf("ANNA ") == 0 || msg.indexOf("安娜 ") == 0) {

				// 判讀指令
				anna.searchDataAndReply(msg, replyFunc);
				return;

			}

			// 呼叫定型文
			if (anna.stampReply(msg, replyFunc)) {
				return;
			}

			if (Math.floor(Math.random() * 10000) == 0) {
				replyFunc("ちくわ大明神");
				return;
			}

			// 無視...
			//if (_debug) console.log("Not a command");
			//return "";
		}
	});
}



const main = async function() {
	// 讀取資料
	let p1 = anna.init();
	let p2 = imgur.init();
	await Promise.all([p1, p2]);

	// 開始監聽
	bot_on();
	console.log("Anna secretary online");
};main();



/*
const debugFunc = function() {
	anna.stampCommand("anna debug", function(obj) {console.log(obj)});


	var sendMsg = [];
	sendMsg.push({
		type: "image",
		originalContentUrl: 'https://i.imgur.com/NX3tRXx.jpg',
		previewImageUrl: 'https://i.imgur.com/NX3tRXx.jpg'
	});
	//bot.push('U9eefeba8c0e5f8ee369730c4f983346b', sendMsg);
	bot.push('C576ad7f8e2d943f7a6f07d043391dab3', sendMsg);

	anna.searchData("安娜 帝国猟兵レーゼル", function(obj) {console.log(obj)});

}



// Test function
setTimeout(debugFunc, 3 * 1000);*/















