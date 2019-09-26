
const fs = require('fs');
const path = require('path');
const fetch = require('isomorphic-fetch');
const Dropbox = require('dropbox').Dropbox;
const config = require("./config.js");
const dbox = new Dropbox({
    fetch: fetch,
    accessToken: config.dropbox.DROPBOX_ACCESS_TOKEN
});
const root = config.dropbox.DROPBOX_ROOT;

module.exports = {
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
            console.log("makeDir error... " + path);
            throw error;
        }
    },
    // LS
    listDir: async function (dirPath, filter) {
        try {
            let result = [];
            let response = await dbox.filesListFolder({ path: root + dirPath });
            //console.log(response);

            for (let i = 0; i < response.entries.length; ++i) {
                //result.push(response.entries[i].name + ", " + response.entries[i][".tag"]); continue;
                if (!filter) {
                    result.push(response.entries[i].name)
                } else if (filter == response.entries[i][".tag"]) {
                    result.push(response.entries[i].name)
                }
            }

            return result;
        } catch (error) {
            console.log("listDir error... ");
            console.log(error);
            return [];
        }
    },

    // download
    fileDownloadToFile: async function (base, localPath) {
        try {
            let onlinePath = path.format({ root, base });
            if (!localPath) localPath = "." + path.normalize(onlinePath);

            let parse = path.parse(localPath);
            let folderPath = parse.root + parse.dir;
            if (!fs.existsSync(folderPath)) { fs.mkdirSync(folderPath, { recursive: true }); }

            let response = await dbox.filesDownload({ path: onlinePath });
            fs.writeFileSync(localPath, response.fileBinary, { encoding: "Binary" });

            return true;
        } catch (error) {
            console.log("fileDownloadToFile error... " + base);
            throw error;
        }
    },
    //fileDownloadToFile("刻詠の風水士リンネ/6230667.png");
    fileDownload: async function (base) {
        try {
            let onlinePath = path.format({ root, base });
            let response = await dbox.filesDownload({ path: onlinePath });
            return response.fileBinary;

        } catch (error) {
            console.log("fileDownload error... " + base);
            throw error;
        }
    },

    // upload
    fileUpload: async function (dirPath, fileBinary, mode) {
        let filesCommitInfo = {
            path: root + dirPath,
            contents: fileBinary,
            mode: { ".tag": (mode || "overwrite") },
            autorename: false,
            mute: true
        };

        try {
            await dbox.filesUpload(filesCommitInfo);
            return true;
        } catch (error) {
            console.log("fileUpload error... " + dirPath);
            throw error;
        }
    },

    // move
    fileBackup: async function (dirPath) {
        let filesRelocationArg = {
            from_path: root + dirPath,
            to_path: root + "backup/" + dirPath,
            allow_shared_folder: true,
            autorename: true,
            allow_ownership_transfer: true
        };
        // let filesDeleteArg = {
        // 	path: root + dirPath
        // };

        try {
            await dbox.filesCopy(filesRelocationArg);
            // await dbox.filesDelete(filesDeleteArg);
            return true;
        } catch (error) {
            console.log("fileBackup error... " + dirPath);
            throw error;
        }
    },

    // move
    fileMove: async function (from, to) {
        let filesRelocationArg = {
            from_path: root + from,
            to_path: root + to,
            allow_shared_folder: false,
            autorename: false,
            allow_ownership_transfer: false
        };
        let filesDeleteArg = {
            path: root + from
        };

        try {
            await dbox.filesCopy(filesRelocationArg);
            await dbox.filesDelete(filesDeleteArg);
            return true;
        } catch (error) {
            console.log("filesMove error... " + from);
            throw error;
        }
    },

    // delete
    fileDelete: async function (path) {
        console.log("filesDelete: " + path);
        try {
            await dbox.filesDelete({ path: root + path });
            return true;
        } catch (error) {
            console.log("filesDelete error... " + path);
            throw error;
        }
    },

    // 
    logToFile: function (base, name, data) {
        let dateNow = new Date(Date.now());
        let path = (dateNow.getMonth() + 1).toString().padStart(2, "0") + "/" + name + "_" +
            dateNow.getFullYear().toString().padStart(4, "0") + "-" +
            (dateNow.getMonth() + 1).toString().padStart(2, "0") + "-" +
            dateNow.getDate().toString().padStart(2, "0") + "-" +
            dateNow.getHours().toString().padStart(2, "0") +
            dateNow.getMinutes().toString().padStart(2, "0") +
            dateNow.getSeconds().toString().padStart(2, "0") +
            dateNow.getMilliseconds().toString().padStart(4, "0");

        let binary = Buffer.from(JSON.stringify(data, null, 4))
        try {
            module.exports.fileUpload(base + path + ".json", binary, "add").catch(console.log);
        } catch (error) {
            console.log("logToFile error... " + error);
        }
    },

};


/*
const debugFunc = function() {

	dboxCore.listDir("").then(function(obj){console.log(obj);});

}
setTimeout(debugFunc, 1 * 1000);*/

