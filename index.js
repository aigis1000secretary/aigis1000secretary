// 初始化
const config = require("./config.js");
const anna = require("./anna.js");
const imgur = require("./imgur.js");
const express = require("./express.js");
const line = require("./line.js");
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
	line.bot.on("memberJoined", async function (event) {
		if (config.switchVar.logRequestToFile && event) {
			let dateNow = new Date(Date.now());
			let path = "line_bot_on_memberJoined/" +
				dateNow.getFullYear() + "-" +
				((dateNow.getMonth() + 1) + "-").padStart(3, "0") +
				(dateNow.getDate() + "-").padStart(3, "0") +
				(dateNow.getHours() + "").padStart(2, "0") +
				(dateNow.getMinutes() + "").padStart(2, "0") +
				(dateNow.getSeconds() + "").padStart(2, "0") +
				(dateNow.getMilliseconds() + "").padStart(4, "0");
			let data = new Buffer.from(JSON.stringify(event, null, 4));

			dbox.fileUpload("webhook/" + path + ".json", data, "add").catch(function (error) { });
		}

		// anna.debugLog(event);
		let userId = !event.source.userId ? config.adminstrator : event.source.userId;	// Line API bug?
		let sourceId =
			event.source.type == "group" ? event.source.groupId :
				event.source.type == "room" ? event.source.roomId : userId;

		// 呼叫定型文
		var result = anna.replyStamp("新人");
		if (result == false) {
			result = await anna.replyAI("anna help", sourceId, userId);
		}
		anna.debugLog(result);
		line.push(sourceId, result);
		return true;
	});// */

	// normal msg
	line.bot.on("message", async function (event) {
		if (config.switchVar.logRequestToFile && event) {
			let dateNow = new Date(Date.now());
			let path = "line_bot_on_message/" +
				dateNow.getFullYear() + "-" +
				((dateNow.getMonth() + 1) + "-").padStart(3, "0") +
				(dateNow.getDate() + "-").padStart(3, "0") +
				(dateNow.getHours() + "").padStart(2, "0") +
				(dateNow.getMinutes() + "").padStart(2, "0") +
				(dateNow.getSeconds() + "").padStart(2, "0") +
				(dateNow.getMilliseconds() + "").padStart(4, "0");
			let data = new Buffer.from(JSON.stringify(event, null, 4));

			dbox.fileUpload("webhook/" + path + ".json", data, "add").catch(function (error) { });
		}
		// anna.debugLog(event);

		// 文字事件
		if (event.message.type == "text") {
			// 取出文字內容
			var msg = event.message.text.trim()
			anna.debugLog(event);
			// get source id
			let userId = !event.source.userId ? config.adminstrator : event.source.userId;	// Line API bug?
			let sourceId =
				event.source.type == "group" ? event.source.groupId :
					event.source.type == "room" ? event.source.roomId : userId;
			if (sourceId[0] != "U") {
				groupDatabase.addData(sourceId, msg.split("\n")[0].trim(), event.timestamp);
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
			if (anna.isAdmin(sourceId)) {
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
				var result = await anna.replyAI(msg, sourceId, userId);
				if (result != false) {
					replyFunc(result);
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

	var callback = async function (tweet_data) {

		for (let i in groupDatabase.data) {
			if (!groupDatabase.data[i].alarm) continue;

			// push text
			await botPush(groupDatabase.data[i].name, tweet_data.text);

			// push image
			if (tweet_data.medias.length <= 0) continue;
			for (let j in tweet_data.medias) {
				let media = tweet_data.medias[j];
				if (media.type == "photo") {
					let imageMsg = line.createImageMsg(media.link, media.link);
					await botPush(groupDatabase.data[i].name, imageMsg);
				}
			}
		}
	}

	if (!config.isLocalHost) {
		twitter.stream.litsen("Aigis1000", "", callback);
	}
}

const timerBotOn = function () {

	var timer = async function () {
		let nd = new Date(Date.now());
		if (nd.getMinutes() < 5) {

			let dayList = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"]
			let str = "";
			str += nd.getFullYear() + "/";
			str += (nd.getMonth() + 1) + "/";
			str += nd.getDate() + " ";
			str += dayList[nd.getDay()] + " ";

			str += nd.getHours() + ":";
			str += nd.getMinutes() + ":";
			str += nd.getSeconds();

			botPushLog(str);
			await sleep(2 * 60 * 1000);
		}
		setTimeout(timer, 3 * 60 * 1000);
	};
	timer();
}



const main = async function () {
	express.init();

	// 讀取資料
	await Promise.all([
		anna.init(),
		imgur.init()
	]);

	// 開始監聽
	await groupDatabase.init();
	lineBotOn();
	twitterBotOn();
	timerBotOn();

	console.log("=====*****Anna secretary online*****=====");
	botPushLog("Anna secretary online");

}; main();



/*
const debugFunc = async function () {
	let sourceId = "U9eefeba8c0e5f8ee369730c4f983346b";
	let userId = "U9eefeba8c0e5f8ee369730c4f983346b";
	var replyFunc = function (str) { console.log(">>" + str + "<<"); return str != "" && str && str != "undefined" };
	config.switchVar.debug = true;

}



// Test function
setTimeout(debugFunc, 5 * 1000);// */















