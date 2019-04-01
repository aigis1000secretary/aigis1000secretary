
const express = require("express");
const dbox = require("./dbox.js");
const line = require("./line.js");
const twitter = require("./twitter.js");
const bodyParser = require('body-parser');
const anna = require("./anna.js");
var jsonParser = bodyParser.json()

const app = express();
const server = app.listen(process.env.PORT || 8080, function () {
    // 因為 express 預設走 port 3000，而 heroku 上預設卻不是，要透過下列程式轉換
    let port = server.address().port;
    console.log("App now running on port", port);
});
String.prototype.replaceAll = function (s1, s2) {
    var source = this;
    while ((temp = source.replace(s1, s2)) != source) {
        source = temp;
    }
    return source.toString();
}

module.exports = {
    init: async function () {

        // http host
        app.get("/", function (request, response) {
            response.send("Anna say hello to you!")
        });
        app.get("/anna/:command", async function (request, response) {
            let sourceId = "U9eefeba8c0e5f8ee369730c4f983346b";
            let userId = "U9eefeba8c0e5f8ee369730c4f983346b";
            var command = request.params.command;
            var responseBody = "reply false!";
            await anna.replyAI("anna " + command, sourceId, userId, function (object) {
                if (typeof (object) == "string") {
                    responseBody = object.replaceAll("\n", "<br>");
                } else {
                    responseBody = JSON.stringify(object, null, 2).replaceAll("\n", "<br>");
                }
            });
            response.send(responseBody);
        });

        // uptimerobot
        app.get("/uptimerobot/", function (request, response) {
            response.send("Hello uptimerobot!");
        });

        // line webhook
        app.post("/linebot/", line.bot.parser());

        // twitter webhook
        app.get("/twitterbot/:function", twitter.webhook.crcFunctions);
        app.get("/twitterbot/", twitter.webhook.get);
        app.post("/twitterbot/", jsonParser, twitter.webhook.post);

        // hotfix
        try {
            await dbox.fileDownload("hotfix.js", "./hotfix.js");
            hotfix = require("./hotfix.js");
            app.get("/hotfix/:function", hotfix.hotfix);
        } catch (err) {
            console.log("hotfix error ", err);
        }
    },
    app: app
}
module.exports.init();