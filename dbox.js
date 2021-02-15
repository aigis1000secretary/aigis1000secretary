
const fs = require('fs');
const path = require('path');
const fetch = require('isomorphic-fetch');
const Dropbox = require('dropbox').Dropbox;

let dbox = null;
let root = null;
let config = null;

module.exports = {

    async init(cfg) {
        if (!cfg.DROPBOX_ACCESS_TOKEN) return;
        config = cfg;

        dbox = new Dropbox({
            fetch: fetch,
            accessToken: cfg.DROPBOX_ACCESS_TOKEN
        });
        root = cfg.DROPBOX_ROOT || "";

        await this.checkUser();
    },

    enable() {
        if (dbox != null) return true;
        console.log("[dropbox] Dropbox unable...");
        return false;
    },

    async checkUser() {
        try {
            await dbox.checkUser({ query: config.DROPBOX_ACCESS_TOKEN });
            return true;
        } catch (error) {
            console.log(error);
            dbox = null;
            return false;
        }
    },

    // LS
    // dirPath: "/GIF" or "/Images"
    // filter: "file" or "folder"
    async listDir(dirPath = "", filter) {
        if (!this.enable()) return null;
        // console.log(`[dropbox] listDir( ${dirPath} )`);

        try {
            // get list
            let result = [];
            let response = await dbox.filesListFolder({ path: root + dirPath });
            result = result.concat(response.result.entries);

            // more then
            while (response.result.has_more) {
                let cursor = response.result.cursor;
                response = await dbox.filesListFolderContinue({ cursor: cursor });
                result = result.concat(response.result.entries);
            }

            // filter
            if (filter) {
                result = result.filter((obj) => { return (filter == obj[".tag"]); });
            }

            return result;
        } catch (error) {
            // console.log(`[dropbox] listDir( ${dirPath} ) error...`);
            // console.log(json(error));
            throw error;
        }
    },

    // MD
    async makeDir(path = "") {
        if (!this.enable()) return null;

        try {
            let response = await dbox.filesCreateFolder({ path: root + path, autorename: false });
            // console.log(`[dropbox]\n${response}`);
            return true;
        } catch (error) {
            console.log("[dropbox] makeDir error... " + path);
            throw error;
        }
    },

    // DL
    // fileDownloadToFile("/刻詠の風水士リンネ/6230667.png");
    async fileDownload(base) {
        if (!this.enable()) return null;

        try {
            // get dbox file path
            let onlinePath = path.format({ root, base });

            // download data
            let response = await dbox.filesDownload({ path: onlinePath });

            return response.result.fileBinary;
        } catch (error) {
            console.log("[dropbox] fileDownload error... " + base);
            throw error;
        }
    },
    async fileDownloadToFile(base, localPath) {
        if (!this.enable()) return null;

        try {
            // get dbox file path
            let onlinePath = path.format({ root, base });

            // get local file path
            if (!localPath) localPath = "." + path.normalize(onlinePath);
            let parse = path.parse(localPath);
            let folderPath = parse.root + parse.dir;
            // md if not exists
            if (!fs.existsSync(folderPath)) { fs.mkdirSync(folderPath, { recursive: true }); }

            // download data
            let response = await dbox.filesDownload({ path: onlinePath });
            // write data to file
            fs.writeFileSync(localPath, response.result.fileBinary, { encoding: "Binary" });

            return true;
        } catch (error) {
            console.log("[dropbox] fileDownloadToFile error... " + base);
            throw error;
        }
    },

    // upload
    async fileUpload(dirPath = "", fileBinary, mode) {
        if (!this.enable()) return null;

        try {
            // set option obj
            let filesCommitInfo = {
                path: root + dirPath,
                contents: fileBinary,
                mode: { ".tag": (mode || "overwrite") },
                autorename: false,
                mute: true
            };

            await dbox.filesUpload(filesCommitInfo);
            return true;
        } catch (error) {
            console.log("[dropbox] fileUpload error... " + dirPath);
            throw error;
        }
    },

    // Backup
    async fileBackup(filePath) {
        if (!this.enable()) return null;

        try {
            let filesRelocationArg = {
                from_path: root + filePath,
                to_path: root + "/backup/" + filePath,
                allow_shared_folder: true,
                autorename: true,
                allow_ownership_transfer: true
            };
            // let filesDeleteArg = {
            // 	path: root + dirPath
            // };

            await dbox.filesCopy(filesRelocationArg);
            // await dbox.filesDelete(filesDeleteArg);
            return true;
        } catch (error) {
            console.log("[dropbox] fileBackup error... " + filePath);
            throw error;
        }
    },

    // move
    async fileMove(from, to) {
        if (!this.enable()) return null;

        try {
            let filesRelocationArg = {
                from_path: root + from,
                to_path: root + to,
                allow_shared_folder: false,
                autorename: true,
                allow_ownership_transfer: false
            };

            await dbox.filesMoveV2(filesRelocationArg);
            return true;
        } catch (error) {
            console.log("[dropbox] filesMove error... <" + (root + from) + ">");
            throw error;
        }
    },

    // delete
    async fileDelete(path) {
        if (!this.enable()) return null;

        try {
            console.log("[dropbox] filesDelete: " + path);
            await dbox.filesDelete({ path: root + path });
            return true;
        } catch (error) {
            console.log("[dropbox] filesDelete error... " + path);
            throw error;
        }
    },

    // log
    logToFile(base, data) {
        if (!this.enable()) return null;

        let dateNow = new Date(Date.now());
        let timeString = dateNow.toISOString().replace(/:|Z/g, "").replace(/T|\./, "-");

        let binary = Buffer.from(JSON.stringify(data, null, 4));
        module.exports.fileUpload(`/Logs/${base}/${timeString}.json`, binary, "add").catch((error) => {
            console.log("[dropbox] logToFile error... ");
            console.log(error);
        });
    },
}


