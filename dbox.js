const fetch = require('isomorphic-fetch');
const fs = require("fs");
const Dropbox = require('dropbox').Dropbox;
const config = require("./config.js");
const dbox = new Dropbox({
	fetch: fetch,
	accessToken: config.dropbox.DROPBOX_ACCESS_TOKEN
});
const root = config.dropbox.DROPBOX_ROOT;

var dboxCore = {
	// const rootUrl = "https://aigis1000secretary.updog.co/";
	// https://aigis1000secretary.updog.co/%E5%88%BB%E8%A9%A0%E3%81%AE%E9%A2%A8%E6%B0%B4%E5%A3%AB%E3%83%AA%E3%83%B3%E3%83%8D/6230667.png
	// https://aigis1000secretary.updog.co/刻詠の風水士リンネ/6230667.png
	// 應用程式/updog/aigis1000secretary/刻詠の風水士リンネ?preview=6230667.png

	// MD
	makeDir: async function (path) {
		try {
			let response = await dbox.filesCreateFolder({ path: root + path, autorename: false });
			//console.log(response);
			return true;
		} catch (error) {
			//console.log(error);
			return Promise.reject(error);
		}
	},
	// LS
	listDir: async function (dirPath, filter) {
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
	},

	// download
	fileDownloadToFile: async function (dirPath, localPath) {
		if (!localPath) localPath = dirPath;

		try {
			let response = await dbox.filesDownload({ path: root + dirPath })
			await asyncSaveFile(localPath, response.fileBinary, "Binary");

		} catch (error) {
			//console.log(error);
			return Promise.reject(error);
		}
	},
	//fileDownloadToFile("刻詠の風水士リンネ/6230667.png", "6230667.png");
	fileDownload: async function (dirPath) {
		try {
			let response = await dbox.filesDownload({ path: root + dirPath })
			return response.fileBinary;

		} catch (error) {
			//console.log(error);
			return Promise.reject(error);
		}
	},


	// upload
	fileUpload: async function (dirPath, fileBinary, mode) {
		var filesCommitInfo = {
			path: root + dirPath,
			contents: fileBinary,
			mode: { ".tag": ((mode) ? mode : "overwrite") },
			autorename: false,
			mute: true
		};

		try {
			await dbox.filesUpload(filesCommitInfo);

		} catch (error) {
			//console.log(error);
			return Promise.reject(error);
		}
	},

	// move
	filesBackup: async function (dirPath) {
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
	},

}; module.exports = dboxCore

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

