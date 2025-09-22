const { SlashCommandBuilder } = require('discord.js');
const { useMainPlayer } = require('discord-player');
const config = require('../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('⏭️ Skip to the next song in queue'),
        
    async execute(interaction) {
        const player = useMainPlayer();
        const queue = player.nodes.get(interaction.guildId);
        
        if (!queue || !queue.currentTrack) {
            const embed = config.errorEmbed(
                'No Music Playing!',
                `${config.emojis.warning} There's no music currently playing to skip!`
            );
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const voiceChannel = interaction.member.voice.channel;
        if (!voiceChannel || voiceChannel.id !== queue.connection.channel.id) {
            const embed = config.errorEmbed(
                'Wrong Voice Channel!',
                `${config.emojis.headphones} You need to be in the same voice channel as me to control the music!`
            );
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        if (!queue.tracks.data.length && !queue.currentTrack) {
            const embed = config.errorEmbed(
                'Nothing to Skip!',
                `${config.emojis.warning} There are no more songs in the queue to skip to!`
            );
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        try {
            const currentTrack = queue.currentTrack;
            queue.node.skip();
            
            const embed = config.successEmbed(
                'Song Skipped!',
                `${config.emojis.skip} Skipped **${currentTrack.title}**! ${queue.tracks.data.length > 0 ? 'Playing next song...' : 'Queue is now empty!'} ${config.emojis.sparkle}`
            );
            
            return interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Skip command error:', error);
            const embed = config.errorEmbed(
                'Skip Failed!',
                `${config.emojis.error} Something went wrong while trying to skip the song.`
            );
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
};
