
const express = require("express");
const line = require("./line.js");

const app = express();
const server = app.listen(process.env.PORT || 8080, function () {
    // 因為 express 預設走 port 3000，而 heroku 上預設卻不是，要透過下列程式轉換
    let port = server.address().port;
    console.log("App now running on port", port);
});

module.exports = {
    init: function () {
        // line webhook
        app.post("/", line.bot.parser());
        
        // http host
        app.get('/', function (req, res) {
            res.send('Anna say hello to you!')
        });
    }
}