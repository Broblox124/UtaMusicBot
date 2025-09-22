const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource } = require('@discordjs/voice');
const ytdl = require('ytdl-core');
const yts = require('yt-search');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('🎵 Play a song!')
        .addStringOption(option =>
            option.setName('song')
                .setDescription('Song name or YouTube URL')
                .setRequired(true)
        ),
        
    async execute(interaction) {
        try {
            await interaction.deferReply();
            
            const query = interaction.options.getString('song');
            const voiceChannel = interaction.member?.voice?.channel;
            
            if (!voiceChannel) {
                return await interaction.editReply('🎧 Join a voice channel first!');
            }
            
            let videoUrl;
            let videoInfo;
            
            // Check if it's a YouTube URL or search term
            if (ytdl.validateURL(query)) {
                videoUrl = query;
            } else {
                // Search YouTube
                const searchResult = await yts(query);
                if (!searchResult.videos.length) {
                    return await interaction.editReply('❌ No results found! Try a different search.');
                }
                videoUrl = searchResult.videos[0].url;
            }
            
            // Get video info
            videoInfo = await ytdl.getBasicInfo(videoUrl);
            const title = videoInfo.videoDetails.title;
            const author = videoInfo.videoDetails.author.name;
            
            // Connect to voice channel
            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: interaction.guild.id,
                adapterCreator: interaction.guild.voiceAdapterCreator,
            });
            
            // Create audio player and resource
            const player = createAudioPlayer();
            const resource = createAudioResource(ytdl(videoUrl, {
                filter: 'audioonly',
                quality: 'highestaudio'
            }));
            
            // Play audio
            player.play(resource);
            connection.subscribe(player);
            
            // Success message
            const embed = new EmbedBuilder()
                .setTitle('🎵 Now Playing')
                .setDescription(`**${title}**\nBy: ${author}`)
                .setColor('#FF69B4')
                .addFields([
                    { name: '🎧 Requested by', value: interaction.user.toString(), inline: true }
                ])
                .setTimestamp();
            
            await interaction.editReply({ embeds: [embed] });
            
            // Auto-disconnect when done
            player.on('idle', () => {
                connection.destroy();
            });
            
        } catch (error) {
            console.error('Play command error:', error);
            await interaction.editReply('❌ Failed to play the song. Try a YouTube URL!');
        }
    }
};
