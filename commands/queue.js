const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { useMainPlayer } = require('discord-player');
const config = require('../config/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('📋 Show the current music queue'),
        
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
        
        const tracks = queue.tracks.data;
        const currentTrack = queue.currentTrack;
        
        try {
            const embed = new EmbedBuilder()
                .setTitle(`${config.emojis.queue} Music Queue`)
                .setColor(config.botColor)
                .setTimestamp()
                .setFooter({ 
                    text: `${config.botName} • ${tracks.length + 1} song${tracks.length !== 0 ? 's' : ''} total ${config.emojis.notes}`,
                    iconURL: interaction.client.user.displayAvatarURL()
                });
            
            // Current track
            embed.addFields({
                name: `${config.emojis.play} Now Playing`,
                value: `**[${currentTrack.title}](${currentTrack.url})**\n${config.emojis.microphone} ${currentTrack.author} • ${currentTrack.duration}\n${config.emojis.headphones} Requested by ${currentTrack.requestedBy}`,
                inline: false
            });
            
            // Queue tracks
            if (tracks.length > 0) {
                const queueString = tracks.slice(0, 10).map((track, index) => {
                    return `**${index + 1}.** [${track.title}](${track.url})\n${config.emojis.microphone} ${track.author} • ${track.duration}`;
                }).join('\n\n');
                
                embed.addFields({
                    name: `${config.emojis.notes} Up Next ${tracks.length > 10 ? `(Showing 10 of ${tracks.length})` : `(${tracks.length} song${tracks.length !== 1 ? 's' : ''})`}`,
                    value: queueString,
                    inline: false
                });
            } else {
                embed.addFields({
                    name: `${config.emojis.sparkle} Queue Status`,
                    value: `No songs in queue! Use \`/play\` to add more vibes! ${config.emojis.love}`,
                    inline: false
                });
            }
            
            // Queue info
            const totalDuration = [currentTrack, ...tracks].reduce((acc, track) => acc + (track.durationMS || 0), 0);
            const formatTime = (ms) => {
                const hours = Math.floor(ms / 3600000);
                const minutes = Math.floor((ms % 3600000) / 60000);
                const seconds = Math.floor((ms % 60000) / 1000);
                if (hours > 0) return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                return `${minutes}:${seconds.toString().padStart(2, '0')}`;
            };
            
            embed.addFields({
                name: `${config.emojis.radio} Queue Statistics`,
                value: `**Total Songs:** ${tracks.length + 1}\n**Total Duration:** ${formatTime(totalDuration)}\n**Loop Mode:** ${queue.repeatMode === 0 ? 'Off' : queue.repeatMode === 1 ? 'Track' : 'Queue'}\n**Volume:** ${queue.node.volume}%`,
                inline: true
            });
            
            // Control buttons
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
                        .setCustomId('shuffle')
                        .setEmoji('🔀')
                        .setLabel('Shuffle')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('repeat')
                        .setEmoji('🔁')
                        .setLabel('Repeat')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('stop')
                        .setEmoji('⏹️')
                        .setLabel('Stop')
                        .setStyle(ButtonStyle.Danger)
                );
            
            return interaction.reply({ 
                embeds: [embed],
                components: [row]
            });
            
        } catch (error) {
            console.error('Queue command error:', error);
            const embed = config.errorEmbed(
                'Queue Error!',
                `${config.emojis.error} Something went wrong while fetching the queue.`
            );
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
};
