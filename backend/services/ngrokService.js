let tunnelUrl = null;

async function startNgrok(port = 5000) {
    try {
        const ngrok = require('ngrok');
        // Disconnect any existing tunnels first
        try { await ngrok.kill(); } catch (e) { }

        const url = await ngrok.connect({
            authtoken: process.env.NGROK_AUTH_TOKEN,
            addr: port,
            region: 'ap',
        });

        tunnelUrl = url;
        process.env.PUBLIC_URL = url;
        console.log('🚇 ngrok tunnel:', url);
        return url;
    } catch (err) {
        console.warn('⚠️  ngrok failed (' + err.message + ') — using localhost for webhooks');
        tunnelUrl = 'http://localhost:' + port;
        process.env.PUBLIC_URL = tunnelUrl;
        return tunnelUrl;
    }
}

function getUrl() {
    return process.env.PUBLIC_URL || tunnelUrl || 'http://localhost:5000';
}

async function stopNgrok() {
    try { const ngrok = require('ngrok'); await ngrok.kill(); } catch (e) { }
}

process.on('SIGINT', async () => { await stopNgrok(); process.exit(0); });
process.on('SIGTERM', async () => { await stopNgrok(); process.exit(0); });

module.exports = { startNgrok, getUrl, stopNgrok };
