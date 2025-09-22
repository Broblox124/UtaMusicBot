const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const ytdl = require('ytdl-core');
const yts = require('yt-search');

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
                let videoInfo;
                let searchResult;
                
                // Check if it's already a YouTube URL
                if (ytdl.validateURL(query)) {
                    console.log('Direct YouTube URL provided');
                    videoInfo = await ytdl.getBasicInfo(query);
                } else {
                    console.log(`🔍 Searching YouTube for: "${query}"`);
                    
                    // Search YouTube directly
                    searchResult = await yts(query);
                    
                    if (!searchResult || !searchResult.videos || searchResult.videos.length === 0) {
                        return await interaction.editReply({
                            content: `❌ No results found for "${query}". Try:\n\n✅ **Different keywords**\n✅ **Add artist name**\n✅ **Use a YouTube URL directly**\n✅ **Try popular songs like "bohemian rhapsody" or "imagine dragons"**`
                        });
                    }
                    
                    // Get the first video from search results
                    const firstVideo = searchResult.videos[0];
                    console.log(`✅ Found: ${firstVideo.title} by ${firstVideo.author.name}`);
                    
                    // Get detailed info for the first result
                    videoInfo = await ytdl.getBasicInfo(firstVideo.url);
                }
                
                const videoDetails = videoInfo.videoDetails;
                const title = videoDetails.title;
                const author = videoDetails.author.name;
                const duration = new Date(parseInt(videoDetails.lengthSeconds) * 1000).toISOString().substr(11, 8);
                const thumbnail = videoDetails.thumbnails[0]?.url;
                const videoUrl = videoDetails.video_url;
                
                // Join voice channel
                const connection = joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: interaction.guild.id,
                    adapterCreator: interaction.guild.voiceAdapterCreator,
                });
                
                // Create audio player
                const player = createAudioPlayer();
                
                // Create audio resource
                const resource = createAudioResource(ytdl(videoUrl, {
                    filter: 'audioonly',
                    quality: 'highestaudio',
                    highWaterMark: 1 << 25
                }));
                
                // Play the audio
                player.play(resource);
                connection.subscribe(player);
                
                // Success embed
                const embed = new EmbedBuilder()
                    .setTitle('🎵 Now Playing')
                    .setDescription(`**[${title}](${videoUrl})**\n🎤 ${author}`)
                    .setColor('#FF69B4')
                    .setThumbnail(thumbnail)
                    .addFields([
                        { name: '⏱️ Duration', value: duration, inline: true },
                        { name: '🎧 Requested by', value: interaction.user.toString(), inline: true },
                        { name: '🔍 Search Query', value: `"${query}"`, inline: true }
                    ])
                    .setFooter({ 
                        text: 'VibyMusic • Simple & Reliable ✨',
                        iconURL: interaction.client.user.displayAvatarURL()
                    })
                    .setTimestamp();
                
                await interaction.editReply({ embeds: [embed] });
                
                // Handle player events
                player.on(AudioPlayerStatus.Playing, () => {
                    console.log(`🎵 Now playing: ${title}`.cyan);
                });
                
                player.on(AudioPlayerStatus.Idle, () => {
                    connection.destroy();
                    console.log('🎵 Playback finished'.blue);
                });
                
                player.on('error', error => {
                    console.error('❌ Audio player error:', error.message);
                    connection.destroy();
                });
                
            } catch (searchError) {
                console.error('Search/Play error:', searchError);
                
                if (searchError.message.includes('Video unavailable')) {
                    return await interaction.editReply({
                        content: '❌ This video is unavailable or private. Try a different search!'
                    });
                }
                
                if (searchError.message.includes('age-restricted')) {
                    return await interaction.editReply({
                        content: '❌ This video is age-restricted. Try a different song!'
                    });
                }
                
                return await interaction.editReply({
                    content: `❌ Failed to play "${query}". This might be due to:\n\n🔧 **YouTube restrictions**\n🔧 **Copyright issues**\n🔧 **Network problems**\n\n✅ **Try a different song or YouTube URL**`
                });
            }
            
        } catch (error) {
            console.error('Command error:', error);
            
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
                console.error('Failed to send error reply:', replyError);
            }
        }
    }
};
