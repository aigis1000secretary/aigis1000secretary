const LineConnect = require('./connect');
const line = require('./main.js');

class bot {
    constructor(auth) {
        this.LINE = new line();
        this.client = new LineConnect(auth);

        this.client.startx().then(async (res) => {

            let { mid } = await this.client._client.getProfile();
            console.log(mid);
            this.LINE.botmid = mid;

        while (true) {
            try {
                    let ops = await this.client.fetchOps(res.operation.revision);
            for (let op in ops) {
                if (ops[op].revision.toString() != -1) {
                    res.operation.revision = ops[op].revision;
                            // console.log(`\n`);
                            // console.log(ops[op]);
                            this.LINE.poll(ops[op])
                }
            }
                } catch (error) {
                    console.log('error', error)
                }
        }
    });
}
}

module.exports = bot;