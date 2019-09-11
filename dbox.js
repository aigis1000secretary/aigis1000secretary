
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
            console.log(error);
            return false;
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
            console.log(error);
            // console.log(JSON.stringify(error, null, 4));
            return false;
        }
    },
    //fileDownloadToFile("刻詠の風水士リンネ/6230667.png");
    fileDownload: async function (base) {
        try {
            let onlinePath = path.format({ root, base });
            let response = await dbox.filesDownload({ path: onlinePath });
            return response.fileBinary;

        } catch (error) {
            console.log(error);
            return null;
        }
    },


    // upload
    fileUpload: async function (dirPath, fileBinary, mode) {
        let filesCommitInfo = {
            path: root + dirPath,
            contents: fileBinary,
            mode: { ".tag": ((mode) ? mode : "overwrite") },
            autorename: false,
            mute: true
        };

        try {
            await dbox.filesUpload(filesCommitInfo);
            return true;
        } catch (error) {
            console.log(error);
            return false;
        }
    },

    // move
    filesBackup: async function (dirPath) {
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
            return !false;
        } catch (error) {
            console.log(error);
            return false;
        }
    },

    // move
    filesMove: async function (from, to) {
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
            return !false;
        } catch (error) {
            console.log(error);
            return false;
        }
    },

    filesDelete: async function (path) {
        console.log("filesDelete: " + path);
        try {
            await dbox.filesDelete({ path: root + path });
            return !false;
        } catch (error) {
            console.log(error.error);
            return false;
        }
    },

};


/*
const debugFunc = function() {

	dboxCore.listDir("").then(function(obj){console.log(obj);});

}
setTimeout(debugFunc, 1 * 1000);*/

