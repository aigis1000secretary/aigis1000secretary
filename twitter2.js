

const fs = require('fs');
const path = require('path');

const { ETwitterStreamEvent, TwitterApi } = require('twitter-api-v2');
const _options = {
    full: {
        'expansions': ['attachments.poll_ids', 'attachments.media_keys', 'author_id', 'entities.mentions.username', 'geo.place_id', 'in_reply_to_user_id', 'referenced_tweets.id', 'referenced_tweets.id.author_id'],
        'media.fields': ['duration_ms', 'height', 'media_key', 'preview_image_url', 'type', 'url', 'width', 'public_metrics', 'alt_text', 'variants'],
        'place.fields': ['contained_within', 'country', 'country_code', 'full_name', 'geo', 'id', 'name', 'place_type'],
        'poll.fields': ['duration_minutes', 'end_datetime', 'id', 'options', 'voting_status'],
        'tweet.fields': ['attachments', 'author_id', 'context_annotations', 'conversation_id', 'created_at', 'entities', 'geo', 'id', 'in_reply_to_user_id', 'lang', 'public_metrics', 'possibly_sensitive', 'referenced_tweets', 'reply_settings', 'source', 'text', 'withheld'],
        'user.fields': ['created_at', 'description', 'entities', 'id', 'location', 'name', 'pinned_tweet_id', 'profile_image_url', 'protected', 'public_metrics', 'url', 'username', 'verified', 'withheld'],
    },
    default: {
        'expansions': ['attachments.media_keys', 'author_id', 'entities.mentions.username'],
        'media.fields': ['height', 'media_key', 'preview_image_url', 'type', 'url', 'width', 'alt_text'],
        'tweet.fields': ['attachments', 'author_id', 'created_at', 'entities', 'id', 'source', 'text'],
        'user.fields': ['created_at', 'description', 'entities', 'id', 'location', 'name', 'profile_image_url', 'public_metrics', 'url', 'username']
    },
    stream: {
        'expansions': ['author_id'],
        'media.fields': ['url', 'alt_text'],
        'tweet.fields': ['author_id', 'created_at', 'entities', 'id', 'text'],
    }
}

const dbox = require("./dbox.js")

const request = require("request");
const util = require('util');
const get = util.promisify(request.get);
// const post = util.promisify(request.post);

function sleep(ms) { return new Promise((resolve) => { setTimeout(resolve, ms); }); }

class Twitter {


    async getUserID(username) {
        const user = await this.client.v2.userByUsername(username);
        return user?.data?.id || null;
    }

    async getUsers(IDs) {
        const users = await this.client.v2.users(IDs);
        return users?.data || [];
        // [{ id: '2186926766', name: 'タクシキ', username: 'z1022001' }]
    }

    async getFollowingIDs(userID) {
        const followings = await this.client.v2.following(userID);
        let usernames = [];
        for (let followingUser of followings?.data || []) {
            usernames.push(followingUser.username);
        }
        return usernames;
    }

    async getStreamRules() {
        let rules = await this.client.v2.streamRules();
        return rules?.data || [];
    }

    getTweet(tweetId, options = _options.default) {
        return this.client.v2.singleTweet(tweetId, options).catch(console.log);
    }

    getTweetsList(username, options = _options.default) {
        return this.client.v2.search(`from:${username} -is:retweet`, options).catch(console.log);
    }

    getTweets(query, options = _options.default) {
        return this.client.v2.search(query, options).catch(console.log);
    }

    // stream
    stream = null;
    streamError = '';
    async fillback(timeInMin) {
        const nowTime = Date.now();
        let fillback = [];

        // check online filter rule
        let onlineRules = await this.getStreamRules();
        for (let { id, value, tag } of onlineRules) {

            // get recent tweets
            let recentTweets = await this.getTweets(value);
            for await (const tweet of recentTweets) {

                // filter tweet in 20 min
                let createTime = new Date(tweet.created_at).getTime();
                if (nowTime - createTime > 1000 * 60 * timeInMin) { break; }

                // set dummy event data
                let eventData =
                    fillback.find((eventData) => (eventData.data?.id == tweet.id))  // check fillback array
                    || { data: tweet, matching_rules: [] };  // build new eventData
                eventData.matching_rules.push({ id, tag })  // set match rule
                // keep event data
                fillback.push(eventData);
            }
        }
        // sort by time
        fillback.sort((a, b) => {
            let iA = (new Date(a.data?.created_at).getTime());
            let iB = (new Date(b.data?.created_at).getTime());
            return iA == iB ? 0 : (iA < iB ? -1 : 1);
        });
        return fillback;
    }

    initStream() {
        // normal init
        let options = _options.stream;
        options.autoConnect = false;

        let stream = this.client.v2.searchStream(options);

        // normal event
        // stream.on(ETwitterStreamEvent.ConnectError, (err) => console.log('[TL2] Connect error: ', err.message || err));
        stream.on(ETwitterStreamEvent.ConnectionClosed, () => console.log('[TL2] Connection has been closed.'));
        stream.on(ETwitterStreamEvent.ConnectionLost, () => console.log('[TL2] Connection lost.'));

        // stream.on(ETwitterStreamEvent.ReconnectAttempt, () => console.log('[TL2] Reconnect attempt'));
        // stream.on(ETwitterStreamEvent.ReconnectError, (err) => console.log('[TL2] Reconnect error: ', err.message || err));
        stream.on(ETwitterStreamEvent.ReconnectLimitExceeded, () => console.log('[TL2] Reconnect limit exceeded'));

        stream.on(ETwitterStreamEvent.DataError, (err) => console.log('[TL2] Data twitter error: ', err.message || err));
        stream.on(ETwitterStreamEvent.TweetParseError, (err) => console.log('[TL2] Data tweet parse error: ', err.message || err));

        // keep connect alive
        stream.on(ETwitterStreamEvent.DataKeepAlive, () => {
            // console.log('[TL2] Received keep alive event');
            (() => { })();
        });

        // Connected / Reconnected
        stream.on(ETwitterStreamEvent.Connected, async () => console.log('[TL2] Connected!'));
        stream.on(ETwitterStreamEvent.Reconnected, async () => {
            if (this.streamError) { console.log(this.streamError); this.streamError = ''; }
            console.log('[TL2] Reconnected!');
        });

        // ECONNRESET
        stream.on(ETwitterStreamEvent.ConnectionError, err => console.log('[TL2] Connection error!: ', err.message || err));
        stream.on(ETwitterStreamEvent.Error, async (err) => {
            let error = `[TL2] Stream error: ${err.message || err}`;
            if (error.includes('Reconnect error')) { this.streamError = error; }
            else { console.log(error); }
        });

        return stream;
    }
    async listen(callback) {
        // init stream
        if (!this.stream) {
            this.stream = this.initStream();
        }

        // // manual fillback data for debug
        // let fillback = await this.fillback(300);
        // for (let eventData of fillback) { await callback(eventData); }

        // backfill 30 minutes data
        this.stream.on(ETwitterStreamEvent.Connected, async () => {
            // fillback data to callback
            let fillback = await this.fillback(30);
            for (let eventData of fillback) { await callback(eventData); }
        });
        this.stream.on(ETwitterStreamEvent.Reconnected, async () => {
            // fillback data to callback
            let fillback = await this.fillback(30);
            for (let eventData of fillback) { await callback(eventData); }
        });

        // data event
        this.stream.on(ETwitterStreamEvent.Data, callback);

        if (this.interval != null) { clearTimeout(this.interval); }
        // start connect
        this.interval = setTimeout(async () => {
            await this.stream.connect({
                autoReconnect: true, autoReconnectRetries: Infinity,
                nextRetryTimeout:
                    (tryOccurence) => (([5, 10, 15, 30, 60, 90, 120, 150, 180, 360, 600][tryOccurence - 1] || 900) * 1000)
            })
                .catch((e) => { console.log(`[TL2] v2.searchStream() error! ${e.message}`) });
        }, 5000);
    }
    // async forceReconnect() {
    //     this.stream?.destroy();
    //     await sleep(30 * 1000);
    //     // restart stream
    //     await this.listen();
    // }
}







module.exports = {

    core: null,
    api403: false,

    client: new TwitterApi(),
    async init({ bearerToken }) {
        this.client = new TwitterApi(bearerToken);

        if (await this.getUserID('Aigis1000') == null) { this.api403 = true; }
    },

    async getUserID(username) {
        const user = await this.client.v2.userByUsername(username).catch((e) => console.log(e.message));
        return user?.data?.id || null;
    },

    async getUsers(IDs) {
        const users = await this.client.v2.users(IDs).catch((e) => console.log(e.message));
        return users?.data || [];
        // [{ id: '2186926766', name: 'タクシキ', username: 'z1022001' }]
    },

    async getFollowingIDs(userID) {
        const followings = await this.client.v2.following(userID).catch((e) => console.log(e.message));
        let usernames = [];
        for (let followingUser of followings?.data || []) {
            usernames.push(followingUser.username);
        }
        return usernames;
    },

    async getStreamRules() {
        let rules = await this.client.v2.streamRules();
        return rules?.data || [];
    },

    getTweet(tweetId, options = _options.default) {
        return this.client.v2.singleTweet(tweetId, options).catch((e) => console.log(e.message));
    },

    getTweetsList(username, options = _options.default) {
        return this.client.v2.search(`from:${username} -is:retweet`, options).catch((e) => console.log(e.message));
    },

    getTweets(query, options = _options.default) {
        return this.client.v2.search(query, options).catch((e) => console.log(e.message));
    },

    async getTweetImages(tweet) {
        let images = [];
        // image to file
        for (let i in tweet?.includes?.media || []) {
            let media = tweet.includes.media[i];

            if (media.type == "photo") {
                // build img info
                let tweetTime = new Date(tweet.data.created_at);
                let timeString = tweetTime.toISOString().replace(/-|:|\.\d+Z/g, "").replace("T", "_");
                let filename = `${tweet.includes.users[0].username}-${tweet.data.id}-${timeString}-img${parseInt(i) + 1}${path.parse(media.url).ext}`

                // download image to file
                const req = await get({ url: media.url + ":orig", encoding: 'binary' });
                if (req.body) {
                    fs.writeFileSync("./" + filename, req.body, { encoding: 'binary' });
                    images.push("./" + filename);

                    let img = fs.readFileSync("./" + filename);
                    await dbox.fileUpload(`/Images/NewImages/${tweet.includes.users[0].username}/${filename}`, img);
                    fs.unlinkSync("./" + filename);
                }
            }
        }
        return images;
    },

    getTweetList(username, options = _options.default) {
        return this.client.v2.search(`from:${username} -is:retweet -is:reply -is:quote`, options).catch(console.log);
    },

    // stream
    stream: null,
    streamError: '',
    async fillback(timeInMin) {
        const nowTime = Date.now();
        let fillback = [];

        // check online filter rule
        let onlineRules = await this.getStreamRules();
        for (let { id, value, tag } of onlineRules) {

            // get recent tweets
            let recentTweets = await this.getTweets(value);
            for await (const tweet of recentTweets) {

                // filter tweet in 20 min
                let createTime = new Date(tweet.created_at).getTime();
                if (nowTime - createTime > 1000 * 60 * timeInMin) { break; }

                // set dummy event data
                let eventData =
                    fillback.find((eventData) => (eventData.data?.id == tweet.id))  // check fillback array
                    || { data: tweet, matching_rules: [] };  // build new eventData
                eventData.matching_rules.push({ id, tag })  // set match rule
                // keep event data
                fillback.push(eventData);
            }
        }
        // sort by time
        fillback.sort((a, b) => {
            let iA = (new Date(a.data?.created_at).getTime());
            let iB = (new Date(b.data?.created_at).getTime());
            return iA == iB ? 0 : (iA < iB ? -1 : 1);
        });
        return fillback;
    },

    initStream() {
        // normal init
        let options = _options.stream;
        options.autoConnect = false;

        let stream = this.client.v2.searchStream(options);

        // normal event
        // stream.on(ETwitterStreamEvent.ConnectError, (err) => console.log('[TL2] Connect error: ', err.message || err));
        stream.on(ETwitterStreamEvent.ConnectionClosed, () => console.log('[TL2] Connection has been closed.'));
        stream.on(ETwitterStreamEvent.ConnectionLost, () => console.log('[TL2] Connection lost.'));

        // stream.on(ETwitterStreamEvent.ReconnectAttempt, () => console.log('[TL2] Reconnect attempt'));
        // stream.on(ETwitterStreamEvent.ReconnectError, (err) => console.log('[TL2] Reconnect error: ', err.message || err));
        stream.on(ETwitterStreamEvent.ReconnectLimitExceeded, () => console.log('[TL2] Reconnect limit exceeded'));

        stream.on(ETwitterStreamEvent.DataError, (err) => console.log('[TL2] Data twitter error: ', err.message || err));
        stream.on(ETwitterStreamEvent.TweetParseError, (err) => console.log('[TL2] Data tweet parse error: ', err.message || err));

        // keep connect alive
        stream.on(ETwitterStreamEvent.DataKeepAlive, () => {
            // console.log('[TL2] Received keep alive event');
            (() => { })();
        });

        // Connected / Reconnected
        stream.on(ETwitterStreamEvent.Connected, async () => console.log('[TL2] Connected!'));
        stream.on(ETwitterStreamEvent.Reconnected, async () => {
            if (this.streamError) { console.log(this.streamError); this.streamError = ''; }
            console.log('[TL2] Reconnected!');
        });

        // ECONNRESET
        stream.on(ETwitterStreamEvent.ConnectionError, err => console.log('[TL2] Connection error!: ', err.message || err));
        stream.on(ETwitterStreamEvent.Error, async (err) => {
            let error = `[TL2] Stream error: ${err.message || err}`;
            if (error.includes('Reconnect error')) { this.streamError = error; }
            else { console.log(error); }
        });

        return stream;
    },
    async listen(callback) {
        // init stream
        if (!this.stream) {
            this.stream = this.initStream();
        }

        // // manual fillback data for debug
        // let fillback = await this.fillback(300);
        // for (let eventData of fillback) { await callback(eventData); }

        // backfill 30 minutes data
        this.stream.on(ETwitterStreamEvent.Connected, async () => {
            // fillback data to callback
            let fillback = await this.fillback(30);
            for (let eventData of fillback) { await callback(eventData); }
        });
        this.stream.on(ETwitterStreamEvent.Reconnected, async () => {
            // fillback data to callback
            let fillback = await this.fillback(30);
            for (let eventData of fillback) { await callback(eventData); }
        });

        // data event
        this.stream.on(ETwitterStreamEvent.Data, callback);

        if (this.interval != null) { clearTimeout(this.interval); }
        // start connect
        this.interval = setTimeout(async () => {
            await this.stream.connect({
                autoReconnect: true, autoReconnectRetries: Infinity,
                nextRetryTimeout:
                    (tryOccurence) => (([5, 10, 15, 30, 60, 90, 120, 150, 180, 360, 600][tryOccurence - 1] || 900) * 1000)
            })
                .catch((e) => { console.log(`[TL2] v2.searchStream() error! ${e.message}`) });
        }, 5000);
    },
}