
// 初始化
var anna = require("./anna.js");

const main = async function () {
    // 讀取資料
    await anna.init();

    // 爬蟲: 3sec 後更新資料
    setTimeout(function () { anna.classDataCrawler(); }, 0);
    setTimeout(function () { anna.saveClassDataBase(); }, 2 * 1000);//*/
	
    /*
	anna.searchDataAndReply("anna debug", function(obj) {console.log(obj)});
    setTimeout(function() {anna.charaDataCrawler(anna._encodeURI_JP("https://seesaawiki.jp/aigis/d/剣の聖女ゼノビア"));}, 0);//*/
	
	
    setTimeout(function () { anna.allCharaDataCrawler(); }, 0);
    setTimeout(function () { anna.sort(); }, 35 * 1000);
    setTimeout(function () { anna.saveCharaDataBase(); }, 36 * 1000);//*/
	

}; main();