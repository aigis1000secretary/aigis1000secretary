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
                let embed = new Discord.MessageEmbed()
                    .setColor('BLUE')
                    .setImage(msg.imageLink);
                return embed;

            } else if (type == "option") {
                let str = [];

                for (let i = 0; i < msg.labels.length; ++i) {
                    if (msg.msgs[i].indexOf("http") == 0) {
                        str.push(`[${msg.labels[i]}](${msg.msgs[i]})`);
                    } else {
                        str.push(`${msg.labels[i]}:\n ${msg.msgs[i]}`);
                    }
                }

                let embed = new Discord.MessageEmbed()
                    .setColor('BLUE')
                    .setTitle(msg.title)
                    .setDescription(str.join("\n"))

                return embed;

            } else if (type == "twitter") {
                let str = ""
                for (data of msg.data) {
                    // str += `<https://twitter.com/Aigis1000/status/${data.twitterId}>\n`;
                    str += `https://twitter.com/Aigis1000/status/${data.twitterId}\n`;
                }
                return str.trim();

            } else if (type == "character") {
                let embed = new Discord.MessageEmbed()
                    .setColor('BLUE')
                    .setTitle(msg.title)
                    .setDescription(`${msg.data}\n\n[${msg.labels}](${msg.url})`);

                if (msg.imageLink) { embed.setImage(msg.imageLink); }

                return embed;

            }
            return msg;
        }
    }

}