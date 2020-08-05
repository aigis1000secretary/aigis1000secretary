

// ライブラリ読み込み
const fs = require('fs');
const path = require('path');
const Twitter = require('twitter');
const request = require("request");
// const crypto = require('crypto');
const config = require("./config.js");
const dbox = require("./dbox.js");

const _twitter = module.exports = {
    bot: null,
    init() {
        // oauth認証に使う値
        const twitter_oauth = {
            consumer_key: config.twitterCfg.TWITTER_CONSUMER_KEY.trim(),
            consumer_secret: config.twitterCfg.TWITTER_CONSUMER_SECRET.trim(),
            access_token_key: config.twitterCfg.TWITTER_ACCESS_TOKEN.trim(),
            access_token_secret: config.twitterCfg.TWITTER_ACCESS_TOKEN_SECRET.trim()
        }
        _twitter.bot = new Twitter(twitter_oauth);
        // Twitterオブジェクトの作成
    },

    stream: {
        getUserId(target) {
            return new Promise(function (resolve, reject) {
                // 監視するユーザのツイートを取得
                _twitter.bot.get('statuses/user_timeline', { screen_name: target },
                    function (error, tweets, response) {
                        if (!error) {
                            // 取得したtweet情報よりユーザ固有IDを文字列形式で取得
                            let user_id = tweets[0].user.id_str;
                            // 取得したユーザIDよりストリーミングで使用するオプションを定義
                            resolve(user_id);
                        } else {
                            console.log(error);
                            //reject(error);
                            resolve("");
                        }
                    });
            });
        },

        async litsen(target, user_id, callback) {
            if (user_id == "") {
                user_id = await _twitter.stream.getUserId(target);
            }

            console.log(target + 'のツイートを取得します。');

            // ストリーミングでユーザのタイムラインを監視
            _twitter.bot.stream('statuses/filter', { follow: user_id }, function (stream) {
                // Streamingの開始と受取
                stream.on('data', function (tweet) {
                    // console.log("stream.on = data")

                    _twitter.stream.getStreamData(tweet, target, callback);
                });

                // エラー時は再接続を試みた方がいいかもしれません(未検証)
                stream.on('error', function (rawData) {
                    console.log("stream.on = error\ngetTweetData: \n" + JSON.stringify(rawData, null, 4));

                    let tweet = rawData.source;
                    _twitter.stream.getStreamData(tweet, target, callback);
                });

                // 接続が切れた際の再接続
                stream.on('end', function (tweet) {
                    stream.destroy();
                    console.log(target + 'のツイートを取得終了。');

                    setTimeout(function () {
                        _twitter.stream.litsen(target, user_id, callback);
                    }, 60 * 1000);
                });

                // // 接続開始時にはフォロワー情報が流れます
                // stream.on('friends', function (tweet) { console.log(JSON.stringify(tweet)); });
                // // つい消しの場合                    
                // stream.on('delete', function (tweet) { console.log(JSON.stringify(tweet)); });
                // // 位置情報の削除やふぁぼられといったeventはここに流れます
                // stream.on('event', function (tweet) { console.log(JSON.stringify(tweet)); });

            });
        },

        async getStreamData(tweet, target, callback) {
            // RTと自分のツイートは除外
            if (!tweet || !tweet.user || tweet.retweeted_status) { return; }

            // 送信する情報を定義
            let tweet_data = await _twitter.stream.getTweetData(tweet);
            if (tweet_data.screen_name != target || tweet_data.screen_name == "ERROR") { return; }

            // log
            if (config.switchVar.logStreamToFile && tweet) {
                dbox.logToFile("twitter/", "stream", tweet);
            }

            // 送信
            if (tweet_data.text) {
                callback(tweet_data);
            }

            // image to dropbox
            if (tweet_data.medias) {
                _twitter.stream.getTweetImages(tweet_data);
            }

        },

        getTweetImages(tweet_data) {
            // image to dropbox
            for (let i in tweet_data.medias) {
                let media = tweet_data.medias[i];

                if (media.type == "photo") {
                    let tweetTime = new Date(parseInt(tweet_data.timestamp_ms));
                    let timeString = tweetTime.toISOString().replace(/-|:|\.\d+Z/g, "").replace("T", "_");
                    let filename = `${tweet_data.screen_name}-${tweet_data.id_str}-${timeString}-img${parseInt(i) + 1}${path.parse(media.link).ext}`

                    request.get(media.link, { encoding: 'binary' }, async (error, response, body) => {
                        if (body) {
                            fs.writeFileSync("./" + filename, body, { encoding: 'binary' });
                            body = fs.readFileSync("./" + filename);
                            await dbox.fileUpload("Images/NewImages/" + filename, body);
                            fs.unlinkSync("./" + filename);
                        }
                        // if (error || !body) { return console.log(error); }
                    });
                }
            }
        },

        async getTweetData(raw) {
            let tweet_data = { medias: [] };

            if (raw.extended_tweet) {
                raw = Object.assign(raw, raw.extended_tweet);
            }
            if (!raw.entities) raw.entities = {};
            if (!raw.extended_entities) raw.extended_entities = {};
            raw.entities = Object.assign(raw.entities, raw.extended_entities);

            // get tweet data
            tweet_data.id_str = raw.id_str;
            tweet_data.name = (raw.user ? raw.user.name : "ERROR");
            tweet_data.screen_name = (raw.user ? raw.user.screen_name : "ERROR");
            tweet_data.created_at = raw.created_at;
            tweet_data.timestamp_ms = raw.timestamp_ms || Date.parse(raw.created_at);

            // tweet text
            tweet_data.text = raw.full_text || raw.text;

            // tweet media
            if (raw.entities.media && Array.isArray(raw.entities.media)) {
                for (let media of raw.entities.media) {

                    if (media.type == "photo") {
                        tweet_data.medias.push({
                            type: media.type,
                            link: media.media_url_https,
                            url: media.url  // same with tweet link text, useless?
                        });
                    }
                }
            }

            // api bug?
            // https://developer.twitter.com/en/docs/labs/tweets-and-users/api-reference/get-tweets-id
            if (tweet_data.medias.length == 0) {
                // get image data form new api
                let medias = await new Promise((resolve, reject) => {
                    request.get({
                        url: 'https://api.twitter.com/labs/2/tweets',
                        oauth: {
                            consumer_key: config.twitterCfg.TWITTER_CONSUMER_KEY.trim(),
                            consumer_secret: config.twitterCfg.TWITTER_CONSUMER_SECRET.trim(),
                            token: config.twitterCfg.TWITTER_ACCESS_TOKEN.trim(),
                            token_secret: config.twitterCfg.TWITTER_ACCESS_TOKEN_SECRET.trim()
                        },
                        qs: {
                            ids: raw.id_str,
                            'expansions': 'attachments.media_keys',
                            'media.fields': 'type,url'
                        },
                        json: true
                    }, (error, req) => {
                        // console.log(JSON.stringify(req.body, null, 2));
                        if (req.body.includes && req.body.includes.media) {
                            resolve(req.body.includes.media);
                        }
                        resolve([]);
                    })
                });

                for (let media of medias) {
                    if (media.type == "photo") {
                        tweet_data.medias.push({
                            type: media.type,
                            link: media.url,
                            url: media.url  // same with tweet link text, useless?
                        });
                    }
                }
            }
            return tweet_data;
        },
    },

    api: {
        getTweet(id) {
            return new Promise((resolve, reject) => {
                _twitter.bot.get('statuses/show/' + id, { include_entities: true, include_ext_alt_text: true }, async (error, tweet, response) => {
                    // error ? console.log("error", JSON.stringify(error, null, 4)) : {};
                    // tweet ? console.log("tweet", JSON.stringify(tweet, null, 4)) : {};
                    // response ? console.log("response", JSON.stringify(response, null, 4)) : {};
                    // twitterCore.stream.getStreamData(tweet[0], "Aigis1000", (obj) => console.log(JSON.stringify(obj, null, 4)));
                    resolve(await _twitter.stream.getTweetData(tweet));
                });
            });
        }
    },

    /*
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
        crcFunctions(request, response) {
            for (let key in twitterCore.crc) {
                if (key == request.params.function) {
                    twitterCore.crc[key]();
                    response.send("twitterCore.crc." + key + "()");
                    return;
                }
            }
            //response.send("Unknown function");
        },
        get(request, response) {
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
        post(request, response) {
            if (config.switchVar.logRequestToFile && request.body) {
                dbox.logToFile("twitter/", "webhook", request.body);
            }
            response.send("200 OK");
        }
    },//*/

    /*async autoTest() {
        twitterCore.stream.litsen("Aigis1000", "", console.log);
    }//*/
};



/*
let count = 0;
searchTweet('(from:Aigis1000)');
function searchTweet(queryArg, nextResultsMaxIdArg = null) {
    bot.get('search/tweets', { q: queryArg, count: 10000, max_id: nextResultsMaxIdArg }, (error, searchData, response) => {
        for (item in searchData.statuses) {
            let tweet = searchData.statuses[item];
            // console.log('@' + tweet.user.screen_name + ' : ' + tweet.text); //実際に使う場合はここでファイルへ書き出しなどといった処理を行うことになると思います

            // if (!tweet.retweeted_status) {
            if (tweet.user.screen_name == "Aigis1000") {
                // console.log('@' + tweet.user.screen_name + '\n >>' + tweet.text); //実際に使う場合はここでファイルへ書き出しなどといった処理を行うことになると思います
                console.log('@' + tweet.user.screen_name + ' >> ' + tweet.created_at + ' >> ' + tweet.id + ' >> ' + (++count)); //実際に使う場合はここでファイルへ書き出しなどといった処理を行うことになると思います
                // console.log(JSON.stringify(tweet, null, 4));
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

/* showTweet("651955440129978368");
function showTweet(id) {
    bot.get('statuses/lookup', { id, include_entities: true, include_ext_alt_text: true }, (error, tweet, response) => {
        // bot.get('statuses/show/' + id, { include_entities: true, include_ext_alt_text: true }, (error, tweet, response) => {
        // error ? console.log("error", JSON.stringify(error, null, 4)) : {};
        tweet ? console.log("tweet", JSON.stringify(tweet, null, 4)) : {};
        // response ? console.log("response", JSON.stringify(response, null, 4)) : {};
        twitterCore.stream.getStreamData(tweet[0], "Aigis1000", (obj) => console.log(JSON.stringify(obj, null, 4)));
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

        let html = iconv.decode(Buffer.from(body, "binary"), "UTF-8"); // EUC-JP to utf8 // Shift_JIS EUC-JP
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

            }
        });


        //;
    }
    //request.get(srcUrl, { encoding: "binary" }, requestCallBack);
}//*/




