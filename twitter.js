

const fs = require('fs');
const path = require('path');

const Twitter = require('twitter');

const request = require("request");
const util = require('util');
const get = util.promisify(request.get);
// const post = util.promisify(request.post);

const _twitter = {
    oAuthConfig: null,
    devLabel: null,
    bot: null,
    stream: null,

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
                console.log(`[twitter] Cannot get tweet <${id}>`);
                console.log(req.body.errors)
                return null;
            }
        },

        // download tweet images & return filelist
        async getTweetImages(tweet_data, isAdmin) {
            let images = [];
            // image to file
            for (let i in tweet_data.includes.media) {
                let media = tweet_data.includes.media[i];

                if (media.type == "photo") {
                    // build img info
                    let tweetTime = new Date(Date.parse(tweet_data.data.created_at));
                    let timeString = tweetTime.toISOString().replace(/-|:|\.\d+Z/g, "").replace("T", "_");
                    let filename = `${tweet_data.includes.users[0].username}-${tweet_data.data.id}-${timeString}-img${parseInt(i) + 1}${path.parse(media.url).ext}`

                    // download image
                    // request.get(media.url + ":orig", { encoding: 'binary' }, async (error, response, body) => {
                    //     if (body) {
                    //         fs.writeFileSync("./" + filename, body, { encoding: 'binary' });
                    //         body = fs.readFileSync("./" + filename);
                    //         await dbox.fileUpload("Images/NewImages/" + filename, body);
                    //         fs.unlinkSync("./" + filename);
                    //     }
                    //     // if (error || !body) { return console.log(error); }
                    // });

                    // download image to file
                    const req = await get({ url: media.url + ":orig", encoding: 'binary' });
                    if (req.body) {
                        fs.writeFileSync("./" + filename, req.body, { encoding: 'binary' });
                        images.push("./" + filename);

                        let dbox = require("./dbox.js")
                        let img = fs.readFileSync("./" + filename);
                        await dbox.fileUpload(`/Images/NewImages/${isAdmin ? "" : "etc/"}${filename}`, img);
                        fs.unlinkSync("./" + filename);
                    }
                }
            }
            return images;
        },

        // async getUserData({ userName, userID }) {
        //     const endpointURL = new URL('https://api.twitter.com/1.1/users/lookup.json');
        //     const params = {
        //         screen_name: userName,
        //         user_id: userID,
        //         count: 1
        //     };

        //     const req = await get({ url: endpointURL, oauth: _twitter.oAuthConfig, qs: params, json: true });

        //     if (req.body && !req.body.errors) {
        //         return req.body[0];
        //         // req.body[0].name
        //         // req.body[0].id_str
        //     } else {
        //         console.log(req.body.errors)
        //         console.log(`Cannot get user <${{ userName, userID }}> ID`);
        //         throw new Error(`Cannot get user <${{ userName, userID }}> ID`);
        //     }
        // },

        // async getFriendIDs(screen_name) {
        //     const endpointURL = new URL('https://api.twitter.com/1.1/friends/ids.json');
        //     const params = { screen_name, stringify_ids: true };

        //     const req = await get({ url: endpointURL, oauth: _twitter.oAuthConfig, qs: params, json: true });

        //     if (req.body && !req.body.errors) {
        //         return req.body;
        //     } else {
        //         console.log(req.body.errors)
        //         console.log(`Cannot get user <${screen_name}>'s friends ID`);
        //         throw new Error(`Cannot get user <${screen_name}>'s friends ID`);
        //     }
        // },

        async getFriendList(screen_name) {
            const endpointURL = new URL('https://api.twitter.com/1.1/friends/list.json');
            const params = { screen_name, skip_status: true, include_user_entities: false };

            const req = await get({ url: endpointURL, oauth: _twitter.oAuthConfig, qs: params, json: true });

            if (req.body && !req.body.errors) {
                let names = [];
                for (let obj of req.body.users) { names.push(obj.screen_name); }
                return { names: names };
            } else {
                console.log(`[twitter]  ${req.body.errors}`)
                console.log(`Cannot get user <${screen_name}>'s friends Name`);
                throw new Error(`Cannot get user <${screen_name}>'s friends Name`);
            }
        },

        async getStreamByIDs(ids, callback) { _twitter.api.getStream({ follow: ids.join(',') }, callback); },
        async getStreamByNames(names, callback) { _twitter.api.getStream({ track: names.join(',') }, callback); },

        async getStream(params, callback) {

            if (_twitter.stream != null) { _twitter.stream.destroy(); }

            console.log(`[twitter] ツイートを取得します。`);
            let stream = _twitter.bot.stream('statuses/filter', params);

            // Streamingの開始と受取
            stream.on('data', (tweet) => {
                // console.log(`[data] tweet: ${tweet.id_str} `);
                // console.log(`       name : ${tweet.user.screen_name} `);
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
                    _twitter.api.getStream(params, callback);
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
    }
}

module.exports = {

    async init(twitterCfg) {
        // oauth認証に使う値
        _twitter.oAuthConfig = {
            consumer_key: twitterCfg.TWITTER_CONSUMER_KEY,
            consumer_secret: twitterCfg.TWITTER_CONSUMER_SECRET,
            token: twitterCfg.TWITTER_ACCESS_TOKEN,
            token_secret: twitterCfg.TWITTER_ACCESS_TOKEN_SECRET
        };
        _twitter.devLabel = twitterCfg.devLabel;

        // Twitterオブジェクトの作成
        let twitter_oauth = {
            consumer_key: twitterCfg.TWITTER_CONSUMER_KEY,
            consumer_secret: twitterCfg.TWITTER_CONSUMER_SECRET,
            access_token_key: twitterCfg.TWITTER_ACCESS_TOKEN,
            access_token_secret: twitterCfg.TWITTER_ACCESS_TOKEN_SECRET
        }
        _twitter.bot = new Twitter(twitter_oauth);

        if (_twitter.stream != null) { _twitter.stream.destroy(); }

        await _twitter.bot.get('statuses/user_timeline', { screen_name: "Aigis1000Anna" })
            .catch((error) => {
                console.log(error);
                _twitter.bot = null;
            })
    },

    enable() {
        if (_twitter.bot != null) return true;
        console.log("[twitter] twitter unable...");
        return false;
    },

    async listen(callback) {
        if (!module.exports.enable()) return null;

        // get target IDs
        // let response = await _twitter.api.getFriendIDs("Aigis1000Anna");
        // _twitter.api.getStreamByIDs(response.ids, async (tweet) => {

        let response = await _twitter.api.getFriendList("Aigis1000Anna");
        _twitter.api.getStreamByNames(response.names, async (tweet) => {
            // check then callback

            // RT除外
            if (!tweet || !tweet.user || tweet.retweeted_status) { return; }

            // // log
            // if (twitterCfg.logStreamToFile) {
            //     dbox.logToFile("twitter/", "litsen", tweet);
            // }

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

    api: {
        async getTweet(id) {
            if (!module.exports.enable()) return null;

            return await _twitter.api.getTweet(id);
        },
        async getTweetImages(tweet_data, isAdmin) {
            if (!module.exports.enable()) return null;

            return await _twitter.api.getTweetImages(tweet_data, isAdmin);
        }
    }
}