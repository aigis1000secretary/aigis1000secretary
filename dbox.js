const fetch = require('isomorphic-fetch');
const fs = require("fs");
const Dropbox = require('dropbox').Dropbox;
const dbox = new Dropbox({
	fetch: fetch,
	accessToken: 'UOrWCnsUR3AAAAAAAAAIrYde0tdaFqjsTny15tb_ip-nCpnKdlvKYl7iRNe5vtru'
});
const root = "/應用程式/updog/aigis1000secretary/";

var dboxCore = {}
// const rootUrl = "https://aigis1000secretary.updog.co/";
// https://aigis1000secretary.updog.co/%E5%88%BB%E8%A9%A0%E3%81%AE%E9%A2%A8%E6%B0%B4%E5%A3%AB%E3%83%AA%E3%83%B3%E3%83%8D/6230667.png
// https://aigis1000secretary.updog.co/刻詠の風水士リンネ/6230667.png
// 應用程式/updog/aigis1000secretary/刻詠の風水士リンネ?preview=6230667.png


module.exports = dboxCore;

dboxCore.core = dbox;
dboxCore.root = root;


// MD
dboxCore.makeDir = async function (path) {
	try {
		let response = await dbox.filesCreateFolder({ path: root + path, autorename: false });
		//console.log(response);
		return true;
	} catch (error) {
		//console.log(error);
		return Promise.reject(error);
	}
};
// LS
dboxCore.listDir = async function (dirPath, filter) {
	try {
		var result = [];
		let response = await dbox.filesListFolder({ path: root + dirPath });
		//console.log(response);

		for (let i = 0; i < response.entries.length; i++) {
			//result.push(response.entries[i].name + ", " + response.entries[i][".tag"]); continue;
			if (!filter) {
				result.push(response.entries[i].name)
			} else if (filter == response.entries[i][".tag"]) {
				result.push(response.entries[i].name)
			}
		}

		return result;
	} catch (error) {
		//console.log(error);
		return Promise.reject(error);
	}
};
//listDir("").then(function(obj){console.log(obj);});


// download
dboxCore.fileDownload = async function (dirPath, localPath) {
	if (!localPath) localPath = dirPath;

	try {
		let response = await dbox.filesDownload({ path: root + dirPath })
		await asyncSaveFile(localPath, response.fileBinary, "Binary");

	} catch (error) {
		//console.log(error);
		return Promise.reject(error);
	}
};
//fileDownload("刻詠の風水士リンネ/6230667.png", "6230667.png");


// upload
dboxCore.fileUpload = async function (dirPath, fileBinary) {
	var filesCommitInfo = {
		path: root + dirPath,
		contents: fileBinary,
		mode: { ".tag": "overwrite" },
		autorename: false,
		mute: true
	};

	try {
		await dbox.filesUpload(filesCommitInfo);

	} catch (error) {
		//console.log(error);
		return Promise.reject(error);
	}
};


// move
dboxCore.filesBackup = async function (dirPath) {
	var filesRelocationArg = {
		from_path: root + dirPath,
		to_path: root + "backup/" + dirPath,
		allow_shared_folder: true,
		autorename: true,
		allow_ownership_transfer: true
	};
	// var filesDeleteArg = {
	// 	path: root + dirPath
	// };

	try {
		await dbox.filesCopy(filesRelocationArg);
		// await dbox.filesDelete(filesDeleteArg);

	} catch (error) {
		// console.log(error);
		return Promise.reject(error);
	}
};


// json to file
const asyncSaveFile = function (filePath, data, options) {
	if (!options) options = "utf8";
	return new Promise(function (resolve, reject) {
		fs.writeFile(filePath, data, options, function (err, bytesRead, buffer) {
			if (err) {
				reject(err);
			} else {
				resolve("");
			}
		});
	});
};




/*
const debugFunc = function() {

	module.exports.listDir("").then(function(obj){console.log(obj);});

}
setTimeout(debugFunc, 1 * 1000);*/

