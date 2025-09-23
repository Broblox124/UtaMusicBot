module.exports = {
    name: 'skip',
    description: '⏭️ Skip current song',
    
    async execute(message, args, client) {
        const player = client.manager.get(message.guild.id);
        
        if (!player || !player.queue.current) {
            return message.reply('❌ Nothing is currently playing!');
        }
        
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel || voiceChannel.id !== player.voiceChannel) {
            return message.reply('🎧 You need to be in the same voice channel as the bot!');
        }
        
        const skipped = player.queue.current.title;
        player.stop();
        message.reply(`⏭️ Skipped: **${skipped}**`);
    }
};
