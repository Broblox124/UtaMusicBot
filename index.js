require('dotenv').config();

const { Client, GatewayIntentBits, Collection, ActivityType, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const colors = require('colors');

// Initialize Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages
    ]
});

client.commands = new Collection();

// Auto-deploy commands function
async function deployCommands() {
    const commands = [];
    const commandsPath = path.join(__dirname, 'commands');
    
    try {
        if (fs.existsSync(commandsPath)) {
            const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
            
            for (const file of commandFiles) {
                const filePath = path.join(commandsPath, file);
                try {
                    delete require.cache[require.resolve(filePath)]; // Clear cache
                    const command = require(filePath);
                    if ('data' in command && 'execute' in command) {
                        commands.push(command.data.toJSON());
                        console.log(`✅ Loaded: ${command.data.name}`.green);
                    }
                } catch (error) {
                    console.log(`❌ Failed: ${file} - ${error.message}`.red);
                }
            }
        }
        
        if (commands.length === 0) {
            console.log('⚠️ No commands found in commands folder'.yellow);
            return;
        }
        
        // Deploy to Discord
        const rest = new REST().setToken(process.env.DISCORD_TOKEN);
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );
        
        console.log(`✅ Deployed ${commands.length} commands!`.green);
        
    } catch (error) {
        console.error('❌ Command deployment failed:', error.message);
    }
}

// Load existing commands
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        try {
            delete require.cache[require.resolve(filePath)]; // Clear cache
            const command = require(filePath);
            if ('data' in command && 'execute' in command) {
                client.commands.set(command.data.name, command);
                console.log(`🎵 Command loaded: ${command.data.name}`.cyan);
            }
        } catch (error) {
            console.error(`❌ Error loading ${file}:`, error.message);
        }
    }
}

// Bot ready event
client.once('ready', async () => {
    console.log(`🚀 ${client.user.tag} is online!`.rainbow);
    console.log(`🎧 Connected to ${client.guilds.cache.size} servers`.cyan);
    
    // Deploy commands
    setTimeout(async () => {
        await deployCommands();
    }, 2000);
    
    // Set activity
    client.user.setActivity('🎵 /play your favorite songs!', { type: ActivityType.Listening });
    
    console.log('✨ VibyMusic Bot is ready!'.magenta);
    console.log('🎶 Try /play with any song name!'.blue);
});

// Interaction handler
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) {
        console.log(`❌ Command not found: ${interaction.commandName}`.red);
        return;
    }

    try {
        console.log(`🎵 ${interaction.user.tag} used /${interaction.commandName} in ${interaction.guild?.name}`.cyan);
        await command.execute(interaction);
    } catch (error) {
        console.error(`❌ Command execution error for ${interaction.commandName}:`, error.message);
        
        const reply = { 
            content: '❌ Something went wrong while executing this command!', 
            ephemeral: true 
        };
        
        try {
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(reply);
            } else {
                await interaction.reply(reply);
            }
        } catch (replyError) {
            console.error('❌ Failed to send error message:', replyError.message);
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

// Login to Discord
async function startBot() {
    try {
        console.log('🔐 Logging into Discord...'.blue);
        await client.login(process.env.DISCORD_TOKEN);
        console.log('🎉 Successfully connected to Discord!'.green);
    } catch (error) {
        console.error('❌ Failed to login:', error.message);
        process.exit(1);
    }
}

// Keep alive server for Render
const PORT = process.env.PORT || 3000;
const http = require('http');

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
        <html>
            <head><title>VibyMusic Bot</title></head>
            <body style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-family: Arial; text-align: center; padding: 50px;">
                <h1>🎵 VibyMusic Bot is Online!</h1>
                <p>✅ Bot Status: Running</p>
                <p>🎶 Ready to play your favorite music!</p>
                <p>💖 Made with love for Discord music lovers</p>
            </body>
        </html>
    `);
});

server.listen(PORT, () => {
    console.log(`🌐 Keep-alive server running on port ${PORT}`.blue);
    startBot();
});
