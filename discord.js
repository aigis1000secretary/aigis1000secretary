const Discord = require('discord.js');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js')
const { GatewayIntentBits, Partials, ButtonStyle, Colors } = require('discord.js')
const encoder = require("./urlEncoder.js")

const msgEmbedUrl = (url) => {
    if (url.startsWith("http://seesaawiki.jp/aigis/d/")) {
        url = encoder.urlDecodeJP(url);
        url = url.replace("http://seesaawiki.jp/aigis/d/", "https://aigis1000secretary.fly.dev/seesaawiki/");
        // url = url.replace("http://seesaawiki.jp/aigis/d/", "http://127.0.0.1:8080/seesaawiki/");
    }
    return url;
}

module.exports = {
    bot: null,
    admin: [],

    init(discordCfg) {
        this.bot = new Discord.Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent
            ],
            partials: [
                Partials.Message,
                Partials.Channel,
                Partials.Reaction
            ]
        });
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
            let _msg = /new [a-f0-9]{32}/.test(msg) ? `anna ${msg}` : msg;

            let embed = new EmbedBuilder()
                .setColor(Colors.Blue)
                .setDescription(_msg)
            return { embeds: [embed] };

        } else if (type == "object") {
            // console.json(msg);
            type = msg.type;

            if (type == "image") {
                let embed = new EmbedBuilder()
                    .setColor(Colors.Blue)
                    .setImage(msg.imageLink);
                return { embeds: [embed] };

            } else if (type == "option") {
                let str = [];
                let components = [];

                for (let i = 0; i < msg.labels.length; ++i) {
                    let label = msg.labels[i];
                    let command = /new [a-f0-9]{32}/.test(msg.msgs[i]) ? `anna ${msg.msgs[i]}` : msg.msgs[i];
                    let btn;

                    if (command.indexOf("http") == 0) {
                        str.push(`\`${label}\``);

                        // new btn
                        btn = new ButtonBuilder()
                            .setStyle(ButtonStyle.Link)
                            .setLabel(label.replace(/>> /, ''))
                            .setURL(command);
                    } else {
                        str.push(`\`${label}:\`\n ${command}`);

                        // new btn
                        btn = new ButtonBuilder()
                            .setStyle(ButtonStyle.Primary)
                            .setLabel(label)
                            .setCustomId(`option #${i}`);
                    }

                    // new col
                    if (components.length <= 0 ||
                        components[components.length - 1].components.length >= 5) {
                        // new row
                        let row = new ActionRowBuilder().addComponents(btn);
                        components.push(row);

                    } else {
                        components[components.length - 1]
                            .addComponents(btn);
                    }
                }

                let embed = new EmbedBuilder()
                    .setColor(Colors.Blue)
                    .setTitle(msg.title)
                    .setDescription(str.join("\n"))

                let result = { embeds: [embed] };
                if (components.length > 0) { result.components = components; }

                return result;

            } else if (type == "twitter") {
                // let str = ""
                // for (data of msg.data) {
                //     // str += `<https://twitter.com/Aigis1000/status/${data.twitterId}>\n`;
                //     str += `https://twitter.com/Aigis1000/status/${data.twitterId}\n`;
                // }
                // return { content: str.trim() };

                let results = [];
                for (let tweet of msg.data) {
                    let embed = new EmbedBuilder()
                        .setColor(Colors.Blue)
                        .setAuthor({
                            name: tweet.includes.users[0].name,
                            iconURL: tweet.includes.users[0].username == "Aigis1000" ? 'https://pbs.twimg.com/profile_images/587842655951826945/zs_Nfo7C_bigger.jpg' : null,
                            url: `https://twitter.com/${tweet.includes.users[0].username}`
                        })
                        .setDescription(tweet.text)
                        .setTimestamp()
                        .setFooter({ text: 'Twitter', iconURL: 'https://abs.twimg.com/icons/apple-touch-icon-192x192.png' });

                    if (tweet.media) {
                        let img = tweet.includes.media.shift();
                        embed.setImage(img.url)
                    }
                    results.push(embed);

                    for (let img of tweet.includes.media) {
                        embed = new EmbedBuilder()
                            .setImage(img.url)
                        results.push(embed);
                    }
                }
                return { embeds: results };

            } else if (type == "character") {
                let embed = new EmbedBuilder()
                    .setColor(Colors.Blue)
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