
// line bot
//const line = require("./line.js");

// ライブラリ読み込み
const request = require("request");
const crypto = require('crypto');

// 各種Twitter APIを使用するための情報を設定
const config = {
    TWITTER_CONSUMER_KEY: "BA5DAB2yRX2EWFPB7xIR1DOfo",
    TWITTER_CONSUMER_SECRET: "2G8Ltf2F1DwrwscIGrJ4KhY7ZbiKCfKUlw3khkmIPNux6aJUv5",
    TWITTER_ACCESS_TOKEN: "1098066659091181568-OEi7e7FAs6Xdp0bvaXHzJE1xdMy16Q",
    TWITTER_ACCESS_TOKEN_SECRET: "nRAT33Ozkq0zJ6rjjoFJetuTWu6ouAE9dVgUxM1t36MWK",
    devLabel: "aigis1000secretary",
    hookId: "1099858367579856901",
    webhookUrl: "https://aigis1000secretary.herokuapp.com/twitterbot/",
    expressWatchPath: "/twitterbot/"
}
// oauth認証に使う値
const twitter_oauth = {
    consumer_key: config.TWITTER_CONSUMER_KEY.trim(),
    consumer_secret: config.TWITTER_CONSUMER_SECRET.trim(),
    token: config.TWITTER_ACCESS_TOKEN.trim(),
    token_secret: config.TWITTER_ACCESS_TOKEN_SECRET.trim()
}



module.exports = {
    config: config,

    crc: {
        // https://qiita.com/Fushihara/items/79913a5b933af15c5cf4
        // CRC API
        crcRegist() {
            console.log("crcRegist");
            // Registers a webhook URL / Generates a webhook_id
            const request_options = {
                url: `https://api.twitter.com/1.1/account_activity/all/${config.devLabel}/webhooks.json`,
                oauth: twitter_oauth,
                headers: { "Content-type": "application/x-www-form-urlencoded" },
                form: { url: config.webhookUrl }
            };
            request.post(request_options, (error, response, body) => { console.log(body) });
        },

        crcSubsc() {
            console.log("crcSubsc");
            // Subscribes an application to an account"s events
            // これが登録らしいんだけど、来ないんだよなあ
            const request_options = {
                url: `https://api.twitter.com/1.1/account_activity/all/${config.devLabel}/subscriptions.json`,
                oauth: twitter_oauth
            };
            request.post(request_options, (error, response, body) => { console.log(`${response.statusCode} ${response.statusMessage}`); console.log(body) });
        },

        crcGetList() {
            console.log("crcGetList");
            // Returns all webhook URLs and their statuses
            // アクティブなwebhookのURL一覧を取得
            // [{"id":"900000000000000000","url":"https://example.com/twitter-webhook-test/","valid":true,"created_timestamp":"2018-05-16 17:04:41 +0000"}]
            const request_options = {
                url: `https://api.twitter.com/1.1/account_activity/all/${config.devLabel}/webhooks.json`,
                oauth: twitter_oauth,
                headers: { "Content-type": "application/x-www-form-urlencoded" }
            };
            request.get(request_options, (error, response, body) => { console.log(body) });
        },

        crcPutHook() {
            console.log("crcPutHook");
            // Manually triggers a challenge response check
            // Registers a webhook URL / Generates a webhook_id
            // 登録したurlに "GET /twitter-webhook-test/index?crc_token=xxxxxxxxxxxxxxxxxxx&nonce=yyyyyyyyyyyyyyyy HTTP/1.1" のリクエストを送る
            // webhookの定期的なリクエストのテスト？
            const request_options = {
                url: `https://api.twitter.com/1.1/account_activity/all/${config.devLabel}/webhooks/${config.hookId}.json`,
                oauth: twitter_oauth,
                headers: { "Content-type": "application/x-www-form-urlencoded" },
            };
            request.put(request_options, (error, response, body) => { console.log(body) });
        },

        crcGetSubsc() {
            console.log("crcGetSubsc");
            // Check to see if a webhook is subscribed to an account
            // よくわからん。204が返ってきているのでOKの事らしいが
            const request_options = {
                url: `https://api.twitter.com/1.1/account_activity/all/${config.devLabel}/subscriptions.json`,
                oauth: twitter_oauth,
                headers: { "Content-type": "application/x-www-form-urlencoded" }
            };
            request.get(request_options, (error, response, body) => { console.log(`${response.statusCode} ${response.statusMessage} ( 204ならok)`); console.log(body) });
        },

        crcCount() {
            console.log("crcCount");
            // Returns a count of currently active subscriptions
            // {"errors":[{"message":"Your credentials do not allow access to this resource","code":220}]}
            // 無料だと取れないっぽい？
            const request_options = {
                url: `https://api.twitter.com/1.1/account_activity/subscriptions/count.json`,
                oauth: twitter_oauth,
                headers: { "Content-type": "application/x-www-form-urlencoded" }
            };
            request.get(request_options, (error, response, body) => { console.log(body) });
        },

        crcList() {
            console.log("crcList");
            // Returns a list of currently active subscriptions
            // {"errors":[{"message":"Your credentials do not allow access to this resource","code":220}]}
            // 無料では取れないっぽい？
            const request_options = {
                url: `https://api.twitter.com/1.1/account_activity/all/${config.devLabel}/subscriptions/list.json`,
                oauth: twitter_oauth,
                headers: { "Content-type": "application/x-www-form-urlencoded" }
            };
            request.get(request_options, (error, response, body) => { console.log(`${response.statusCode} ${response.statusMessage}`); console.log(body) });
        },

        crcDel() {
            console.log("crcDel");
            // Deletes the webhook
            // これを実行すると、get-listの戻り値がカラになる。
            const request_options = {
                url: `https://api.twitter.com/1.1/account_activity/all/${config.devLabel}/webhooks/${config.hookId}.json`,
                oauth: twitter_oauth,
                headers: { "Content-type": "application/x-www-form-urlencoded" }
            };
            request.delete(request_options, (error, response, body) => { console.log(`${response.statusCode} ${response.statusMessage}`); console.log(body) });
        },

        crcDes() {
            console.log("crcDes");
            // Deactivates subscription
            // delを実行した後なのでわからん
            const request_options = {
                url: `https://api.twitter.com/1.1/account_activity/all/${config.devLabel}/subscriptions.json`,
                oauth: twitter_oauth,
                headers: { "Content-type": "application/x-www-form-urlencoded" }
            };
            request.delete(request_options, (error, response, body) => { console.log(`${response.statusCode} ${response.statusMessage} (204ならOKかな？)`); console.log(body) });
        }
    },

    webhook: {
        crcFunction: function (request, response) {
            for (let key in module.exports.crc) {
                if (key == request.params.function) {
                    module.exports.crc[key]();
                    response.send("module.exports.crc." + key + "()");
                    return;
                }
            }
            response.send("Unknown function");
        },

        get: function (request, response) {
            // getでchallenge response check (CRC)が来るのでその対応
            const crc_token = request.query.crc_token
            if (crc_token) {
                const hash = crypto.createHmac('sha256', config.TWITTER_CONSUMER_SECRET).update(crc_token).digest('base64')
                console.log(`receive crc check. token=${crc_token} responce=${hash}`);
                response.status(200);
                response.send({
                    response_token: 'sha256=' + hash
                })
            } else {
                response.status(400);
                response.send('Error: crc_token missing from request.')
            }
        },

        post: function (request, response) {
            console.log(JSON.stringify(request.body, null, 4));
            response.send("200 OK");
        }
    }
}
/*
return function (request, response) {
    parser(request, response, function () {
        if (this.options.verify && !this.verify(request.rawBody, request.get('X-Line-Signature'))) {
            return response.sendStatus(400);
        }
        this.parse(request.body);
        return response.json({});
    });
};*/






/*
const httpTwitterAPI = function () {

    let srcUrl = "https://mobile.twitter.com/aigis1000";

    // callback
    let requestCallBack = function (error, response, body) {
        if (error || !body) {
            console.log(error);
            return null;
        }

        var html = iconv.decode(new Buffer(body, "binary"), "UTF-8"); // EUC-JP to utf8 // Shift_JIS EUC-JP
        let $ = cheerio.load(html, { decodeEntities: false }); // 載入 body

        // remove all hashtag
        $(".dir-ltr").each(async function (i, iElem) {
            if ($(this).attr("class") != "twitter_external_link dir-ltr tco-link has-expanded-path") {
                if ($(this).attr("class") != "dir-ltr") {
                    $(this).remove();
                } else if (!($(this).parent().parent().parent().parent().parent(".tweet  ").attr("href"))) {
                    $(this).remove();
                }
            }
        });


        $(".dir-ltr").each(async function (i, iElem) {
            if ($(this).attr("class") == "twitter_external_link dir-ltr tco-link has-expanded-path") {
                return;
            }
            console.log("");

            let postId = $(this).parent().parent().parent().parent().parent(".tweet  ").attr("href");
            postId = postId.substring(postId.lastIndexOf("\/") + 1, postId.lastIndexOf("?"));
            console.log("@@@@" + postId + "");

            let postText = $(this).text().toString().trim()
            console.log(">>" + postText + "<<");

            if (postText.indexOf("pic.twitter.com") != -1) {
                // botPush(postText);
            }
        });


        //;
    }
    //request.get(srcUrl, { encoding: "binary" }, requestCallBack);
}//*/




