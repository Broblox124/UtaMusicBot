const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource } = require('@discordjs/voice');
const play = require('play-dl');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('🎵 Play a song from SoundCloud!')
        .addStringOption(option =>
            option.setName('song')
                .setDescription('Song name to search on SoundCloud')
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
            
            try {
                console.log(`🔍 Searching SoundCloud for: "${query}"`);
                
                // Search SoundCloud instead of YouTube
                const searched = await play.search(`${query}`, { 
                    source: { soundcloud: 'tracks' },
                    limit: 1 
                });
                
                if (!searched.length) {
                    return await interaction.editReply(`❌ No results found for "${query}" on SoundCloud!`);
                }
                
                const track = searched[0];
                
                // Get stream from SoundCloud
                const stream = await play.stream(track.url);
                
                // Connect to voice channel
                const connection = joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: interaction.guild.id,
                    adapterCreator: interaction.guild.voiceAdapterCreator,
                });
                
                // Create audio player and resource
                const player = createAudioPlayer();
                const resource = createAudioResource(stream.stream, {
                    inputType: stream.type
                });
                
                // Play audio
                player.play(resource);
                connection.subscribe(player);
                
                // Success embed
                const embed = new EmbedBuilder()
                    .setTitle('🎵 Now Playing from SoundCloud')
                    .setDescription(`**${track.title}**\nBy: ${track.channel?.name || 'Unknown'}`)
                    .setColor('#FF69B4')
                    .setThumbnail(track.thumbnail?.url || null)
                    .addFields([
                        { name: '⏱️ Duration', value: track.durationRaw || 'Unknown', inline: true },
                        { name: '🎧 Requested by', value: interaction.user.toString(), inline: true },
                        { name: '🔗 Source', value: 'SoundCloud', inline: true }
                    ])
                    .setTimestamp();
                
                await interaction.editReply({ embeds: [embed] });
                
                // Auto-disconnect when finished
                player.on('idle', () => {
                    connection.destroy();
                    console.log('🎵 Finished playing, disconnected'.blue);
                });
                
                console.log(`🎵 Now playing: ${track.title}`.cyan);
                
            } catch (searchError) {
                console.error('Search/play error:', searchError);
                
                return await interaction.editReply({
                    content: `❌ Failed to play "${query}". Try:\n\n✅ Different song name\n✅ Popular artists\n✅ Check spelling\n\n**Note:** Using SoundCloud instead of YouTube due to restrictions.`
                });
            }
            
        } catch (error) {
            console.error('Command error:', error);
            await interaction.editReply('❌ Something went wrong!');
        }
    }
};
