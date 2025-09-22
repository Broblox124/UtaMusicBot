const { SlashCommandBuilder } = require('discord.js');
const { useMainPlayer } = require('discord-player');
const config = require('../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('⏹️ Stop the music and clear the queue'),
        
    async execute(interaction) {
        const player = useMainPlayer();
        const queue = player.nodes.get(interaction.guildId);
        
        if (!queue || !queue.currentTrack) {
            const embed = config.errorEmbed(
                'No Music Playing!',
                `${config.emojis.warning} There's no music currently playing to stop!`
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
        
        try {
            queue.delete();
            
            const embed = config.successEmbed(
                'Music Stopped!',
                `${config.emojis.stop} The music has been stopped and the queue has been cleared. Thanks for vibing with ${config.botName}! ${config.emojis.love}`
            );
            
            return interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Stop command error:', error);
            const embed = config.errorEmbed(
                'Stop Failed!',
                `${config.emojis.error} Something went wrong while trying to stop the music.`
            );
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
};
