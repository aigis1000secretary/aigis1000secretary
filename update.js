
// 初始化
var anna = require("./anna.js");
const database = require("./database.js");

const main = async function () {
    // 讀取資料
    // await anna.init();

    let sourceId = "U9eefeba8c0e5f8ee369730c4f983346b";
    let userId = "U9eefeba8c0e5f8ee369730c4f983346b";
    var replyFunc = function (str) { console.log(">>" + str + "<<"); return str != "" && str && str != "undefined" };
    var result = await anna.replyAI("anna UPDATE", sourceId, userId);
    replyFunc(result);

    setTimeout(function () { database.charaDatabase.saveDB(); }, 1 * 60 * 1000);//*/


}; main();