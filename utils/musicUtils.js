const SpotifyWebApi = require('spotify-web-api-node');
const config = require('../config/config');

// Initialize Spotify API
const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET
});

// Authenticate with Spotify
async function authenticateSpotify() {
    try {
        const data = await spotifyApi.clientCredentialsGrant();
        spotifyApi.setAccessToken(data.body['access_token']);
        console.log('🎵 Spotify API authenticated successfully!'.green);
        
        // Refresh token every 50 minutes
        setInterval(async () => {
            try {
                const data = await spotifyApi.clientCredentialsGrant();
                spotifyApi.setAccessToken(data.body['access_token']);
                console.log('🔄 Spotify token refreshed!'.yellow);
            } catch (error) {
                console.error('❌ Spotify token refresh failed:', error);
            }
        }, 50 * 60 * 1000);
        
    } catch (error) {
        console.error('❌ Spotify authentication failed:', error);
        console.log('⚠️ Bot will work without Spotify features'.yellow);
    }
}

// Search Spotify for better metadata
async function searchSpotify(query) {
    try {
        const results = await spotifyApi.searchTracks(query, { limit: 1 });
        if (results.body.tracks.items.length > 0) {
            const track = results.body.tracks.items[0];
            return {
                title: track.name,
                artist: track.artists.map(artist => artist.name).join(', '),
                album: track.album.name,
                duration: Math.floor(track.duration_ms / 1000),
                image: track.album.images[0]?.url,
                url: track.external_urls.spotify,
                popularity: track.popularity
            };
        }
    } catch (error) {
        console.error('Spotify search error:', error);
    }
    return null;
}

// Format duration from milliseconds
function formatDuration(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
        return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    }
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
}

// Get random viby message
function getVibyMessage() {
    const messages = [
        `Let's vibe together! ${config.emojis.sparkle}`,
        `Music makes everything better! ${config.emojis.love}`,
        `Keep the good vibes flowing! ${config.emojis.notes}`,
        `Dancing to the rhythm! ${config.emojis.party}`,
        `Spreading musical magic! ${config.emojis.star}`,
        `Your personal DJ is here! ${config.emojis.headphones}`,
        `Let the music heal your soul! ${config.emojis.heart}`,
        `Vibing since day one! ${config.emojis.fire}`
    ];
    return messages[Math.floor(Math.random() * messages.length)];
}

module.exports = {
    authenticateSpotify,
    searchSpotify,
    formatDuration,
    getVibyMessage,
    spotifyApi
};
