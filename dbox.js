const fetch = require('isomorphic-fetch');
const Dropbox = require('dropbox').Dropbox;
const dbox = new Dropbox({
	fetch: fetch,
	accessToken: 'UOrWCnsUR3AAAAAAAAAIrYde0tdaFqjsTny15tb_ip-nCpnKdlvKYl7iRNe5vtru'
});
const fs = require("fs");

const root = "/應用程式/updog/aigis1000secretary/";
// const rootUrl = "https://aigis1000secretary.updog.co/";
// https://aigis1000secretary.updog.co/%E5%88%BB%E8%A9%A0%E3%81%AE%E9%A2%A8%E6%B0%B4%E5%A3%AB%E3%83%AA%E3%83%B3%E3%83%8D/6230667.png
// https://aigis1000secretary.updog.co/刻詠の風水士リンネ/6230667.png
// 應用程式/updog/aigis1000secretary/刻詠の風水士リンネ?preview=6230667.png

module.exports = {
	core: dbox,
	root: root,

	// MD
	makeDir: function (path) {
		dbox.filesCreateFolder({ path: root + path, autorename: false })
			.then(function (response) {
				//console.log(response);
				return true;
			})
			.catch(function (error) {
				console.log(error);
				return false;
			});
	},

	// LS
	listDir: function (dirPath, filter) {
		return new Promise(function (resolve, reject) {

			var result = [];
			dbox.filesListFolder({ path: root + dirPath })
				.then(function (response) {
					//console.log(response);
					for (let i = 0; i < response.entries.length; i++) {
						//result.push(response.entries[i].name + ", " + response.entries[i][".tag"]); continue;
						if (typeof (filter) == "undefined") {
							result.push(response.entries[i].name)

						} else if (filter == response.entries[i][".tag"]) {
							result.push(response.entries[i].name)
						}
					}
					resolve(result);
				})
				.catch(function (error) {
					//console.log(error);
					resolve([]);
				});
		});
	},
	//listDir("").then(function(obj){console.log(obj);});

	// download
	fileDownload: function (dirPath, localPath) {
		if (typeof (localPath) == "undefined") localPath = dirPath;

		dbox.filesDownload({ path: root + dirPath })
			.then(function (response) {
				//console.log(response);

				// callback
				var fsCallBack = function (error, bytesRead, buffer) {
					if (error) {
						console.log(error);
						return;
					}
				}
				// binart to file
				fs.writeFile(localPath, response.fileBinary, "Binary", fsCallBack);
			})
			.catch(function (error) {
				console.log(error);
			});
	},
	//fileDownload("刻詠の風水士リンネ/6230667.png", "6230667.png");


	// upload
	fileUpload: function (dirPath, fileBinary) {
		var filesCommitInfo = {
			path: root + dirPath,
			contents: fileBinary,
			mode: "add",
			autorename: true,
			mute: true
		};
		dbox.filesUpload(filesCommitInfo)
			.then(function (response) {
				//console.log(response);
			})
			.catch(function (error) {
				console.log(error);
			});
	},
};





/*
const debugFunc = function() {

	module.exports.listDir("").then(function(obj){console.log(obj);});

}
setTimeout(debugFunc, 1 * 1000);*/

