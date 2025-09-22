const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('⏹️ Stop music and clear the queue'),
        
    async execute(interaction) {
        const queue = global.musicQueues?.get(interaction.guild.id);
        
        if (!queue) {
            return interaction.reply({ content: '❌ Nothing is currently playing!', ephemeral: true });
        }
        
        const voiceChannel = interaction.member?.voice?.channel;
        if (!voiceChannel) {
            return interaction.reply({ content: '🎧 You need to be in a voice channel!', ephemeral: true });
        }
        
        queue.songs = [];
        queue.isPlaying = false;
        queue.currentSong = null;
        queue.player.stop();
        queue.connection.destroy();
        
        global.musicQueues.delete(interaction.guild.id);
        
        await interaction.reply({ content: '⏹️ Music stopped and queue cleared!' });
    }
};
