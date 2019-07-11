const fs = require('fs');
const path = require('path');

const LineConnect = require('./connect.js');
const line = require('./main.js');
let LINE = new line();

const { Message, OpType } = require('../curve-thrift/line_types');

function createBot(auth) {
	let client = new LineConnect(auth);

	client.startx().then(async (res) => {
		while (true) {
			try {
				ops = await client.fetchOps(res.operation.revision);
			} catch (error) {
				console.log('error', error)
			}
			for (let op in ops) {
				if (ops[op].revision.toString() != -1) {
					res.operation.revision = ops[op].revision;
					LINE.poll(ops[op])
					// console.log(JSON.stringify(ops[op], null, 4));
				}
			}
		}
	});

	return LINE;
}
module.exports = createBot;

line.prototype.newEvent = function (_line, operations) {

	let event = {}

	for (let key in OpType) {
		if (operations.type == OpType[key]) {
			event.type = key;
		}
	}

	switch (event.type) {
		case 'NOTIFIED_ACCEPT_GROUP_INVITATION': {
			event.source = {}
			event.source.userId = operations.param1;
			event.source.type = operations.param1[0] == 'c' ? 'group' : 'room';
		} break;
		case 'RECEIVE_MESSAGE': {
			event.source = {}
			event.source.userId = operations.message._from;
			if (operations.message.to[0] == 'c') {
				event.source.groupId = operations.message.to;
				event.source.type = 'group';
			} else if (operations.message.to[0] == 'r') {
				event.source.roomId = operations.message.to;
				event.source.type = 'room';
			} else {
				event.source.type = 'user';
			}
		} break;
	}

	event.timestamp = Date.now();
	event.message = {};
	event.message.type = operations.message.text ? 'text' : '';
	event.message.id = operations.message.id;
	event.message.text = operations.message.text;

	event.reply = async function (msg) {
		// await this.push(operations.message.to, msg);
		await _line.push(operations.message.to, msg)
	}

	return event;
}
line.prototype.push = async function (to, msg) {
	let message = new Message();
	message.to = to;

	if (Array.isArray(msg)) {
		for (let i in msg) {
			await this.push(to, msg[i]);
		}
		return;
	} else if (typeof (msg) == 'string') {
		return await this._sendMessage(message, msg);

	} else if (msg.type) {
		switch (msg.type) {
			case "text": {
				return await this._sendMessage(message, msg.text);
			} break;

			case "image": {
				return await this._sendImageByUrl(message, msg.originalContentUrl);
			} break;

			case "template": {
				let text = '';
				text += msg.altText + '\n';
				for (let i in msg.template.actions) {
					let action = msg.template.actions[i];
					text += '-> ' + action.label + ': ' + action.uri + '\n';
				}
				return await this._sendMessage(message, text.trim());
			} break;

		}
	}
}
line.prototype.listeners = [];	//[ 'RECEIVE_MESSAGE', [ function() ] ]
line.prototype.on = function (event, listener) {
	// 'message'	->	'RECEIVE_MESSAGE'
	// 'follow'		->	'ADD_FOLLOW'
	// 'unfollow'	->	'DELETE_FOLLOW'
	// 'join'		->	'NOTIFIED_JOIN_CHAT'
	// 'leave'		->	'LEAVE_GROUP' & 'LEAVE_ROOM'

	if (typeof (OpType[event]) == 'undefined') {
		console.log("Unknown event type");
		return;
	}

	if (this.listeners.indexOf(event) == -1) this.listeners[event] = [listener];
	else this.listeners[event].push(listener);
}



global.logToFile = function (fileName, object, dateNow = new Date(Date.now())) {
	let json = JSON.stringify(object, null, 4);

	let timeStr = "_" +
		dateNow.getFullYear() + "-" +
		((dateNow.getMonth() + 1) + "-").padStart(3, "0") +
		(dateNow.getDate() + "-").padStart(3, "0") +
		(dateNow.getHours() + "").padStart(2, "0") +
		(dateNow.getMinutes() + "").padStart(2, "0") +
		(dateNow.getSeconds() + "").padStart(2, "0") +
		(dateNow.getMilliseconds() + "").padStart(4, "0");

	let filePath = "./lineAlpha/logs/" + fileName + timeStr + ".log";
	fs.existsSync(path.dirname(filePath)) ? {} : fs.mkdirSync(path.dirname(filePath), { recursive: true });
	fs.writeFileSync(filePath, json, "utf8")
}