const { Client, GatewayIntentBits, Collection, EmbedBuilder } = require('discord.js');
const { Manager } = require('erela.js');
const express = require('express');
const colors = require('colors');
const path = require('path');
const fs = require('fs');

// Initialize Discord Client with MINIMAL intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent  // This requires MESSAGE CONTENT INTENT enabled
    ]
});

// Initialize Commands Collection
client.commands = new Collection();

// Initialize Express App for Keep-Alive
const app = express();
const PORT = process.env.PORT || 10000;

// Express Routes for Render Health Check
app.get('/', (req, res) => {
    res.json({ 
        status: 'VibyMusic Bot Online! 🎵', 
        uptime: Math.floor(process.uptime()),
        guilds: client.guilds.cache.size || 0,
        timestamp: new Date().toISOString()
    });
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        bot: client.user ? client.user.tag : 'offline',
        guilds: client.guilds.cache.size,
        uptime: Math.floor(process.uptime())
    });
});

// Start Express Server (Required for Render)
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 Express server running on port ${PORT}`.blue);
    console.log(`🔗 Health check available at /health`.blue);
});

// Initialize Lavalink Manager
client.manager = new Manager({
    nodes: [
        {
            host: 'lava-v3.ajieblogs.eu.org',
            port: 443,
            password: 'https://dsc.gg/ajidevserver',
            secure: true,
            identifier: 'main-node'
        }
    ],
    send(id, payload) {
        const guild = client.guilds.cache.get(id);
        if (guild) guild.shard.send(payload);
    },
})
.on('nodeConnect', node => {
    console.log(`✅ Lavalink node "${node.options.identifier}" connected`.green);
})
.on('nodeError', (node, error) => {
    console.log(`❌ Lavalink node "${node.options.identifier}" error: ${error.message}`.red);
})
.on('trackStart', (player, track) => {
    const channel = client.channels.cache.get(player.textChannel);
    
    if (channel) {
        const embed = new EmbedBuilder()
            .setTitle('🎵 Now Playing')
            .setDescription(`**[${track.title}](${track.uri})**\n🎤 ${track.author}`)
            .setColor('#FF69B4')
            .setThumbnail(track.thumbnail)
            .addFields([
                { name: '⏱️ Duration', value: formatTime(track.duration), inline: true },
                { name: '🎧 Requested by', value: `<@${track.requester.id}>`, inline: true }
            ])
            .setFooter({ text: 'VibyMusic • Professional Music Experience' })
            .setTimestamp();
        
        channel.send({ embeds: [embed] }).catch(() => {});
    }
})
.on('queueEnd', player => {
    const channel = client.channels.cache.get(player.textChannel);
    if (channel) {
        channel.send('🎵 Queue ended. Thanks for listening!').catch(() => {});
    }
    player.destroy();
});

// Load Commands Function
function loadCommands() {
    const commandsPath = path.join(__dirname, 'commands');
    
    if (!fs.existsSync(commandsPath)) {
        console.log('⚠️ Commands folder not found, creating...'.yellow);
        fs.mkdirSync(commandsPath);
        return;
    }
    
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    console.log(`📁 Found ${commandFiles.length} command files`.cyan);
    
    for (const file of commandFiles) {
        try {
            const command = require(path.join(commandsPath, file));
            
            if (command.name && command.execute) {
                client.commands.set(command.name, command);
                console.log(`✅ Loaded command: ${command.name}`.green);
            } else {
                console.log(`❌ Command ${file} missing name or execute function`.red);
            }
        } catch (error) {
            console.log(`❌ Error loading ${file}: ${error.message}`.red);
        }
    }
}

// Bot Ready Event
client.once('ready', async () => {
    console.log(`🚀 Bot logged in as ${client.user.tag}!`.rainbow);
    console.log(`🎧 Connected to ${client.guilds.cache.size} servers`.cyan);
    console.log(`👥 Serving ${client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)} users`.cyan);
    
    // Initialize Lavalink
    client.manager.init(client.user.id);
    console.log('🎵 Lavalink manager initialized'.blue);
    
    // Load Commands
    loadCommands();
    
    // Set Activity
    client.user.setPresence({
        activities: [{ name: '🎵 >play for music!', type: 2 }], // Type 2 = LISTENING
        status: 'online',
    });
    
    console.log('✨ VibyMusic is fully ready and operational!'.magenta);
});

// Voice State Update (Required for Lavalink)
client.on('raw', d => client.manager.updateVoiceState(d));

// Message Handler for Commands
client.on('messageCreate', async (message) => {
    // Ignore bots and DMs
    if (message.author.bot || !message.guild) return;
    
    const prefix = '>';
    if (!message.content.startsWith(prefix)) return;
    
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    
    const command = client.commands.get(commandName);
    if (!command) return;
    
    try {
        console.log(`🎵 ${message.author.tag} used >${commandName} in ${message.guild.name}`.cyan);
        await command.execute(message, args, client);
    } catch (error) {
        console.error(`❌ Command error in >${commandName}: ${error.message}`.red);
        message.reply('❌ An error occurred while executing this command!').catch(() => {});
    }
});

// Helper Functions
function formatTime(ms) {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor(ms / (1000 * 60 * 60));
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Enhanced Error Handling
process.on('unhandledRejection', (reason, promise) => {
    console.log('🚨 Unhandled Rejection at:'.red, promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
    console.log('🚨 Uncaught Exception:'.red, err);
    process.exit(1);
});

// Graceful Shutdown
process.on('SIGINT', () => {
    console.log('🛑 Received SIGINT, shutting down gracefully...'.yellow);
    client.destroy();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('🛑 Received SIGTERM, shutting down gracefully...'.yellow);
    client.destroy();
    process.exit(0);
});

// Login to Discord
console.log('🔐 Attempting to login to Discord...'.blue);
client.login(process.env.DISCORD_TOKEN).catch(error => {
    console.error('❌ Failed to login to Discord:'.red, error.message);
    console.error('🔧 Check your DISCORD_TOKEN in Render environment variables'.red);
    process.exit(1);
});
