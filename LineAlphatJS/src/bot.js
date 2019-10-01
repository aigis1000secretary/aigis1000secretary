const LineConnect = require('./connect');
let line = require('./main.js');
let LINE = new line();

function createBot(auth) {
    let client = new LineConnect(auth);

    client.startx().then(async (res) => {

        while (true) {
            try {
                ops = await client.fetchOps(res.operation.revision);
            } catch (error) {
                console.log('error', error)
            }
            for (let op in ops) {
                if (ops[op].revision.toString() != -1) {
                    res.operation.revision = ops[op].revision;
                    LINE.poll(ops[op])
                }
            }
        }
    });

    return LINE;
}
module.exports = createBot;






String.prototype.equali = function (s1) {
    let source = this;
    if (!s1) s1 = "";
    return (source.toUpperCase().trim() == s1.toUpperCase().trim());
}

// const fs = require("fs");
// global.logToFile = function (name, data) {
//     let dateNow = new Date(Date.now());
//     let path = "./logs/" + name + "_" +
//         dateNow.getFullYear().toString().padStart(4, "0") + "-" +
//         (dateNow.getMonth() + 1).toString().padStart(2, "0") + "-" +
//         dateNow.getDate().toString().padStart(2, "0") + "-" +
//         dateNow.getHours().toString().padStart(2, "0") +
//         dateNow.getMinutes().toString().padStart(2, "0") +
//         dateNow.getSeconds().toString().padStart(2, "0") +
//         dateNow.getMilliseconds().toString().padStart(4, "0") + ".log";

//     let binary = Buffer.from(JSON.stringify(data, null, 4))
//     fs.writeFileSync(path, binary);
// }
