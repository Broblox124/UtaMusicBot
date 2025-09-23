const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'play',
    description: '🎵 Play music from YouTube, Spotify, SoundCloud',
    usage: '>play <song name or URL>',
    
    async execute(message, args, client) {
        const query = args.join(' ');
        
        if (!query) {
            return message.reply('❌ Please provide a song name or URL!');
        }
        
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) {
            return message.reply('🎧 You need to be in a voice channel!');
        }
        
        const permissions = voiceChannel.permissionsFor(message.client.user);
        if (!permissions.has(['CONNECT', 'SPEAK'])) {
            return message.reply('⚠️ I need permissions to connect and speak in your voice channel!');
        }
        
        try {
            // Search for tracks
            const res = await client.manager.search(query, message.author);
            
            if (res.loadType === 'LOAD_FAILED') {
                return message.reply('❌ Failed to load the track!');
            }
            
            if (res.loadType === 'NO_MATCHES') {
                return message.reply(`❌ No results found for "${query}"!`);
            }
            
            // Create or get player
            const player = client.manager.create({
                guild: message.guild.id,
                voiceChannel: voiceChannel.id,
                textChannel: message.channel.id,
                selfDeafen: true,
            });
            
            // Connect to voice channel
            if (player.state !== 'CONNECTED') player.connect();
            
            // Add track(s) to queue
            if (res.loadType === 'PLAYLIST_LOADED') {
                player.queue.add(res.tracks);
                
                const embed = new EmbedBuilder()
                    .setTitle('📋 Playlist Added')
                    .setDescription(`**${res.playlist.name}**\nAdded ${res.tracks.length} tracks to queue`)
                    .setColor('#FF69B4')
                    .addFields([
                        { name: '🎧 Requested by', value: message.author.toString(), inline: true },
                        { name: '📋 Queue length', value: `${player.queue.size}`, inline: true }
                    ])
                    .setTimestamp();
                
                message.channel.send({ embeds: [embed] });
            } else {
                const track = res.tracks[0];
                player.queue.add(track);
                
                const embed = new EmbedBuilder()
                    .setTitle(player.playing ? '📋 Added to Queue' : '🎵 Now Playing')
                    .setDescription(`**[${track.title}](${track.uri})**\n🎤 ${track.author}`)
                    .setColor('#FF69B4')
                    .setThumbnail(track.thumbnail)
                    .addFields([
                        { name: '⏱️ Duration', value: formatTime(track.duration), inline: true },
                        { name: '🎧 Requested by', value: message.author.toString(), inline: true },
                        { name: '📋 Position in queue', value: `${player.queue.size}`, inline: true }
                    ])
                    .setFooter({ text: 'VibyMusic • High Quality Music' })
                    .setTimestamp();
                
                message.channel.send({ embeds: [embed] });
            }
            
            // Start playing if not already
            if (!player.playing && !player.paused && !player.queue.size) {
                player.play();
            }
            
        } catch (error) {
            console.error('Play command error:', error);
            message.reply('❌ An error occurred while trying to play the track!');
        }
    }
};

function formatTime(ms) {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor(ms / (1000 * 60 * 60));
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
