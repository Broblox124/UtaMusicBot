const { SlashCommandBuilder } = require('discord.js');
const { AudioPlayerStatus } = require('@discordjs/voice');
const { queues } = require('./play.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resume')
        .setDescription('▶️ Resume the paused song'),
        
    async execute(interaction) {
        const queue = queues.get(interaction.guild.id);
        
        if (!queue || !queue.currentSong) {
            return interaction.reply({ content: '❌ Nothing is currently paused!', ephemeral: true });
        }
        
        const voiceChannel = interaction.member?.voice?.channel;
        if (!voiceChannel) {
            return interaction.reply({ content: '🎧 You need to be in a voice channel!', ephemeral: true });
        }
        
        if (queue.player.state.status !== AudioPlayerStatus.Paused) {
            return interaction.reply({ content: '▶️ Music is not paused!', ephemeral: true });
        }
        
        queue.player.unpause();
        await interaction.reply({ content: '▶️ Music resumed!' });
    }
};
