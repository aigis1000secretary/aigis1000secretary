
const fs = require("fs");
const path = require("path");
const anna = require("./anna.js");
const dbox = require("./dbox.js");
const imgur = require("./imgur.js");
const md5f = function (str) { return require('crypto').createHash('md5').update(str).digest('hex'); }


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
    let albumList = ["AutoResponse", "Images"];
    for (let i in albumList) {
        let albumName = albumList[i];
        let albums = imgur.database.findAlbumData({ title: albumName });
        if (albums.length == 0) {
            // await imgur.api.album.albumCreation({ title: albumName, cover: "vtHXE4B" });
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
        let resultImage = imgur.database.findImageData({ md5, isGif: true });
        //  console.log("[", i, "/", pathArray.length, "]");

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
            await sleep(20 * 1000);

            continue;
        } else {
            console.log("[", i, "/", pathArray.length, "] result.length > 1");
            for (let j in resultImage) {
                await imgur.api.image.imageDeletion({ imageHash: resultImage[j].id })
            }
            await imgur.api.image.imageUpload({ imageBinary, fileName, md5, albumHash, tagList });

            continue;
        }
    }


    // annaWebHook("status");
    // anna.replyAI("status");
    checkImages();
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
                require("request").get(img.imageLink)
                    .pipe(fs.createWriteStream("./" + filename))
                    .on("error", (e) => { console.log("pipe error", e) })
                    .on("close", async () => {
                        let body = fs.readFileSync("./" + filename);
                        await dbox.fileUpload("DelImages/" + filename, body);
                        fs.unlinkSync("./" + filename);
                        await imgur.api.image.imageDeletion({ imageHash: img.id });
                        resolve();
                    });
            });
        }
    }

    console.log("done!")
}

module.exports = {
    upload: main
};
