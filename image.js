
console.log("Image Upload Script");

const fs = require("fs");
const dbox = require("./dbox.js");
const imgur = require("./imgur.js");
const md5 = function (str) { return require('crypto').createHash('md5').update(str).digest('hex'); }

String.prototype.replaceAll = function (s1, s2) {
    var source = this;
    while ((temp = source.replace(s1, s2)) != source) {
        source = temp;
    }
    return source.toString();
}

const main = async function () {
    await imgur.init();

    // delete all image from imgur
    // for (let i in imgur.database.images) { await imgur.image.ImageDeletion(imgur.database.images[i].id); }

    // savedatabase
    //imgur.database.saveDatabase();

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
    console.log("pathArray = " + JSON.stringify(pathArray, null, 4));

    try {
        for (let i in pathArray) {

            // split folder name for AR key word
            let parameter = pathArray[i].split("/");
            let album = parameter[0];
            let tagList = parameter[1];
            let fileName = parameter[2];
            // console.log(tagList + ", " + fileName);


            let onlineImage;

            // try to find existed image first
            onlineImage = imgur.database.findImageByNameTag(fileName, tagList.split(",")[0]);
            if (onlineImage.length == 1) {
                console.log("file already existed(file+tag): " + pathArray[i]);
                // return "file already existed";
                continue;
            }

            // download image from dropbox
            // var fileBinary = await asyncReadFile("6230667.png"); // test local image file
            var fileBinary = await dbox.fileDownload(pathArray[i]);
            let fileMd5 = md5(fileBinary);  // get MD5 for check
            onlineImage = imgur.database.findImageByMd5(fileMd5);
            if (onlineImage.length == 1) {
                console.log("file already existed(md5): " + pathArray[i]);
                // return "file already existed";
                if (onlineImage[0].tags.join(",") != tagList || onlineImage[0].fileName != fileName) {
                    console.log("Alarm!! Tag data is incorrect!: https://imgur.com/" + onlineImage[0].id);
                    console.log(onlineImage[0].tags.join(",") + " : " + tagList);
                    console.log(onlineImage[0].fileName + " : " + fileName);

                }
                continue;
            }

            // test local image file
            // let uploadResponse = await imgur.image.binaryImageUpload(fileBinary, fileMd5, "6230667.png", "刻詠の風水士リンネ");
            let uploadResponse = await imgur.image.binaryImageUpload(fileBinary, fileMd5, fileName, tagList);
            console.log("upload file: " + uploadResponse.data.title + ", " + fileName + ", " + tagList);

        }//*/
    } catch (err) {
        console.log(err);
    }
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
        var html = '';
        req.on('data', function (data) {
            let str = new String(data);
            html += str.replaceAll("<br>", "\n");;
        });
        req.on('end', function () {
            console.info(html);
        });
    });
}

// const asyncReadFile = function (filePath) {
//     return new Promise(function (resolve, reject) {
//         fs.readFile(filePath, function (err, data) {
//             if (err) {
//                 reject(err);
//             } else {
//                 resolve(data);
//             }
//         });
//     });
// }


