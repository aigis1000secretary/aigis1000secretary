
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
        let pathArrayAR = await getFileList("AutoResponse"); pathArray = pathArray.concat(pathArrayAR)
        let pathArrayCh = await getFileList("Character"); pathArray = pathArray.concat(pathArrayCh)
    } catch (error) {
        console.log(error);
    }
    console.log("GET DBox Images count: " + pathArray.length);
    // console.log("pathArray = " + JSON.stringify(pathArray, null, 4));


    try {
        for (let i in pathArray) {

            // split folder name for AR key word
            let parameter = pathArray[i].split("/");
            let albumName = parameter[0];
            let tagList = parameter[1];
            let fileName = parameter[2];
            // console.log(albumName + ", " + tagList + ", " + fileName);


            let onlineImage;
            let onlineAlbum = imgur.database.findAlbumData({ title: albumName });
            let albumHash = "";
            if (onlineAlbum.length == 0) {
                console.log("album not existed: " + albumName);
                // albumHash = (await imgur.api.album.albumCreation({ title: albumName })).id;
            } else {
                albumHash = onlineAlbum[0].id;
            }


            // // try to find existed image first
            // onlineImage = imgur.database.findImageData({ fileName, tag: tagList.split(",")[0] });
            // if (onlineImage.length == 1) {
            //     console.log("file already existed(file+tag): " + pathArray[i]);
            //     continue;
            // }


            // download image from dropbox
            let imageBinary = await asyncReadFile("C:\\LineBot\\imgur\\" + pathArray[i]); // test local image file
            // let imageBinary = await dbox.fileDownload(pathArray[i]);
            let fileMd5 = md5(imageBinary);  // get MD5 for check
            onlineImage = imgur.database.findImageData({ md5: fileMd5 });
            if (onlineImage.length == 1) {
                // console.log("file already existed(md5): " + pathArray[i]);

                if (onlineImage[0].tagList != tagList) {
                    console.log("Alarm!! TagList incorrect!: https://imgur.com/" + onlineImage[0].id);
                    imgur.api.image.updateImage({ imageHash: onlineImage[0].id, tagList });
                }
                if (onlineImage[0].fileName != fileName) {
                    console.log("Alarm!! fileName incorrect!: https://imgur.com/" + onlineImage[0].id);
                }
                // if (onlineAlbum[0].findImage({ id: onlineImage[0].id }).length == 0) {
                if (onlineAlbum[0].findImage(onlineImage[0]).length == 0) {
                    console.log("Alarm!! Image not in album!");
                    // console.log(onlineAlbum[0]);

                }
                continue;
            }


            // test local image file
            // let uploadResponse = await imgur.image.binaryImageUpload(fileBinary, "6230667.png",albumHash, "刻詠の風水士リンネ");
            // let uploadResponse = await imgur.api.image.imageUpload({ imageBinary, fileName, albumHash, tagList });
            // console.log("upload file: " + uploadResponse.title + ", " + fileName + ", " + tagList);



            console.log("file is not exist: " + pathArray[i]);
        }

    } catch (error) {
        console.log(error);
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

const asyncReadFile = function (filePath) {
    return new Promise(function (resolve, reject) {
        fs.readFile(filePath, function (err, data) {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}


