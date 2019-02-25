
// todo
/*
*/

// commit
/*
	0.6.5.0
	Database 物件化
*/

// 初始化
const anna = require("./anna.js");
const imgur = require("./imgur.js");
const express = require("./express.js");

const line = require("./line.js");
const botPush = line.botPush;
const botPushLog = line.botPushLog;

const twitter = require("./twitter.js");

// remote system
let botMode = "anna";
let remoteTarget = "";
let remoter = "";
// groupDatabase
const database = require("./database.js");
var groupDatabase = database.groupDatabase;



// line bot 監聽
const lineBotOn = function () {

	// wellcome msg
	/*bot.on("memberJoined", function (event) {
		// anna.debugLog(event);
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
	});// */

	// normal msg
	line.bot.on("message", async function (event) {
		// anna.debugLog(event);

		// 文字事件
		if (event.message.type == "text") {
			// 取出文字內容
			var msg = event.message.text.trim()
			anna.debugLog(msg);
			// get source id
			let userId = !event.source.userId ? anna.adminstrator : event.source.userId;	// Line API bug?
			let sourceId =
				event.source.type == "group" ? event.source.groupId :
					event.source.type == "room" ? event.source.roomId : userId;
			if (sourceId[0] != "U") {
				groupDatabase.addData(sourceId, msg.split("\n")[0].trim());
			}

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
				return true;
			};

			// remote func
			if (anna.isAdmin(userId)) {
				if (msg == "remote") {
					// list group
					for (let i in groupDatabase.data) {
						let groupId = groupDatabase.data[i].name;
						let text = groupDatabase.data[i].text;

						let str = groupId + " :\n\t" + text;
						console.log(str);
						await botPush(userId, str);

					}
					return;

				} else if (msg == "remote off") {
					botMode = "anna";
					remoteTarget = "";
					remoter = "";
					replyFunc("remote off");
					return;

				} else if (msg.indexOf("remote ") == 0) {
					let target = msg.split(" ")[1];
					let i = groupDatabase.indexOf(target);
					if (i != -1) {
						botMode = "remote";
						remoteTarget = groupDatabase.data[i].name;
						remoter = userId;
						replyFunc("remote on " + groupDatabase.data[i].text);
					}
					return;
				}
			}
			// remote mode
			if (botMode == "remote") {
				if (sourceId == remoteTarget) {
					botPush(remoter, msg);
					return;
				} else if (sourceId == remoter) {
					botPush(remoteTarget, msg);
					return;
				}
			}

			// bot mode
			// if (botMode == "anna") {
			if (sourceId != remoter && sourceId != remoteTarget) {
				// normal response
				if (msg == "安娜") {
					replyFunc("是的！王子？");
					return;
				}
				// 身分驗證
				if (userId == "U9eefeba8c0e5f8ee369730c4f983346b") {
					if (msg == "我婆") {
						msg = "刻詠の風水士リンネ";
					}
				}
				// in user chat
				if (event.source.type == "user" && msg.toUpperCase().indexOf("ANNA ") == -1 && msg.indexOf("安娜 ") == -1) {
					msg = "ANNA " + msg;
				}

				// 				
				if (anna.replyAI(msg, userId, replyFunc)) {
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
// twitter bot 監聽
const twitterBotOn = function () {

	var callback = function (tweet_data) {
		// 送信する情報の定義
		// var tweet_data = {
		// 	screen_name: data.user.screen_name,
		// 	created_at: data.created_at,
		// 	text: data.text,
		// 	geo: data.geo,
		// };

		if (tweet_data.screen_name == "Aigis1000") {
			botPushLog(tweet_data.text);
		} else if (tweet_data.screen_name == "Aigis1000Anna") {
			botPushLog("@" + tweet_data.text);
		}
	}

	twitter.get("Aigis1000", callback);
}



const main = async function () {
	express.init();

	// 讀取資料
	let pArray = [];
	pArray.push(anna.init());
	pArray.push(imgur.init());
	await Promise.all(pArray);

	// 開始監聽
	await groupDatabase.init();
	lineBotOn();
	twitterBotOn();

	console.log("=====*****Anna secretary online*****=====");
	botPushLog("Anna secretary online");
}; main();



/*
const debugFunc = async function () {
	let userId = "U9eefeba8c0e5f8ee369730c4f983346b";
	var replyFunc = function (str) { console.log(">>" + str + "<<"); return str != "" && str && str != "undefined" };
	anna.debug = true;

	// anna.replyAI("anna UPLOAD", userId, replyFunc);
	// anna.replyAI("anna 學習 NNLK:黑弓", userId, replyFunc);
	anna.replyAI("anna 黑弓", userId, replyFunc);
	//anna.replyAI("anna 狀態", userId, replyFunc);
	// anna.replyAI("anna 學習 あて：酒吞童子", userId, replyFunc);
	//anna.replyAI("anna 學習 V武王：一途な武王姫アリス", userId, replyFunc);
	// anna.replyAI("anna 忘記 あて ：酒吞童子", userId, replyFunc);

}
// sleep
const sleep = function (ms) {
	return new Promise(resolve => setTimeout(resolve, ms))
}



// Test function
setTimeout(debugFunc, 5 * 1000);// */















