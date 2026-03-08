const axios = require('axios');
const fs = require('fs');
const path = require('path');

function isConfigured() {
    return !!(process.env.ELEVENLABS_API_KEY && !process.env.ELEVENLABS_API_KEY.includes('your_'));
}

async function textToSpeech(text, filename) {
    if (!isConfigured()) {
        console.log('⚠️  ElevenLabs not configured — Twilio Polly TTS will be used');
        return null;
    }

    try {
        const voiceId = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';
        const res = await axios({
            method: 'post',
            url: `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
            headers: {
                'Accept': 'audio/mpeg',
                'xi-api-key': process.env.ELEVENLABS_API_KEY,
                'Content-Type': 'application/json',
            },
            data: {
                text,
                model_id: 'eleven_multilingual_v2',
                voice_settings: { stability: 0.65, similarity_boost: 0.80, style: 0.20, use_speaker_boost: true }
            },
            responseType: 'arraybuffer',
            timeout: 15000,
        });

        const dir = path.join(__dirname, '../uploads/audio');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        const filePath = path.join(dir, filename + '.mp3');
        fs.writeFileSync(filePath, Buffer.from(res.data));
        console.log('🎙️  ElevenLabs audio saved:', filename + '.mp3');
        return `/uploads/audio/${filename}.mp3`;
    } catch (err) {
        console.error('ElevenLabs TTS error:', err.message, '— falling back to Polly');
        return null;
    }
}

async function generateCallAudio(complaint, step) {
    const city = complaint.location?.city || 'your area';
    const scripts = {
        intro: `Hello, this is an automated assistant calling from JantaVoice, India's citizen grievance system. I am calling on behalf of a registered citizen. Please stay on the line for an important civic complaint.`,
        explain: `I am calling regarding a complaint about ${complaint.title} in ${city}. This issue has been categorized under ${complaint.category} and marked as ${complaint.priority} priority by our AI system.`,
        confirm: `Can you please confirm if this matter falls under your department's jurisdiction? You may say yes to confirm, or no if this should be redirected to another department.`,
        status: `Could you please provide the current status of this issue, or an expected timeline for resolution? Your response will be recorded and shared with the citizen.`,
        followup: `This is a follow-up call from JantaVoice. The complaint filed about ${complaint.title} in ${city} remains unresolved. The citizen is requesting an update on the action taken.`,
        closing: `Thank you for your response. This conversation has been recorded and will be attached to the complaint record. The citizen will be notified. Have a good day. Goodbye.`,
    };

    const text = scripts[step] || scripts.intro;
    const fname = `${complaint._id}_${step}_${Date.now()}`;
    return textToSpeech(text, fname);
}

module.exports = { textToSpeech, generateCallAudio, isConfigured };
