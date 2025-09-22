const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { useMainPlayer } = require('discord-player');
const config = require('../config/config');
const { getVibyMessage } = require('../utils/musicUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nowplaying')
        .setDescription('🎵 Show what\'s currently playing'),
        
    async execute(interaction) {
        const player = useMainPlayer();
        const queue = player.nodes.get(interaction.guildId);
        
        if (!queue || !queue.currentTrack) {
            const embed = config.errorEmbed(
                'No Music Playing!',
                `${config.emojis.warning} There's no music currently playing! Use \`/play\` to start the party! ${config.emojis.music}`
            );
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        const track = queue.currentTrack;
        const timestamp = queue.node.getTimestamp();
        const progress = queue.node.createProgressBar();
        
        try {
            // Create control buttons
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('pause_resume')
                        .setEmoji(queue.node.isPaused() ? '▶️' : '⏸️')
                        .setLabel(queue.node.isPaused() ? 'Resume' : 'Pause')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('skip')
                        .setEmoji('⏭️')
                        .setLabel('Skip')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('stop')
                        .setEmoji('⏹️')
                        .setLabel('Stop')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId('shuffle')
                        .setEmoji('🔀')
                        .setLabel('Shuffle')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('repeat')
                        .setEmoji('🔁')
                        .setLabel('Repeat')
                        .setStyle(ButtonStyle.Secondary)
                );
            
            // Create embed
            const embed = new EmbedBuilder()
                .setTitle(`${config.emojis.music} Now Playing`)
                .setDescription(`**[${track.title}](${track.url})**\n${config.emojis.microphone} ${track.author}`)
                .addFields(
                    { 
                        name: `${config.emojis.notes} Progress`, 
                        value: `${progress.progress}\n\`${timestamp.current.label}\` / \`${timestamp.total.label}\``, 
                        inline: false 
                    },
                    { name: `${config.emojis.headphones} Requested by`, value: track.requestedBy.toString(), inline: true },
                    { name: `${config.emojis.radio} Source`, value: track.source, inline: true },
                    { name: `${config.emojis.volume} Volume`, value: `${queue.node.volume}%`, inline: true },
                    { 
                        name: `${config.emojis.queue} Queue Info`, 
                        value: `**${queue.tracks.data.length}** songs in queue\n**${queue.repeatMode === 0 ? 'Off' : queue.repeatMode === 1 ? 'Track' : 'Queue'}** repeat mode`, 
                        inline: true 
                    },
                    { 
                        name: `${config.emojis.sparkle} Status`, 
                        value: queue.node.isPaused() ? '⏸️ Paused' : '▶️ Playing', 
                        inline: true 
                    }
                )
                .setThumbnail(track.thumbnail)
                .setColor(config.botColor)
                .setTimestamp()
                .setFooter({ 
                    text: `${config.botName} • ${getVibyMessage()}`,
                    iconURL: interaction.client.user.displayAvatarURL()
                });
            
            return interaction.reply({ 
                embeds: [embed],
                components: [row]
            });
            
        } catch (error) {
            console.error('Now playing command error:', error);
            const embed = config.errorEmbed(
                'Error!',
                `${config.emojis.error} Something went wrong while fetching the current track.`
            );
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
};
