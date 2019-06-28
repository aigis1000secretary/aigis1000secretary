const line = require("./line.js");
const database = require("./database.js");
let groupDatabase = database.groupDatabase;

let remobeMode = false;
let remoteSource = '';
let remoteTarget = '';

module.exports = async function (rawMsg, sourceId) {
    if (remobeMode) {
        if (sourceId == remoteSource) {
            if (rawMsg == "remote off") {
                remobeMode = false;
                remoteSource = '';
                remoteTarget = '';
                botPush(remoteSource, "remote off");
                return true;
            } else {
                botPush(remoteTarget, rawMsg);
                return true;
            }
        }
        if (sourceId == remoteTarget) {
            botPush(remoteSource, rawMsg);
            return true;
        }
        return false;
    } else {

        // 分析命令
        let msg1 = ("" + rawMsg.split("\n")[0]).trim();
        let msgs = msg1.split(" ").filter(function (n) { return (n && (n != "")) });
        // >> remote <target>
        let command = ("" + msgs[0].toLowerCase()).trim();
        let arg1 = ("" + msgs[1].toLowerCase()).trim();

        if (command != "remote") return false;

        // remote undefine
        // remote <name>
        // remote <CID>
        let targetList = [];
        for (let i in groupDatabase.data) {
            let groupId = groupDatabase.data[i].name;
            let text = groupDatabase.data[i].text;
            targetList.push(groupId + " :\n\t" + text);

            if ((arg1 == groupId || arg1 == text) && groupId != '') {
                remobeMode = true;
                remoteSource = sourceId;
                remoteTarget = groupId;
                return true;
            }
        }
        // cant find target, send targetList
        for (let i in targetList) {
            console.log(targetList[i]);
            await botPush(sourceId, targetList[i]);
        }
        return true;
    }
}