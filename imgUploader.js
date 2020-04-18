
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

    // check album
    let albumList = ["AutoResponse", "Images"];
    for (let i in albumList) {
        let albumName = albumList[i];
        let albums = imgur.database.findAlbumData({ title: albumName });
        if (albums.length == 0) {
            await imgur.api.album.albumCreation({ title: albumName, cover: "vtHXE4B" });
        }
        // get filelist
        pathArray = pathArray.concat(await getFileList(albumList[i]));
    }

    // loop
    console.log("GET DBox Images count: " + pathArray.length);
    for (let i in pathArray) {
        let filePath = pathArray[i];

        // image data
        let imageBinary = null;
        // image var
        let md5 = null;  // get MD5 for check
        let tagList = filePath;
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

        imageBinary = await dbox.fileDownload(dboxPath);
        md5 = md5f(imageBinary);  // get MD5 for check
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

// get dropbox file list
const getFileList = async function (mainFolder) {
    let result = [];
    let apiResult = await dbox.listDir(mainFolder).catch(console.log);
    // filter
    let dirs = apiResult.filter((obj) => ("folder" == obj[".tag"]));
    let files = apiResult.filter((obj) => ("file" == obj[".tag"]));

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

    for (let obj in files) { result.push(files[obj].path_display); }

    return result;
};

module.exports = {
    upload: main,
};
