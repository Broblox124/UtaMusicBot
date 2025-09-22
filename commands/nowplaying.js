const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nowplaying')
        .setDescription('🎵 Show the currently playing song'),
        
    async execute(interaction) {
        const queue = global.musicQueues?.get(interaction.guild.id);
        
        if (!queue || !queue.currentSong) {
            return interaction.reply({ content: '❌ Nothing is currently playing!', ephemeral: true });
        }
        
        const song = queue.currentSong;
        
        const embed = new EmbedBuilder()
            .setTitle('🎵 Now Playing')
            .setDescription(`**[${song.title}](${song.url})**\n🎤 ${song.author}`)
            .setColor('#FF69B4')
            .setThumbnail(song.thumbnail)
            .addFields([
                { name: '⏱️ Duration', value: song.duration, inline: true },
                { name: '🎧 Requested by', value: song.requester.toString(), inline: true },
                { name: '📋 Songs in Queue', value: `${queue.songs.length}`, inline: true }
            ])
            .setFooter({ text: 'VibyMusic • Enjoy the vibes! ✨' })
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    }
};
