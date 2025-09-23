require('dotenv').config();

const { Client, GatewayIntentBits, Collection, ActivityType, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Initialize Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages
    ]
});

client.commands = new Collection();

// FIXED command loading with better error handling
async function loadCommands() {
    const commandsPath = path.join(__dirname, 'commands');
    
    // Check if commands folder exists
    if (!fs.existsSync(commandsPath)) {
        console.log('❌ Commands folder does not exist! Creating it...'.red);
        fs.mkdirSync(commandsPath);
        console.log('✅ Commands folder created'.green);
        return [];
    }
    
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    
    if (commandFiles.length === 0) {
        console.log('⚠️ No .js files found in commands folder'.yellow);
        return [];
    }
    
    const commands = [];
    
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        
        try {
            // Clear require cache
            delete require.cache[require.resolve(filePath)];
            
            const command = require(filePath);
            
            if (!command.data || !command.execute) {
                console.log(`❌ ${file}: Missing 'data' or 'execute' property`.red);
                continue;
            }
            
            if (typeof command.data.toJSON !== 'function') {
                console.log(`❌ ${file}: Invalid command data structure`.red);
                continue;
            }
            
            // Successfully loaded
            client.commands.set(command.data.name, command);
            commands.push(command.data.toJSON());
            console.log(`✅ Loaded: ${command.data.name}`.green);
            
        } catch (error) {
            console.log(`❌ Failed to load ${file}: ${error.message}`.red);
            console.log(`   Error details: ${error.stack}`.red);
        }
    }
    
    return commands;
}

// Deploy commands function
async function deployCommands() {
    try {
        const commands = await loadCommands();
        
        if (commands.length === 0) {
            console.log('⚠️ No commands to deploy'.yellow);
            return;
        }
        
        const rest = new REST().setToken(process.env.DISCORD_TOKEN);
        
        console.log(`🚀 Deploying ${commands.length} commands...`.blue);
        
        const data = await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );
        
        console.log(`✅ Successfully deployed ${data.length} commands!`.green);
        
    } catch (error) {
        console.error('❌ Command deployment failed:'.red, error.message);
    }
}

// Bot ready event
client.once('ready', async () => {
    console.log(`🚀 ${client.user.tag} is online!`.rainbow);
    console.log(`🎧 Connected to ${client.guilds.cache.size} servers`.cyan);
    
    // Deploy commands after a delay
    setTimeout(deployCommands, 3000);
    
    client.user.setActivity('🎵 /play for music!', { type: ActivityType.Listening });
    
    console.log('✨ Bot is ready!'.magenta);
});

// Interaction handler with better error handling
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    
    if (!command) {
        console.log(`❌ Command not found: ${interaction.commandName}`.red);
        return;
    }

    try {
        console.log(`🎵 ${interaction.user.tag} used /${interaction.commandName}`.cyan);
        await command.execute(interaction);
    } catch (error) {
        console.error(`❌ Command error for ${interaction.commandName}:`.red, error.message);
        
        const reply = { 
            content: '❌ An error occurred while executing this command!', 
            ephemeral: true 
        };
        
        try {
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(reply);
            } else {
                await interaction.reply(reply);
            }
        } catch (replyError) {
            console.error('❌ Failed to send error reply:'.red, replyError.message);
        }
    }
});

// Enhanced error handling
process.on('unhandledRejection', (reason, promise) => {
    console.log('🚨 Unhandled Rejection:'.red, reason?.message || reason);
});

process.on('uncaughtException', (err) => {
    console.log('🚨 Uncaught Exception:'.red, err.message);
    process.exit(1);
});

// Login function
async function startBot() {
    try {
        console.log('🔐 Logging into Discord...'.blue);
        await client.login(process.env.DISCORD_TOKEN);
    } catch (error) {
        console.error('❌ Failed to login:'.red, error.message);
        process.exit(1);
    }
}

// Keep-alive server for Render
const PORT = process.env.PORT || 3000;
require('http').createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('VibyMusic Bot Status: ONLINE 🎵');
}).listen(PORT, () => {
    console.log(`🌐 Keep-alive server running on port ${PORT}`.blue);
    startBot();
});
