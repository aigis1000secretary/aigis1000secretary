
// 初始化
var anna = require("./anna.js");

const main = async function () {
    // 讀取資料
    await anna.init();

    /*
    setTimeout(function () { anna.classDataCrawler(); }, 0);
    setTimeout(function () { anna.saveClassDataBase(); }, 2 * 1000);//*/
    
    setTimeout(function () { anna.allCharaDataCrawler(); }, 0);
	
    /*
	anna.searchDataAndReply("anna debug", function(obj) {console.log(obj)});
    setTimeout(function() {anna.charaDataCrawler(anna._encodeURI_JP("https://seesaawiki.jp/aigis/d/剣の聖女ゼノビア"));}, 0);//*/
	
	
	

}; main();