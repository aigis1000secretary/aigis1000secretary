const LineConnect = require('./connect.js');
let line = require('./main.js');
let LINE = new line();

const fs = require("fs");
let auth = fs.existsSync('./lineAlpha/auth.js') ? require('./auth.js') : { authToken: '', certificate: '', ID: '', email: '', password: '' };


let client = new LineConnect(auth);

client.startx().then(async (res) => {

	console.log("=====*****Anna secretary online*****=====");

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

String.prototype.equali = function (s1) {
	let source = this;
	if (!s1) s1 = "";
	return (source.toUpperCase().trim() == s1.toUpperCase().trim());
}

// sleep
global.sleep = function (ms) {
	return new Promise(resolve => setTimeout(resolve, ms))
}
asyncWriteFile = function (filePath, data, options = "utf8") {
	return new Promise(function (resolve, reject) {
		try {
			let path = filePath.substring(0, filePath.lastIndexOf("\\"));

			if (path.indexOf("\\") != -1 && !fs.existsSync(path)) {
				fs.mkdirSync(path, { recursive: true });
			}

			// fs.writeFileSync(filePath, data, options);
			// resolve();
			fs.writeFile(filePath, data, options, function (err, bytesRead, buffer) {
				if (err) {
					reject(err);
				} else {
					resolve();
				}
			});

		} catch (err) {
			reject(err);
		}
	});
};
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

	// asyncWriteFile("logs/" + fileName + timeStr + ".log", json);
}