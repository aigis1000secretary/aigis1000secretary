
// todo
/*
*/

// commit
/*
	0.6.1.2
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
// remote system
let botMode = "anna";
let remoteTarget = "";
let remoter = "";
// groupDataBase
const database = require("./database.js");
var groupDataBase = database.createNewDataBase("GroupDataBase");
groupDataBase.newData = function () {
	var obj = {};
	obj.name = "";
	obj.text = "";
	obj.alarm = "";

	return obj;
}
// 新增資料
const addGroupData = function (groupId, text) {
	if (groupId == "" || text == "") return;

	if (groupDataBase.indexOf(groupId) == -1) {
		var newData = groupDataBase.newData();
		newData.name = groupId;
		newData.text = text;
		newData.alarm = true;
		groupDataBase.data.push(newData);

		// sort
		groupDataBase.data.sort(function (A, B) {
			return A.name.localeCompare(B.name)
		})
		groupDataBase.uploadTask();
	}
}


// bot監聽
const bot_on = function () {

	// wellcome msg
	/*bot.on("memberJoined", function (event) {
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
	});//*/

	// normal msg
	bot.on("message", async function (event) {
		anna.debugLog(event);

		// 文字事件
		if (event.message.type == "text") {
			// 取出文字內容
			var msg = event.message.text.trim()
			anna.debugLog(msg);
			// get source id
			let userId = typeof (event.source.userId) == "undefined" ? anna.adminstrator : event.source.userId;	// Line API bug?
			let sourceId =
				event.source.type == "group" ? event.source.groupId :
					event.source.type == "room" ? event.source.roomId : userId;
			if (sourceId[0] != "U") {
				addGroupData(sourceId, msg.split("\n")[0].trim());
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
					for (let i in groupDataBase.data) {
						let groupId = groupDataBase.data[i].name;
						let text = groupDataBase.data[i].text;

						let str = groupId + " :\n\t" + text;
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
					let target = msg.split(" ")[1];
					let i = groupDataBase.indexOf(target);
					if (i != -1) {
						botMode = "remote";
						remoteTarget = groupDataBase.data[i].name;
						remoter = userId;
						replyFunc("remote on " + groupDataBase.data[i].text);
					}
					return;
				}
			}
			// remote mode
			if (botMode == "remote") {
				if (sourceId == remoteTarget) {
					bot.push(remoter, msg);
					return;
				} else if (sourceId == remoter) {
					bot.push(remoteTarget, msg);
					return;
				}
			}

			// bot mode
			//if (botMode == "anna") {
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

/*
function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms))
}
const request = require("request");
const fs = require("fs");
const hotfix = async function (object) {
	await new Promise(function (resolve, reject) {
		request.get("http://36.225.136.202:26080/hotfix_src.js")
			.pipe(fs.createWriteStream('hotfix.js').on('finish', resolve));
	});

	let hoitfixTest = require("./hotfix.js");
	hoitfixTest(object);
	delete require.cache[require.resolve("./hotfix.js")]
}*/



const main = async function () {
	// 讀取資料
	let pArray = [];
	pArray.push(anna.init());
	pArray.push(imgur.init());
	await Promise.all(pArray);

	// 開始監聽
	bot_on();
	console.log("=====*****Anna secretary online*****=====");
	bot.push(anna.debugLogger, "Anna secretary online");
}; main();




const debugFunc = async function () {
	let userId = "U9eefeba8c0e5f8ee369730c4f983346b";
	var replyFunc = function (str) { console.log(">>" + str + "<<"); return str != "" && typeof (str) != "undefined" && str != "undefined" };
	//anna.debug = true;

	//anna.replyAI("anna UPLOAD", userId, replyFunc);
	//anna.replyAI("anna 學習 NNLK:黑弓", userId, replyFunc);
	//anna.replyAI("anna 黑弓", userId, replyFunc);
	anna.replyAI("anna debug", userId, replyFunc);
	//await sleep(1000);

}



// Test function
setTimeout(debugFunc, 5 * 1000);//*/















