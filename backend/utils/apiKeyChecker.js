// Checks which APIs are configured and logs status on startup

function checkAPIKeys() {
    const checks = {
        'Groq AI': !!process.env.GROQ_API_KEY && !process.env.GROQ_API_KEY.includes('your_'),
        'Twilio Call': !!process.env.TWILIO_ACCOUNT_SID && !process.env.TWILIO_ACCOUNT_SID.includes('your_'),
        'ElevenLabs': !!process.env.ELEVENLABS_API_KEY && !process.env.ELEVENLABS_API_KEY.includes('your_'),
        'Deepgram': !!process.env.DEEPGRAM_API_KEY && !process.env.DEEPGRAM_API_KEY.includes('your_'),
        'OpenWeather': !!process.env.OPENWEATHER_API_KEY && !process.env.OPENWEATHER_API_KEY.includes('your_'),
    };

    console.log('\n🔑 API KEY STATUS:');
    Object.entries(checks).forEach(([name, ok]) => {
        console.log(`   ${ok ? '✅' : '⚠️ '} ${name}: ${ok ? 'Configured' : 'Missing (demo mode)'}`);
    });

    const missing = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name);
    if (missing.length) {
        console.log(`\n📋 To enable full features, add these keys to .env:`);
        missing.forEach(m => {
            const guide = {
                'Groq AI': 'https://console.groq.com → API Keys (FREE)',
                'Twilio Call': 'https://twilio.com → Console (FREE trial $15 credit)',
                'ElevenLabs': 'https://elevenlabs.io → Profile → API Key (FREE 10k chars/mo)',
                'Deepgram': 'https://console.deepgram.com → API Keys (FREE $200 credit)',
                'OpenWeather': 'https://openweathermap.org/api → Subscribe (FREE tier)',
            };
            console.log(`   → ${m}: ${guide[m]}`);
        });
    }
    console.log('');
    return checks;
}

module.exports = { checkAPIKeys };
