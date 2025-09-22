const { ActivityType } = require('discord.js');
const config = require('../config/config');

module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        console.log(`💖 ${config.botName} is now online and ready to vibe!`.rainbow);
        console.log(`🎧 Connected to ${client.guilds.cache.size} servers with ${client.users.cache.size} users!`.cyan);
        
        // Set bot activity with rotating messages
        const activities = [
            { name: 'your favorite tunes 🎵', type: ActivityType.Listening },
            { name: 'beats that make you dance 💃', type: ActivityType.Listening },
            { name: 'music that touches your soul 💖', type: ActivityType.Listening },
            { name: '/play to start the vibe ✨', type: ActivityType.Watching },
            { name: 'Spotify playlists 🎧', type: ActivityType.Streaming, url: 'https://open.spotify.com' },
            { name: 'chill vibes 24/7 🌙', type: ActivityType.Listening },
            { name: 'your musical journey 🚀', type: ActivityType.Watching }
        ];
        
        let i = 0;
        const updateActivity = () => {
            const activity = activities[i++ % activities.length];
            client.user.setActivity(activity);
        };
        
        // Set initial activity
        updateActivity();
        
        // Update activity every 15 seconds
        setInterval(updateActivity, 15000);
        
        console.log(`✨ Ready to spread good vibes! Use ${config.prefix}play to get started!`.magenta);
        console.log(`🎵 Bot invite: https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=36700160&scope=bot%20applications.commands`.blue);
    }
};
