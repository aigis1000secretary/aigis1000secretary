
const express = require("express");

const _express = {
    app: null,
    server: null,

    init() {

        _express.app = express();
        _express.server = _express.app.listen(process.env.PORT || 8080, () => {
            // 因為 express 預設走 port 3000，而 heroku 上預設卻不是，要透過下列程式轉換
            let port = _express.server.address().port;
            console.log("[express] App now running on port", port);
        });

        // uptimerobot
        _express.app.get("/uptimerobot/", (request, response) => {
            response.send("Hello uptimerobot!");
        });

        // http host
        _express.app.get("/", (request, response) => {
            response.send("Anna say hello to you!")
        });










        // // line webhook
        // _express.app.post("/linebot/", line.bot.parser());

    }
}

module.exports = {
    // app: _express.app,
    app: {
        get(path, method) {
            if (!module.exports.enable()) return null;

            _express.app.get(path, method);
        },
        post(path, method) {
            if (!module.exports.enable()) return null;

            _express.app.post(path, method);
        }
    },

    init() {
        _express.init();
    },

    enable() {
        if (_express.app != null) return true;
        console.log("[express] express unable...");
        return false;
    },

}
