module.exports = {
    name: 'stop',
    description: '⏹️ Stop music and disconnect',
    
    async execute(message, args, client) {
        const player = client.manager.get(message.guild.id);
        
        if (!player) {
            return message.reply('❌ Nothing is currently playing!');
        }
        
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel || voiceChannel.id !== player.voiceChannel) {
            return message.reply('🎧 You need to be in the same voice channel as the bot!');
        }
        
        player.destroy();
        message.reply('⏹️ Music stopped and disconnected!');
    }
};
