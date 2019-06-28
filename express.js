
const express = require("express");
// hotfix
const dbox = require("./dbox.js");


module.exports = express();
const server = module.exports.listen(process.env.PORT || 8080, function () {
    // 因為 express 預設走 port 3000，而 heroku 上預設卻不是，要透過下列程式轉換
    let port = server.address().port;
    console.log("App now running on port", port);
});

const init = async function () {
    // hotfix
    try {
        await dbox.fileDownloadToFile("hotfix.js", "./hotfix.js");
        hotfix = require("./hotfix.js");
        module.exports.get("/hotfix/:function", hotfix.hotfix);
    } catch (err) {
        console.log("hotfix error ", err);
    }
}; init();