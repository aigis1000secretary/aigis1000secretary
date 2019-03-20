
const request = require("request");
const fs = require("fs");
const md5 = function (str) { return require('crypto').createHash('md5').update(str).digest('hex'); }

// vist site: https://api.imgur.com/oauth2/authorize?client_id=84f351fab201d5a&response_type=token
// get var from url
const IMGUR_REFRESH_TOKEN = "67d3f69b6ee6fd17f0c77a8df78cc87748fa7c68";
const IMGUR_USERNAME = "z1022001jp";
// https://imgur.com/account/settings/apps
const IMGUR_CLIENT_ID = "84f351fab201d5a";
const IMGUR_CLIENT_SECRET = "72ac198eaeb6edd3748a805f68fb9b9f741a9884";

const IMGUR_API_URL = "https://api.imgur.com/3/";
var IMGUR_ACCESS_TOKEN = "5f336949d6731b67fcad374a83851f3b543c17ad";

var _debug = false;

// Core
var imgur = {
	// request
	_request(options) {
		return new Promise(function (resolve, reject) {
			request(options, function (error, response, body) {

				//console.log(error);
				//console.log(response);
				//console.log(body);

				if (!error && response.statusCode == 200) {
					// Print out the response body
					var json = JSON.parse(body);
					resolve(json);

				} else {
					var err = "error";
					if (error) {
						err = error;
					} else {
						let json = JSON.parse(body);
						err = {
							status: json.status,
							message: json.data ? json.data.error : "No body data response"
						};
					}
					reject(err);
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

			// send request
			imgur._request(options)
				.then(function (jsonResponse) {
					if (_debug) console.log(jsonResponse);
					resolve(jsonResponse);
				})
				.catch(function (error) {
					if (_debug) console.log(error);
					reject(error);
				});
		});
	},


	// POST Generate Access_Token
	// web API: https://api.imgur.com/oauth2/token
	oauth2: {
		token() {
			console.log("Generate Access_Token");
			return new Promise(function (resolve, reject) {
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
				imgur._request(options)
					.then(function (jsonResponse) {
						if (_debug) console.log(jsonResponse);
						IMGUR_ACCESS_TOKEN = jsonResponse.access_token;
						//console.log(IMGUR_ACCESS_TOKEN);
						resolve(jsonResponse);
					})
					.catch(function (error) {
						if (_debug) console.log(error);
						IMGUR_ACCESS_TOKEN = "";
						reject(error);
					});
			});
		}
	},


	// Account API
	account: {
		// GET All Images
		async allImages() {
			console.log("GET Account All Images");
			try {
				// get images every page
				let maxPage = await imgur.account.imagesCount();
				var allImages = [], promiseArray = [];
				for (let i = 0; i <= maxPage; i++) {
					promiseArray.push(
						imgur.account.images(i).then(
							function (lastImages) {
								for (let j in lastImages) {
									allImages.push(lastImages[j]);
								}
							}
						)
					);
				}
				await Promise.all(promiseArray);

				return allImages;
			} catch (error) {
				throw error;
			}
		},
		// GET Images
		images(page) {
			if (typeof (page) != "number") page = 0;
			console.log("GET Account Images page: " + page);

			return new Promise(function (resolve, reject) {
				// Configure the request
				var options = {
					//url: IMGUR_API_URL + "account/" + IMGUR_USERNAME + "/images",
					url: IMGUR_API_URL + "account/me/images/" + page,
					method: "GET"
				};

				imgur._apiRequest(options)
					.then(function (jsonResponse) {
						resolve(jsonResponse.data);
					})
					.catch(function (error) {
						reject(error);
					});
			});
		},
		// GET Count
		imagesCount() {
			return new Promise(function (resolve, reject) {
				// Configure the request
				var options = {
					//url: IMGUR_API_URL + "account/" + IMGUR_USERNAME + "/images",
					url: IMGUR_API_URL + "account/me/images/count",
					method: "GET"
				};

				imgur._apiRequest(options)
					.then(function (jsonResponse) {
						resolve(parseInt(jsonResponse.data / 50));
					})
					.catch(function (error) {
						reject(error);
					});
			});
		}
	},


	/*// Album API
	imgur.album = {};
	// GET Album Images
	imgur.album.imagesByHash = function(_albumHash) {
		return new Promise(function(resolve, reject) {
			// Set the headers
			//var headers = {	Authorization:	"Bearer " + IMGUR_ACCESS_TOKEN };
	
			// Configure the request
			var options = {
				url: IMGUR_API_URL + "album/" + _albumHash + "/images",
				method: "GET"
			};
	
			imgur._apiRequest(options)
			.then(function(jsonResponse) {
				for (var i in jsonResponse.data) {
					jsonResponse.data[i].albumHash = _albumHash;
				}
				resolve(jsonResponse.data);
			})
			.catch(function(error) {
				reject(error);
			});
		});
	}*/ // useless?


	// Image API
	image: {
		// POST Image Upload
		imageUpload(imageLocalPath, mainTag) {
			return new Promise(async function (resolve, reject) {
				// get request data
				var imageBinary = "";
				var md5 = "";
				var fileName = imageLocalPath.match(/[^\/]+$/gi);
				try {
					imageBinary = await asyncReadFile(imageLocalPath);
					md5 = md5(imageBinary);

					imgur.image.binaryImageUpload(imageBinary, md5, fileName, mainTag)
						.then(function (jsonResponse) {
							resolve(jsonResponse);
						})
						.catch(function (error) {
							reject(error);
						});
				} catch (error) {
					reject(error);
				}
			});
		},
		binaryImageUpload(imageBinary, md5, fileName, mainTag) {
			return new Promise(function (resolve, reject) {
				// Configure the request
				var options = {
					url: IMGUR_API_URL + "image",
					method: "POST",
					// Set the POST body
					formData: {
						image: imageBinary,
						title: md5,
						name: fileName,
						description: mainTag	//description: _tage.join(",")	// defult: folder name, manual add for auto response key word
					}
				};

				imgur._apiRequest(options)
					.then(function (jsonResponse) {
						resolve(jsonResponse);
					})
					.catch(function (error) {
						reject(error);
					});
			});
		},
		// DELETE Image Deletion
		ImageDeletion(imageHash) {
			return new Promise(function (resolve, reject) {
				// Configure the request
				var options = {
					url: IMGUR_API_URL + "image/" + imageHash,
					method: "DELETE",
				};

				imgur._apiRequest(options)
					.then(function (jsonResponse) {
						resolve(jsonResponse);
					})
					.catch(function (error) {
						reject(error);
					});
			});
		}
	},


	// DB
	database: {
		// cteate image data from response.data
		images: [],
		// get image from response.data
		loadImages(jsonResponse) {
			// response.data to album
			imgur.database.images = [];	// clear Database
			for (let i in jsonResponse) {
				//console.log(jsonResponse[i]);
				var newImage = imgur.database.createImage(jsonResponse[i]);

				if (newImage.md5) {
					let onlineImage = imgur.database.findImageByMd5(newImage.md5);
					if (onlineImage.length != 0) {
						imgur.image.ImageDeletion(newImage.id)
					} else {
						imgur.database.images.push(newImage);
					}
				}
			}
			console.log("Imgur account images load complete (" + imgur.database.images.length + " images)!");
			return;
		},
		createImage(newData) {
			// set new image data
			var newImage = {};
			newImage.fileName = newData.name;
			newImage.md5 = newData.title;
			newImage.tags = newData.description == null ? [] : newData.description.toUpperCase().split(",");
			newImage.id = newData.id;	// imageHash
			newImage.imageLink = newData.link;
			newImage.thumbnailLink = newData.link.replace(newImage.id, newImage.id + "m");
			/*
			Thumbnail Suffix	Thumbnail Name		Thumbnail Size	Keeps Image Proportions
			"s"					Small Square		90x90			No
			"b"					Big Square			160x160			No
			"t"					Small Thumbnail		160x160			Yes
			"m"					Medium Thumbnail	320x320			Yes
			"l"					Large Thumbnail		640x640			Yes
			"h"					Huge Thumbnail		1024x1024		Yes
			*/

			for (let i in newImage.tags) {
				newImage.tags[i] = newImage.tags[i].trim();
			}


			return newImage;
		},
		// find image from Database
		findImageByMd5(keyMd5) {
			keyMd5 = keyMd5.toUpperCase().trim();
			// search album by md5
			for (let i in imgur.database.images) {
				if (imgur.database.images[i].md5.toUpperCase().trim() == keyMd5)
					return [imgur.database.images[i]];
			}
			return [];
		},
		findImageByTag(keyTag) {
			// search album by tag
			var result = [];
			for (let i in imgur.database.images) {
				if (imgur.database.images[i].tags.indexOf(keyTag) != -1) {
					result.push(imgur.database.images[i]);
				}
			}
			return result;
		},
		findImageByNameTag(keyName, keyTag) {
			// search album by tag
			var result = [];
			keyName = keyName.toUpperCase().trim();
			for (let i in imgur.database.images) {
				if (imgur.database.images[i].fileName.toUpperCase().trim() == keyName &&
					imgur.database.images[i].tags.indexOf(keyTag) != -1) {
					result.push(imgur.database.images[i]);

				}
			}
			return result;
		},
		findImageByFileName(keyName) {
			// search album by tag
			var result = [];
			keyName = keyName.toUpperCase().trim();
			for (let i in imgur.database.images) {
				if (imgur.database.images[i].fileName.toUpperCase().trim() == keyName) {
					result.push(imgur.database.images[i]);
				}
			}
			return result;
		},

		// 儲存資料
		saveDatabase() {
			console.log("Imgur Database saving...");

			// object to json
			var json = JSON.stringify(imgur.database.images);

			// callback
			let fsCallBack = function (error, bytesRead, buffer) {
				if (error) {
					console.log(error);
					return;
				}
			}
			// json to file
			fs.writeFile("ImgurDatabase.log", json, "utf8", fsCallBack);

			console.log("Imgur Database saved!");
		},
	},


	async init() {
		// access token update
		await imgur.oauth2.token()
			.then(function (jsonResponse) {
				console.log("IMGUR_ACCESS_TOKEN update complete!");
			})
			.catch(function (error) {
				console.log("IMGUR_ACCESS_TOKEN update error!");
				console.log(error);
			});

		await imgur.account.allImages()
			.then(imgur.database.loadImages)
			.catch(function (error) {
				console.log("Imgur images load error!");
				console.log(error);
			});

		return;
	}


};
module.exports = imgur;


/*
imgur.account.images
imgur.image.imageUpload = function(_imgPath, _tags)
//*/
/*
const debugFunc = function() {
	var _imageHash = "NX3tRXx";

	imgur.account.images()
	//imgur.image.imageUpload("C:/Windows/Web/Wallpaper/Scenes/img25.jpg", _tags)
	.then(function(jsonResponse) {
		console.log(jsonResponse);
	})
	.catch(function(error) {
		console.log(error);
	});
}//*/
/*
const debugFunc = function() {
	var tmp = imgur.database.albums;
	var str = JSON.stringify(tmp);
	console.log(str);
}//*/
//setTimeout(debugFunc, 2 * 1000);

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