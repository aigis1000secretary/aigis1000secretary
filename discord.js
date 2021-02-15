const Discord = require('discord.js')
const config = require("./config.js");

module.exports = {
    bot: null,
    admin: [],

    init(discordCfg) {
        this.bot = new Discord.Client();
        this.bot.login(discordCfg.token);
        this.admin = discordCfg.admin;
    },

    isAdmin(id) {
        return this.admin.includes(id);
    },

    formatReply(msgs) {
        if (Array.isArray(msgs)) {
            for (let i = 0; i < msgs.length; ++i) {
                msgs[i] = this.replyObj(msgs[i]);
            }
            return msgs;
        } else {
            return this.replyObj(msgs);
        }
    },
    replyObj(msg) {
        let type = typeof (msg);

        if (type == "string") {
            return msg;

        } else if (type == "object") {
            // console.json(msg);
            type = msg.type;

            if (type == "image") {
                return msg.imageLink;

            } else if (type == "option") {
                let str = `${msg.title}\n`;

                for (let i = 0; i < msg.labels.length; ++i) {
                    if (msg.msgs[i].indexOf("http") == 0) {
                        str += `${msg.labels[i]}: <${msg.msgs[i]}>\n`;
                    } else {
                        str += `${msg.labels[i]}:\n${msg.msgs[i]}\n`;
                    }
                }

                return str;
            }
        }
    }

}