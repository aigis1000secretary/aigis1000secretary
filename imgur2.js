
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
                if (!error && response.statusCode == 200) {
                    // Print out the response body
                    var json = JSON.parse(body);
                    resolve(json);
                } else {
                    let json = JSON.parse(body);
                    reject(error ? error : { status: json.status, message: json.data ? json.data.error : "No body data response" });
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


    // Account API
    account: {
        // GET Images
        async images({ page = 0 }) {
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
        async imagesIds({ page = 0 }) {
            console.log("GET Image IDs page " + page);
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

        // GET Albums
        async albums({ page = 0 }) {
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
        async albumsIds({ page = 0 }) {
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
            console.log("GET Image " + imageHash);
            try {
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
            console.log("POST Image Upload " + fileName);
            try {
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
            console.log("DEL Image Deletion " + imageHash);
            try {
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
        async updateImage({ imageHash, md5, tagList }) {
            console.log("POST Update Image(" + imageHash + ") Information " + md5 + ", " + tagList);
            try {
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

    },


    // DB
    database: {
        images: [],
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
        };

        await sleep(500);
        // get account data
        // await imgur.account.albums(0).then(obj => JSON.stringify(obj, null, 4)).then(console.log);
        // await imgur.account.albumsCount().then(obj => JSON.stringify(obj, null, 4)).then(console.log);
        // await imgur.account.albumsIds(0).then(obj => JSON.stringify(obj, null, 4)).then(console.log);
        // await imgur.account.images(0).then(obj => JSON.stringify(obj, null, 4)).then(console.log);
        // await imgur.account.imagesCount().then(obj => JSON.stringify(obj, null, 4)).then(console.log);
        // await imgur.account.imagesIds(5).then(obj => JSON.stringify(obj, null, 4)).then(console.log);

        // get image data
        // let imageHash = (await imgur.account.imagesIds(5))[0];
        // await imgur.image.image({ imageHash }).then(obj => JSON.stringify(obj, null, 4)).then(console.log).catch(console.log);
        // await imgur.image.image({ imageHash: "XtrPHOx" }).then(obj => JSON.stringify(obj, null, 4)).then(console.log).catch(console.log);

        // upload
        // let fileName = "icon.png";
        // let imageBinary = await asyncReadFile(fileName);
        // await imgur.image.imageUpload({ imageBinary: imageBinary, fileName: fileName }).then(obj => JSON.stringify(obj, null, 4)).then(console.log).catch(console.log);
        // Ex. response =:= imgur.image.image({ imageHash })

        // delete image
        // imgur.image.imageDeletion({ imageHash: "XtrPHOx" }).then(obj => JSON.stringify(obj, null, 4)).then(console.log).catch(console.log);

        // update
        imgur.image.updateImage({ imageHash: "R3sQTLx", tagList: "tagList" }).then(obj => JSON.stringify(obj, null, 4)).then(console.log).catch(console.log);


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