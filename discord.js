const Discord = require('discord.js')
const config = require("./config.js");
const encoder = require("./urlEncoder.js")

const msgEmbedUrl = (url) => {
    if (url.startsWith("http://seesaawiki.jp/aigis/d/")) {
        url = encoder.urlDecodeJP(url);
        url = url.replace("http://seesaawiki.jp/aigis/d/", "https://aigis1000secretary.herokuapp.com/seesaawiki/");
        // url = url.replace("http://seesaawiki.jp/aigis/d/", "http://127.0.0.1:8080/seesaawiki/");
    }
    return url;
}

module.exports = {
    bot: null,
    admin: [],

    init(discordCfg) {
        this.bot = new Discord.Client({ intents: ["GUILDS", "GUILD_MESSAGES"] });
        this.bot.login(discordCfg.token);
        this.admin = discordCfg.admin;
    },

    isAdmin(id) {
        return this.admin.includes(id);
    },

    formatReply(msgs) {
        if (Array.isArray(msgs)) {
            let embeds = [], components = [];

            for (let i = 0; i < msgs.length; ++i) {
                let payload = this.replyObj(msgs[i]);
                if (payload.embeds) { embeds = embeds.concat(payload.embeds); }
                if (payload.components) { components = components.concat(payload.components); }
            }
            return { embeds, components, allowedMentions: { repliedUser: false } };
        } else {
            let rMsg = this.replyObj(msgs);
            rMsg.allowedMentions = { repliedUser: false };
            return rMsg;
        }
    },
    replyObj(msg) {
        let type = typeof (msg);

        if (type == "string") {
            let embed = new Discord.MessageEmbed()
                .setColor('BLUE')
                .setDescription(msg)
            return { embeds: [embed] };

        } else if (type == "object") {
            // console.json(msg);
            type = msg.type;

            if (type == "image") {
                let embed = new Discord.MessageEmbed()
                    .setColor('BLUE')
                    .setImage(msg.imageLink);
                return { embeds: [embed] };

            } else if (type == "option") {
                let str = [];

                for (let i = 0; i < msg.labels.length; ++i) {
                    if (msg.msgs[i].indexOf("http") == 0) {
                        str.push(`[${msg.labels[i]}](${msgEmbedUrl(msg.msgs[i])})`);
                    } else {
                        str.push(`\`${msg.labels[i]}:\`\n ${msg.msgs[i]}`);
                    }
                }

                let embed = new Discord.MessageEmbed()
                    .setColor('BLUE')
                    .setTitle(msg.title)
                    .setDescription(str.join("\n"))

                return { embeds: [embed] };

            } else if (type == "twitter") {
                // let str = ""
                // for (data of msg.data) {
                //     // str += `<https://twitter.com/Aigis1000/status/${data.twitterId}>\n`;
                //     str += `https://twitter.com/Aigis1000/status/${data.twitterId}\n`;
                // }
                // return { content: str.trim() };

                let results = [];
                for (let tweet of msg.data) {
                    let embed = new Discord.MessageEmbed()
                        .setColor('BLUE')
                        .setAuthor(tweet.includes.users[0].name,
                            tweet.includes.users[0].username == "Aigis1000" ? 'https://pbs.twimg.com/profile_images/587842655951826945/zs_Nfo7C_bigger.jpg' : '',
                            `https://twitter.com/${tweet.includes.users[0].username}`)
                        .setDescription(tweet.text)
                        .setTimestamp()
                        .setFooter('Twitter', 'https://abs.twimg.com/icons/apple-touch-icon-192x192.png');

                    if (tweet.media) {
                        let img = tweet.includes.media.shift();
                        embed.setImage(img.url)
                    }
                    results.push(embed);

                    for (let img of tweet.includes.media) {
                        embed = new Discord.MessageEmbed()
                            .setImage(img.url)
                        results.push(embed);
                    }
                }
                return { embeds: results };

            } else if (type == "character") {
                let embed = new Discord.MessageEmbed()
                    .setColor('BLUE')
                    .setTitle(msg.title)
                    .setDescription(`${msg.data}\n\n[${msg.label}](${msgEmbedUrl(msg.url)})`);

                if (msg.imageLink) { embed.setImage(msg.imageLink); }

                return { embeds: [embed] };

            }
            return null;
        }
    },
    async pushLog(content) {
        const admin = await this.bot.users.fetch(this.admin[0]);
        return await admin.send({ content })
            .then(message => console.log(`Sent message: ${message.content}`))
            .catch(console.error);
    }
}