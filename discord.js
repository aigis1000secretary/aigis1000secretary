const Discord = require('discord.js')
const config = require("./config.js");

const _discord = module.exports = {
    bot: null,
    init() {
        _discord.bot = new Discord.Client();
        _discord.bot.login(config.discordbot.token);
    }
}