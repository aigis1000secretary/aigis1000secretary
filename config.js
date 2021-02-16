/*
    // todo
    debug
    +index
    +   config
    +   anna
    +       database
    +       dbox
    +       imgUploader
    +       imgur
    +       twitter
            
    +   discord
    +   line
    +   express
    -   linealpht
*/

/*
    // commit 
*/

const crypto = require("./crypto.js");
const dbox = require("./dbox.js");
let _config = module.exports = {
    _version: "1.0.0.7",
    // 主版本號：當你做了不兼容的API修改
    // 次s版本號：當你做了向下兼容的功能性新增
    // 修訂號：當你做了向下兼容的問題修正
    // 次修訂號：線上debug

    hostIP: "",
    isLocalHost: require("fs").existsSync("./debug.js"),

    // dropbox
    dropbox: {
        // https://www.dropbox.com/developers/apps
        DROPBOX_ACCESS_TOKEN: process.env.DROPBOX_ACCESS_TOKEN,
        DROPBOX_ROOT: ""
    },

    async init() {
        // get host IP
        module.exports.hostIP = await new Promise(resolve => {
            require("dns").lookup(require("os").hostname(), function (err, address, fam) {
                resolve(address);
            });
        });

        // dbox init
        await dbox.init(this.dropbox);
        // get cfg
        // let cfgObj = global.CFG_OBJECT;
        let cfgObj = await this.loadConfigFromDbox();
        Object.assign(_config, cfgObj);

        await this.saveConfigToDbox();
    },

    async loadConfigFromDbox() {
        let cfgObj = null;
        let rawData = null;
        try {
            rawData = await dbox.fileDownload("/config.json");
            rawData = Buffer.from(rawData, "binary").toString();
        } catch (e) {
            // console.log(json(e));
            return null;
        }

        try {
            // json string to object
            cfgObj = eval(`(${rawData})`);
            console.log("[config] Download config from dropbox");
        } catch (e) {
            // encode
            let key = process.env.JSONKEY;
            let data = crypto.decrypt(rawData, key);
            // json string to object
            cfgObj = eval(`(${data})`);
            console.log("[config] Download encrypt config from dropbox");
        }

        return cfgObj;
    },
    async saveConfigToDbox() {
        // 加密 to dropbox
        let key = process.env.JSONKEY;
        let cfg = {
            imgur: this.imgur,
            twitter: this.twitter,
            discord: this.discord,
            devbot: this.devbot
        }
        let data = crypto.encrypt(JSON.stringify(cfg, null, 2), key);
        console.log("[config] Upload config to dropbox");

        dbox.fileUpload("/config.json", data);
    }
};

String.prototype.replaceAll = function (s1, s2) {
    let source = this;
    while ((temp = source.replace(s1, s2)) != source) {
        source = temp;
    }
    return source.toString();
}
String.prototype.equali = function (s1) {
    let source = this;
    if (!s1) s1 = "";
    return (source.toUpperCase().trim() == s1.toUpperCase().trim());
}
// Array.prototype.randomPick = function () {
//     return this[Math.floor(Math.random() * this.length)];
// }

// randomPick
global.randomPick = function (array) {
    if (!Array.isArray(array)) return array;
    return array[Math.floor(Math.random() * array.length)];
}

// sleep
global.sleep = function (ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}
