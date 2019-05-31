
console.log("Image Upload Script");

const fs = require("fs");
const dbox = require("./dbox.js");
const imgur = require("./imgur.js");
const md5 = function (str) { return require('crypto').createHash('md5').update(str).digest('hex'); }


const main = async function () {
    await imgur.init();

    // delete all image from imgur
    // // for (let i in imgur.database.images) { await imgur.image.ImageDeletion(imgur.database.images[i].id); }

    // savedatabase
    imgur.database.saveDatabase();

    console.log("== image.js ==");

    let pathArray = [];
    // chara
    try {
        let albumList = ["AutoResponse", "Character"];
        let newAlbum = false;
        for (let i in albumList) {
            let albumName = albumList[i];
            let newPathArray = await getFileList(albumName);
            pathArray = pathArray.concat(newPathArray);

            if (imgur.database.findAlbumData({ title: albumName }).length == 0) {
                console.log("album not existed: " + albumName);
                await imgur.api.album.albumCreation({ title: albumName });
                newAlbum = true;
            }
        }
        if (newAlbum) {
            imgur.database.albums = [];
            await imgur.api.account.getAllAlbums().catch(function (error) { console.log("Imgur images load error!\n" + error) })
        }
    } catch (error) {
        console.log(error);
    }
    console.log("GET DBox Images count: " + pathArray.length);
    // console.log("pathArray = " + JSON.stringify(pathArray, null, 4));



    for (let i in pathArray) {
        try {
            // split folder name for AR key word
            let parameter = pathArray[i].split("/");
            let albumName = parameter[0];
            let tagList = parameter[1];
            let fileName = parameter[2];
            // console.log(albumName + ", " + tagList + ", " + fileName);

            let resultImage = [];
            let onlineAlbum = imgur.database.findAlbumData({ title: albumName })[0];
            let albumHash = onlineAlbum.id;



            const localImageFileScript = true;
            const localImagesPath = "C:\\LineBot\\imgur\\";

            let imageBinary, fileMd5;
            // local image files
            if (localImageFileScript) {
                imageBinary = await asyncReadFile(localImagesPath + pathArray[i]);
                fileMd5 = md5(imageBinary);  // get MD5 for check
            }

            // try to find existed image firt
            // resultImage = imgur.database.findImageData({ md5: fileMd5 }).filter(obj => resultImage.indexOf(obj) == -1);
            // resultImage = imgur.database.findImageData({ fileName }).filter(obj => resultImage.indexOf(obj) == -1);
            resultImage = imgur.database.findImageData({ fileName, tag: tagList.split(",")[0] }).filter(obj => resultImage.indexOf(obj) == -1);

            if (resultImage.length == 1) {
                let onlineImage = resultImage[0];
                // console.log("file already existed(file): " + pathArray[i]);

                // check album
                if (albumHash && onlineAlbum.findImage({ id: onlineImage.id }).length == 0) {
                    console.log("Alarm!! Image not in album!");
                    imgur.api.album.addAlbumImages({ albumHash: albumHash, ids: [onlineImage.id] });
                    console.log();
                }

                // check tag list
                if (onlineImage.tagList != tagList || (fileMd5 && onlineImage.md5 != fileMd5)) {
                    console.log("Alarm!! TagList incorrect!: https://imgur.com/" + onlineImage.id);
                    console.log(onlineImage.tagList, tagList, onlineImage.md5, fileMd5);
                    imgur.api.image.updateImage({ imageHash: onlineImage.id, tagList, md5: fileMd5 }).then(console.log);
                    console.log();
                }

                // check filename
                if (onlineImage.fileName != fileName) {
                    console.log("Alarm!! fileName incorrect!: https://imgur.com/" + onlineImage.id);
                    console.log();
                }

            } else if (resultImage.length == 0) {
                console.log("file is not exist: " + pathArray[i]);

                if (!localImageFileScript) {
                    imageBinary = await dbox.fileDownload(pathArray[i]);
                    asyncWriteFile(localImagesPath + pathArray[i].replaceAll("/", "\\"), imageBinary, "Binary");
                    fileMd5 = md5(imageBinary);  // get MD5 for check
                }

                let uploadResponse = await imgur.api.image.imageUpload({ imageBinary, fileName, albumHash, tagList });
                console.log("upload file: " + uploadResponse.title + ", " + fileName + ", " + tagList);
                console.log();

            } else {
                console.log("file have same name: " + pathArray[i]);
                // for (let i in resultImage) {
                //     imgur.api.image.imageDeletion({ imageHash: resultImage[i].id });
                // }
            }

        } catch (error) {
            console.log(error);
        }

    }
    // */

    annaWebHook("statu");

}; main();

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
                .then(
                    function (fileArray) {

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
