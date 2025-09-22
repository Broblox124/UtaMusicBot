const { Events } = require('discord.js');
const config = require('../config/config');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        // Handle slash commands
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            
            if (!command) {
                console.error(`❌ No command matching ${interaction.commandName} was found.`);
                return;
            }
            
            try {
                console.log(`🎵 ${interaction.user.tag} used /${interaction.commandName} in ${interaction.guild?.name || 'DM'}`);
                await command.execute(interaction);
            } catch (error) {
                console.error(`❌ Error executing ${interaction.commandName}:`, error);
                
                const errorEmbed = config.errorEmbed(
                    'Command Error!',
                    `${config.emojis.error} There was an error while executing this command! Please try again.`
                );
                
                try {
                    if (interaction.replied || interaction.deferred) {
                        await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
                    } else {
                        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                    }
                } catch (followUpError) {
                    console.error('❌ Failed to send error message:', followUpError);
                }
            }
        }
        
        // Handle button interactions
        if (interaction.isButton()) {
            const { player } = interaction.client;
            const queue = player.nodes.get(interaction.guildId);
            
            if (!queue || !queue.currentTrack) {
                const embed = config.errorEmbed(
                    'No Music Playing!',
                    `${config.emojis.warning} No music is currently playing!`
                );
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }
            
            // Check if user is in voice channel
            const voiceChannel = interaction.member.voice.channel;
            if (!voiceChannel || voiceChannel.id !== queue.connection.channel.id) {
                const embed = config.errorEmbed(
                    'Wrong Voice Channel!',
                    `${config.emojis.headphones} You need to be in the same voice channel as me to control the music!`
                );
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }
            
            try {
                switch (interaction.customId) {
                    case 'pause_resume':
                        if (queue.node.isPaused()) {
                            queue.node.resume();
                            const resumeEmbed = config.successEmbed(
                                'Music Resumed!',
                                `${config.emojis.play} Music resumed! Keep vibing! ${config.emojis.notes}`
                            );
                            await interaction.reply({ embeds: [resumeEmbed], ephemeral: true });
                        } else {
                            queue.node.pause();
                            const pauseEmbed = config.successEmbed(
                                'Music Paused!',
                                `${config.emojis.pause} Music paused! Click again to resume. ${config.emojis.sparkle}`
                            );
                            await interaction.reply({ embeds: [pauseEmbed], ephemeral: true });
                        }
                        break;
                        
                    case 'skip':
                        const currentTrack = queue.currentTrack;
                        queue.node.skip();
                        const skipEmbed = config.successEmbed(
                            'Song Skipped!',
                            `${config.emojis.skip} Skipped **${currentTrack.title}**! ${config.emojis.sparkle}`
                        );
                        await interaction.reply({ embeds: [skipEmbed], ephemeral: true });
                        break;
                        
                    case 'stop':
                        queue.delete();
                        const stopEmbed = config.successEmbed(
                            'Music Stopped!',
                            `${config.emojis.stop} Music stopped and queue cleared! Thanks for vibing! ${config.emojis.love}`
                        );
                        await interaction.reply({ embeds: [stopEmbed], ephemeral: true });
                        break;
                        
                    case 'shuffle':
                        if (queue.tracks.data.length === 0) {
                            const noTracksEmbed = config.errorEmbed(
                                'Nothing to Shuffle!',
                                `${config.emojis.warning} There are no songs in the queue to shuffle!`
                            );
                            await interaction.reply({ embeds: [noTracksEmbed], ephemeral: true });
                            break;
                        }
                        
                        queue.tracks.shuffle();
                        const shuffleEmbed = config.successEmbed(
                            'Queue Shuffled!',
                            `${config.emojis.shuffle} Queue shuffled! Time for surprises! ${config.emojis.party}`
                        );
                        await interaction.reply({ embeds: [shuffleEmbed], ephemeral: true });
                        break;
                        
                    case 'repeat':
                        const modes = ['Off', 'Track', 'Queue'];
                        const newMode = (queue.repeatMode + 1) % 3;
                        queue.setRepeatMode(newMode);
                        
                        const repeatEmbed = config.successEmbed(
                            'Repeat Mode Changed!',
                            `${config.emojis.repeat} Repeat mode: **${modes[newMode]}** ${config.emojis.fire}`
                        );
                        await interaction.reply({ embeds: [repeatEmbed], ephemeral: true });
                        break;
                        
                    default:
                        console.warn(`Unknown button interaction: ${interaction.customId}`);
                        break;
                }
            } catch (error) {
                console.error('❌ Button interaction error:', error);
                const errorEmbed = config.errorEmbed(
                    'Button Error!',
                    `${config.emojis.error} An error occurred while processing your request.`
                );
                
                try {
                    await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                } catch (replyError) {
                    console.error('❌ Failed to send button error message:', replyError);
                }
            }
        }
    }
};
