const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('📋 Show the current music queue'),
        
    async execute(interaction) {
        const queue = global.musicQueues?.get(interaction.guild.id);
        
        if (!queue || (!queue.currentSong && queue.songs.length === 0)) {
            return interaction.reply({ content: '📭 The queue is empty!', ephemeral: true });
        }
        
        let description = '';
        
        if (queue.currentSong) {
            description += `**🎵 Now Playing:**\n[${queue.currentSong.title}](${queue.currentSong.url}) - ${queue.currentSong.author}\nRequested by ${queue.currentSong.requester.username}\n\n`;
        }
        
        if (queue.songs.length > 0) {
            description += '**📋 Up Next:**\n';
            queue.songs.slice(0, 10).forEach((song, index) => {
                description += `**${index + 1}.** [${song.title}](${song.url}) - ${song.author}\nRequested by ${song.requester.username}\n`;
            });
            
            if (queue.songs.length > 10) {
                description += `\n*... and ${queue.songs.length - 10} more songs*`;
            }
        }
        
        const embed = new EmbedBuilder()
            .setTitle('📋 Music Queue')
            .setDescription(description || 'Queue is empty')
            .setColor('#FF69B4')
            .setFooter({ text: `Total songs in queue: ${queue.songs.length}` })
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    }
};
