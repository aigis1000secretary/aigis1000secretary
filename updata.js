
// 初始化
var anna = require("./anna.js");

// 讀取資料
anna.loadClassDataBase();
anna.loadCharaDataBase();

// 爬蟲: 3sec 後更新資料
setTimeout(function() {anna.classDataCrawler();}, 3 * 1000);
setTimeout(function() {anna.allCharaDataCrawler();}, 3 * 1000);

//setTimeout(function() {anna.charaDataCrawler();}, 3 * 1000);

// 80sec 後儲存資料庫
setTimeout(function() {anna.saveClassDataBase();}, 80 * 1000);
setTimeout(function() {anna.saveCharaDataBase();}, 80 * 1000);

// Test function
//setTimeout(anna.debugFunc, 1 * 1000);

