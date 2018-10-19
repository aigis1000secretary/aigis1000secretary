
console.log("Image Upload Script");

const fs = require("fs");
const dbox = require("./dbox.js");
const imgur = require("./imgur.js");
const md5 = function(str) { return require('crypto').createHash('md5').update(str).digest('hex'); }

const main = async function() {
    await imgur.init();
    console.log("==Main==");

    let pathArray = [];
    // chara
    try {
        let pathArrayAR = await getFileList("AutoResponse");
        let pathArrayCh = await getFileList("Character");

        pathArray = pathArrayAR.concat(pathArrayCh)
    } catch (error) {
        console.log(error);
    }

    for(let i in pathArray) {

        try {
            // split folder name for AR key word
            let mainTag = pathArray[i].substr(0, pathArray[i].lastIndexOf("/"));
                mainTag = mainTag.substr(mainTag.indexOf("/") + 1);
            let fileName = pathArray[i].substr(pathArray[i].lastIndexOf("/") + 1);

            // try to find existed image first
            let onlineImage = imgur.dataBase.findImageByNameTag(fileName, mainTag);
            if (onlineImage != null) {
                console.log("file already existed: " + pathArray[i]);
                // return "file already existed";

            } else {
                // download image from dropbox
                // fileBinary = await asyncReadFile("6230667.png"); // test local image file
                fileBinary = await fileDataDownload(pathArray[i]);
                let fileMd5 = md5(fileBinary);  // get MD5 for check

                let onlineImage = imgur.dataBase.findImageByMd5(fileMd5);
                if (onlineImage != null) {
                    console.log("file already existed: " + pathArray[i]);
                    // return "file already existed";

                } else {
                    //console.log("file is not existed");

                    // test local image file
                    //let uploadResponse = await imgur.image.binaryImageUpload(fileBinary, fileMd5, "6230667.png", "刻詠の風水士リンネ");
                    let uploadResponse = await imgur.image.binaryImageUpload(fileBinary, fileMd5, fileName, mainTag);

                    console.log(uploadResponse.data.title);
                    //console.log(fileMd5 + ", " + fileName + ", " + mainTag);

                }
            }
        } catch (err) {
            console.log(err);
        }
    }

};main();




const getFileList = async function(mainFolder) {
    var pathArray = [];
    // get AutoResponse key word
    let dirArray = await dbox.listDir(mainFolder, "folder");
    for(let i in dirArray) {
        // set AR image path
        dirArray[i] = mainFolder + "/" + dirArray[i];

        // get AR image name
        let fileArray = await dbox.listDir(dirArray[i]);

        for(let j in fileArray) {
            // set AR image full path
            pathArray.push(dirArray[i] + "/" + fileArray[j]);
        }
    }
    return pathArray;
}








const asyncReadFile = function(filePath){
    return new Promise(function(resolve, reject) {
        fs.readFile(filePath, function(err, data) {
            if(err){
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}



const fileDataDownload = function(path) {
    return new Promise(function(resolve, reject) {
        dbox.filesDownload({path: dbox.root + path})
        .then(function(response) {
            resolve(response.fileBinary);
        })
        .catch(function(error) {
            reject(error);
        });
    });
}
















