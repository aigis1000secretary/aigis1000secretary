
const express = require("express");
const bodyParser = require('body-parser');
const config = require("./config.js");
const dbox = require("./dbox.js");
const anna = require("./anna.js");
// let jsonParser = bodyParser.json()

const _express = module.exports = {
    app: null,
    server: null,
    init() {

        _express.app = express();
        _express.server = _express.app.listen(process.env.PORT || 8080, function () {
            // 因為 express 預設走 port 3000，而 heroku 上預設卻不是，要透過下列程式轉換
            let port = _express.server.address().port;
            console.log("App now running on port", port);
        });


        // http host
        _express.app.get("/", function (request, response) {
            response.send("Anna say hello to you!")
        });
        _express.app.get("/anna/:command", async function (request, response) {
            let sourceId = config.adminstrator;
            let userId = config.adminstrator;
            let command = request.params.command;
            let responseBody = "reply false!";
            console.log(command);

            let result = await anna.replyAI(command, sourceId, userId);
            if (typeof (result) == "string") {
                responseBody = result.replaceAll("\n", "<br>");
            } else {
                responseBody = JSON.stringify(result, null, 2).replaceAll("\n", "<br>");
            }
            response.send(responseBody);
        });
        _express.app.get("/stamp/:command", async function (request, response) {
            let command = request.params.command;
            let responseBody = "reply false!";
            console.log(command);

            let result = anna.replyStamp(command);
            if (typeof (result) == "string") {
                responseBody = result.replaceAll("\n", "<br>");
            } else {
                responseBody = JSON.stringify(result, null, 2).replaceAll("\n", "<br>");
            }
            response.send(responseBody);
        });

        // uptimerobot
        _express.app.get("/uptimerobot/", function (request, response) {
            response.send("Hello uptimerobot!");
        });

        // // line webhook
        // _express.app.post("/linebot/", line.bot.parser());

        // // twitter webhook
        // _express.app.get("/twitterbot/:function", twitter.webhook.crcFunctions);
        // _express.app.get("/twitterbot/", twitter.webhook.get);
        // _express.app.post("/twitterbot/", jsonParser, twitter.webhook.post);

        // hotfix
        dbox.fileDownloadToFile("hotfix.js").then(function (result) {
            if (result) {
                let hotfix = require("./hotfix.js");
                _express.app.get("/hotfix/:function", hotfix.hotfix);
            }
        }).catch(function (error) { console.log("hotfix error ", error) })
        
        // let hotfix = require("./hotfix.js");
        // app.get("/hotfix/:function", hotfix.hotfix);
    },
};