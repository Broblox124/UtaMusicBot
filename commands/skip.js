const { SlashCommandBuilder } = require('discord.js');
const { queues } = require('./play.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('⏭️ Skip the current song'),
        
    async execute(interaction) {
        const queue = queues.get(interaction.guild.id);
        
        if (!queue || !queue.isPlaying) {
            return interaction.reply({ content: '❌ Nothing is currently playing!', ephemeral: true });
        }
        
        const voiceChannel = interaction.member?.voice?.channel;
        if (!voiceChannel) {
            return interaction.reply({ content: '🎧 You need to be in a voice channel!', ephemeral: true });
        }
        
        const skippedSong = queue.currentSong?.title || 'Unknown';
        queue.player.stop(); // This triggers the 'idle' event which plays next song
        
        await interaction.reply({ content: `⏭️ Skipped **${skippedSong}**!` });
    }
};
