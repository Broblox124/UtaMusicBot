const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('test')
        .setDescription('Test if the bot is working'),
        
    async execute(interaction) {
        await interaction.reply({
            content: '✅ Bot is working! Commands are responding properly! 🎵',
            ephemeral: true
        });
    }
};
