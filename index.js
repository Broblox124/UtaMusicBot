require('dotenv').config();

const { Client, GatewayIntentBits, Collection, ActivityType, REST, Routes } = require('discord.js');
const { Player } = require('discord-player');
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

// Initialize Discord Player
const player = new Player(client, {
    ytdlOptions: {
        quality: 'highestaudio',
        highWaterMark: 1 << 25,
        filter: 'audioonly'
    }
});

// Load default extractors
player.extractors.loadDefault((ext) => ext !== 'YouTubeExtractor');

client.commands = new Collection();
client.player = player;

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
                    const command = require(filePath);
                    if ('data' in command && 'execute' in command) {
                        commands.push(command.data.toJSON());
                        console.log(`✅ Loaded: ${command.data.name}`.green);
                    }
                } catch (error) {
                    console.log(`❌ Failed: ${file}`.red);
                }
            }
        }
        
        if (commands.length === 0) {
            // Create basic play command if no commands exist
            const { SlashCommandBuilder } = require('discord.js');
            const playCommand = {
                data: new SlashCommandBuilder()
                    .setName('play')
                    .setDescription('🎵 Play a song!')
                    .addStringOption(option =>
                        option.setName('song')
                            .setDescription('Song name or URL')
                            .setRequired(true)
                    ),
                execute: async (interaction) => {
                    await interaction.deferReply();
                    const query = interaction.options.getString('song');
                    const voiceChannel = interaction.member?.voice?.channel;
                    
                    if (!voiceChannel) {
                        return interaction.editReply('🎧 Join a voice channel first!');
                    }
                    
                    try {
                        const { track } = await player.play(voiceChannel, query, {
                            requestedBy: interaction.user,
                            nodeOptions: {
                                metadata: { channel: interaction.channel }
                            }
                        });
                        
                        return interaction.editReply(`🎵 Now playing: **${track.title}** by ${track.author}`);
                    } catch (error) {
                        return interaction.editReply('❌ Failed to play the song. Try a different search!');
                    }
                }
            };
            
            client.commands.set('play', playCommand);
            commands.push(playCommand.data.toJSON());
            console.log('✅ Created basic play command'.yellow);
        }
        
        // Deploy to Discord
        const rest = new REST().setToken(process.env.DISCORD_TOKEN);
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );
        
        console.log(`✅ Deployed ${commands.length} commands!`.green);
        
    } catch (error) {
        console.error('Command deployment failed:', error.message);
    }
}

// Load existing commands
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        try {
            const command = require(filePath);
            if ('data' in command && 'execute' in command) {
                client.commands.set(command.data.name, command);
            }
        } catch (error) {
            console.error(`Error loading ${file}:`, error.message);
        }
    }
}

// Player events
player.events.on('playerStart', (queue, track) => {
    console.log(`🎵 Playing: ${track.title}`.cyan);
});

player.events.on('error', (queue, error) => {
    console.log(`❌ Player error: ${error.message}`.red);
});

// Bot ready
client.once('ready', async () => {
    console.log(`🚀 ${client.user.tag} is online!`.rainbow);
    console.log(`🎧 Connected to ${client.guilds.cache.size} servers`.cyan);
    
    // Deploy commands
    await deployCommands();
    
    // Set activity
    client.user.setActivity('🎵 /play to start vibing!', { type: ActivityType.Listening });
    
    console.log('✨ Bot is ready!'.magenta);
});

// Interaction handler
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error('Command error:', error.message);
        
        const reply = { content: '❌ Something went wrong!', ephemeral: true };
        
        try {
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(reply);
            } else {
                await interaction.reply(reply);
            }
        } catch {}
    }
});

// Error handling
process.on('unhandledRejection', (reason) => {
    console.log('Unhandled rejection:', reason?.message || reason);
});

process.on('uncaughtException', (err) => {
    console.log('Uncaught exception:', err.message);
    process.exit(1);
});

// Login
client.login(process.env.DISCORD_TOKEN).catch(error => {
    console.error('❌ Login failed:', error.message);
    process.exit(1);
});

// Keep alive for Railway
const PORT = process.env.PORT || 3000;
require('http').createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('VibyMusic Bot is running! 🎵');
}).listen(PORT, () => {
    console.log(`🌐 Server running on port ${PORT}`.blue);
});
