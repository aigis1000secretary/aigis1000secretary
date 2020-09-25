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

