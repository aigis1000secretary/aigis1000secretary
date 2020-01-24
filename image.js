
// const fs = require("fs");
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
    console.log("== image.js ==");

    // get dropbox image list
    let pathArray = [];

    // let albumList = ["AutoResponse", "Images"];
    let albumList = ["Images"];
    // let albumList = ["AutoResponse"];
    for (let i in albumList) {
        let albumName = albumList[i];
        let newPathArray = await getFileList(albumName);
        pathArray = pathArray.concat(newPathArray);

        if (imgur.database.findAlbumData({ title: albumName }).length == 0) {
            console.log("album not existed: " + albumName);
            await imgur.api.album.albumCreation({ title: albumName, cover: "LOuRzFE" });
            return;
        }
    }

    console.log("GET DBox Images count: " + pathArray.length);
    // console.log("pathArray = " + JSON.stringify(pathArray, null, 4));

    // image upload script
    for (let i in pathArray) {
        // split folder name for AR key word
        let parse = path.parse(pathArray[i]);
        let dboxPath = pathArray[i].replace(parse.root, "");
        let fileName = parse.base;
        let tagList = dboxPath.replace("/" + fileName, "").split("/").join(",");
        // console.log(albumName + ", <" + tagList + ">, " + fileName);

        // get albumHash
        let albumName = dboxPath.split("/")[0];
        let albumHash = "";
        let onlineAlbum = imgur.database.findAlbumData({ title: albumName });
        if (onlineAlbum.length != 0) { albumHash = onlineAlbum[0].id; }
        else { console.log("findAlbumData error: " + albumName); }

        let imageBinary = null, fileMd5 = "";
        let resultImage = [];
        // find by filename
        let tags = tagList.split(",");
        let mainTag = tags[tags.length - 1];
        resultImage = imgur.database.findImageData({ fileName, tag: mainTag });

        if (resultImage.length > 1) {
            // error
            console.log("[" + i + "/" + pathArray.length + "]");
            console.log("resultImage.length > 1 ", fileName, mainTag);
            console.log("");
            continue;
        }
        let flag = false;
        if (resultImage.length == 1) {
            // image exist
            let result = resultImage[0];
            let rId = result.id
            let rtagList = result.tagList
            let rfileName = result.fileName
            // let rmd5 = result.md5

            if (!rtagList.equali(tagList)) {
                console.log("[" + i + "/" + pathArray.length + "]");
                await imgur.api.image.updateImage({ imageHash: rId, tagList });
                console.log("resultImage.length == 1", fileName, mainTag);
                console.log("Update Image (" + rId + ") :" + rtagList + " -> " + tagList);
                await sleep(2 * 1000);
                continue;
            }
            if (!rfileName.equali(fileName)) {
                console.log("[" + i + "/" + pathArray.length + "]");
                await imgur.api.image.imageDeletion({ imageHash: rId });
                console.log("resultImage.length == 1", fileName, mainTag);
                console.log("Delete Image (" + rId + ")");
                flag = true;
                await sleep(2 * 1000);
            }
        }
        if (resultImage.length == 0 || flag) {
            // image is not exist
            imageBinary = await dbox.fileDownload(dboxPath);
            fileMd5 = md5f(imageBinary);  // get MD5 for check

            if (!flag) { console.log("[" + i + "/" + pathArray.length + "]"); }
            let uploadResponse = await imgur.api.image.imageUpload({ imageBinary, fileName, albumHash, tagList });
            if (uploadResponse != null) {

                console.log("Upload file: " + uploadResponse.title + ", " + fileName + ", " + tagList);
                await sleep(20 * 1000);
            }
            continue;
        }

        continue;

    } // */

    // annaWebHook("status");
    anna.replyAI("status");
    console.log("done!")
    return;
};

// get dropbox file list
const getFileList = async function (mainFolder) {
    let pathArray = [];

    let result = await dbox.listDir(mainFolder).catch(console.log);
    // filter
    let dirs = result.filter((obj) => ("folder" == obj[".tag"]));
    let files = result.filter((obj) => ("file" == obj[".tag"]));

    let listDirsTask = async function () {
        let pop;
        while (dirs.length > 0) {
            pop = dirs.pop();
            let _folder = pop.path_display;

            // console.log(_folder);
            let _result = await dbox.listDir(_folder).catch(console.log);

            let _dirs = _result.filter((obj) => ("folder" == obj[".tag"]));
            let _files = _result.filter((obj) => ("file" == obj[".tag"]));

            for (let obj in _dirs) { dirs.push(_dirs[obj]); }
            for (let obj in _files) { files.push(_files[obj]); }
        }
        // console.log("Thread done");
    };

    let pArray = [];
    for (let i = 0; i < 10; ++i) {
        pArray.push(listDirsTask());
        await sleep(500);
    }
    await Promise.all(pArray);

    for (let obj in files) { pathArray.push(files[obj].path_display); }

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
            html += str.replaceAll("<br>", "\n");
        });
        req.on('end', function () {
            console.info(html);
        });
    });
}
*/

module.exports = {
    upload: main,
    getFileList: getFileList,
};
