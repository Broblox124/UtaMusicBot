const { EmbedBuilder } = require('discord.js');

module.exports = {
    // Bot Configuration
    prefix: process.env.PREFIX || '/',
    botName: process.env.BOT_NAME || 'VibyMusic',
    botColor: process.env.BOT_COLOR || '#FF69B4',
    
    // Emojis for viby theme
    emojis: {
        play: '▶️',
        pause: '⏸️',
        stop: '⏹️',
        skip: '⏭️',
        previous: '⏮️',
        shuffle: '🔀',
        repeat: '🔁',
        volume: '🔊',
        queue: '📋',
        music: '🎵',
        love: '💖',
        sparkle: '✨',
        headphones: '🎧',
        microphone: '🎤',
        radio: '📻',
        notes: '🎶',
        success: '✅',
        error: '❌',
        warning: '⚠️',
        loading: '⏳',
        fire: '🔥',
        star: '⭐',
        heart: '💕',
        party: '🎉'
    },
    
    // Create success embed
    successEmbed: (title, description) => {
        return new EmbedBuilder()
            .setTitle(`${module.exports.emojis.success} ${title}`)
            .setDescription(description)
            .setColor(module.exports.botColor)
            .setTimestamp()
            .setFooter({ 
                text: `${module.exports.botName} • Vibing with you! ${module.exports.emojis.love}`,
                iconURL: 'https://i.imgur.com/4M34hi2.png'
            });
    },
    
    // Create error embed
    errorEmbed: (title, description) => {
        return new EmbedBuilder()
            .setTitle(`${module.exports.emojis.error} ${title}`)
            .setDescription(description)
            .setColor('#FF4444')
            .setTimestamp()
            .setFooter({ 
                text: `${module.exports.botName} • Something went wrong ${module.exports.emojis.warning}`,
                iconURL: 'https://i.imgur.com/4M34hi2.png'
            });
    },
    
    // Create music embed
    musicEmbed: (title, description) => {
        return new EmbedBuilder()
            .setTitle(`${module.exports.emojis.music} ${title}`)
            .setDescription(description)
            .setColor(module.exports.botColor)
            .setTimestamp()
            .setFooter({ 
                text: `${module.exports.botName} • Keep vibing! ${module.exports.emojis.sparkle}`,
                iconURL: 'https://i.imgur.com/4M34hi2.png'
            });
    },
    
    // Create info embed
    infoEmbed: (title, description) => {
        return new EmbedBuilder()
            .setTitle(`${module.exports.emojis.sparkle} ${title}`)
            .setDescription(description)
            .setColor('#4A90E2')
            .setTimestamp()
            .setFooter({ 
                text: `${module.exports.botName} • Here to help! ${module.exports.emojis.heart}`,
                iconURL: 'https://i.imgur.com/4M34hi2.png'
            });
    }
};
