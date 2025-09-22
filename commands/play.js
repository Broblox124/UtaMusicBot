const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { useMainPlayer } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('🎵 Play a song and start the vibe!')
        .addStringOption(option =>
            option.setName('song')
                .setDescription('Song name, artist, or YouTube URL')
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
                console.log(`🔍 Searching for: "${query}"`);
                
                // Enhanced search with multiple fallbacks
                const searchResult = await player.search(query, {
                    requestedBy: interaction.user,
                    searchEngine: 'youtubeSearch', // Use YouTube search specifically
                    fallbackSearchEngine: 'youtube'
                });
                
                // If first search fails, try with different engines
                if (!searchResult || !searchResult.tracks?.length) {
                    console.log('First search failed, trying alternative...');
                    
                    // Try with auto search engine
                    const fallbackResult = await player.search(query, {
                        requestedBy: interaction.user,
                        searchEngine: 'auto'
                    });
                    
                    if (!fallbackResult || !fallbackResult.tracks?.length) {
                        // Final attempt with direct YouTube URL search
                        const youtubeQuery = `ytsearch:${query}`;
                        const finalResult = await player.search(youtubeQuery, {
                            requestedBy: interaction.user
                        });
                        
                        if (!finalResult || !finalResult.tracks?.length) {
                            return await interaction.editReply({
                                content: `❌ No results found for "${query}". Try:\n\n✅ **Different spelling:** "despacito" instead of "despasito"\n✅ **Add artist:** "despacito luis fonsi"\n✅ **Use YouTube URL:** Paste direct link\n✅ **Popular songs:** Try "shape of you" or "bad guy"`
                            });
                        }
                        
                        Object.assign(searchResult, finalResult);
                    } else {
                        Object.assign(searchResult, fallbackResult);
                    }
                }
                
                console.log(`✅ Found ${searchResult.tracks.length} tracks`);
                
                // Play the first track
                const { track } = await player.play(voiceChannel, searchResult, {
                    requestedBy: interaction.user,
                    nodeOptions: {
                        metadata: {
                            channel: interaction.channel,
                            requestedBy: interaction.user
                        },
                        volume: 80,
                        leaveOnEmpty: true,
                        leaveOnEmptyCooldown: 300000,
                        leaveOnEnd: true,
                        leaveOnEndCooldown: 300000
                    }
                });
                
                // Create control buttons
                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('pause_resume')
                            .setEmoji('⏸️')
                            .setLabel('Pause')
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
                
                // Success embed
                const embed = new EmbedBuilder()
                    .setTitle('🎵 Now Playing')
                    .setDescription(`**[${track.title}](${track.url})**\n🎤 ${track.author}`)
                    .setColor('#FF69B4')
                    .setThumbnail(track.thumbnail || 'https://i.imgur.com/4M34hi2.png')
                    .addFields([
                        { name: '⏱️ Duration', value: track.duration || 'Unknown', inline: true },
                        { name: '🎧 Requested by', value: interaction.user.toString(), inline: true },
                        { name: '📻 Source', value: track.source || 'YouTube', inline: true }
                    ])
                    .setFooter({ 
                        text: 'VibyMusic • Enjoy the vibes! ✨',
                        iconURL: interaction.client.user.displayAvatarURL()
                    })
                    .setTimestamp();
                
                return await interaction.editReply({ 
                    embeds: [embed],
                    components: [row]
                });
                
            } catch (playError) {
                console.error('Play error details:', playError);
                
                // Handle specific search/play errors
                if (playError.message.includes('Sign in to confirm')) {
                    return await interaction.editReply({
                        content: '❌ YouTube is blocking requests. Try:\n\n✅ **Different search terms**\n✅ **Wait 30 seconds and try again**\n✅ **Use a YouTube URL directly**'
                    });
                }
                
                if (playError.message.includes('Video unavailable')) {
                    return await interaction.editReply({
                        content: '❌ That video is unavailable. Try a different search!'
                    });
                }
                
                if (playError.message.includes('No extractors')) {
                    return await interaction.editReply({
                        content: '❌ Music extractors are loading. Try again in 30 seconds!'
                    });
                }
                
                return await interaction.editReply({
                    content: `❌ Failed to play "${query}". Try:\n\n✅ **Check spelling:** "despacito" not "despasito"\n✅ **Add artist name:** "despacito luis fonsi"\n✅ **Try popular songs:** "shape of you", "blinding lights"\n✅ **Use YouTube URL** for guaranteed results`
                });
            }
            
        } catch (error) {
            console.error('Command error:', error);
            
            try {
                if (interaction.deferred) {
                    await interaction.editReply({
                        content: '❌ Something went wrong! Try again in a few seconds.'
                    });
                } else {
                    await interaction.reply({
                        content: '❌ Something went wrong! Try again in a few seconds.',
                        ephemeral: true
                    });
                }
            } catch (replyError) {
                console.error('Failed to send error reply:', replyError);
            }
        }
    }
};
