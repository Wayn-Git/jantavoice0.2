const ngrok = require('ngrok');

let currentUrl = null;

async function startNgrok(port = 5000) {
    try {
        // If already running, disconnect first
        await ngrok.disconnect();
        await ngrok.kill();
    } catch (e) { /* ignore */ }

    try {
        const url = await ngrok.connect({
            authtoken: process.env.NGROK_AUTH_TOKEN,
            addr: port,
            region: 'ap',  // Asia-Pacific — fastest for India
        });

        currentUrl = url;
        process.env.PUBLIC_URL = url;

        console.log('🚇 ngrok tunnel active:', url);
        console.log('📞 Twilio webhook base URL:', url + '/api/calls');

        return url;
    } catch (err) {
        console.error('❌ ngrok failed:', err.message);
        console.log('⚠️  Calls will run in demo mode (no real calls)');
        currentUrl = 'http://localhost:' + port;
        process.env.PUBLIC_URL = currentUrl;
        return currentUrl;
    }
}

function getUrl() {
    return currentUrl || process.env.PUBLIC_URL || 'http://localhost:5000';
}

async function stopNgrok() {
    try { await ngrok.kill(); } catch (e) { /* ignore */ }
}

// Graceful shutdown
process.on('SIGINT', async () => { await stopNgrok(); process.exit(0); });
process.on('SIGTERM', async () => { await stopNgrok(); process.exit(0); });

module.exports = { startNgrok, getUrl, stopNgrok };
