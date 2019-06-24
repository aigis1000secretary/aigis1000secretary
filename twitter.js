

// ライブラリ読み込み
let Twitter = require('twitter');
const request = require("request");
const crypto = require('crypto');
const line = require("./line.js");
const dbox = require("./dbox.js");
const config = require("./config.js");

// oauth認証に使う値
const twitter_oauth = {
    consumer_key: config.twitterCfg.TWITTER_CONSUMER_KEY.trim(),
    consumer_secret: config.twitterCfg.TWITTER_CONSUMER_SECRET.trim(),
    access_token_key: config.twitterCfg.TWITTER_ACCESS_TOKEN.trim(),
    access_token_secret: config.twitterCfg.TWITTER_ACCESS_TOKEN_SECRET.trim()
}
const bot = new Twitter(twitter_oauth);
// Twitterオブジェクトの作成

const twitterCore = {
    // webhook crc
    crc: {
        // https://qiita.com/Fushihara/items/79913a5b933af15c5cf4
        // CRC API
        crcRegistWebhook() {
            console.log("crcRegist");
            // Registers a webhook URL / Generates a webhook_id
            request.post({
                url: `https://api.twitter.com/1.1/account_activity/all/${config.twitterCfg.devLabel}/webhooks.json`,
                oauth: twitter_oauth,
                headers: { "Content-type": "application/x-www-form-urlencoded" },
                form: { url: config.twitterCfg.webhookUrl }
            }, (error, response, body) => { console.log(body) });
        },


        crcPostSubscriptions() {
            console.log("crcPostSubscriptions");
            request.post({
                url: `https://api.twitter.com/1.1/account_activity/all/${config.twitterCfg.devLabel}/subscriptions.json`,
                oauth: twitter_oauth,
                headers: { "Content-type": "application/x-www-form-urlencoded" },
            }, (error, response, body) => { if (error) console.log(error); else if (body) console.log(body); else console.log(response); });
        },
        crcGetSubscriptions() {
            console.log("crcGetSubscriptions");
            request.get({
                url: `https://api.twitter.com/1.1/account_activity/all/${config.twitterCfg.devLabel}/subscriptions.json`,
                oauth: twitter_oauth,
                headers: { "Content-type": "application/x-www-form-urlencoded" },
            }, (error, response, body) => { if (error) console.log(error); else if (body) console.log(body); else console.log(response); });
        },
        crcDelSubscriptions() {
            console.log("crcDelSubscriptions");
            request.delete({
                url: `https://api.twitter.com/1.1/account_activity/all/${config.twitterCfg.devLabel}/subscriptions.json`,
                oauth: twitter_oauth,
                headers: { "Content-type": "application/x-www-form-urlencoded" },
            }, (error, response, body) => { if (error) console.log(error); else if (body) console.log(body); else console.log(response); });
        },


        crcSubsc() {
            console.log("crcSubsc");
            // Subscribes an application to an account"s events
            // これが登録らしいんだけど、来ないんだよなあ
            const request_options = {
                url: `https://api.twitter.com/1.1/account_activity/all/${config.twitterCfg.devLabel}/subscriptions.json`,
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
                url: `https://api.twitter.com/1.1/account_activity/all/${config.twitterCfg.devLabel}/webhooks.json`,
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
                url: `https://api.twitter.com/1.1/account_activity/all/${config.twitterCfg.devLabel}/webhooks/${config.twitterCfg.hookId}.json`,
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
                url: `https://api.twitter.com/1.1/account_activity/all/${config.twitterCfg.devLabel}/subscriptions.json`,
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
                url: `https://api.twitter.com/1.1/account_activity/all/${config.twitterCfg.devLabel}/subscriptions/list.json`,
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
                url: `https://api.twitter.com/1.1/account_activity/all/${config.twitterCfg.devLabel}/webhooks/${config.twitterCfg.hookId}.json`,
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
                url: `https://api.twitter.com/1.1/account_activity/all/${config.twitterCfg.devLabel}/subscriptions.json`,
                oauth: twitter_oauth,
                headers: { "Content-type": "application/x-www-form-urlencoded" }
            };
            request.delete(request_options, (error, response, body) => { console.log(`${response.statusCode} ${response.statusMessage} (204ならOKかな？)`); console.log(body) });
        }
    },
    webhook: {
        crcFunctions: function (request, response) {
            for (let key in twitterCore.crc) {
                if (key == request.params.function) {
                    twitterCore.crc[key]();
                    response.send("twitterCore.crc." + key + "()");
                    return;
                }
            }
            //response.send("Unknown function");
        },
        get: function (request, response) {
            // getでchallenge response check (CRC)が来るのでその対応
            const crc_token = request.query.crc_token
            if (crc_token) {
                const hash = crypto.createHmac('sha256', twitter_oauth.consumer_secret).update(crc_token).digest('base64')
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
            if (config.switchVar.logRequestToFile && request.body) {
                let dateNow = new Date(Date.now());
                let path = "twitter_" +
                    dateNow.getFullYear() + "-" +
                    ((dateNow.getMonth() + 1) + "-").padStart(3, "0") +
                    (dateNow.getDate() + "-").padStart(3, "0") +
                    (dateNow.getHours() + "").padStart(2, "0") +
                    (dateNow.getMinutes() + "").padStart(2, "0") +
                    (dateNow.getSeconds() + "").padStart(2, "0") +
                    (dateNow.getMilliseconds() + "").padStart(4, "0");
                let data = new Buffer.from(JSON.stringify(request.body, null, 4));

                dbox.fileUpload("webhook/" + path + ".json", data, "add").catch(function (error) { });
            }
            response.send("200 OK");
        }
    },

    stream: {
        getUserId: function (target) {
            return new Promise(function (resolve, reject) {
                // 監視するユーザのツイートを取得
                bot.get('statuses/user_timeline', { screen_name: target },
                    function (error, tweets, response) {
                        if (!error) {
                            // 取得したtweet情報よりユーザ固有IDを文字列形式で取得
                            let user_id = tweets[0].user.id_str;
                            // 取得したユーザIDよりストリーミングで使用するオプションを定義
                            resolve(user_id);
                        } else {
                            // console.log(error);
                            line.botPushError(error);
                            //reject(error);
                        }
                    });
            });
        },

        litsen: async function (target, user_id, callback) {
            if (user_id == "") {
                user_id = await twitterCore.stream.getUserId(target);
            }

            // console.log(target + 'のツイートを取得します。');
            botPushLog(target + 'のツイートを取得します。');

            // ストリーミングでユーザのタイムラインを監視
            bot.stream('statuses/filter', { follow: user_id }, function (stream) {
                // Streamingの開始と受取
                stream.on('data', function (tweet) {
                    console.log("stream.on = data")

                    twitterCore.stream.getStreamData(tweet, target, callback);
                });

                // エラー時は再接続を試みた方がいいかもしれません(未検証)
                stream.on('error', function (rawData) {
                    line.botPushLog("stream.on = error\ngetTweetData: ");
                    line.botPushLog(JSON.stringify(rawData, null, 4));

                    let tweet = rawData.source;
                    twitterCore.stream.getStreamData(tweet, target, callback);
                });

                // 接続が切れた際の再接続
                stream.on('end', function (tweet) {
                    stream.destroy();
                    // console.log(target + 'のツイートを取得終了。');
                    line.botPushLog(target + 'のツイートを取得終了。');

                    setTimeout(function () {
                        twitterCore.stream.litsen(target, user_id, callback);
                    }, 30 * 1000);
                });

                // // 接続開始時にはフォロワー情報が流れます
                // stream.on('friends', function (tweet) { console.log(JSON.stringify(tweet)); });
                // // つい消しの場合                    
                // stream.on('delete', function (tweet) { console.log(JSON.stringify(tweet)); });
                // // 位置情報の削除やふぁぼられといったeventはここに流れます
                // stream.on('event', function (tweet) { console.log(JSON.stringify(tweet)); });

            });
        },

        getStreamData: function (tweet, target, callback) {
            // RTと自分のツイートは除外
            if (tweet && tweet.user && !tweet.retweeted_status) {

                // 送信する情報を定義
                let tweet_data = twitterCore.stream.getTweetData(tweet);

                // 送信
                if (tweet_data.text && tweet_data.screen_name == target) {
                    callback(tweet_data);
                }

                // log
                if (config.switchVar.logStreamToFile && tweet) {
                    let dateNow = new Date(Date.now());
                    let dateString = "twitter_" +
                        dateNow.getFullYear() + "-" +
                        ((dateNow.getMonth() + 1) + "-").padStart(3, "0") +
                        (dateNow.getDate() + "-").padStart(3, "0") +
                        (dateNow.getHours() + "").padStart(2, "0") +
                        (dateNow.getMinutes() + "").padStart(2, "0") +
                        (dateNow.getSeconds() + "").padStart(2, "0") +
                        (dateNow.getMilliseconds() + "").padStart(4, "0");
                    let data = new Buffer.from(JSON.stringify(tweet, null, 4));

                    dbox.fileUpload("stream/" + dateString + ".json", data, "add").catch(function (error) { });
                }
            }
        },

        getTweetData: function (raw) {
            let tweet_data = { medias: [] };

            if (raw.extended_tweet) {
                raw = Object.assign(raw, raw.extended_tweet);
            }
            if (!raw.entities) raw.entities = {};
            if (!raw.extended_entities) raw.extended_entities = {};
            raw.entities = Object.assign(raw.entities, raw.extended_entities);

            // get tweet data
            tweet_data.name = raw.user.name;
            tweet_data.screen_name = raw.user.screen_name;
            tweet_data.created_at = raw.created_at;
            tweet_data.timestamp_ms = raw.timestamp_ms;

            // tweet text
            tweet_data.text = raw.full_text ? raw.full_text : raw.text;

            // tweet media
            if (raw.entities.media && Array.isArray(raw.entities.media)) {
                for (let i in raw.entities.media) {
                    let media = raw.entities.media[i];

                    if (media.type == "photo") {
                        tweet_data.medias.push({
                            type: media.type,
                            link: media.media_url_https,
                            url: media.url  // same with tweet text
                        });
                    }
                }
            }

            return tweet_data;
        },
    },

    // autoTest: async function () {
    // }
}
//twitterCore.stream.litsen("Aigis1000", function () { });
module.exports = twitterCore;

// twitterCore.stream.litsen("z1022001", "", function (tweet_data) {
//     console.log(JSON.stringify(tweet_data, null, 4));
// });


/*
searchTweet('『冥闇の剣士アンブレ』が登場！');
function searchTweet(queryArg, nextResultsMaxIdArg = null) {
    bot.get('search/tweets', { q: queryArg, count: 100, max_id: nextResultsMaxIdArg }, (error, searchData, response) => {
        for (item in searchData.statuses) {
            let tweet = searchData.statuses[item];
            // console.log('@' + tweet.user.screen_name + ' : ' + tweet.text); //実際に使う場合はここでファイルへ書き出しなどといった処理を行うことになると思います

            // if (!tweet.retweeted_status) {
            if (tweet.user.screen_name == "Aigis1000") {
                console.log('@' + tweet.user.screen_name + '\n >>' + tweet.text); //実際に使う場合はここでファイルへ書き出しなどといった処理を行うことになると思います
                console.log(JSON.stringify(tweet, null, 4));
            }
        }

        if (searchData.search_metadata == undefined) {
            console.log('---- Complete (no metadata) ----');
            return 0;
        }
        else if (searchData.search_metadata.next_results) {
            let maxId = searchData.search_metadata.next_results.match(/\?max_id=(\d*)/);

            if (maxId[1] == null) {
                return 0;
            }

            console.log('---- next:' + maxId[1] + ' ----');
            searchTweet(queryArg, maxId[1]);
        }
        else {
            console.log('---- Complete ----');
            return 0;
        }
    });
}//*/


/*
const httpTwitterAPI = function () {

    let srcUrl = "https://mobile.twitter.com/aigis1000";

    // callback
    let requestCallBack = function (error, response, body) {
        if (error || !body) {
            console.log(error);
            return null;
        }

        let html = iconv.decode(new Buffer(body, "binary"), "UTF-8"); // EUC-JP to utf8 // Shift_JIS EUC-JP
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




