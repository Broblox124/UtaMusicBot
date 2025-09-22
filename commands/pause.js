const { SlashCommandBuilder } = require('discord.js');
const { useMainPlayer } = require('discord-player');
const config = require('../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('⏸️ Pause the current music'),
        
    async execute(interaction) {
        const player = useMainPlayer();
        const queue = player.nodes.get(interaction.guildId);
        
        if (!queue || !queue.currentTrack) {
            const embed = config.errorEmbed(
                'No Music Playing!',
                `${config.emojis.warning} There's no music currently playing to pause!`
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
        
        if (queue.node.isPaused()) {
            const embed = config.errorEmbed(
                'Already Paused!',
                `${config.emojis.pause} The music is already paused! Use \`/resume\` to continue.`
            );
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        try {
            queue.node.pause();
            
            const embed = config.successEmbed(
                'Music Paused!',
                `${config.emojis.pause} The music has been paused! Use \`/resume\` to continue the vibe! ${config.emojis.sparkle}`
            );
            
            return interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Pause command error:', error);
            const embed = config.errorEmbed(
                'Pause Failed!',
                `${config.emojis.error} Something went wrong while trying to pause the music.`
            );
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
};
