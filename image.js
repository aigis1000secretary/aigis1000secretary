
// const fs = require("fs");
const anna = require("./anna.js");
const dbox = require("./dbox.js");
const imgur = require("./imgur.js");
const twitter = require("./twitter.js");
const md5f = function (str) { return require('crypto').createHash('md5').update(str).digest('hex'); }


const main = async function () {
    console.log("Image Upload Script");
    // await imgur.init();

    // delete all image from imgur
    // // // for (let i in imgur.database.images) { await imgur.image.ImageDeletion(imgur.database.images[i].id); }

    // save database
    console.log("== image.js ==");

    // get dropbox image list
    let pathArray = [];

    let albumList = ["AutoResponse", "Character", "NewImages"];
    for (let i in albumList) {
        let albumName = albumList[i];
        let newPathArray = await getFileList(albumName);
        pathArray = pathArray.concat(newPathArray);

        if (imgur.database.findAlbumData({ title: albumName }).length == 0) {
            console.log("album not existed: " + albumName);
            // await imgur.api.album.albumCreation({ title: albumName });
            return;
        }
    }

    console.log("GET DBox Images count: " + pathArray.length);
    // console.log("pathArray = " + JSON.stringify(pathArray, null, 4));

    // // download all image
    // for (let i in pathArray) {
    //     console.log(pathArray[i]);
    //     let imageBinary = await dbox.fileDownload(pathArray[i]);
    //     if (imageBinary) {
    //         fs.writeFileSync(localImagesPath + pathArray[i].replaceAll("/", "\\"), imageBinary, "Binary");
    //     } else {
    //         console.log(error);
    //     }
    // }

    // image upload script
    for (let i in pathArray) {
        // split folder name for AR key word
        let parameter = pathArray[i].split("/");
        let albumName = parameter[0];
        let tagList = (albumName == parameter[1] ? albumName : albumName + "," + parameter[1]);
        let fileName = parameter[2];
        // console.log(albumName + ", <" + tagList + ">, " + fileName);

        let resultImage = [];
        let onlineAlbum = imgur.database.findAlbumData({ title: albumName })[0];
        if (onlineAlbum.length == 0) { console.log("findAlbumData error: " + albumName); }
        let albumHash = onlineAlbum.id;
        let imageBinary = null, fileMd5 = "";

        // filename check
        resultImage = imgur.database.findImageData({ fileName, tag: tagList.split(",")[1] });
        if (resultImage.length != 1) {
            // md5 check
            imageBinary = await dbox.fileDownload(pathArray[i]);
            if (imageBinary) {
                fileMd5 = md5f(imageBinary);  // get MD5 for check
                resultImage = imgur.database.findImageData({ md5: fileMd5 });
            } else {
                continue;
            }
        }

        if (resultImage.length == 0) {
            // upload
            console.log("file is not exist: " + pathArray[i]);
            if (!imageBinary) imageBinary = await dbox.fileDownload(pathArray[i]);
            if (imageBinary) {
                let uploadResponse = await imgur.api.image.imageUpload({ imageBinary, fileName, albumHash, tagList });
                if (uploadResponse == null) { break; }
                console.log("upload file: " + uploadResponse.title + ", " + fileName + ", " + tagList);
                console.log("");
                await sleep(10000);
            }
        } else if (resultImage.length == 1) {
            // check data
            // console.log("file already existed(file): " + pathArray[i]);
            let onlineImage = resultImage[0];

            // check album
            if (albumHash && onlineAlbum.findImage({ id: onlineImage.id }).length == 0) {
                console.log("Alarm!! Image is not in album!");
                // put in
                imgur.api.album.addAlbumImages({ albumHash: albumHash, ids: [onlineImage.id] });
                console.log("");
            }

            // check tag list
            if (onlineImage.tagList != tagList) {
                console.log("Alarm!! TagList incorrect! " + onlineImage.id);
                console.log(onlineImage.tagList, onlineImage.md5);
                console.log(tagList, fileMd5);
                // update image data
                await imgur.api.image.updateImage({ imageHash: onlineImage.id, tagList, md5: fileMd5 });
                console.log("");
            }

            // check filename
            if (onlineImage.fileName != fileName) {
                console.log("Alarm!! fileName incorrect!: https://imgur.com/" + onlineImage.id);
                // delete & upload again Manual
                console.log("Plz delete & upload again Manual!");
            }
        } else if (resultImage.length > 1) {
            // double upload
            console.log("many file have same data: " + pathArray[i]);
            for (let i in resultImage) {
                // delete all same image
                if (i != 0) imgur.api.image.imageDeletion({ imageHash: resultImage[i].id });
                console.log("Now delete file...");
            }
        }
        continue;

    } // */

    // annaWebHook("statu");
    console.log("done!")
    return;
};

// get dropbox file list
const getFileList = async function (mainFolder) {
    let pathArray = [];
    // get AutoResponse key word
    let dirArray = await dbox.listDir(mainFolder, "folder").catch(console.log);
    let promiseArray = [];

    for (let i in dirArray) {
        // set AR image path
        dirArray[i] = mainFolder + "/" + dirArray[i];

        // get AR image name
        promiseArray.push(
            dbox.listDir(dirArray[i])
                .then(function (fileArray) {
                    for (let j in fileArray) {
                        // set AR image full path
                        pathArray.push(dirArray[i] + "/" + fileArray[j]);
                        // console.log("pathArray: " + pathArray[pathArray.length - 1]);
                    }
                }
                ).catch(console.log)
        );
    }

    await Promise.all(promiseArray);

    return pathArray;
}
/*
const http = require('http');
const annaWebHook = function (command) {
    const webhookUrl = "http://aigis1000secretary.herokuapp.com/";
    // const webhookUrl = "http://127.0.0.1:8080/";

    http.get(webhookUrl + "anna/" + command, function (req, res) {
        let html = '';
        req.on('data', function (data) {
            let str = new String(data);
            html += str.replaceAll("<br>", "\n");;
        });
        req.on('end', function () {
            console.info(html);
        });
    });
}
*/

const twitterImageSearch = async function () {
    let imgArray = imgur.database.findImageData({ tag: "NewImages" });
    if (imgArray.length > 0) {

        let _regex1 = /^Aigis1000-\d{18,19}-\d{8}_\d{6}/;
        let _regex2 = /\d{18,19}/;
        for (let i in imgArray) {
            let img = imgArray[i];

            let fn = img.fileName;
            if (_regex1.test(fn)) {
                let tweetId = _regex2.exec(fn);
                // let data = await 
                data = await twitter.api.getTweet(tweetId);

                console.log(tweetId);
                console.log(img.md5);
                let text = anna.searchData(data.text) + "";
                console.log(text);

                // console.log(tweetId);
                // console.log(img.md5);
                // console.log(anna.searchData(data.text));

            }
            break;
        }
    }
}

module.exports = {
    upload: main,
    twitterImageSearch: twitterImageSearch
};
