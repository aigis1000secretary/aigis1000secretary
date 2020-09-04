
const fs = require("fs");
const path = require("path");
// const config = require("./config.js");
const config = { isLocalHost: false };
const anna = require("./anna.js");
const dbox = require("./dbox.js");
const imgur = require("./imgur.js");
const { isLocalHost } = require("./config.js");
const md5f = function (str) { return require('crypto').createHash('md5').update(str).digest('hex'); }

let loaclPath = "C:/Users/HUANG/Dropbox/應用程式/aigis1000secretary";

const main = async function () {
    console.log("Image Upload Script");
    // await imgur.init();

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
            // await imgur.api.album.albumCreation({ title: albumName, cover: "vtHXE4B" });
            console.log("albums.length == 0");
            return;
        }
        // get filelist
        pathArray = pathArray.concat(await getFileList(albumList[i]).catch(console.log));
    }

    // loop
    console.log("GET DBox Images count: " + pathArray.length);
    for (let filePath of pathArray) {

        // image var
        let tagList = config.isLocalHost ? filePath.replace(loaclPath, "") : filePath;
        let fileName = path.parse(filePath).base;
        // album id
        let albumHash = "";
        let albums = imgur.database.findAlbumData({ title: tagList.substring(1, tagList.indexOf("/", 1)) });
        if (albums.length != 0) { albumHash = albums[0].id; }

        // console.log(filePath)
        // console.log(fileName)
        // console.log("")
        // console.log(`\n[${pathArray.indexOf(filePath)}/${pathArray.length}]`);
        // console.log(`\n[${pathArray.indexOf(filePath)}/${pathArray.length}] ${fileName}`);
        // get online image data
        let resultImage = imgur.database.findImageData({ tagList, isGif: true });

        // cant found image from imgur
        if (resultImage.length == 0) {
            // get image data
            let imageBinary = config.isLocalHost ? fs.readFileSync(filePath) : await dbox.fileDownload(tagList.substring(1));
            let md5 = md5f(imageBinary);  // get MD5 for check

            // find again
            resultImage = imgur.database.findImageData({ md5, tag: fileName, isGif: true });

            // found image from imgur
            if (resultImage.length == 1) {
                console.log(`\n[${pathArray.indexOf(filePath)}/${pathArray.length}]`);

                // if dropbox file moved, update image params
                await imgur.api.image.updateImage({ imageHash: resultImage[0].id, tagList });
                continue;

            }

            console.log(`\n[${pathArray.indexOf(filePath)}/${pathArray.length}]`);
            // found some image from imgur
            if (resultImage.length >= 1) {
                // delete same images
                for (let imageHash of resultImage) { await imgur.api.image.imageDeletion({ imageHash }) }
            }
            // now no image in imgur, upload new
            await imgur.api.image.imageUpload({ imageBinary, fileName, md5, albumHash, tagList });
            continue;
        }

        // found image from imgur 
        if (resultImage.length == 1) {
            // check md5
            // skip on online script
            if (config.isLocalHost) {
                // image data
                let imageBinary = fs.readFileSync(filePath);
                let md5 = md5f(imageBinary);  // get MD5 for check

                // check md5
                if (!resultImage[0].md5.equali(md5) ||
                    // !resultImage[0].fileName.equali(fileName)
                    fileName.indexOf(resultImage[0].fileName) != 0// filename too long
                ) {
                    console.log(`\n[${pathArray.indexOf(filePath)}/${pathArray.length}]`);
                    console.log(`${resultImage[0].md5} => ${md5}`);
                    console.log(`${resultImage[0].fileName} => ${fileName}`);

                    await imgur.api.image.imageDeletion({ imageHash: resultImage[0].id })
                    await imgur.api.image.imageUpload({ imageBinary, fileName, md5, albumHash, tagList });
                }
            }

            continue;
        }

        // found many image from imgur
        if (resultImage.length >= 1) {
            console.log(`\n[${pathArray.indexOf(filePath)}/${pathArray.length}] result.length > 1`);

            // del online images 
            for (let imageHash of resultImage) { await imgur.api.image.imageDeletion({ imageHash }) }

            // image data
            let imageBinary = config.isLocalHost ? fs.readFileSync(filePath) : await dbox.fileDownload(tagList.substring(1));
            let md5 = md5f(imageBinary);  // get MD5 for check
            // re-upload            
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

// get file list
const getFileList = async function (mainFolder) {
    return config.isLocalHost ?
        await getOfflineFileList(`${loaclPath}/${mainFolder}`) :
        await getOnlineFileList(mainFolder)
}
// get local file list
const getOfflineFileList = async function (dirPath) {
    return new Promise(async (resolve, reject) => {
        let result = [];
        let apiResult = fs.readdirSync(dirPath);
        for (let i in apiResult) {
            let resultPath = `${dirPath}/${apiResult[i]}`;
            if (fs.lstatSync(resultPath).isDirectory()) {
                result = result.concat(await getOfflineFileList(resultPath));
            } else {
                result.push(resultPath);
            }
        }
        resolve(result);
    });
};
// get dropbox file list
const getOnlineFileList = async function (mainFolder) {
    let result = [];
    let apiResult = await dbox.listDir(mainFolder);
    // filter
    let dirs = apiResult.filter((obj) => (obj[".tag"] == "folder"));
    let files = apiResult.filter((obj) => (obj[".tag"] == "file"));

    let listDirsTask = async function () {
        let pop;
        while (dirs.length > 0) {
            pop = dirs.pop();
            let _folder = pop.path_display;

            // console.log(`${_folder} ${dirs.length}`);
            let _result = await dbox.listDir(_folder).catch(() => { return false; });
            if (!_result) { dirs.push(pop); await sleep(1000); continue; }   // list dir error, wait 1sec & retry

            let _dirs = _result.filter((obj) => ("folder" == obj[".tag"]));
            let _files = _result.filter((obj) => ("file" == obj[".tag"]));

            for (let obj in _dirs) { dirs.push(_dirs[obj]); }
            for (let obj in _files) { files.push(_files[obj]); }

            for (let i = 0; i < 50; ++i) {
                await sleep(100);
                if (dirs.length > 0) { break; }
            }
        }
        // console.log(`Thread done ${dirs.length}`);
    };

    let pArray = [];
    for (let i = 0; i < 10; ++i) {
        pArray.push(listDirsTask());
    }
    await Promise.all(pArray);

    for (let obj in files) { result.push(files[obj].path_display); }

    return result;
};

// check dbox img status
const checkImages = async function () {
    await imgur.init();

    // get dropbox image list
    let pathArray = [];

    try {
        // check album
        let albumList = ["AutoResponse", "Images"];
        for (let albumName of albumList) {
            // get filelist
            pathArray = pathArray.concat(await getOnlineFileList(albumName));
        }
    } catch (err) {
        console.log(`checkImages error: ${err}`);
        return;
    }

    for (let img of imgur.database.images) {
        let path = img.tagList;
        let filename = img.imageLink.replace(`https://i.imgur.com/`, "");
        let pathInDbox = pathArray.find((p) => path.equali(p));
        if (!pathInDbox) {
            console.log(`${path} not exist in dropbox`);
            // await dbox.fileUpload(`DelImages/${filename}`, body);

            await new Promise((resolve, reject) => {
                require("request").get(img.imageLink, { encoding: 'binary' }, async (error, response, body) => {
                    if (body) {
                        fs.writeFileSync("./" + filename, body, { encoding: 'binary' });
                        body = fs.readFileSync("./" + filename);
                        await dbox.fileUpload("DelImages/" + filename, body);
                        fs.unlinkSync("./" + filename);
                        await imgur.api.image.imageDeletion({ imageHash: img.id });
                        resolve();
                    }
                    // if (error || !body) { return console.log(error); }
                });
            });
        }
    }

    console.log("done!")
}

module.exports = {
    upload: main
};
