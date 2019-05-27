
const request = require("request");
const fs = require("fs");
const md5f = function (str) { return require('crypto').createHash('md5').update(str).digest('hex'); }
const config = require("./config.js");

const IMGUR_CLIENT_ID = config.imgur.IMGUR_CLIENT_ID;
const IMGUR_CLIENT_SECRET = config.imgur.IMGUR_CLIENT_SECRET;
const IMGUR_REFRESH_TOKEN = config.imgur.IMGUR_REFRESH_TOKEN;

const IMGUR_API_URL = "https://api.imgur.com/3/";
var IMGUR_ACCESS_TOKEN = "5f336949d6731b67fcad374a83851f3b543c17ad";

// Core
var imgur = {
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
                        body = eval("(" + body + ")");
                    }
                }
                if (!error && response.statusCode == 200) {
                    // Print out the response body
                    resolve(body);
                } else {
                    reject(error ? error :
                        body ? { status: body.status, message: body.data ? body.data.error : "No body data response" } :
                            response);
                }
            });
        });
    },
    // imgur API request
    async _apiRequest(options) {
        // Set the headers
        options.headers = {
            Authorization: "Bearer " + IMGUR_ACCESS_TOKEN
        }

        try {
            // send request
            return await imgur._request(options)
        } catch (error) {
            return Promise.reject(error);
        }
    },


    // POST Generate Access_Token
    // web API: https://api.imgur.com/oauth2/token
    oauth2: {
        async token() {
            console.log("Generate Access_Token");

            // Set the body
            var form = {
                refresh_token: IMGUR_REFRESH_TOKEN,
                client_id: IMGUR_CLIENT_ID,
                client_secret: IMGUR_CLIENT_SECRET,
                grant_type: "refresh_token"
            };

            // Configure the request
            var options = {
                url: "https://api.imgur.com/oauth2/token",
                method: "POST",
                form: form
            };

            // send request
            try {
                var jsonResponse = await imgur._request(options);

                if (config._debug) console.log(jsonResponse);
                IMGUR_ACCESS_TOKEN = jsonResponse.access_token;
                //console.log(IMGUR_ACCESS_TOKEN);
                return jsonResponse;

            } catch (error) {
                if (config._debug) console.log(error);
                IMGUR_ACCESS_TOKEN = "";
                return Promise.reject(error);
            }
        }
    },

    api: {
        // Account API
        account: {
            // GET Images
            async images({ page }) {
                console.log("GET Images page " + page);
                try {
                    // Configure the request
                    var options = {
                        url: IMGUR_API_URL + "account/me/images/" + page,
                        method: "GET"
                    };
                    return (await imgur._apiRequest(options)).data;

                } catch (error) {
                    return Promise.reject(error);
                }
            },
            // GET Image IDs
            async imagesIds({ page }) {
                console.log("GET Images IDs page " + page);
                try {
                    // Configure the request
                    var options = {
                        url: IMGUR_API_URL + "account/me/images/ids/" + page,
                        method: "GET"
                    };
                    return (await imgur._apiRequest(options)).data;

                } catch (error) {
                    return Promise.reject(error);
                }
            },
            // GET Image Count
            async imagesCount() {
                console.log("GET Image Count");
                try {
                    // Configure the request
                    var options = {
                        url: IMGUR_API_URL + "account/me/images/count",
                        method: "GET"
                    };
                    return (await imgur._apiRequest(options)).data;

                } catch (error) {
                    return Promise.reject(error);
                }
            },
            // load all images data
            async getAllImages() {
                console.log("GET All Images");
                let pages = parseInt(await this.imagesCount() / 50);
                let promiseArray = [];
                for (let page = 0; page <= pages; page++) {
                    // let imagesArray = await this.images({ page });
                    // for (let i in imagesArray) {
                    //     let image = imagesArray[i];
                    //     imgur.database.addImage(image);
                    // }
                    promiseArray.push(
                        this.images({ page }).then(function (array) {
                            for (let i in array) {
                                let image = array[i];
                                imgur.database.addImage(image);
                            }
                        })
                    );
                }
                await Promise.all(promiseArray);
            },

            // GET Albums
            async albums({ page }) {
                console.log("GET Albums page " + page);
                try {
                    // Configure the request
                    var options = {
                        url: IMGUR_API_URL + "account/me/albums/" + page,
                        method: "GET"
                    };
                    return (await imgur._apiRequest(options)).data;

                } catch (error) {
                    return Promise.reject(error);
                }
            },
            // GET Album IDs
            async albumsIds({ page }) {
                console.log("GET Album IDs page " + page);
                try {
                    // Configure the request
                    var options = {
                        url: IMGUR_API_URL + "account/me/albums/ids/" + page,
                        method: "GET"
                    };
                    return (await imgur._apiRequest(options)).data;

                } catch (error) {
                    return Promise.reject(error);
                }
            },
            // GET Album Count
            async albumsCount() {
                console.log("GET Album Count");
                try {
                    // Configure the request
                    var options = {
                        url: IMGUR_API_URL + "account/me/albums/count",
                        method: "GET"
                    };
                    return (await imgur._apiRequest(options)).data;

                } catch (error) {
                    return Promise.reject(error);
                }
            },
        },

        // Image API
        image: {
            // GET Image
            async image({ imageHash }) {
                try {
                    console.log("GET Image " + imageHash);
                    // Configure the request
                    var options = {
                        url: IMGUR_API_URL + "image/" + imageHash,
                        method: "GET"
                    };
                    return (await imgur._apiRequest(options)).data;

                } catch (error) {
                    return Promise.reject(error);
                }
            },
            // POST Image Upload
            async imageUpload({ imageBinary, fileName = null, albumHash = "", tagList = "" }) {
                try {
                    console.log("POST Image Upload " + fileName);
                    // Configure the request
                    var options = {
                        url: IMGUR_API_URL + "upload",
                        method: "POST",
                        // Set the POST body
                        formData: {
                            image: imageBinary, // A binary file, base64 data, or a URL for an image. (up to 10MB)
                            album: albumHash,
                            title: md5f(imageBinary),
                            name: fileName,
                            description: tagList //description: _tags.join(",") // defult: folder name, manual add for auto response key word
                        }
                    };
                    return (await imgur._apiRequest(options)).data;

                } catch (error) {
                    return Promise.reject(error);
                }
            },
            // DEL Image Deletion
            async imageDeletion({ imageHash }) {
                try {
                    console.log("DEL Image Deletion " + imageHash);
                    // Configure the request
                    var options = {
                        url: IMGUR_API_URL + "image/" + imageHash,
                        method: "DELETE",
                    };
                    return (await imgur._apiRequest(options));//.data;

                } catch (error) {
                    return Promise.reject(error);
                }
            },
            // POST Update Image Information
            async updateImage({ imageHash, tagList, md5 }) {
                try {
                    console.log("POST Update Image(" + imageHash + ") Information <" + tagList + ">, <" + md5 + ">");
                    // Set the POST body
                    let postBody = {};
                    if (md5) postBody.title = md5;
                    if (tagList) postBody.description = tagList;
                    // Configure the request
                    var options = {
                        url: IMGUR_API_URL + "image/" + imageHash,
                        method: "POST",
                        formData: postBody
                    };
                    return (await imgur._apiRequest(options)).data;

                } catch (error) {
                    return Promise.reject(error);
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
                    var options = {
                        url: IMGUR_API_URL + "album/" + albumHash,
                        method: "GET"
                    };
                    return (await imgur._apiRequest(options)).data;

                } catch (error) {
                    return Promise.reject(error);
                }
            },
            // GET Album Images // useless?
            async albumImages({ albumHash }) {
                try {
                    console.log("GET Album Images " + albumHash);
                    // Configure the request
                    var options = {
                        url: IMGUR_API_URL + "album/" + albumHash + "/images",
                        method: "GET"
                    };
                    return (await imgur._apiRequest(options)).data;

                } catch (error) {
                    return Promise.reject(error);
                }
            },
            // POST Album Creation
            async albumCreation({ title, ids = [], description = "", privacy = "hidden", cover }) {
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
                    var options = {
                        url: IMGUR_API_URL + "album",
                        method: "POST",
                        formData: postBody
                    };
                    return (await imgur._apiRequest(options)).data;

                } catch (error) {
                    return Promise.reject(error);
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
                    var options = {
                        url: IMGUR_API_URL + "album/" + albumHash,
                        method: "PUT",
                        json: putBody,
                        // formData: putBody
                    };
                    return (await imgur._apiRequest(options))//.data;

                } catch (error) {
                    return Promise.reject(error);
                }
            },
            // DEL Album Deletion
            async albumDeletion({ albumHash }) {
                try {
                    console.log("DEL Album Deletion " + albumHash);
                    // Configure the request
                    var options = {
                        url: IMGUR_API_URL + "album/" + albumHash,
                        method: "DELETE",
                    };
                    return (await imgur._apiRequest(options));//.data;

                } catch (error) {
                    return Promise.reject(error);
                }
            },
            // POST Set Album Images
            async setAlbumImages({ albumHash, ids }) {
                try {
                    console.log("POST Set Album Images " + albumHash);
                    // Configure the request
                    var options = {
                        url: IMGUR_API_URL + "album/" + albumHash,
                        method: "POST",
                        // Set the POST body
                        formData: {
                            ids: ids.join(",")
                        }
                    };
                    return (await imgur._apiRequest(options)).data;

                } catch (error) {
                    return Promise.reject(error);
                }
            },
            // POST Add Images to an Album
            async addAlbumImages({ albumHash, ids = [] }) {
                try {
                    console.log("POST Add Images to an Album " + albumHash);
                    // Configure the request
                    var options = {
                        url: IMGUR_API_URL + "album/" + albumHash + "/add",
                        method: "POST",
                        // Set the POST body
                        formData: {
                            ids: ids.join(",")
                        }
                    };
                    return (await imgur._apiRequest(options)).data;

                } catch (error) {
                    return Promise.reject(error);
                }
            }
            /*// POST Remove Images from an Album // Deprecation ?
            async removeAlbumImages({ albumHash, ids = [] }) {
                try {
                    console.log("POST Remove Images from an Album " + albumHash);
                    // Configure the request
                    var options = {
                        url: IMGUR_API_URL + "album/" + albumHash + "/remove_images",
                        method: "DELETE",
                        // Set the POST body
                        formData: {
                            ids: ids.join(",")
                        }
                    };
                    return (await imgur._apiRequest(options)).data;
         
                } catch (error) {
                    return Promise.reject(error);
                }
            }//*/
        }
    },


    // DB
    database: {
        images: [],
        createImage(rawData) {
            return new Image(rawData);
        },
        addImage(rawData) {
            let newImage = this.createImage(rawData);
            if (this.findImage({ id: newImage.id }).length == 0) {
                this.images.push(newImage);
            }
        },
        findImage({ id, md5, fileName, tag }) {
            return this.images.filter(function (image) {
                return (
                    
                    image.id == id &&
                    image.md5.toUpperCase().trim() == md5.toUpperCase().trim() &&
                    image.fileName.toUpperCase().trim() == fileName.toUpperCase().trim() &&
                    image.tags.indexOf(tag) != -1
                    
                    );
            });
        },

        albums: []
    },


    async init() {
        // access token update
        try {
            await imgur.oauth2.token();
            console.log("IMGUR_ACCESS_TOKEN update complete!");
        } catch (error) {
            console.log("IMGUR_ACCESS_TOKEN update error!");
            console.log(error);
        }
        try {
            await imgur.api.account.getAllImages();;
        } catch (error) {
            console.log(error);
        }

        // console.log(imgur.database.images);
        console.log(imgur.database.findImage({ md5: "0a30270d467375710b9361bec4441af7" }));

        await sleep(500);
        // Account
        // await imgur.api.account.albums(0).then(obj => JSON.stringify(obj, null, 4)).then(console.log);
        // await imgur.api.account.albumsCount().then(obj => JSON.stringify(obj, null, 4)).then(console.log);
        // await imgur.api.account.albumsIds(0).then(obj => JSON.stringify(obj, null, 4)).then(console.log);
        // await imgur.api.account.images(0).then(obj => JSON.stringify(obj, null, 4)).then(console.log);
        // await imgur.api.account.imagesCount().then(obj => JSON.stringify(obj, null, 4)).then(console.log);
        // await imgur.api.account.imagesIds(5).then(obj => JSON.stringify(obj, null, 4)).then(console.log);


        // Image
        // get image data
        // let imageHash = "uH66IWL";
        // let fileName = "20190524003631.jpg";
        // let imageBinary = await asyncReadFile(fileName);
        // let tagList = "付与魔術師アンリ";
        // await imgur.api.image.image({ imageHash }).then(obj => console.log(JSON.stringify(obj, null, 4))).catch(obj => console.log(JSON.stringify(obj, null, 4)));
        // await imgur.api.image.imageUpload({ imageBinary, fileName }).then(obj => console.log(JSON.stringify(obj, null, 4))).catch(obj => console.log(JSON.stringify(obj, null, 4)));
        // await imgur.api.image.imageDeletion({ imageHash }).then(obj => console.log(JSON.stringify(obj, null, 4))).catch(obj => console.log(JSON.stringify(obj, null, 4)));
        // await imgur.api.image.updateImage({ imageHash, tagList }).then(obj => console.log(JSON.stringify(obj, null, 4))).catch(obj => console.log(JSON.stringify(obj, null, 4)));
        // let raw = await imgur.api.image.image({ imageHash });
        // console.log(typeof (raw), JSON.stringify(raw, null, 4))
        // let obj = imgur.database.createImage(raw);
        // console.log(typeof (obj), JSON.stringify(obj, null, 4))

        // Album
        // let albumHash = "kGtma7A"   // test album hash
        // await imgur.api.album.album({ albumHash }).then(obj => console.log(JSON.stringify(obj, null, 4))).catch(obj => console.log(JSON.stringify(obj, null, 4)));
        // await imgur.api.album.albumImages({ albumHash }).then(obj => console.log(JSON.stringify(obj, null, 4))).catch(obj => console.log(JSON.stringify(obj, null, 4)));
        // await imgur.api.album.albumCreation({ title: "Test" }).then(obj => console.log(JSON.stringify(obj, null, 4))).catch(obj => console.log(JSON.stringify(obj, null, 4)));
        // await imgur.api.album.updateAlbum({ albumHash, description: "" }).then(obj => console.log(JSON.stringify(obj, null, 4))).catch(obj => console.log(JSON.stringify(obj, null, 4)));
        // await imgur.api.album.albumDeletion({albumHash}).then(obj => console.log(JSON.stringify(obj, null, 4))).catch(obj => console.log(JSON.stringify(obj, null, 4)));
        // await imgur.api.album.setAlbumImages({ albumHash, ids: ["uH66IWL"] }).then(obj => console.log(JSON.stringify(obj, null, 4))).catch(obj => console.log(JSON.stringify(obj, null, 4)));
        // await imgur.api.album.addAlbumImages({ albumHash, ids: ["RZRO2d1", "Sb4N1jh"] }).then(obj => console.log(JSON.stringify(obj, null, 4))).catch(obj => console.log(JSON.stringify(obj, null, 4)));


        console.log("init.");
        return;
    }

}; module.exports = imgur;

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

const sleep = function (ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
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
    _constructor({ id, title, description, name, link }) {
        this.fileName = name;
        this.md5 = title;
        this.tags = (description) ? description.split(",") : [];
        this.id = id; // imageHash
        this.imageLink = link;
        this.thumbnailLink = link.replace(this.id, this.id + "m");
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






album = {
    "id": "ytVHFTP",
    "title": "test album",
    "description": null,
    "datetime": 1558938993,
    "cover": "uH66IWL",
    "cover_edited": null,
    "cover_width": 900,
    "cover_height": 900,
    "account_url": "z1022001jp",
    "account_id": 95858677,
    "privacy": "public",
    "layout": "blog",
    "views": 4,
    "link": "https://imgur.com/a/ytVHFTP",
    "favorite": false,
    "nsfw": true,
    "section": null,
    "images_count": 3,
    "in_gallery": false,
    "is_ad": false,
    "include_album_ads": false,
    "is_album": true,
    "deletehash": "ekHfxNRFfmHD7ai",
    "images": [
        {
            "id": "uH66IWL",
            "title": "defb85f00f6709720c0aee1ba71a95b6",
            "description": "付与魔術師アンリ",
            "datetime": 1558679317,
            "type": "image/jpeg",
            "animated": false,
            "width": 900,
            "height": 900,
            "size": 72344,
            "views": 3,
            "bandwidth": 217032,
            "vote": null,
            "favorite": false,
            "nsfw": null,
            "section": null,
            "account_url": null,
            "account_id": null,
            "is_ad": false,
            "in_most_viral": false,
            "has_sound": false,
            "tags": [],
            "ad_type": 0,
            "ad_url": "",
            "edited": "0",
            "in_gallery": false,
            "deletehash": "a4pvdZypERT7KSx",
            "name": "20190524003631.jpg",
            "link": "https://i.imgur.com/uH66IWL.jpg"
        }
    ]
}

