
// 初始化
var anna = require("./anna.js");

const main = async function () {
    // 讀取資料
    await anna.init();

    // 爬蟲: 3sec 後更新資料
    setTimeout(function () { anna.classDataCrawler(); }, 0);
    setTimeout(function () { anna.allCharaDataCrawler(); }, 0);
    //setTimeout(function() {anna.charaDataCrawler();}, 0);

    // 75sec 後儲存資料庫
    setTimeout(function () { anna.saveClassDataBase(); }, 75 * 1000);
    setTimeout(function () { anna.saveCharaDataBase(); }, 75 * 1000);

}; main();