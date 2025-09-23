const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource } = require('@discordjs/voice');
const ytdl = require('ytdl-core');
const yts = require('yt-search');

// Global queue system
if (!global.musicQueues) {
    global.musicQueues = new Map();
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('🎵 Play any song by name or URL!')
        .addStringOption(option =>
            option.setName('song')
                .setDescription('Song name, artist, or YouTube URL')
                .setRequired(true)
        ),
        
    async execute(interaction) {
        try {
            await interaction.deferReply();
            
            const query = interaction.options.getString('song');
            const voiceChannel = interaction.member?.voice?.channel;
            const guildId = interaction.guild.id;
            
            if (!voiceChannel) {
                return await interaction.editReply('🎧 Join a voice channel first!');
            }
            
            let videoUrl = null;
            let videoInfo = null;
            let searchAttempt = 1;
            
            try {
                // Method 1: Check if it's already a YouTube URL
                if (ytdl.validateURL(query)) {
                    console.log('📎 Direct URL provided');
                    videoUrl = query;
                    videoInfo = await ytdl.getBasicInfo(videoUrl);
                } else {
                    // Method 2: Search YouTube
                    console.log(`🔍 Attempt ${searchAttempt}: Searching for "${query}"`);
                    
                    const searchResults = await yts(query);
                    
                    if (searchResults && searchResults.videos && searchResults.videos.length > 0) {
                        // Try the first 3 search results
                        for (let i = 0; i < Math.min(3, searchResults.videos.length); i++) {
                            try {
                                const video = searchResults.videos[i];
                                console.log(`🎵 Trying: "${video.title}" by ${video.author.name}`);
                                
                                // Test if this video works
                                const testInfo = await ytdl.getBasicInfo(video.url);
                                
                                if (testInfo && testInfo.videoDetails) {
                                    videoUrl = video.url;
                                    videoInfo = testInfo;
                                    console.log(`✅ Success with search result ${i + 1}`);
                                    break;
                                }
                            } catch (testError) {
                                console.log(`❌ Search result ${i + 1} failed: ${testError.message}`);
                                continue;
                            }
                        }
                    }
                }
                
                // Method 3: If search failed, try alternative search terms
                if (!videoUrl) {
                    const alternatives = [
                        `${query} official`,
                        `${query} lyrics`,
                        `${query} music video`,
                        `${query} audio`,
                        query.split(' ')[0] // Just first word
                    ];
                    
                    for (const alt of alternatives) {
                        try {
                            console.log(`🔍 Trying alternative: "${alt}"`);
                            const altResults = await yts(alt);
                            
                            if (altResults?.videos?.length > 0) {
                                const video = altResults.videos[0];
                                const testInfo = await ytdl.getBasicInfo(video.url);
                                
                                if (testInfo?.videoDetails) {
                                    videoUrl = video.url;
                                    videoInfo = testInfo;
                                    console.log(`✅ Success with alternative search: "${alt}"`);
                                    break;
                                }
                            }
                        } catch (altError) {
                            continue;
                        }
                    }
                }
                
                // If everything failed
                if (!videoUrl || !videoInfo) {
                    return await interaction.editReply({
                        content: `❌ Could not find or play "${query}"\n\n💡 **Try these tips:**\n✅ **Use simpler search terms:** "bohemian rhapsody" instead of "bohemian rhapsody queen official video"\n✅ **Include artist name:** "shape of you ed sheeran"\n✅ **Try a YouTube URL:** Copy from youtube.com\n✅ **Popular songs work better:** "imagine dragons believer"\n\n🔧 **Technical note:** YouTube is actively blocking music bots on hosting platforms, so some searches may fail.`
                    });
                }
                
                const videoDetails = videoInfo.videoDetails;
                const title = videoDetails.title;
                const author = videoDetails.author.name;
                const duration = new Date(parseInt(videoDetails.lengthSeconds) * 1000).toISOString().substr(11, 8);
                const thumbnail = videoDetails.thumbnails[0]?.url;
                
                // Queue management (same as before)
                let queue = global.musicQueues.get(guildId);
                if (!queue) {
                    const connection = joinVoiceChannel({
                        channelId: voiceChannel.id,
                        guildId: interaction.guild.id,
                        adapterCreator: interaction.guild.voiceAdapterCreator,
                    });
                    
                    const player = createAudioPlayer();
                    connection.subscribe(player);
                    
                    queue = {
                        connection,
                        player,
                        songs: [],
                        isPlaying: false,
                        currentSong: null
                    };
                    
                    global.musicQueues.set(guildId, queue);
                    
                    player.on('idle', () => {
                        if (queue.songs.length > 0) {
                            playNext(queue);
                        } else {
                            queue.isPlaying = false;
                            queue.currentSong = null;
                            setTimeout(() => {
                                if (!queue.isPlaying && queue.songs.length === 0) {
                                    connection.destroy();
                                    global.musicQueues.delete(guildId);
                                }
                            }, 300000);
                        }
                    });
                }
                
                const song = {
                    title,
                    author,
                    duration,
                    thumbnail,
                    url: videoUrl,
                    requester: interaction.user,
                    searchQuery: query
                };
                
                queue.songs.push(song);
                
                if (!queue.isPlaying) {
                    playNext(queue);
                }
                
                // Success embed
                const embed = new EmbedBuilder()
                    .setTitle(queue.songs.length === 1 && !queue.isPlaying ? '🎵 Now Playing' : '📋 Added to Queue')
                    .setDescription(`**[${title}](${videoUrl})**\n🎤 ${author}`)
                    .setColor('#FF69B4')
                    .setThumbnail(thumbnail)
                    .addFields([
                        { name: '⏱️ Duration', value: duration, inline: true },
                        { name: '🎧 Requested by', value: interaction.user.toString(), inline: true },
                        { name: '🔍 Search Query', value: `"${query}"`, inline: true },
                        { name: '📋 Queue Position', value: `${queue.songs.length}`, inline: true }
                    ])
                    .setFooter({ text: 'VibyMusic • Smart Search + Queue System ✨' })
                    .setTimestamp();
                
                await interaction.editReply({ embeds: [embed] });
                
            } catch (error) {
                console.error('Search/Play error:', error);
                
                if (error.message.includes('Sign in to confirm')) {
                    return await interaction.editReply({
                        content: `❌ **YouTube is blocking this request!**\n\n🔧 **This is a known issue in 2025:**\n• YouTube actively blocks Discord music bots\n• Hosting platforms get flagged as "bot traffic"\n• Some songs work, others don't\n\n💡 **What you can try:**\n✅ **Wait 30 seconds** and try again\n✅ **Try a different song** temporarily\n✅ **Use a YouTube URL** instead of searching\n✅ **Popular/older songs** work better\n\n🎵 **For "${query}" try:** \`/play https://youtu.be/[video-id]\``
                    });
                }
                
                return await interaction.editReply({
                    content: `❌ Failed to play "${query}"\n\n🔧 **Possible reasons:**\n• YouTube is blocking the request\n• Video is unavailable/private\n• Network issues with hosting\n\n✅ **Try:** Different search terms or a YouTube URL`
                });
            }
            
        } catch (error) {
            console.error('Command error:', error);
            await interaction.editReply('❌ An unexpected error occurred!');
        }
    }
};

// Helper function
function playNext(queue) {
    if (queue.songs.length === 0) {
        queue.isPlaying = false;
        queue.currentSong = null;
        return;
    }
    
    const song = queue.songs.shift();
    queue.currentSong = song;
    queue.isPlaying = true;
    
    try {
        const stream = ytdl(song.url, {
            filter: 'audioonly',
            quality: 'lowest', // Use lowest to reduce bandwidth
            requestOptions: { timeout: 10000 }
        });
        
        const resource = createAudioResource(stream, { inlineVolume: true });
        resource.volume.setVolume(0.5);
        
        queue.player.play(resource);
        console.log(`🎵 Now playing: ${song.title}`.cyan);
        
    } catch (error) {
        console.error('Play error:', error);
        if (queue.songs.length > 0) {
            playNext(queue);
        } else {
            queue.isPlaying = false;
        }
    }
}
