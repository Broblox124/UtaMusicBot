const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { useMainPlayer } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('🎵 Play a song and start the vibe!')
        .addStringOption(option =>
            option.setName('song')
                .setDescription('Song name or URL')
                .setRequired(true)
        ),
        
    async execute(interaction) {
        try {
            // IMMEDIATELY defer to prevent timeout
            await interaction.deferReply();
            
            const player = useMainPlayer();
            const query = interaction.options.getString('song');
            const voiceChannel = interaction.member?.voice?.channel;
            
            // Quick validation
            if (!voiceChannel) {
                return await interaction.editReply({
                    content: '🎧 You need to be in a voice channel to play music!'
                });
            }
            
            const permissions = voiceChannel.permissionsFor(interaction.client.user);
            if (!permissions?.has(['Connect', 'Speak'])) {
                return await interaction.editReply({
                    content: '⚠️ I need permissions to connect and speak in your voice channel!'
                });
            }
            
            try {
                // Simple play method
                const { track } = await player.play(voiceChannel, query, {
                    requestedBy: interaction.user,
                    nodeOptions: {
                        metadata: {
                            channel: interaction.channel,
                            requestedBy: interaction.user
                        }
                    }
                });
                
                // Simple success message
                const embed = new EmbedBuilder()
                    .setTitle('🎵 Now Playing')
                    .setDescription(`**${track.title}**\n🎤 ${track.author}`)
                    .setColor('#FF69B4')
                    .setThumbnail(track.thumbnail || null)
                    .addFields([
                        { name: '⏱️ Duration', value: track.duration || 'Unknown', inline: true },
                        { name: '🎧 Requested by', value: interaction.user.toString(), inline: true }
                    ])
                    .setFooter({ text: 'VibyMusic • Enjoy the vibes! ✨' });
                
                return await interaction.editReply({ embeds: [embed] });
                
            } catch (playError) {
                console.error('Play error:', playError.message);
                
                // Handle common errors
                if (playError.message.includes('No results')) {
                    return await interaction.editReply({
                        content: `❌ No results found for "${query}". Try a different search!`
                    });
                }
                
                if (playError.message.includes('unavailable')) {
                    return await interaction.editReply({
                        content: `❌ That video is unavailable. Try a different song!`
                    });
                }
                
                return await interaction.editReply({
                    content: `❌ Failed to play "${query}". Try a different search or try again later.`
                });
            }
            
        } catch (error) {
            console.error('Command error:', error.message);
            
            // Handle timeout errors
            if (error.code === 10062) {
                console.log('Interaction timed out');
                return;
            }
            
            try {
                if (interaction.deferred) {
                    await interaction.editReply({
                        content: '❌ Something went wrong! Please try again.'
                    });
                } else {
                    await interaction.reply({
                        content: '❌ Something went wrong! Please try again.',
                        ephemeral: true
                    });
                }
            } catch (replyError) {
                console.error('Failed to send error reply:', replyError.message);
            }
        }
    }
};
