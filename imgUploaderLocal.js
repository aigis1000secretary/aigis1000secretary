
const fs = require("fs");
const path = require("path");
const anna = require("./anna.js");
const dbox = require("./dbox.js");
const imgur = require("./imgur.js");
const md5f = function (str) { return require('crypto').createHash('md5').update(str).digest('hex'); }


const main = async function () {
    console.log("Image Upload Script");
    await imgur.init();

    // delete all image from imgur
    // // // for (let i in imgur.database.images) { await imgur.image.ImageDeletion(imgur.database.images[i].id); }

    // save database
    console.log("== imgUploader.js ==");

    // get dropbox image list
    let pathArray = [];

    let loaclPath = "C:/Users/Mirror/Dropbox/應用程式/aigis1000secretary";

    // check album
    let albumList = ["AutoResponse", "Images"];
    for (let i in albumList) {
        let albumName = albumList[i];
        let albums = imgur.database.findAlbumData({ title: albumName });
        if (albums.length == 0) {
            await imgur.api.album.albumCreation({ title: albumName, cover: "vtHXE4B" });
        }
        // get filelist
        pathArray = pathArray.concat(await getFileList(loaclPath + "/" + albumList[i]));
    }

    // loop
    console.log("GET local Images count: " + pathArray.length);
    for (let i in pathArray) {
        let filePath = pathArray[i];

        // image data
        let imageBinary = fs.readFileSync(filePath);
        // image var
        let md5 = md5f(imageBinary);  // get MD5 for check
        let tagList = filePath.replace(loaclPath, "");
        let fileName = path.parse(filePath).base;
        // album id
        let albumHash = "";
        let albums = imgur.database.findAlbumData({ title: tagList.substring(1, tagList.indexOf("/", 1)) });
        if (albums.length != 0) { albumHash = albums[0].id; }

        // get image data
        let resultImage = imgur.database.findImageData({ fileName, isGif: true });

        //
        if (resultImage.length == 1) {
            if (!resultImage[0].tagList.equali(tagList)) {
                console.log("[", i, "/", pathArray.length, "] result.length == 1");
                await imgur.api.image.updateImage({ imageHash: resultImage[0].id, tagList, md5 });
            }

            continue;
        }

        if (resultImage.length == 0) {
            console.log("[", i, "/", pathArray.length, "] result.length == 0");
            await imgur.api.image.imageUpload({ imageBinary, fileName, md5, albumHash, tagList });

            continue;
        } else {
            console.log("[", i, "/", pathArray.length, "] result.length > 1");
            for (let j in resultImage) {
                if (resultImage[j].md5 != md5) {
                    await imgur.api.image.imageDeletion({ imageHash: resultImage[j].id })
                }
            }
            await imgur.api.image.imageUpload({ imageBinary, fileName, md5, albumHash, tagList });

            continue;
        }
    }


    // annaWebHook("status");
    anna.replyAI("status");
    console.log("done!")
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

module.exports = {
    upload: main,
};
