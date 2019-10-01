
const request = require("request");
const fs = require("fs");
const config = require("./config.js");
const md5f = function (str) { return require('crypto').createHash('md5').update(str).digest('hex'); }

const IMGUR_CLIENT_ID = config.imgur.IMGUR_CLIENT_ID;
const IMGUR_CLIENT_SECRET = config.imgur.IMGUR_CLIENT_SECRET;
const IMGUR_REFRESH_TOKEN = config.imgur.IMGUR_REFRESH_TOKEN;

const IMGUR_API_URL = "https://api.imgur.com/3/";
let IMGUR_ACCESS_TOKEN = "";

// Core
let imgurCore = {
    // request
    _request(options) {
        return new Promise(function (resolve, reject) {
            request(options, function (error, response, body) {
                // console.log(error + ", " + response + ", " + body);
                if (typeof body === 'string') {
                    // console.log(body)
                    try {
                        body = JSON.parse(body);
                    } catch (e) {
                        try {
                            body = eval("(" + body + ")");
                        } catch (e) {
                            console.log(body);
                            reject(e);
                        }
                    }
                }
                if (!error && response.statusCode == 200) {
                    // Print out the response body
                    resolve(body);
                } else {
                    reject(error ? error :
                        body ? {
                            status: body.status,
                            message: body.data ?
                                body.data.error :
                                "No body data response"
                        } :
                            response);
                }
            });
        });
    },
    // imgur API request
    _apiRequest(options) {
        return new Promise(function (resolve, reject) {
            // Set the headers
            options.headers = {
                Authorization: "Bearer " + IMGUR_ACCESS_TOKEN
            }

            // send reques
            imgurCore._request(options).then(resolve).catch(reject);
        });
    },


    // POST Generate Access_Token
    // web API: https://api.imgur.com/oauth2/token
    oauth2: {
        async token() {
            console.log("Generate Access_Token");

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
                method: "POST",
                form: form
            };

            // send request
            try {
                let jsonResponse = await imgurCore._request(options);

                if (config._debug) console.log(jsonResponse);
                IMGUR_ACCESS_TOKEN = jsonResponse.access_token;

                //console.log(IMGUR_ACCESS_TOKEN);
                console.log("IMGUR_ACCESS_TOKEN update complete!")
                return jsonResponse;

            } catch (error) {
                IMGUR_ACCESS_TOKEN = "";
                console.log("IMGUR_ACCESS_TOKEN update error!\n" + error)
                return null;
            }
        }
    },

    api: {
        // Account API
        account: {
            // GET Images
            async images({ page }) {
                try {
                    console.log("GET Images page " + page);
                    // Configure the request
                    let options = {
                        url: IMGUR_API_URL + "account/me/images/" + page,
                        method: "GET"
                    };
                    let data = (await imgurCore._apiRequest(options)).data
                    for (let i in data) {
                        imgurCore.database.newImageData(data[i]);
                    }
                    return data;

                } catch (error) {
                    console.log(error);
                    return null;
                }
            },
            // GET Image IDs
            async imagesIds({ page }) {
                try {
                    console.log("GET Images IDs page " + page);
                    // Configure the request
                    let options = {
                        url: IMGUR_API_URL + "account/me/images/ids/" + page,
                        method: "GET"
                    };
                    return (await imgurCore._apiRequest(options)).data;
                } catch (error) {
                    console.log(error);
                    return null;
                }
            },
            // GET Image Count
            async imagesCount() {
                try {
                    // console.log("GET Image Count");
                    // Configure the request
                    let options = {
                        url: IMGUR_API_URL + "account/me/images/count",
                        method: "GET"
                    };
                    return (await imgurCore._apiRequest(options)).data;
                } catch (error) {
                    console.log(error);
                    return 0;
                }
            },
            // load all images data
            async getAllImages() {
                console.log("GET All Images");
                let pages = parseInt(await this.imagesCount() / 50);
                let promiseArray = [];
                for (let page = 0; page <= pages; page++) {
                    promiseArray.push(this.images({ page }));
                }
                await Promise.all(promiseArray);
                console.log("Imgur account images load complete (" + imgurCore.database.images.length + " images)!");
            },

            // GET Albums
            async albums({ page }) {
                try {
                    console.log("GET Albums page " + page);
                    // Configure the request
                    let options = {
                        url: IMGUR_API_URL + "account/me/albums/" + page,
                        method: "GET"
                    };
                    let data = (await imgurCore._apiRequest(options)).data
                    for (let i in data) {
                        imgurCore.database.newAlbumData(data[i]);
                    }
                    return data;

                } catch (error) {
                    console.log(error);
                    return null;
                }
            },
            // GET Album IDs
            async albumsIds({ page }) {
                try {
                    console.log("GET Album IDs page " + page);
                    // Configure the request
                    let options = {
                        url: IMGUR_API_URL + "account/me/albums/ids/" + page,
                        method: "GET"
                    };
                    let data = (await imgurCore._apiRequest(options)).data
                    for (let i in data) {
                        await imgurCore.api.album.album({ albumHash: data[i] });
                    }
                    return data;

                } catch (error) {
                    console.log(error);
                    return null;
                }
            },
            // GET Album Count
            async albumsCount() {
                try {
                    // console.log("GET Album Count");
                    // Configure the request
                    let options = {
                        url: IMGUR_API_URL + "account/me/albums/count",
                        method: "GET"
                    };
                    return (await imgurCore._apiRequest(options)).data;

                } catch (error) {
                    console.log(error);
                    return 0;
                }
            },
            // load all albums data
            async getAllAlbums() {
                console.log("GET All Albums");
                let pages = parseInt(await this.albumsCount() / 50);
                let promiseArray = [];
                for (let page = 0; page <= pages; page++) {
                    promiseArray.push(this.albumsIds({ page }));
                }
                await Promise.all(promiseArray);
                console.log("Imgur account albums load complete (" + imgurCore.database.albums.length + " albums)!");
            }
        },

        // Image API
        image: {
            // GET Image
            async image({ imageHash }) {
                try {
                    console.log("GET Image " + imageHash);
                    // Configure the request
                    let options = {
                        url: IMGUR_API_URL + "image/" + imageHash,
                        method: "GET"
                    };
                    let data = (await imgurCore._apiRequest(options)).data;
                    imgurCore.database.newImageData(data);
                    return data;

                } catch (error) {
                    console.log(error);
                    return null;
                }
            },
            // POST Image Upload
            async imageUpload({ imageBinary, fileName = null, albumHash = "", tagList = "" }) {
                try {
                    console.log("POST Image Upload " + fileName);
                    // Configure the request
                    let options = {
                        url: IMGUR_API_URL + "upload",
                        method: "POST",
                        // Set the POST body
                        formData: {
                            image: imageBinary, // A binary file, base64 data, or a URL for an image. (up to 10MB)
                            album: albumHash,
                            title: tagList,
                            name: fileName,
                            description: md5f(imageBinary)
                        }
                    };
                    // let data = (await imgurCore._apiRequest(options)).data;
                    // imgurCore.database.newImageData(data);
                    // return data;
                    return (await imgurCore._apiRequest(options)).data;

                } catch (error) {
                    console.log(error);
                    return null;
                }
            },
            // DEL Image Deletion
            async imageDeletion({ imageHash }) {
                try {
                    console.log("DEL Image Deletion " + imageHash);
                    // Configure the request
                    let options = {
                        url: IMGUR_API_URL + "image/" + imageHash,
                        method: "DELETE",
                    };
                    return (await imgurCore._apiRequest(options));//.data;

                } catch (error) {
                    console.log(error);
                    return null;
                }
            },
            // POST Update Image Information
            async updateImage({ imageHash, tagList, md5 }) {
                try {
                    console.log("POST Update Image(" + imageHash + ") Information <" + tagList + ">, <" + md5 + ">");
                    // Set the POST body
                    let postBody = {};
                    if (md5) postBody.description = md5;
                    if (tagList) postBody.title = tagList;
                    // Configure the request
                    let options = {
                        url: IMGUR_API_URL + "image/" + imageHash,
                        method: "POST",
                        formData: postBody
                    };
                    // let data = (await imgurCore._apiRequest(options)).data;
                    // imgurCore.database.newImageData(data);
                    // return data;
                    return (await imgurCore._apiRequest(options)).data;

                } catch (error) {
                    console.log(error);
                    return null;
                }
            }
        },

        // Album API
        album: {
            // GET Album
            async album({ albumHash }) {
                try {
                    console.log("GET Album " + albumHash);
                    // Configure the request
                    let options = {
                        url: IMGUR_API_URL + "album/" + albumHash,
                        method: "GET"
                    };
                    let data = (await imgurCore._apiRequest(options)).data;
                    imgurCore.database.newAlbumData(data);
                    return data;

                } catch (error) {
                    console.log(error);
                    return null;
                }
            },
            // GET Album Images // useless?
            async albumImages({ albumHash }) {
                try {
                    console.log("GET Album Images " + albumHash);
                    // Configure the request
                    let options = {
                        url: IMGUR_API_URL + "album/" + albumHash + "/images",
                        method: "GET"
                    };
                    return (await imgurCore._apiRequest(options)).data;

                } catch (error) {
                    console.log(error);
                    return null;
                }
            },
            // POST Album Creation
            async albumCreation({ title, ids = [], description = "", privacy = "hidden", cover = null }) {
                try {
                    console.log("POST Album Creation ");
                    // Set the POST body
                    let postBody = {};
                    if (ids) postBody.ids = ids.join(",");
                    if (title) postBody.title = title;
                    // if (description) postBody.description = description;
                    if (privacy) postBody.privacy = privacy;
                    if (cover) postBody.cover = cover;
                    // Configure the request
                    let options = {
                        url: IMGUR_API_URL + "album",
                        method: "POST",
                        formData: postBody
                    };
                    return (await imgurCore._apiRequest(options)).data;

                } catch (error) {
                    console.log(error);
                    console.log(error.message);
                    return null;
                }
            },
            // PUT Update Album // useless
            async updateAlbum({ albumHash, ids, title, description, privacy, cover }) {
                try {
                    console.log("PUT Update Album " + albumHash);
                    // Set the POST body
                    let putBody = {};
                    if (ids) putBody.ids = ids.join(",");
                    if (title) putBody.title = title;
                    // if (description) putBody.description = description;
                    if (privacy) putBody.privacy = privacy;
                    if (cover) putBody.cover = cover;
                    // Configure the request
                    let options = {
                        url: IMGUR_API_URL + "album/" + albumHash,
                        method: "PUT",
                        json: putBody,
                        // formData: putBody
                    };
                    console.log(putBody);
                    return (await imgurCore._apiRequest(options))//.data;

                } catch (error) {
                    console.log(error);
                    return null;
                }
            },
            // DEL Album Deletion
            async albumDeletion({ albumHash }) {
                try {
                    console.log("DEL Album Deletion " + albumHash);
                    // Configure the request
                    let options = {
                        url: IMGUR_API_URL + "album/" + albumHash,
                        method: "DELETE",
                    };
                    return (await imgurCore._apiRequest(options));//.data;

                } catch (error) {
                    console.log(error);
                    return null;
                }
            },
            // POST Set Album Images
            async setAlbumImages({ albumHash, ids }) {
                try {
                    console.log("POST Set Album Images " + albumHash);
                    // Configure the request
                    let options = {
                        url: IMGUR_API_URL + "album/" + albumHash,
                        method: "POST",
                        // Set the POST body
                        formData: {
                            ids: ids.join(",")
                        }
                    };
                    return (await imgurCore._apiRequest(options)).data;

                } catch (error) {
                    if (ids.length == 0 && error.status == 403) return "Object {data: true, success: true, status: 200}";

                    console.log(error);
                    return null;
                }
            },
            // POST Add Images to an Album
            async addAlbumImages({ albumHash, ids }) {
                try {
                    console.log("POST Add " + ids + " to Album " + albumHash);
                    // Configure the request
                    let options = {
                        url: IMGUR_API_URL + "album/" + albumHash + "/add",
                        method: "POST",
                        // Set the POST body
                        formData: {
                            ids: ids.join(",")
                        }
                    };
                    return (await imgurCore._apiRequest(options)).data;

                } catch (error) {
                    console.log(error);
                    return null;
                }
            },
            // POST Remove Images from an Album // Deprecation ?
            async removeAlbumImages({ albumHash, ids }) {
                try {
                    console.log("POST Remove " + ids + " from an Album " + albumHash);
                    let idList = (ids.length == 1 ? ids[0] : ids.join(","));
                    // Configure the request
                    let options = {
                        url: IMGUR_API_URL + "album/" + albumHash + "/remove_images/?ids=" + ids.join(","),
                        method: "DELETE",
                    };
                    return (await imgurCore._apiRequest(options)).data;

                } catch (error) {
                    console.log(error);
                    return null;
                }
            }//
        }
    },


    // DB
    database: {
        images: [],
        newImageData(rawData) {
            let newImage = new Image(rawData);
            let result = this.findImageData({ id: newImage.id });

            if (result.length == 0) {
                // new image
                this.images.push(newImage);
                return newImage;
            }
            for (let key in newImage) {
                result[0][key] = newImage[key];
            }
            return result[0];
        },
        findImageData({ id, md5, fileName, tag }) {
            let filter = { id, md5, fileName, tag };
            Object.keys(filter).forEach((key) => (filter[key] == null) && delete filter[key]);

            return this.images.filter(function (image) {
                let result = (filter != {});
                if (filter.id) {
                    result &= (filter.id == image.id);
                }
                if (filter.md5) {
                    result &= (filter.md5.equali(image.md5));
                }
                if (filter.fileName) {
                    result &= filter.fileName.equali(image.fileName);
                }
                if (filter.tag) {
                    result &= (
                        image.tagList.toUpperCase().trim().split(",").indexOf(
                            filter.tag.toUpperCase().trim()
                        ) != -1);
                }
                return result;
            });
        },
        deleteImageData({ id, md5, fileName, tag }) {
            let filter = { id, md5, fileName, tag };
            Object.keys(filter).forEach((key) => (filter[key] == null) && delete filter[key]);

            this.images = this.images.filter(function (image) {
                let result = (filter != {});
                if (filter.id) {
                    result &= (filter.id == image.id);
                }
                if (filter.md5) {
                    result &= (filter.md5.equali(image.md5));
                }
                if (filter.fileName) {
                    result &= filter.fileName.equali(image.fileName);
                }
                if (filter.tag) {
                    result &= (
                        image.tagList.toUpperCase().trim().split(",").indexOf(
                            filter.tag.toUpperCase().trim()
                        ) != -1);
                }
                return !result;
            });
        },

        albums: [],
        newAlbumData(rawData) {
            let newAlbum = new Album(rawData);
            let result = this.findAlbumData({ id: newAlbum.id });

            if (result.length == 0) {
                // new album
                this.albums.push(newAlbum);
                return newAlbum;
            }
            for (let key in newAlbum) {
                result[0][key] = newAlbum[key];
            }
            return result[0];
        },
        findAlbumData({ id, title }) {
            let filter = { id, title };
            Object.keys(filter).forEach((key) => (filter[key] == null) && delete filter[key]);

            return this.albums.filter(function (album) {
                let result = (filter != {});
                for (let key in filter) {
                    result &= (album[key] == filter[key]);
                }
                return result;
            });
        },
        deleteAlbum({ id, title }) {
            let filter = { id, title };
            Object.keys(filter).forEach((key) => (filter[key] == null) && delete filter[key]);

            this.albums = this.albums.filter(function (album) {
                let result = (filter != {});
                for (let key in filter) {
                    result &= (album[key] == filter[key]);
                }
                return !result;
            });
        },


        // 儲存資料
        saveDatabase() {
            console.log("Imgur Database saving...");

            // object to json
            let imagesDB = JSON.stringify(imgurCore.database.images, null, 4);
            let albumsDB = JSON.stringify(imgurCore.database.albums, null, 4);

            // callback
            let fsCallBack = function (error, bytesRead, buffer) {
                if (error) {
                    console.log(error);
                    return;
                }
            }
            // json to file
            fs.writeFile("ImgurDatabase.log", imagesDB, "utf8", fsCallBack);
            fs.writeFile("AlbumDatabase.log", albumsDB, "utf8", fsCallBack);

            console.log("Imgur Database saved!");
        },
    },


    async init() {
        // access token update
        await imgurCore.oauth2.token();

        imgurCore.database.images = [];
        imgurCore.database.albums = [];

        await imgurCore.api.account.getAllAlbums().catch(function (error) { console.log("Imgur images load error!\n" + error) });
        await imgurCore.api.account.getAllImages().catch(function (error) { console.log("Imgur images load error!\n" + error) });

        if (config.isLocalHost) imgurCore.database.saveDatabase();
        return;
    },

    /* async autoTest() {
        // await this.init();

        // Account
        await imgurCore.api.account.albums({ page: 0 }).then((obj) => console.log(obj));;
        await imgurCore.api.account.albumsCount().then((obj) => console.log(obj));;
        await imgurCore.api.account.albumsIds({ page: 0 }).then((obj) => console.log(obj));;
        await imgurCore.api.account.images({ page: 0 }).then((obj) => console.log(obj));;
        await imgurCore.api.account.imagesCount().then((obj) => console.log(obj));;
        await imgurCore.api.account.imagesIds({ page: 5 }).then((obj) => console.log(obj));;

        // Image
        let albumHash = "mmtaVlc";   // test album hash
        let imageHash = "J2GU9wI";
        let testImage = ["ovDiJxZ", "CeraaNV", "4kTvWRn", "EUY6l34"];
        let tagList = "水霊使いセノーテ";
        await imgurCore.api.image.image({ imageHash }).then((obj) => console.log(obj));;
        await imgurCore.api.image.updateImage({ imageHash, tagList }).then((obj) => console.log(obj));;
        // await imgurCore.api.image.imageDeletion({ imageHash }).then((obj)=>console.log(obj));;
        // let fileName = "IMG_20180928_113244.jpg";
        // let imageBinary = fs.readFileSync(fileName);
        // await imgurCore.api.image.imageUpload({ imageBinary, fileName }).then((obj)=>console.log(obj));;

        // Album
        await imgurCore.api.album.album({ albumHash }).then((obj) => console.log(obj));;
        await imgurCore.api.album.albumImages({ albumHash }).then((obj) => console.log(obj));;
        await imgurCore.api.album.setAlbumImages({ albumHash, ids: [] }).then((obj) => console.log(obj));;
        await imgurCore.api.album.setAlbumImages({ albumHash, ids: [testImage[0], testImage[1]] }).then((obj) => console.log(obj));;
        await imgurCore.api.album.addAlbumImages({ albumHash, ids: [testImage[2]] }).then((obj) => console.log(obj));;
        await imgurCore.api.album.addAlbumImages({ albumHash, ids: [testImage[3]] }).then((obj) => console.log(obj));;
        await imgurCore.api.album.updateAlbum({ albumHash, cover: testImage[0] }).then((obj) => console.log(obj));;
        await imgurCore.api.album.album({ albumHash }).then((obj) => console.log(obj));;
        // await imgurCore.api.album.albumCreation({ title: "Test", ids: [testImage[0]] }).then((obj)=>console.log(obj));;
        // await imgurCore.api.album.albumDeletion({ albumHash }).then((obj)=>console.log(obj));;

        let rawAlbumData = await imgurCore.api.album.album({ albumHash });
        let rawImageData = await imgurCore.api.image.image({ imageHash });
        let image = imgurCore.database.newImageData(rawImageData);
        let album = imgurCore.database.newAlbumData(rawAlbumData);

        console.log(image);
        console.log(album);
        console.log("images.length = " + imgurCore.database.images.length);
        console.log("albums.length = " + imgurCore.database.albums.length);
        console.log("imgurCore.database.albums = ");
        console.log(imgurCore.database.albums);
        console.log("imgurCore.database.images = ");
        console.log(imgurCore.database.images);

        console.log("Test Done!!");
    }
    //*/

}; module.exports = imgurCore;


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
    _constructor({ id, title, description, name, link }) {
        this.fileName = name;
        this.md5 = description || "";;
        this.tagList = title || "";
        this.id = id; // imageHash
        this.imageLink = link;
        this.thumbnailLink = (link) ? link.replace(this.id, this.id + "m") : "";
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
        this.images = [];
        let newImages = [];
        for (let i in images) {
            newImages.push(imgurCore.database.newImageData(images[i]));
        }
        this.addImages(newImages);
    }
    addImages(images) {
        for (let i in images) {
            if (this.images.indexOf(images[i]) == -1) {
                this.images.push(images[i]);
            }
        }
    }
    removeImages(images) {
        for (let i in images) {
            let j = this.images.indexOf(images[i]);
            if (j != -1) {
                this.image.splice(j, 1);
            }
        }
    }
    findImage({ id, md5, fileName, tag }) {
        let filter = { id, md5, fileName, tag };
        Object.keys(filter).forEach((key) => (filter[key] == null) && delete filter[key]);

        return this.images.filter(function (image) {
            let result = (filter != {});
            if (filter.id) {
                result &= (filter.id == image.id);
            }
            if (filter.md5) {
                result &= (filter.md5.equali(image.md5));
            }
            if (filter.fileName) {
                result &= filter.fileName.equali(image.fileName);
            }
            if (filter.tag) {
                result &= (
                    image.tagList.toUpperCase().trim().split(",").indexOf(
                        filter.tag.toUpperCase().trim()
                    ) != -1);
            }
            return result;
        });
    }
}
