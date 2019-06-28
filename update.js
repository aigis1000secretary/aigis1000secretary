
// 初始化
let anna = require("./anna.js");
const database = require("./database.js");

const main = async function () {
    // 讀取資料
    // await anna.init();

    let sourceId = "U9eefeba8c0e5f8ee369730c4f983346b";
    let userId = "U9eefeba8c0e5f8ee369730c4f983346b";
    let replyFunc = function (str) { console.log(">>" + str + "<<"); return str != "" && str && str != "undefined" };
    let result = await anna.replyAI("anna UPDATE", sourceId, userId);
    replyFunc(result);

    setTimeout(function () { database.charaDatabase.saveDB(); }, 1.5 * 60 * 1000);//*/


}; main();