const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('⏭️ Skip the current song'),
        
    async execute(interaction) {
        const queue = global.musicQueues?.get(interaction.guild.id);
        
        if (!queue || !queue.isPlaying) {
            return interaction.reply({ content: '❌ Nothing is currently playing!', ephemeral: true });
        }
        
        const voiceChannel = interaction.member?.voice?.channel;
        if (!voiceChannel) {
            return interaction.reply({ content: '🎧 You need to be in a voice channel!', ephemeral: true });
        }
        
        const skippedSong = queue.currentSong?.title || 'Unknown';
        queue.player.stop();
        
        await interaction.reply({ content: `⏭️ Skipped **${skippedSong}**!` });
    }
};
