
// todo
/*
	搜索職業函數化
*/

// commit
/*
	0.5.1.3
	updata complete message
*/

// 初始化
const anna = require("./anna.js");
const imgur = require("./imgur.js");
const express = require("express");

// line bot
const linebot = require("linebot");
// 登入參數
const bot = linebot({
	channelId: 1612493892,
	channelSecret: "ea71aeca4c54c6aa270df537fbab3ee3",
	channelAccessToken: "GMunTSrUWF1vRwdNxegvepxHEQWgyaMypbtyPluxqMxoTqq8QEGJWChetLPvlV0DJrY4fvphSUT58vjVQVLhndlfk2JKQ/sbzT6teG1qUUUEVpVfqs5KGzzn3NUngYMw9/lvvU0QZVGBqPS6wKVxrQdB04t89/1O/w1cDnyilFU="
});
const app = express();
const linebotParser = bot.parser();
app.post("/", linebotParser);
const server = app.listen(process.env.PORT || 8080, function () {
	//因為 express 預設走 port 3000，而 heroku 上預設卻不是，要透過下列程式轉換
	let port = server.address().port;
	console.log("App now running on port", port);
});
const adminstrator = ["U9eefeba8c0e5f8ee369730c4f983346b"];
// remote system
let botMode = "anna";
let remoteTarget = "";
let remoteTargetList = [];
let remoter = "";

// bot監聽
const bot_on = function () {

	// wellcome msg
	bot.on("memberJoined", function (event) {
		anna.debugLog(event);
		// push
		var pushFunc = function (pMsg) {
			anna.debugLog(pMsg);

			if (event.source.type == "group") {
				bot.push(event.source.groupId, pMsg);
			} else if (event.source.type == "room") {
				bot.push(event.source.roomId, pMsg);
			}
		};
		// 呼叫定型文
		if (anna.replyStamp("新人", pushFunc)) {
			return;
		}

	});

	// normal msg
	bot.on("message", async function (event) {
		anna.debugLog(event);

		// 文字事件
		if (event.message.type == "text") {
			// 取出文字內容
			var msg = event.message.text.trim()
			// get source id
			let userId = typeof (event.source.userId) == "undefined" ? adminstrator[0] : event.source.userId;
			anna.debugLog(msg);
			// define reply function
			var replyFunc = function (rMsg) {
				anna.debugLog(rMsg);
				event.reply(rMsg)
					.then(function (data) {
						anna.debugLog(data);
					})
					.catch(function (error) {
						anna.debugLog(error);
					});
			};


			// remote system
			await event.source.profile().then(function (profile) {
				remoteTargetList[userId] = profile.displayName;
				if (event.source.type == "group") {
					remoteTargetList[event.source.groupId] = msg.split("\n");
				} else if (event.source.type == "room") {
					remoteTargetList[event.source.roomId] = msg.split("\n");
				}
			}).catch(function (error) {
				anna.debugLog(error);
			});

			if (adminstrator.indexOf(userId) != -1) {
				if (msg == "remote") {
					// sort by ID
					let keyList = [];
					for (let key in remoteTargetList) {
						keyList.push(key);
					}
					keyList.sort(function (A, B) {
						return A.localeCompare(B);
					});

					for (let i in keyList) {
						let key = keyList[i];
						let str = key + ":\n\t" + remoteTargetList[key];
						console.log(str);
						await bot.push(userId, str);
					}
					return;

				} else if (msg == "remote off") {
					botMode = "anna";
					remoteTarget = "";
					remoter = "";
					replyFunc("remote off");
					return;

				} else if (msg.indexOf("remote ") == 0) {
					let _target = msg.split(" ")[1];
					for (let uID in remoteTargetList) {
						if (remoteTargetList[uID].indexOf(_target) != -1 || _target == uID) {
							botMode = "remote";
							remoteTarget = uID;
							remoter = userId;
							replyFunc("remote on " + remoteTargetList[uID]);
							break;
						}
					}
					return;
				}
			}
			// remote mode
			if (botMode == "remote") {
				if (event.source.type == "user") {
					if (userId == remoter) {
						bot.push(remoteTarget, msg);
						return;
					} else if (userId == remoteTarget) {
						bot.push(remoter, msg);
						return;
					}
				} else if (event.source.groupId == remoteTarget || event.source.roomId == remoteTarget) {
					bot.push(remoter, remoteTargetList[userId] + ": " + msg);
					return;
				}
			}

			// bot mode
			if (botMode == "anna") {
				// normal response
				if (msg == "安娜") {
					replyFunc("是的！王子？");
					return;
				}

				// 身分驗證
				if (adminstrator.indexOf(userId) == -1) {
					if (msg.toUpperCase().indexOf("DEBUG") != -1) {
						msg = "";
					}
				} else if (adminstrator.indexOf(userId) == 0) {
					if (msg.toUpperCase().indexOf("我婆") != -1) {
						msg = "刻詠の風水士リンネ";
					}
				}

				// in user chat
				if (event.source.type == "user" && msg.toUpperCase().indexOf("ANNA ") == -1 && msg.indexOf("安娜 ") == -1) {
					msg = "ANNA " + msg;
				}

				// normal auto-response
				if (msg.toUpperCase().indexOf("ANNA ") == 0 || msg.indexOf("安娜 ") == 0) {
					// 判讀指令
					anna.replyAI(msg, replyFunc);
					return;
				}

				// 呼叫定型文圖片
				if (anna.replyStamp(msg, replyFunc)) {
					return;
				}

				// egg
				if (Math.floor(Math.random() * 10000) == 0) {
					replyFunc("ちくわ大明神");
					return;
				}

				// 無視...
				anna.debugLog("Not a command");
				return;
			}

		}
	});
}



const main = async function () {
	// 讀取資料
	let p1 = anna.init();
	let p2 = imgur.init();
	await Promise.all([p1, p2]);

	// 開始監聽
	bot_on();
	console.log("=====*****Anna secretary online*****=====");
}; main();



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















