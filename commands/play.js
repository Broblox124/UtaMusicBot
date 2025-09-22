const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus } = require('@discordjs/voice');
const ytdl = require('ytdl-core');
const yts = require('yt-search');

// Global queue storage
if (!global.musicQueues) {
    global.musicQueues = new Map();
}

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
            await interaction.deferReply();
            
            const query = interaction.options.getString('song');
            const voiceChannel = interaction.member?.voice?.channel;
            const guildId = interaction.guild.id;
            
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
                let videoUrl;
                
                if (ytdl.validateURL(query)) {
                    videoInfo = await ytdl.getBasicInfo(query);
                    videoUrl = query;
                } else {
                    console.log(`🔍 Searching for: "${query}"`);
                    const searchResult = await yts(query);
                    
                    if (!searchResult || !searchResult.videos || searchResult.videos.length === 0) {
                        return await interaction.editReply({
                            content: `❌ No results found for "${query}". Try different keywords or a YouTube URL!`
                        });
                    }
                    
                    const firstVideo = searchResult.videos[0];
                    videoInfo = await ytdl.getBasicInfo(firstVideo.url);
                    videoUrl = firstVideo.url;
                }
                
                const videoDetails = videoInfo.videoDetails;
                const title = videoDetails.title;
                const author = videoDetails.author.name;
                const duration = new Date(parseInt(videoDetails.lengthSeconds) * 1000).toISOString().substr(11, 8);
                const thumbnail = videoDetails.thumbnails[0]?.url;
                
                // Get or create queue
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
                        currentSong: null,
                        textChannel: interaction.channel
                    };
                    
                    global.musicQueues.set(guildId, queue);
                    
                    player.on(AudioPlayerStatus.Idle, () => {
                        if (queue.songs.length > 0) {
                            playNextSong(queue);
                        } else {
                            queue.isPlaying = false;
                            queue.currentSong = null;
                        }
                    });
                    
                    connection.on(VoiceConnectionStatus.Disconnected, () => {
                        global.musicQueues.delete(guildId);
                    });
                }
                
                const song = { title, author, duration, thumbnail, url: videoUrl, requester: interaction.user };
                queue.songs.push(song);
                
                if (!queue.isPlaying) {
                    playNextSong(queue);
                }
                
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
                            .setStyle(ButtonStyle.Danger)
                    );
                
                const embed = new EmbedBuilder()
                    .setTitle(queue.songs.length === 1 && !queue.isPlaying ? '🎵 Now Playing' : '📋 Added to Queue')
                    .setDescription(`**[${title}](${videoUrl})**\n🎤 ${author}`)
                    .setColor('#FF69B4')
                    .setThumbnail(thumbnail)
                    .addFields([
                        { name: '⏱️ Duration', value: duration, inline: true },
                        { name: '🎧 Requested by', value: interaction.user.toString(), inline: true },
                        { name: '📋 Position', value: `${queue.songs.length}`, inline: true }
                    ])
                    .setFooter({ text: 'VibyMusic • Simple & Reliable ✨' })
                    .setTimestamp();
                
                return await interaction.editReply({ embeds: [embed], components: [row] });
                
            } catch (error) {
                console.error('Play error:', error);
                return await interaction.editReply({
                    content: '❌ Failed to play the song. Try a different search or YouTube URL!'
                });
            }
            
        } catch (error) {
            console.error('Command error:', error);
            try {
                await interaction.editReply({ content: '❌ Something went wrong!' });
            } catch {}
        }
    }
};

function playNextSong(queue) {
    if (queue.songs.length === 0) {
        queue.isPlaying = false;
        queue.currentSong = null;
        return;
    }
    
    const song = queue.songs.shift();
    queue.currentSong = song;
    queue.isPlaying = true;
    
    try {
        const resource = createAudioResource(ytdl(song.url, {
            filter: 'audioonly',
            quality: 'highestaudio',
            highWaterMark: 1 << 25
        }));
        
        queue.player.play(resource);
        console.log(`🎵 Now playing: ${song.title}`.cyan);
        
    } catch (error) {
        console.error('Error playing song:', error);
        if (queue.songs.length > 0) {
            playNextSong(queue);
        }
    }
}
