
const fs = require("fs");
const path = require("path");
const md5f = function (str) { return require('crypto').createHash('md5').update(str).digest('hex'); }


const util = require('util');
const requestGet = util.promisify(require('request').get);
const requestPost = util.promisify(require('request').post);
const requestDel = util.promisify(require('request').delete);
const requestPut = util.promisify(require('request').put);


let IMGUR_CLIENT_ID = null;
let IMGUR_CLIENT_SECRET = null;
let IMGUR_REFRESH_TOKEN = null;

let IMGUR_API_URL = "https://api.imgur.com/3/";
let IMGUR_ACCESS_TOKEN = null;

// imgur API request
const _apiRequest = async function (method, route, options = {}, bearer = true) {

    // Configure the request
    options.url = `${IMGUR_API_URL}${route}`;
    options.json = true;
    options.headers = bearer ? { Authorization: `Bearer ${IMGUR_ACCESS_TOKEN}` } : { Authorization: `Client-ID ${IMGUR_CLIENT_ID}` };

    let res = null;
    switch (method) {
        case 'GET': { res = await requestGet(options); } break;
        case 'POST': { res = await requestPost(options); } break;
        case 'DELETE': { res = await requestDel(options); } break;
        case 'PUT': { res = await requestPut(options); } break;
    }
    if (res.statusCode != 200) { throw res; }
    else if (!res.body) {
        console.log(`[imgur] API error! statu: ${res.statusCode}, body: null`);
    }

    return res.body?.data || null;
}

const _imgur = {

    oauth2: {
        async token() {
            console.log("[imgur] Generate Access_Token");

            // Set the body
            let form = {
                refresh_token: IMGUR_REFRESH_TOKEN,
                client_id: IMGUR_CLIENT_ID,
                client_secret: IMGUR_CLIENT_SECRET,
                grant_type: "refresh_token"
            };

            // Configure the request
            let options = {
                url: "https://api.imgur.com/oauth2/token",
                json: true,
                form: form
            };

            // send request
            try {
                let jsonResponse = await requestPost(options);
                if (jsonResponse.statusCode != 200) { throw jsonResponse; }
                IMGUR_ACCESS_TOKEN = jsonResponse.body.access_token;

                // console.json(jsonResponse);
                // console.log(IMGUR_ACCESS_TOKEN);
                console.log("[imgur] IMGUR_ACCESS_TOKEN update complete!")
                return jsonResponse;

            } catch (error) {
                IMGUR_ACCESS_TOKEN = null;
                console.log(`[imgur] IMGUR_ACCESS_TOKEN update error ${error.statusCode}!`);
                // console.log(error);
                return null;
            }
        }
    },

    // API
    api: {
        // Account API
        account: {
            // GET Images
            async images({ page } = { page: 0 }) {
                // if (!enable()) return null;

                try {
                    // console.log("[imgur] GET Images page " + page);
                    return await _apiRequest("GET", "account/me/images/" + page);

                } catch (error) {
                    console.log(`[imgur] imgur.api.account.images Error ${error.statusCode}`);
                    // console.json(error);
                    return null;
                }
            },
            // GET Image IDs
            async imagesIds({ page } = { page: 0 }) {
                // if (!enable()) return null;

                try {
                    console.log("[imgur] GET Images IDs page " + page);
                    return await _apiRequest("GET", "account/me/images/ids/" + page);

                } catch (error) {
                    console.log(`[imgur] imgur.api.account.imagesIds Error ${error.statusCode}`);
                    // console.json(error);
                    return null;
                }
            },
            // GET Image Count
            async imagesCount() {
                // if (!enable()) return null;

                try {
                    // console.log("[imgur] GET Image Count");
                    return await _apiRequest("GET", "account/me/images/count");

                } catch (error) {
                    console.log(`[imgur] imgur.api.account.imagesCount Error ${error.statusCode}`);
                    // console.json(error);
                    return null;
                }
            },
            // load all images data
            async getAllImages() {
                // if (!enable()) return null;

                try {
                    console.log("[imgur] GET All Images");

                    // get img count
                    let count = await this.imagesCount();
                    if (count == null) throw ("[imgur] Can not get images count!");

                    // loop for pages
                    let pArray = [];
                    let pages = parseInt(count / 50);
                    for (let page = 0; page <= pages; page++) {
                        pArray.push(this.images({ page }));
                    }

                    // get result
                    let result = [];
                    await Promise.all(pArray).then(values => {
                        for (let arr of values) {
                            result = result.concat(arr);
                        }
                    });

                    console.log("[imgur] Imgur account images load complete (" + result.length + " images)!");
                    return result;

                } catch (error) {
                    console.log(`[imgur] imgur.api.account.getAllImages`);
                    console.log(error);
                    return null;
                }
            },

            // GET Albums
            async albums({ page } = { page: 0 }) {
                // if (!enable()) return null;

                try {
                    console.log("[imgur] GET Albums page " + page);
                    return await _apiRequest("GET", "account/me/albums/" + page);

                } catch (error) {
                    console.log(`[imgur] imgur.api.account.albums Error ${error.statusCode}`);
                    // console.json(error);
                    return null;
                }
            },
            // GET Album IDs
            async albumsIds({ page } = { page: 0 }) {
                // if (!enable()) return null;

                try {
                    console.log("[imgur] GET Album IDs page " + page);
                    return await _apiRequest("GET", "account/me/albums/ids/" + page);

                } catch (error) {
                    console.log(`[imgur] imgur.api.account.albumsIds Error ${error.statusCode}`);
                    // console.json(error);
                    return null;
                }
            },
            // GET Album Count
            async albumsCount() {
                // if (!enable()) return null;

                try {
                    // console.log("[imgur] GET Album Count");
                    return await _apiRequest("GET", "account/me/albums/count");

                } catch (error) {
                    console.log(`[imgur] imgur.api.account.albumsCount Error ${error.statusCode}`);
                    // console.json(error);
                    return null;
                }
            },
            // load all albums data
            async getAllAlbums() {
                // if (!enable()) return null;

                try {
                    console.log("[imgur] GET All Albums");

                    // get album count
                    let count = await this.albumsCount();
                    if (count == null) throw ("[imgur] Can not get Albums count!");

                    // loop for pages
                    let pArray = [];
                    let pages = parseInt(count / 50);
                    for (let page = 0; page <= pages; page++) {
                        pArray.push(this.albums({ page }));
                    }

                    // get result
                    let result = [];
                    await Promise.all(pArray).then(values => {
                        for (let arr of values) {
                            result = result.concat(arr);
                        }
                    });

                    console.log("[imgur] Imgur account Albums load complete (" + result.length + " Albums)!");
                    return result;

                } catch (error) {
                    console.log(`[imgur] imgur.api.account.getAllAlbums Error`);
                    console.log(error);
                    return null;
                }
            },
        },

        // Image API
        image: {
            // GET Image Information
            async image({ imageHash }) {
                // if (!enable()) return null;

                try {
                    console.log("[imgur] GET Image " + imageHash);
                    return await _apiRequest("GET", "image/" + imageHash, {});

                } catch (error) {
                    console.log(`[imgur] imgur.api.image.image Error ${error.statusCode}`);
                    // console.json(error);
                    return null;
                }
            },
            // POST Image Upload
            async imageUpload({ imageBinary, fileName = null, md5 = null, albumHash = "", tagList = "" }) {
                // if (!enable()) return null;

                try {
                    console.log(`[imgur] POST Image Upload( ${fileName} )` +
                        (albumHash ? `\n    albumHash: ${albumHash}` : "") + (md5 ? `    md5: ${md5}` : "") +
                        (tagList ? `\n    tagList: ${tagList}` : "")
                    );

                    // Configure the request
                    let options = {
                        // Set the POST body
                        formData: {
                            image: imageBinary, // A binary file, base64 data, or a URL for an image. (up to 10MB)
                            album: albumHash,
                            title: tagList,
                            name: fileName,
                            description: (md5 ? md5 : md5f(imageBinary))
                        }
                    };

                    let data = await _apiRequest("POST", "image", options);
                    console.log("[imgur]     Upload complete!");
                    return data;

                } catch (error) {
                    console.log(`[imgur] imgur.api.image.imageUpload Error ${error.statusCode}`);
                    console.log(error);
                    return null;
                }
            },
            // DEL Image Deletion
            async imageDeletion({ imageHash }) {
                // if (!enable()) return null;

                try {
                    console.log(`[imgur] DEL Image Delete( ${imageHash} )`);
                    let data = await _apiRequest("DELETE", "image/" + imageHash, {});
                    console.log("[imgur]     Delete complete!");
                    return data;

                } catch (error) {
                    console.log(`[imgur] imgur.api.image.imageDeletion Error ${error.statusCode}`);
                    // console.json(error);
                    return null;
                }
            },
            // POST Update Image Information
            async updateImage({ imageHash, tagList, md5 }) {
                // if (!enable()) return null;

                try {
                    console.log(`[imgur] POST Image Update( ${imageHash} )` +
                        (md5 ? `\n    md5: ${md5}` : "") +
                        (tagList ? `\n    tagList: ${tagList}` : "")
                    );

                    // Set the POST body
                    let formData = {};
                    if (md5) formData.description = md5;
                    if (tagList) formData.title = tagList;
                    // Configure the request
                    let options = { formData };

                    let data = await _apiRequest("POST", "image/" + imageHash, options);
                    console.log("[imgur]     Update complete!");
                    return data;    // data === true

                } catch (error) {
                    console.log(`[imgur] imgur.api.image.updateImage Error ${error.statusCode}`);
                    // console.json(error);
                    return null;
                }
            }
        },

        // Album API
        album: {
            // GET Album
            async album({ albumHash }) {
                // if (!enable()) return null;

                try {
                    let res = await _apiRequest("GET", "album/" + albumHash);
                    console.log(`[imgur] GET Album ${albumHash} ${res.title}`);
                    return res;

                } catch (error) {
                    console.log("[imgur] GET Album " + albumHash);
                    console.log(`[imgur] imgur.api.album.album Error ${error.statusCode}`);
                    // console.json(error);
                    return null;
                }
            },
            // GET Album Images // useless?
            async albumImages({ albumHash }) {
                // if (!enable()) return null;

                try {
                    console.log("[imgur] GET Album Images " + albumHash);
                    return await _apiRequest("GET", "album/" + albumHash + "/images");

                } catch (error) {
                    console.log(`[imgur] imgur.api.album.albumImages Error ${error.statusCode}`);
                    // console.json(error);
                    return null;
                }
            },
            // POST Album Creation
            async albumCreation({ title, ids = [], description = "", privacy = "hidden", cover = null }) {
                // if (!enable()) return null;

                try {
                    console.log("[imgur] POST Album Creation ");

                    // Set the POST body
                    let formData = {};
                    if (ids) formData.ids = ids.join(",");
                    if (title) formData.title = title;
                    // if (description) postBody.description = description;
                    if (privacy) formData.privacy = privacy;
                    if (cover) formData.cover = cover;
                    // Configure the request
                    let options = { formData };

                    return await _apiRequest("POST", "album", options);

                } catch (error) {
                    console.log(`[imgur] imgur.api.album.albumCreation Error ${error.statusCode}`);
                    // console.log(json(error));
                    // console.log(error.message);
                    return null;
                }
            },
            // PUT Update Album // useless
            async updateAlbum({ albumHash, ids, title, description, privacy, cover }) {
                // if (!enable()) return null;

                try {
                    console.log("[imgur] PUT Update Album " + albumHash);

                    // Set the POST body
                    let json = {};
                    if (ids) json.ids = ids.join(",");
                    if (title) json.title = title;
                    // if (description) putBody.description = description;
                    if (privacy) json.privacy = privacy;
                    if (cover) json.cover = cover;
                    // Configure the request
                    let options = { json };

                    return await _apiRequest("PUT", "album/" + albumHash, options);

                } catch (error) {
                    console.log(`[imgur] imgur.api.album.updateAlbum Error ${error.statusCode}`);
                    // console.log(error);
                    return null;
                }
            },
            // DEL Album Deletion
            async albumDeletion({ albumHash }) {
                // if (!enable()) return null;

                try {
                    console.log("[imgur] DEL Album " + albumHash);
                    return await _apiRequest("DELETE", "album/" + albumHash);

                } catch (error) {
                    console.log(`[imgur] imgur.api.album.albumDeletion Error ${error.statusCode}`);
                    // console.log(error);
                    return null;
                }
            },

            // POST Set Album Images
            async albumSetImages({ albumHash, ids }) {
                if (!enable() || ids.length == 0) return null;

                try {
                    console.log("[imgur] POST Set Album Images " + albumHash);

                    // Configure the request
                    let options = {
                        // Set the POST body
                        formData: {
                            ids: ids.join(",")
                        }
                    };

                    return await _apiRequest("POST", "album/" + albumHash, options);

                } catch (error) {
                    console.log(`[imgur] imgur.api.album.albumSetImages Error ${error.statusCode}`);
                    // console.log(error);
                    return null;
                }
            },
            // POST Add Images to an Album
            async albumAddImages({ albumHash, ids }) {
                // if (!enable()) return null;

                try {
                    console.log("[imgur] POST Add " + ids + " to Album " + albumHash);

                    // Configure the request
                    let options = {
                        // Set the POST body
                        formData: {
                            ids: ids.join(",")
                        }
                    };
                    return await _apiRequest("POST", "album/" + albumHash + "/add", options);

                } catch (error) {
                    console.log(`[imgur] imgur.api.album.albumAddImages Error ${error.statusCode}`);
                    // console.log(error);
                    return null;
                }
            },
            // POST Remove Images from an Album // Deprecation ?
            async removeAlbumImages({ albumHash, ids }) {
                // if (!enable()) return null;

                try {
                    console.log("[imgur] POST Remove " + ids + " from an Album " + albumHash);

                    // return await _apiRequest("DELETE", "album/" + albumHash + "/remove_images/?ids=" + ids.join(","));

                    // Set the POST body
                    let options = {
                        // Configure the request
                        formData: { ids: ids.join(",") }
                    };

                    return await _apiRequest("DELETE", "album/" + albumHash + "/remove_images", options);

                } catch (error) {
                    console.log(`[imgur] imgur.api.album.removeAlbumImages Error ${error.statusCode}`);
                    // console.log(error);
                    return null;
                }
            }//
        }
    },

    // database
    db: {
        images: [],
        image: {
            // build img data
            newData(rawData) {
                // if (!enable()) return null;

                // new img obj
                return new Image(rawData);
            },
            // add img data to db
            addData(newImage) {
                // typeof(newImage) == Image
                // if (!enable()) return null;

                // search img obj, result should be 0~1
                let result = this.findData({ id: newImage.id, isGif: true });

                // push new obj
                if (result.length == 0) {
                    _imgur.db.images.push(newImage);
                    return true;
                }

                // replace old data
                Object.assign(result[0], newImage);
                return false;
            },
            // find img data, return obj array
            findData({ id, md5, fileName, tag, tagList, isGif = false }) {
                // if (!enable()) return null;

                // build filter
                let filter = { id, md5, fileName, tag, tagList, isGif };
                for (let key of Object.keys(filter)) { if (filter[key] == null) delete filter[key]; }     // remove undefined

                return (filter == {}) ? _imgur.db.images : _imgur.db.images.filter(function (image) {
                    let result = true;
                    if (filter.id) {
                        result &= (filter.id == image.id);
                    }
                    if (filter.md5) {
                        result &= (filter.md5.equali(image.md5));
                    }
                    if (filter.fileName) {
                        let name = path.parse(image.fileName).name;
                        result &= (filter.fileName.equali(image.fileName) || filter.fileName.equali(name));
                    }
                    if (filter.tag && filter.tag != "") {
                        result &= (
                            image.tagList.replaceAll("/", ",").toUpperCase().trim().split(",").indexOf(
                                filter.tag.toUpperCase().trim()
                            ) != -1);
                    }
                    if (filter.tagList) {
                        result &= (image.tagList.equali(filter.tagList));
                    }

                    if (isGif == false) {
                        let ext = path.parse(image.fileName).ext;
                        if (".gif".equali(ext)) {
                            result = false;
                        }
                    }
                    return result;
                });
            },
            // delete img data
            deleteData({ id, md5, fileName, tag }) {
                // if (!enable()) return null;

                // build filter
                let filter = { id, md5, fileName, tag, isGif: true };
                for (let key of Object.keys(filter)) { if (filter[key] == null) delete filter[key]; }     // remove undefined

                // find targets
                let targets = this.findData(filter);
                // delete target
                for (let target of targets) {
                    let i = _imgur.db.images.indexOf(target);
                    _imgur.db.images.splice(i, 1);
                }

                return true;
            },
            // update img data
            updateData({ id, md5, tagList }) {
                // if (!enable()) return null;

                let img = _imgur.db.images.find((img) => img.id == id);
                md5 ? img.md5 = md5 : {};
                tagList ? img.tagList = tagList : {};

                return true;
            },
        },

        albums: [],
        album: {
            // build album data
            newData(rawData) {
                // if (!enable()) return null;

                // new album obj
                return new Album(rawData);
            },
            // add album data to db
            addData(newAlbum) {
                // typeof(newImage) == Image
                // if (!enable()) return null;

                // add all images to img db
                for (let image of newAlbum.albumImages) {
                    _imgur.db.image.addData(image);
                }

                // search album obj, result should be 0~1
                let result = this.findData({ id: newAlbum.id });

                // push new obj
                if (result.length == 0) {
                    _imgur.db.albums.push(newAlbum);
                    return true;
                }

                // replace old data
                Object.assign(result[0], newAlbum);
                return false;
            },
            // find img album, return obj array
            findData({ id, title }) {
                // if (!enable()) return null;

                // build filter
                let filter = { id, title };
                for (let key of Object.keys(filter)) { if (filter[key] == null) delete filter[key]; }     // remove undefined

                return (filter == {}) ? _imgur.db.albums : _imgur.db.albums.filter(function (album) {
                    let result = true;
                    for (let key in filter) {
                        result &= (album[key].equali(filter[key]));
                    }
                    return result;
                });
            },
            deleteData({ id, title }) {
                // if (!enable()) return null;

                // build filter
                let filter = { id, title };
                for (let key of Object.keys(filter)) { if (filter[key] == null) delete filter[key]; }     // remove undefined

                // find targets
                let targets = this.findData(filter);
                // delete target
                for (let target of targets) {
                    let i = _imgur.db.albums.indexOf(target);
                    _imgur.db.albums.splice(i, 1);
                }

                return true;
            },


        },

        // 儲存資料
        saveDatabase() {
            // console.log("[imgur] Imgur Database saving...");

            // object to json
            _imgur.db.images.sort(function (A, B) { return A.id.localeCompare(B.id) });
            _imgur.db.albums.sort(function (A, B) { return A.title.localeCompare(B.title) });
            let imagesDB = JSON.stringify(_imgur.db.images, null, 4);
            let albumsDB = JSON.stringify(_imgur.db.albums, null, 4);

            // callback
            let fsCallBack = function (error, bytesRead, buffer) {
                if (error) {
                    console.log(error);
                    return;
                }
            }
            // json to file
            fs.writeFile("ImgurDatabase.json", imagesDB, "utf8", fsCallBack);
            fs.writeFile("AlbumDatabase.json", albumsDB, "utf8", fsCallBack);
            // fs.writeFile("ImgurDatabase.csv", imagesDB.replace(/\s*\n\s*/g, "").replaceAll(",", "、").replaceAll("\"、\"", "\",\"").replaceAll("\}、\{", "}\n{"), "utf8", fsCallBack);

            console.log("[imgur] Imgur Database saved!");
        },


    }

}

module.exports = {

    async init(imgurCfg) {
        if (!imgurCfg) return;

        // vars
        IMGUR_CLIENT_ID = imgurCfg.IMGUR_CLIENT_ID;
        IMGUR_CLIENT_SECRET = imgurCfg.IMGUR_CLIENT_SECRET;
        IMGUR_REFRESH_TOKEN = imgurCfg.IMGUR_REFRESH_TOKEN;

        // access token update
        await _imgur.oauth2.token().catch(console.error);
        // retry method?
        if (!this.enable()) return null;

        await this.api.account.getAllAlbums();
        _imgur.db.saveDatabase();

        return;
    },

    enable() {
        if (IMGUR_ACCESS_TOKEN != null) return true;
        console.log("[imgur] Imgur unable...");
        return false;
    },

    // API
    api: {
        account: {
            async getAllImages() {
                if (!module.exports.enable()) return null;

                return _imgur.api.account.getAllImages();
            },

            async getAllAlbums() {
                if (!module.exports.enable()) return null;

                for (let albumRaw of (await _imgur.api.account.getAllAlbums() || [])) {
                    let raw = await _imgur.api.album.album({ albumHash: albumRaw.id });
                    let albumObj = _imgur.db.album.newData(raw);
                    _imgur.db.album.addData(albumObj);
                }
                return true;
            }
        },

        // Image API
        image: {
            // POST Image Upload
            async imageUpload({ imageBinary, fileName = null, md5 = null, albumHash = "", tagList = "" }) {
                if (!module.exports.enable()) return null;

                // upload img
                let res = await _imgur.api.image.imageUpload({ imageBinary, fileName, md5, albumHash, tagList });
                if (res == null) return null;

                // get new data & putin to img db
                let obj = _imgur.db.image.newData(res);
                _imgur.db.image.addData(obj);

                // putin img data to album db
                if (albumHash) {
                    let album = _imgur.db.album.findData({ id: albumHash });
                    if (album.length == 1) {
                        album[0].addImage(obj);
                    }
                }
                return obj;
            },
            // DEL Image Deletion
            async imageDeletion({ imageHash }) {
                if (!module.exports.enable()) return null;

                // del img
                let res = await _imgur.api.image.imageDeletion({ imageHash });
                if (res != true) return null;

                // find data & del from album db
                let obj = _imgur.db.image.findData({ id: imageHash, isGif: true });
                if (obj.length == 1) {
                    for (let album of _imgur.db.albums) {
                        album.deleteImage(obj[0]);
                    }
                }
                // del from img db
                _imgur.db.image.deleteData({ id: imageHash });

                return true;
            },
            // POST Update Image Information
            async updateImage({ imageHash, tagList, md5 }) {
                if (!module.exports.enable()) return null;

                // update img
                let res = await _imgur.api.image.updateImage({ imageHash, tagList, md5 });
                if (res != true) return null;

                // get new data & putin to db
                let raw = await _imgur.api.image.image({ imageHash });
                if (!raw) return null;

                let obj = _imgur.db.image.newData(raw);
                _imgur.db.image.addData(obj);
                return _imgur.db.image.findData({ id: imageHash });
            }
        },

        // Album API
        album: {
            // POST Album Creation
            async albumCreation({ title, ids = [], description = "", privacy = "hidden", cover = null }) {
                if (!module.exports.enable()) return null;

                let res = await _imgur.api.album.albumCreation({ title, ids, description, privacy, cover });
                let resID;

                if (res == null) {
                    for (let albumRaw of await _imgur.api.account.getAllAlbums()) {
                        if (albumRaw.title != title || albumRaw.images_count != 0) continue;
                        resID = albumRaw.id;
                        break;
                    }
                } else {
                    resID = res.id;
                }

                let raw = await _imgur.api.album.album({ albumHash: resID });
                let albumObj = _imgur.db.album.newData(raw);
                _imgur.db.album.addData(albumObj);

                return raw;
            },
            // POST Add Images to an Album
            async albumAddImages({ albumHash, ids }) {
                if (!module.exports.enable()) return null;

                let res = await _imgur.api.album.albumAddImages({ albumHash, ids });
                if (res != true) return null;

                return true;
            },

            // DEL Album Deletion
            async albumDeletion({ albumHash }) {
                if (!module.exports.enable()) return null;

                let res = await _imgur.api.album.albumDeletion({ albumHash });
                if (res != true) return null;

                // del from album db
                _imgur.db.album.deleteData({ id: albumHash });
                return true;
            },
        }
    },

    // database
    database: {
        // images: { length: () => { return _imgur.db.images.length } },
        images: _imgur.db.images,
        image: {
            // find img data, return obj array
            findData({ id, md5, fileName, tag, tagList, isGif = false }) {
                if (!module.exports.enable()) return null;

                // build filter
                let filter = { id, md5, fileName, tag, tagList, isGif };
                for (let key of Object.keys(filter)) { if (filter[key] == null) delete filter[key]; }     // remove undefined

                return (filter == {}) ? _imgur.db.images : _imgur.db.images.filter(function (image) {
                    let result = true;
                    if (filter.id) {
                        result &= (filter.id == image.id);
                    }
                    if (filter.md5) {
                        result &= (filter.md5.equali(image.md5));
                    }
                    if (filter.fileName) {
                        let name = path.parse(image.fileName).name;
                        result &= (filter.fileName.equali(image.fileName) || filter.fileName.equali(name));
                    }
                    if (filter.tag && filter.tag != "") {
                        result &= (
                            image.tagList.replaceAll("/", ",").toUpperCase().trim().split(",").indexOf(
                                filter.tag.toUpperCase().trim()
                            ) != -1);
                    }
                    if (filter.tagList) {
                        result &= (image.tagList.equali(filter.tagList));
                    }

                    if (isGif == false) {
                        let ext = path.parse(image.fileName).ext;
                        if (".gif".equali(ext)) {
                            result = false;
                        }
                    }
                    return result;
                });
            },
        },

        album: {
            // find img album, return obj array
            findData({ id, title }) {
                if (!module.exports.enable()) return null;

                // build filter
                let filter = { id, title };
                for (let key of Object.keys(filter)) { if (filter[key] == null) delete filter[key]; }     // remove undefined

                return (filter == {}) ? _imgur.db.albums : _imgur.db.albums.filter(function (album) {
                    let result = true;
                    for (let key in filter) {
                        result &= (album[key].equali(filter[key]));
                    }
                    return result;
                });
            },
        },

        // 儲存資料
        saveDatabase: _imgur.db.saveDatabase,
    }
}

class Image {
    constructor(rawData) {
        if (typeof rawData === 'string') {
            try {
                rawData = JSON.parse(rawData);
            } catch (e) {
                rawData = eval("(" + rawData + ")");
            }
        }
        this._constructor(rawData);
    };
    _constructor({ id, title, description, name, link, deletehash }) {
        this.fileName = name || "";
        this.md5 = description || "";
        this.tagList = title || "";
        this.id = id; // imageHash
        this.imageLink = link;
        this.thumbnailLink = (link) ? link.replace(this.id, this.id + "m") : "";
        this.deleteLink = "https://imgur.com/delete/" + deletehash;
        /*
        Thumbnail Suffix Thumbnail Name  Thumbnail Size Keeps Image Proportions
        "s"     Small Square  90x90   No
        "b"     Big Square   160x160   No
        "t"     Small Thumbnail  160x160   Yes
        "m"     Medium Thumbnail 320x320   Yes
        "l"     Large Thumbnail  640x640   Yes
        "h"     Huge Thumbnail  1024x1024  Yes
        */
    }
}

class Album {
    constructor(rawData) {
        if (typeof rawData === 'string') {
            try {
                rawData = JSON.parse(rawData);
            } catch (e) {
                rawData = eval("(" + rawData + ")");
            }
        }
        this._constructor(rawData);
    };
    _constructor({ id, title, link, images }) {
        this.id = id; // albumHash
        this.title = title;
        this.link = link;
        this.albumImages = [];
        for (let img of images) {
            this.addImage(_imgur.db.image.newData(img));
        }
    }
    addImage(newImage) {
        if (this.albumImages.indexOf(newImage) == -1) {
            this.albumImages.push(newImage);
        }
    }
    deleteImage(tarImage) {
        let i = this.albumImages.indexOf(tarImage);
        if (i != -1) {
            this.albumImages.splice(i, 1);
        }
    }
}