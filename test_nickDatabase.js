
const fs = require("fs");
let charaDataBase = [];

// 檢查資料
const checkCharaData = function (name) {
    //for (var i = 0; i < charaDataBase.length; i++) {
    for (let i in charaDataBase) {
        if (charaDataBase[i].str_name == name)
            return i;
    }
    return -1;
}

// 儲存資料
const saveCharaDataBase = function () {
	console.log("CharaDataBase saving...");

	// object to json
	var json = JSON.stringify(charaDataBase);

	// callback
	let fsCallBack = function (error, bytesRead, buffer) {
		if (error) {
			console.log(error);
			return;
		}
	}
	// json to file
	fs.writeFile("CharaDataBase_.json", json, "utf8", fsCallBack);

	console.log("CharaDataBase saved!");
}

// readfile
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

const loadCharaDataBase = async function () {
    try {
        // read file
        let data = await asyncReadFile("CharaDataBase.json");

        // file to object
        let count = 0;
        try {
            charaDataBase = JSON.parse(data);
        } catch (e) {
            charaDataBase = eval("(" + data + ")");
        }

        // get name-nick data
        let nameList = [];
        for (let i in charaDataBase) {
            if (charaDataBase[i].str_nickname != [] && typeof (charaDataBase[i].str_nickname) != "undefined") {
                nameList.push(charaDataBase[i].str_name + "@" + charaDataBase[i].str_nickname);
            }
        }
        nameList.sort();

        // clear database
        charaDataBase = [];
        for (let i in nameList) {
            let data = nameList[i].split("@");

            if (checkCharaData(data[0]) == -1) {
                // set new data
                let newCharaData = {};
                newCharaData.str_name = data[0];
                newCharaData.str_nickname = data[1].split(",");
                charaDataBase.push(newCharaData);
            } else {
                // set new nick
                let index = checkCharaData(data[0]);
                let nicknames = data[1].split(",");

                for (let j in nicknames) {
                    if (charaDataBase[index].str_nickname.indexOf(nicknames[j]) == -1) {
                        charaDataBase[index].str_nickname.push(nicknames[j])
                    }
                }
            }
        }

        return;
    } catch (error) {
        console.log(error);
    }
}



const debugFunc = async function () {
    await loadCharaDataBase();
    saveCharaDataBase();
}
debugFunc();