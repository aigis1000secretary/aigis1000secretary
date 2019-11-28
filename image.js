
// const fs = require("fs");
const anna = require("./anna.js");
const dbox = require("./dbox.js");
const imgur = require("./imgur.js");
const twitter = require("./twitter.js");
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
    //     try {
    //         let imageBinary = await dbox.fileDownload(pathArray[i]);
    //         fs.writeFileSync(localImagesPath + pathArray[i].replaceAll("/", "\\"), imageBinary, "Binary");
    //     } catch (error) {
    //         console.log(error);
    //         continue;
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
            try {
                imageBinary = await dbox.fileDownload(pathArray[i]);
                fileMd5 = md5f(imageBinary);  // get MD5 for check
                resultImage = imgur.database.findImageData({ md5: fileMd5 });
            } catch (error) {
                console.log(error);
                continue;
            }
        }

        if (resultImage.length == 0) {
            // upload
            console.log("file is not exist: " + pathArray[i]);
            try {
                if (!imageBinary) imageBinary = await dbox.fileDownload(pathArray[i]);
                let uploadResponse = await imgur.api.image.imageUpload({ imageBinary, fileName, albumHash, tagList });
                if (uploadResponse == null) { break; }
                console.log("upload file: " + uploadResponse.title + ", " + fileName + ", " + tagList);
                console.log("");
                await sleep(25000);
            } catch (error) {
                console.log(error);
                continue;
            }
        } else if (resultImage.length == 1) {
            // check data
            // console.log("file already existed(file): " + pathArray[i]);
            let onlineImage = resultImage[0];
            let logFlag = false;

            // check album
            if (albumHash && onlineAlbum.findImage({ id: onlineImage.id }).length == 0) {
                console.log("Alarm!! Image is not in album!");
                // put in
                imgur.api.album.addAlbumImages({ albumHash: albumHash, ids: [onlineImage.id] });
                logFlag = true;
            }

            // check tag list
            if (onlineImage.tagList != tagList) {
                console.log("Alarm!! TagList incorrect! " + onlineImage.id);
                console.log(onlineImage.tagList, onlineImage.md5);
                console.log(tagList, fileMd5);
                // update image data
                await imgur.api.image.updateImage({ imageHash: onlineImage.id, tagList, md5: fileMd5 });
                logFlag = true;
            }

            // check filename
            if (onlineImage.fileName != fileName) {
                console.log("Alarm!! fileName incorrect!: https://imgur.com/" + onlineImage.id);
                // delete & upload again Manual
                console.log("Plz delete & upload again Manual!");
            }
            if (logFlag) console.log("");
        } else if (resultImage.length > 1) {
            // double upload
            console.log("many file have same data: " + pathArray[i]);
            for (let i in resultImage) {
                // delete all same image
                if (i != 0) imgur.api.image.imageDeletion({ imageHash: resultImage[i].id });
                console.log("Now delete file...");
            }
            console.log("");
        }
        continue;

    } // */

    // annaWebHook("status");
    console.log("done!")
    return;
};

// get dropbox file list
const getFileList = async function (mainFolder) {
    let pathArray = [];
    // get AutoResponse key word
    let dirArray = await dbox.listDir(mainFolder, "folder").catch(console.log);

    let dirList = Object.assign([], dirArray);
    while (dirList.length > 0) {
        let pArray = [];
        // 10 thread
        for (let i = 0, pop; i < 10 && (pop = dirList.pop()); ++i) {

            let dir = mainFolder + '/' + pop;
            let donemsg = "pathArray[" + dirList.length + "]: " + dir;
            pArray.push(
                dbox.listDir(dir).then(function (fileArray) {
                    console.log(donemsg);
                    for (let j in fileArray) {
                        // set AR image full path
                        pathArray.push(dir + "/" + fileArray[j]);
                    }
                }).catch(console.log));
        }
        await Promise.all(pArray);
    }

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

module.exports = {
    upload: main,
};
