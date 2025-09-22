const { SlashCommandBuilder } = require('discord.js');
const { useMainPlayer } = require('discord-player');
const config = require('../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resume')
        .setDescription('▶️ Resume the paused music'),
        
    async execute(interaction) {
        const player = useMainPlayer();
        const queue = player.nodes.get(interaction.guildId);
        
        if (!queue || !queue.currentTrack) {
            const embed = config.errorEmbed(
                'No Music Playing!',
                `${config.emojis.warning} There's no music currently playing to resume!`
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
        
        if (!queue.node.isPaused()) {
            const embed = config.errorEmbed(
                'Music Not Paused!',
                `${config.emojis.play} The music is already playing! No need to resume.`
            );
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        try {
            queue.node.resume();
            
            const embed = config.successEmbed(
                'Music Resumed!',
                `${config.emojis.play} The music has been resumed! Let's keep the vibe going! ${config.emojis.notes}`
            );
            
            return interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Resume command error:', error);
            const embed = config.errorEmbed(
                'Resume Failed!',
                `${config.emojis.error} Something went wrong while trying to resume the music.`
            );
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
};
