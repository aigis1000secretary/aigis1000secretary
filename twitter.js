

// ライブラリ読み込み
const fs = require('fs');
const path = require('path');

const Twitter = require('twitter');
const request = require("request");
const util = require('util');
const get = util.promisify(request.get);
const post = util.promisify(request.post);

// const crypto = require('crypto');
const config = require("./config.js");
const dbox = require("./dbox.js");




const _twitter = module.exports = {
    bot: null,
    stream: null,
    oAuthConfig: null,
    init() {
        // oauth認証に使う値
        _twitter.oAuthConfig = {
            consumer_key: config.twitterCfg.TWITTER_CONSUMER_KEY.trim(),
            consumer_secret: config.twitterCfg.TWITTER_CONSUMER_SECRET.trim(),
            token: config.twitterCfg.TWITTER_ACCESS_TOKEN.trim(),
            token_secret: config.twitterCfg.TWITTER_ACCESS_TOKEN_SECRET.trim()
        };
        // Twitterオブジェクトの作成
        let twitter_oauth = {
            consumer_key: _twitter.oAuthConfig.consumer_key,
            consumer_secret: _twitter.oAuthConfig.consumer_secret,
            access_token_key: _twitter.oAuthConfig.token,
            access_token_secret: _twitter.oAuthConfig.token_secret
        }
        _twitter.bot = new Twitter(twitter_oauth);
        if (_twitter.stream != null) { _twitter.stream.destroy(); }
    },

    async listen(callback) {

        // get target IDs
        let response = await _twitter.api.getFriendsID("Aigis1000anna");
        _twitter.api.getStreamByIDs(response.ids, async (tweet) => {
            // check then callback

            // RT除外
            if (!tweet || !tweet.user || tweet.retweeted_status) { return; }

            // log
            if (config.switchVar.logStreamToFile) {
                dbox.logToFile("twitter/", "litsen", tweet);
            }

            // 送信する情報を定義
            try {
                let tweet_data = await _twitter.api.getTweet(tweet.id_str);
                if (tweet_data) { callback(tweet_data) };

            } catch (e) {   // http error
                console.log(JSON.stringify(e, null, 2));
                return;
            }
        });
    },

    data: {
        getTweetImages(tweet_data) {
            // image to dropbox
            for (let i in tweet_data.includes.media) {
                let media = tweet_data.includes.media[i];

                if (media.type == "photo") {
                    let tweetTime = new Date(Date.parse(tweet_data.data.created_at));
                    let timeString = tweetTime.toISOString().replace(/-|:|\.\d+Z/g, "").replace("T", "_");
                    let filename = `${tweet_data.includes.users[0].username}-${tweet_data.data.id}-${timeString}-img${parseInt(i) + 1}${path.parse(media.url).ext}`

                    request.get(media.url + ":orig", { encoding: 'binary' }, async (error, response, body) => {
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
        }
    },

    api: {
        async getTweet(id) {
            const endpointURL = new URL('https://api.twitter.com/labs/2/tweets/' + id);
            const params = {
                'expansions': 'attachments.media_keys,author_id',
                'media.fields': 'url',
                'tweet.fields': 'created_at'
            };

            const req = await get({ url: endpointURL, oauth: _twitter.oAuthConfig, qs: params, json: true });

            if (req.body) {
                return req.body;
            } else {
                // throw new Error(`Cannot get tweet <${id}>`);
                console.log(`Cannot get tweet <${id}>`);
                return null;
            }
        },
        async getUserID(userName) {
            const endpointURL = new URL('https://api.twitter.com/1.1/statuses/user_timeline.json');
            const params = {
                screen_name: userName,
                count: 1
            };

            const req = await get({ url: endpointURL, oauth: _twitter.oAuthConfig, qs: params, json: true });

            if (req.body) {
                return req.body;
            } else {
                throw new Error(`Cannot get user <${userName}> ID`);
            }
        },
        async getFriendsID(screen_name) {
            const endpointURL = new URL('https://api.twitter.com/1.1/friends/ids.json');
            const params = { screen_name };

            const req = await get({ url: endpointURL, oauth: _twitter.oAuthConfig, qs: params, json: true });

            if (req.body) {
                return req.body;
            } else {
                throw new Error(`Cannot get user <${screen_name}>'s friends ID`);
            }
        },

        getStreamByIDs(ids, callback) {
            const params = { follow: ids.join(',') };

            if (_twitter.stream != null) { _twitter.stream.destroy(); }

            console.log(`[twitter] ツイートを取得します。`);
            let stream = _twitter.bot.stream('statuses/filter', params);

            // Streamingの開始と受取
            stream.on('data', (tweet) => {
                // console.log(`[data] tweet: ${tweet.id_str}`);
                // console.log(`       name : ${tweet.user.screen_name}`);
                callback(tweet);
            });

            // エラー時は再接続を試みた方がいいかもしれません(未検証)
            stream.on('error', (error) => {
                console.log(`[twitter] error: ${error}`);
                if (error.source) callback(error.source);
            });

            // 接続が切れた際の再接続
            stream.on('end', () => {
                console.log(`[twitter] ツイートを取得終了。`);
                stream.destroy();

                setTimeout(() => {
                    _twitter.api.getStreamByIDs(ids, callback);
                }, 60 * 1000);
            });

            // // 接続開始時にはフォロワー情報が流れます
            // stream.on('friends', function (tweet) { console.log(JSON.stringify(tweet)); });
            // // つい消しの場合                    
            // stream.on('delete', function (tweet) { console.log(JSON.stringify(tweet)); });
            // // 位置情報の削除やふぁぼられといったeventはここに流れます
            // stream.on('event', function (tweet) { console.log(JSON.stringify(tweet)); });

            _twitter.stream = stream;
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



