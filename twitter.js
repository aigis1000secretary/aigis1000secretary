
// line bot
//const line = require("./line.js");

// ライブラリ読み込み
const twitter = require('twitter');

// 各種Twitter APIを使用するための情報を設定
const bot = new twitter({
    consumer_key: 'SGgqsJBKTDFD5c23wP9XZSBnl',
    consumer_secret: '7PpRpuCsWLHOS4k9he0G4kwuJEgPm0es4TNVJ0e3t4A2UckNVL',
    access_token_key: '1098066659091181568-Fop51vQihDLX8NzP6bW90SzrXPfzPR',
    access_token_secret: '0VkBus9NdwDjHoZMfEuTMNibKBgoOMVCYYDeS1E5XnuKf'
});

// 監視するユーザのIDを標準入力から取得

module.exports = {

    client: bot,

    get: function (target, callback) {
        var params = { screen_name: target };

        // 監視するユーザのツイートを取得
        bot.get('statuses/user_timeline', params, function (error, tweets, response) {
            if (!error) {
                // 取得したtweet情報よりユーザ固有IDを文字列形式で取得
                var user_id = tweets[0].user.id_str;
                // 取得したユーザIDよりストリーミングで使用するオプションを定義
                var option = { follow: user_id };
                console.log(target + 'のツイートを取得します。');

                // ストリーミングでユーザのタイムラインを監視
                bot.stream('statuses/filter', option, function (stream) {
                    stream.on('data', function (data) {
                        // 送信する情報を定義
                        var tweet_data = {
                            screen_name: data.user.screen_name,
                            created_at: data.created_at,
                            text: data.text,
                            geo: data.geo,
                        };
                        // 送信
                        callback(tweet_data);
                    });
                });
            } else {
                console.log(error);
                // line.botPushError(error);
            }
        });
    }
}










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




