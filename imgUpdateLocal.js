
const fs = require("fs");
const path = require("path");
const request = require("request");
const anna = require("./anna.js");
const dbox = require("./dbox.js");
const imgur = require("./imgur.js");
const twitter = require("./twitter.js");
const md5f = function (str) { return require('crypto').createHash('md5').update(str).digest('hex'); }

twitter.init();

const main = async function () {
    console.log("Image Upload (Local) Script");
    await imgur.init();

    // delete all image from imgur
    // // // for (let i in imgur.database.images) { await imgur.image.ImageDeletion(imgur.database.images[i].id); }

    // save database
    console.log("== imgUploaderLocal.js ==");

    // get dropbox image list
    let pathArray = [];

    let loaclPath = "C:/Users/HUANG/Dropbox/應用程式/aigis1000secretary";

    // check album
    let albumList = ["Images"];
    for (let i in albumList) {
        let albumName = albumList[i];
        let albums = imgur.database.findAlbumData({ title: albumName });
        if (albums.length == 0) {
            // await imgur.api.album.albumCreation({ title: albumName, cover: "Tsupr1Z" });
            console.log("albums.length == 0");
            return;
        }
        // get filelist
        pathArray = pathArray.concat(await getFileList(loaclPath + "/" + albumList[i]));
    }

    // loop
    console.log("GET local Images count: " + pathArray.length);
    for (let i in pathArray) {
        let filePath = pathArray[i];
        let fileName = path.parse(filePath).base;

        if (!/^[A-Za-z0-9_]{5,15}-\d{18,19}-\d{8}_\d{6}/.test(fileName)) { continue; }
        // console.log("");
        // console.log(`[${i}/${pathArray.length}]fileName: ${fileName}`);

        // twitter data
        let twitterId = /\d{18,19}/.exec(fileName).toString();
        let tweet_data = await twitter.api.getTweet(twitterId);
        let imgnum = parseInt(/img\d/.exec(fileName).toString().replace("img", ""));
        // console.log("twitterId:", twitterId);
        // console.log("tweet_data:", JSON.stringify(tweet_data, null, 2));

        if (tweet_data.includes && Array.isArray(tweet_data.includes.media) &&
            tweet_data.includes.media.length > 0) {
            let media = tweet_data.includes.media[imgnum - 1];

            console.log("");
            console.log(`[${i}/${pathArray.length}]fileName: ${fileName}`);
            console.log("twitterId:", twitterId);

            // image data
            let imageBinaryOrig;
            let md5Orig;
            let imageBinaryLocal = fs.readFileSync(filePath);
            let md5Local = md5f(imageBinaryLocal);  // get MD5 for check

            // get orig
            await new Promise((resolve, reject) => {
                request.get(media.url + ":orig", { encoding: 'binary' }, async (error, response, body) => {
                    if (body) {
                        fs.writeFileSync("./" + fileName, body, { encoding: 'binary' });
                        imageBinaryOrig = fs.readFileSync("./" + fileName);
                        md5Orig = md5f(imageBinaryOrig);  // get MD5 for check
                        console.log(md5Orig)
                        fs.unlinkSync("./" + fileName);
                        resolve();
                    }
                    // if (error || !body) { return console.log(error); }
                });
            });

            // check md5
            if (md5Orig && md5Local != md5Orig) {
                console.log("\n", twitterId, imgnum, "md5");
                console.log(md5Local, md5Orig);

                let imgArray = imgur.database.findImageData({ md5: md5Local, isGif: true })
                if (imgArray.length != 1) {
                    console.log(`刪除錯誤: 目標異常! (${imgArray.length})`);
                    continue;
                }

                try {
                    let tagList = imgArray[0].tagList;
                    await imgur.api.image.imageDeletion({ imageHash: imgArray[0].id });
                    await dbox.fileMove(tagList.substring(1), "DelImages/" + fileName);
                    await sleep(10000);
                    fs.writeFileSync(filePath, imageBinaryOrig, { encoding: 'binary' });
                    console.log("writeFileSync!");

                } catch (error) {
                    console.log("刪除錯誤!");
                    console.log(error);
                    continue;
                }

            } else if (!md5Orig) {
                console.log("md5Orig", md5Orig);
            } else {
                console.log("...")
            }

        } else {
            console.log("cant found image data in", twitterId)
        }

        console.log("sleep()")
        await sleep();
    }


    // annaWebHook("status");
    // anna.replyAI("status");
    // checkImages();
    // console.log("done!")
    return;
};

// get local file list
let getFileList = function (dirPath) {
    let result = [];
    let apiResult = fs.readdirSync(dirPath);
    for (let i in apiResult) {
        if (fs.lstatSync(dirPath + "/" + apiResult[i]).isDirectory()) {
            result = result.concat(getFileList(dirPath + "/" + apiResult[i]));
        } else {
            result.push(dirPath + "/" + apiResult[i]);
        }
    }
    return result;
};

// check dbox img status
const checkImages = async function () {
    await imgur.init();

    // get dropbox image list
    let pathArray = [];

    // check album
    let albumList = ["AutoResponse", "Images"];
    for (let albumName of albumList) {
        // get filelist
        pathArray = pathArray.concat(await getFileList(albumName));
    }

    for (let img of imgur.database.images) {
        let path = img.tagList;
        let filename = img.imageLink.replace(`https://i.imgur.com/`, "");
        let pathInDbox = pathArray.find((p) => path.equali(p));
        if (!pathInDbox) {
            console.log(`${path} not exist in dropbox`);
            // await dbox.fileUpload(`DelImages/${filename}`, body);

            await new Promise((resolve, reject) => {
                require("request").get(img.imageLink, { encoding: 'binary' }, async (error, response, body) => {
                    if (body) {
                        fs.writeFileSync("./" + filename, body, { encoding: 'binary' });
                        body = fs.readFileSync("./" + filename);
                        await dbox.fileUpload("DelImages/" + filename, body);
                        fs.unlinkSync("./" + filename);
                        await imgur.api.image.imageDeletion({ imageHash: img.id });
                        resolve();
                    }
                    // if (error || !body) { return console.log(error); }
                });
            });
        }
    }

    console.log("done!")
}

module.exports = {
    upload: main
};
