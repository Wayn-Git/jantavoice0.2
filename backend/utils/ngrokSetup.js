// Run this separately: node utils/ngrokSetup.js
// It starts ngrok and updates PUBLIC_URL automatically

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

async function getNgrokUrl() {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const check = () => {
            http.get('http://localhost:4040/api/tunnels', res => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(data);
                        const tunnel = parsed.tunnels?.find(t => t.proto === 'https');
                        if (tunnel) resolve(tunnel.public_url);
                        else if (attempts++ < 10) setTimeout(check, 1000);
                        else reject(new Error('No ngrok tunnel found'));
                    } catch { if (attempts++ < 10) setTimeout(check, 1000); else reject(new Error('Parse failed')); }
                });
            }).on('error', () => { if (attempts++ < 10) setTimeout(check, 1000); else reject(new Error('ngrok not running')); });
        };
        check();
    });
}

async function main() {
    console.log('🚇 Starting ngrok...');
    const ngrok = spawn('ngrok', ['http', '5000'], { detached: true, stdio: 'ignore' });
    ngrok.unref();
    await new Promise(r => setTimeout(r, 2000));
    const url = await getNgrokUrl();
    console.log('✅ ngrok URL:', url);

    // Update .env
    const envPath = path.join(__dirname, '../.env');
    let envContent = fs.readFileSync(envPath, 'utf-8');
    envContent = envContent.replace(/PUBLIC_URL=.*/, `PUBLIC_URL=${url}`);
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Updated .env PUBLIC_URL =', url);
    console.log('🔄 Restart your backend server now.');
}

main().catch(console.error);
