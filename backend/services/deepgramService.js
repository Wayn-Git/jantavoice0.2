function isConfigured() {
    return !!(process.env.DEEPGRAM_API_KEY && !process.env.DEEPGRAM_API_KEY.includes('your_'));
}

async function transcribeAudio(audioUrl) {
    if (!isConfigured()) {
        console.log('⚠️  Deepgram not configured — returning demo transcript');
        return {
            transcript: '[AI AGENT] Hello, this is JantaVoice automated grievance system calling.\n[OFFICER] Yes, I can hear you. What is this regarding?\n[AI AGENT] I am calling about a citizen complaint. The issue has been noted.\n[OFFICER] We will look into it. Thank you for informing us.\n[AI AGENT] Thank you for your response. The citizen will be notified. Goodbye.',
            fullText: 'Demo transcript — add DEEPGRAM_API_KEY to .env for real transcription.',
            utterances: [],
            confidence: 1.0,
            isDemo: true,
        };
    }

    try {
        const { createClient } = require('@deepgram/sdk');
        const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

        const { result, error } = await deepgram.listen.prerecorded.transcribeUrl(
            { url: audioUrl },
            {
                model: 'nova-2',
                language: 'en-IN',
                smart_format: true,
                punctuate: true,
                diarize: true,
                utterances: true,
            }
        );

        if (error) throw new Error(error.message);

        const utterances = result.results?.utterances || [];
        const transcript = utterances.length
            ? utterances.map(u => `[${u.speaker === 0 ? 'AI AGENT' : 'OFFICER'}] ${u.transcript}`).join('\n')
            : result.results?.channels[0]?.alternatives[0]?.transcript || '';

        const fullText = result.results?.channels[0]?.alternatives[0]?.transcript || '';
        const confidence = result.results?.channels[0]?.alternatives[0]?.confidence || 0;

        return { transcript, fullText, utterances, confidence, isDemo: false };
    } catch (err) {
        console.error('Deepgram error:', err.message);
        return {
            transcript: 'Transcription failed: ' + err.message,
            fullText: '',
            utterances: [],
            confidence: 0,
            isDemo: true,
        };
    }
}

module.exports = { transcribeAudio, isConfigured };
