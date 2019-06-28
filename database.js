
const dbox = require("./dbox.js");
const line = require("./line.js");
const config = require("./config.js");

// 網址編碼
const iconv = require("iconv-lite");
const urlEncode = function (str_utf8, codePage) {
    let buffer = iconv.encode(str_utf8, codePage);
    let str = "";
    for (let i = 0; i < buffer.length; i++) {
        str += "%" + buffer[i].toString(16);
    }
    return str.toUpperCase();
}
const urlEncodeJP = function (str_utf8) { return urlEncode(str_utf8, "EUC-JP"); }
const urlEncodeBIG5 = function (str_utf8) { return urlEncode(str_utf8, "BIG5"); }
const urlEncodeUTF8 = function (str_utf8) { return urlEncode(str_utf8, "UTF-8"); }
const encodeURI_JP = function (url) {
    var result = "";

    let jpEncode = "";
    let big5Encode = "";
    let uriEncode = "";

    for (let i = 0; i < url.length; i++) {
        jpEncode = urlEncodeJP(url[i]);
        big5Encode = urlEncodeBIG5(url[i]);
        uriEncode = encodeURI(url[i]);

        if (jpEncode == big5Encode) {
            result += uriEncode;
        } else {
            result += jpEncode;
        }
    }
    return result;
}

class Database {
    constructor(dbName) {
        this.name = dbName;
        this.fileName = dbName + ".json";
        this.data = [];
        this.uploadTaskCount = -1;

        this.uploadCount = (28 * 60);
    };

    newData() { };
    addData() { };

    toString() {
        return "Database: " + this.name + ", upload timer: " + this.uploadCount;
    };

    indexOf(key) {
        for (let i in this.data) {
            if (key && this.data[i].name.toUpperCase() == key.toUpperCase()) {
                return i;
            }
        }
        return -1;
    };

    // 儲存資料
    async saveDB() {
        console.log(this.name + " saving...");

        // sort
        this.data.sort(function (A, B) {
            return A.name.localeCompare(B.name)
        })

        // object to json
        var json = JSON.stringify(this.data);

        try {
            await asyncWriteFile(this.fileName, json);
            console.log(this.name + " saved!");
        } catch (err) {
            console.log(err);
            botPushError(this.name + " saving error...");
            botPushError(err);
            // return Promise.reject(err);
        }
    };

    // 讀取資料
    async loadDB() {
        console.log(this.name + " loading...");

        let obj = [];
        try {
            let data = await asyncReadFile(this.fileName);

            try {
                obj = JSON.parse(data);
            } catch (e) {
                obj = eval("(" + data + ")");
            }

            for (let i in obj) {
                // 建立樣板
                var newData = this.newData();

                // 讀取參數
                for (let key in obj[i]) {
                    if (typeof (newData[key]) != "undefined") {
                        newData[key] = obj[i][key];
                    }
                }
                this.addData(newData);
            }

            console.log(this.name + " loaded!");
        } catch (err) {
            console.log(err);
            botPushError(this.name + " loading error...");
            botPushError(err);
            // return Promise.reject(err);
        }
    };

    // 下載
    async downloadDB() {
        console.log(this.name + " downloading...");

        // download json
        try {
            await dbox.fileDownloadToFile(this.fileName, this.fileName);
            console.log(this.name + " downloaded!");
        } catch (err) {
            console.log(err);
            botPushError(this.name + " downloading error...");
            botPushError(err);
            // return Promise.reject(err);
        }
    };

    // 上傳備份
    async uploadDB(backup) {
        console.log(this.name + " uploading...");

        // object to json
        try {
            var binary = new Buffer.from(JSON.stringify(this.data));
            if (backup) {
                await dbox.filesBackup(this.fileName);
            }
            if (!config.isLocalHost) {
                await dbox.fileUpload(this.fileName, binary);
                console.log(this.name + " uploaded!");
            }
        } catch (err) {
            console.log(err);
            botPushError(this.name + " uploading error...");
            botPushError(err);
            // return Promise.reject(err);
        }
    };

    // 延時上傳
    async uploadTask(backup) {

        try {

            if (this.uploadTaskCount > 0) {
                // counting
                this.uploadTaskCount = this.uploadCount;
            } else {
                // start count
                this.uploadTaskCount = this.uploadCount;

                // count down and upload
                while (this.uploadTaskCount > 0) {
                    await sleep(1000);
                    this.uploadTaskCount--;
                }

                await this.saveDB();
                this.uploadDB(backup);
            }

        } catch (err) {
            console.log(err);
            botPushError(this.name + " uploadTask error...");
            botPushError(err);
            // return Promise.reject(err);
        }
    };

    // init
    async init() {
        await this.downloadDB();
        await this.loadDB();
    };
}

// Character Database
class CharaDatabase extends Database {
    newData() {
        var newData = {};
        newData.name = "";
        newData.ability = "";
        newData.ability_aw = "";
        newData.skill = "";
        newData.skill_aw = "";

        newData.rarity = "";
        newData.class = "";
        newData.type = "";

        newData.getMessage = function () {
            var string = "";

            string += this.name + "　　" + this.rarity + "\n";

            let nickList = [];
            for (let i in nickDatabase.data) {
                if (nickDatabase.data[i].target == this.name) {
                    nickList.push(nickDatabase.data[i].name);
                }
            }
            if (nickList.length > 0) {
                string += nickList.join(" ") + "\n";
            }

            if (this.ability != "") {
                string += "◇特：" + this.ability + "\n";
            }

            if (this.skill != "") {
                string += "◇技：" + this.skill + "\n";
            }

            if (this.ability_aw != "") {
                string += "◆特：" + this.ability_aw + "\n";
            }

            if (this.skill_aw != "") {
                string += "◆技：" + this.skill_aw + "\n";
            }

            return string;
        };
        newData.getWikiUrl = function () {
            if (this.name.indexOf("王子") != -1) {
                var string = "http://seesaawiki.jp/aigis/d/王子";
                return encodeURI_JP(string);
            }
            var string = "http://seesaawiki.jp/aigis/d/" + this.name;
            return encodeURI_JP(string);
        };
        newData.format = function () {
            // 統一格式
            this.skill = this.skill
                .replaceAll("＋", "+").replaceAll("、+", "+").replaceAll("(", "（").replaceAll(")", "）").replaceAll("さらに、", "さらに").replaceAll("の、", "の").replaceAll("配置中のみ", "配置中").replaceAll("配置中、", "配置中").replaceAll("防御力、魔法耐性", "防御力と魔法耐性");
            this.skill_aw = this.skill_aw
                .replaceAll("＋", "+").replaceAll("、+", "+").replaceAll("(", "（").replaceAll(")", "）").replaceAll("さらに、", "さらに").replaceAll("の、", "の").replaceAll("配置中のみ", "配置中").replaceAll("配置中、", "配置中").replaceAll("防御力、魔法耐性", "防御力と魔法耐性");
            this.ability = this.ability
                .replaceAll("＋", "+").replaceAll("、+", "+").replaceAll("(", "（").replaceAll(")", "）").replaceAll("さらに、", "さらに").replaceAll("の、", "の").replaceAll("いるだけで、", "いるだけで").replaceAll("配置中のみ", "配置中").replaceAll("配置中、", "配置中").replaceAll("防御力、魔法耐性", "防御力と魔法耐性");
            this.ability_aw = this.ability_aw
                .replaceAll("＋", "+").replaceAll("、+", "+").replaceAll("(", "（").replaceAll(")", "）").replaceAll("さらに、", "さらに").replaceAll("の、", "の").replaceAll("いるだけで、", "いるだけで").replaceAll("配置中のみ", "配置中").replaceAll("配置中、", "配置中").replaceAll("防御力、魔法耐性", "防御力と魔法耐性");

            if (this.ability.indexOf("ランダム") != -1) {
                this.ability = this.ability.replaceAll("、/、", "、");
                this.ability = this.ability.replaceAll("発動、", "発動：");
                this.ability = this.ability.replaceAll("回復、", "回復/");
                this.ability = this.ability.replaceAll("回避、", "回避/");
                this.ability = this.ability.replaceAll("攻撃、", "攻撃/");
                this.ability = this.ability.replaceAll("連射、", "連射/");
                this.ability = this.ability.replaceAll("無視、", "無視/");
                this.ability = this.ability.replaceAll("入手、", "入手/");
                this.ability = this.ability.replaceAll("倍、", "倍/");
                this.ability = this.ability.replaceAll("硬直なし、", "硬直なし/");
            }
            if (this.ability_aw.indexOf("ランダム") != -1) {
                this.ability_aw = this.ability_aw.replaceAll("、/、", "、");
                this.ability_aw = this.ability_aw.replaceAll("発動、", "発動：");
                this.ability_aw = this.ability_aw.replaceAll("回復、", "回復/");
                this.ability_aw = this.ability_aw.replaceAll("回避、", "回避/");
                this.ability_aw = this.ability_aw.replaceAll("攻撃、", "攻撃/");
                this.ability_aw = this.ability_aw.replaceAll("連射、", "連射/");
                this.ability_aw = this.ability_aw.replaceAll("無視、", "無視/");
                this.ability_aw = this.ability_aw.replaceAll("入手、", "入手/");
                this.ability_aw = this.ability_aw.replaceAll("倍、", "倍/");
                this.ability_aw = this.ability_aw.replaceAll("硬直なし、", "硬直なし/");
            }
        };

        return newData;
    };

    addData(newData) {
        if (!newData.name || newData.name == "") return "";
        // debugLog("New character <" + newData.name + "> data add...");

        // 統一格式
        newData.format();

        if (this.indexOf(newData.name) == -1) {
            this.data.push(newData);
            console.log("New character <" + newData.name + "> data add complete!");
            return "anna " + newData.name + " New character data add complete!";

        } else {
            let i = this.indexOf(newData.name);
            let changed = false;

            // 更新資料
            for (let key in this.data[i]) {
                if (this.data[i][key] == "" && newData[key] && newData[key] != "") {
                    this.data[i][key] = newData[key];
                    changed = true;
                }
            }
            if (changed) {
                console.log("New character <" + newData.name + "> data update complete!");
                return "anna " + newData.name + " New character data update complete!";
            } else {
                console.log("Character <" + newData.name + "> data is existed!");
                return "";
            }
        };
    };
}

// Nickname Database
class NickDatabase extends Database {
    newData(name, nick) {
        if (name == "" || nick == "") return {};

        var newData = {};
        newData.name = nick;
        newData.target = name;

        return newData;
    };

    addData(newData) {
        if (newData == {}) return "";

        if (this.indexOf(newData.name) == -1) {
            this.data.push(newData);
        }
        return "";
    };
}

// Class Database
class ClassDatabase extends Database {
    newData() {
        var newClass = {};
        newClass.name = "";
        newClass.index = [];
        newClass.type = "";

        return newClass;
    };

    addData(newClass) {
        if (newClass.name == "") return "";
        // console.log("New <" + newClass.name + "> Class data add...");

        if (this.indexOf(newClass.name) == -1) {
            this.data.push(newClass);
            console.log("New Class <" + newClass.name + "> add complete!");
            botPushLog("New Class <" + newClass.name + "> add complete!");
            return "New Class <" + newClass.name + "> add complete!";

        } else {
            console.log("Class <" + newClass.name + "> is existed!");
            return "";
        }
    };
}

// Group Database
class GroupDatabase extends Database {
    constructor(dbName) {
        super(dbName);
        this.uploadCount = (10 * 60);
    };

    newData(groupId, text, timestamp) {
        if (groupId == "" || text == "" || timestamp == "") return {};

        var newData = {};
        newData.name = groupId;
        newData.text = text;
        newData.alarm = true;
        newData.timestamp = timestamp;

        return newData;
    };

    addData(newData) {
        if (newData == {}) return "";

        if (this.indexOf(newData.name) == -1) {
            this.data.push(newData);

            // sort
            this.data.sort(function (A, B) {
                return A.name.localeCompare(B.name)
            })

        } else {
            let i = this.indexOf(newData.name);
            this.data[i].text = text;
            this.data[i].timestamp = timestamp;
        }
        this.uploadTask(false);
        return "";
    };
}

var groupDatabase = new GroupDatabase("GroupDatabase");
var charaDatabase = new CharaDatabase("CharaDatabase");
var nickDatabase = new NickDatabase("NickDatabase");
var classDatabase = new ClassDatabase("ClassDatabase");

module.exports = {
    /*init() {

    },*/


    groupDatabase: groupDatabase,
    charaDatabase: charaDatabase,
    nickDatabase: nickDatabase,
    classDatabase: classDatabase
};



/*
const debugFunc = async function () {
    let ClassDatabase = createNewDatabase("ClassDatabase");
    await ClassDatabase.downloadDB();
    await ClassDatabase.loadDB();
    let a = ClassDatabase.indexOf("アコライト");
    console.log(a);
    await ClassDatabase.saveDB();
    await ClassDatabase.uploadDB(true);


}

setTimeout(debugFunc, 1 * 100);// */