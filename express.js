
const express = require("express");
const line = require("./line.js");
const twitter = require("./twitter.js");
const bodyParser = require('body-parser');
var jsonParser = bodyParser.json()

const app = express();
const server = app.listen(process.env.PORT || 8080, function () {
    // 因為 express 預設走 port 3000，而 heroku 上預設卻不是，要透過下列程式轉換
    let port = server.address().port;
    console.log("App now running on port", port);
});

module.exports = {
    init: function () {

        // http host
        app.get("/", function (request, response) {
            response.send("Anna say hello to you!")
        });

        // uptimerobot
        app.get("/uptimerobot/", function (request, response) {
            response.send("Hello uptimerobot!")
        });

        // line webhook
        app.post("/linebot/", line.bot.parser());

        // twitter
        app.get("/twitterbot/:function", twitter.webhook.crcFunction);
        app.get("/twitterbot/", twitter.webhook.get);
        app.post("/twitterbot/", jsonParser, twitter.webhook.post);
    },
    app: app
}
module.exports.init();