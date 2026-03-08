const path = require('path');
const fs = require('fs');
const twilio = require('twilio');
const VoiceResponse = twilio.twiml.VoiceResponse;
const CallLog = require('../models/CallLog');
const Complaint = require('../models/Complaint');

// Safe Notification import
const Notification = (() => {
    try { return require('../models/Notification'); } catch { return null; }
})();

const { callScript } = require('../services/groqService');
const { placeCall, isTwilioConfigured } = require('../services/twilioService');
const { transcribeAudio } = require('../services/deepgramService');
const { generateCallAudio, textToSpeech } = require('../services/elevenLabsService');
const { getUrl } = require('../services/ngrokService');

// ── 1. REQUEST PERMISSION (show user what AI will say) ──
exports.requestCallPermission = async (req, res) => {
    try {
        const complaint = await Complaint.findById(req.params.id).populate('user', 'name');
        if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });

        const script = await callScript(complaint);

        const log = await CallLog.create({
            complaint: complaint._id,
            initiatedBy: req.user._id,
            targetDepartment: complaint.department || complaint.category,
            script,
            status: 'Awaiting Permission',
            conversationLog: [],
            userPermission: false,
        });

        await Complaint.findByIdAndUpdate(complaint._id, { callLogId: log._id });

        res.json({
            success: true,
            callLogId: log._id,
            script,
            department: complaint.department || complaint.category,
            complaintTitle: complaint.title,
            twilioReady: isTwilioConfigured(),
            message: `Do you allow JantaVoice AI to call the ${complaint.department || complaint.category} department regarding your complaint: "${complaint.title}"?`,
        });
    } catch (err) {
        console.error('requestCallPermission error:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── 2. USER CONFIRMS → PLACE CALL ──
exports.confirmAndCall = async (req, res) => {
    try {
        const { callLogId, officerPhone } = req.body;
        if (!callLogId) return res.status(400).json({ success: false, message: 'callLogId required' });

        const log = await CallLog.findById(callLogId).populate({
            path: 'complaint',
            populate: { path: 'user', select: 'name' }
        });
        if (!log) return res.status(404).json({ success: false, message: 'Call log not found' });

        await CallLog.findByIdAndUpdate(callLogId, { userPermission: true });

        // Pre-generate ElevenLabs audio files in background
        generateCallAudio(log.complaint, 'intro').catch(console.error);
        generateCallAudio(log.complaint, 'explain').catch(console.error);

        // Target: officerPhone from request, or test number, or own Twilio number
        const targetNumber = officerPhone ||
            process.env.TEST_OFFICER_PHONE ||
            process.env.TWILIO_PHONE_NUMBER;

        const call = await placeCall(targetNumber, log.complaint._id, log._id);

        await CallLog.findByIdAndUpdate(callLogId, {
            status: call.status === 'demo' ? 'Demo Mode' : 'Calling',
            twilioCallSid: call.sid,
            officerPhone: targetNumber,
            calledAt: new Date(),
        });

        if (Notification) {
            await Notification.create({
                user: log.complaint.user._id,
                complaint: log.complaint._id,
                type: 'call_initiated',
                message: `📞 AI call ${call.status === 'demo' ? 'simulated (demo mode)' : 'placed'} to ${log.targetDepartment}. ${call.status !== 'demo' ? 'Call SID: ' + call.sid : 'Add Twilio keys for real calls.'}`,
            });
        }

        res.json({
            success: true,
            callSid: call.sid,
            callLogId: log._id,
            status: call.status,
            isDemo: call.status === 'demo',
            targetNumber,
            message: call.status === 'demo'
                ? 'Demo mode — script generated, no real call. Add Twilio keys to .env for real calls.'
                : `Call initiated to ${targetNumber}`,
        });
    } catch (err) {
        console.error('confirmAndCall error:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── 3. TWIML START (Twilio hits this when call connects) ──
exports.twimlStart = async (req, res) => {
    const { callLogId } = req.params;
    const twiml = new VoiceResponse();

    try {
        const log = await CallLog.findById(callLogId).populate('complaint');
        if (!log) throw new Error('Log not found');

        await CallLog.findByIdAndUpdate(callLogId, {
            status: 'In Progress',
            $push: { conversationLog: { speaker: 'AI', text: '[Intro + Explanation started]', timestamp: new Date() } }
        });

        // Try ElevenLabs audio first
        const introAudio = await generateCallAudio(log.complaint, 'intro');
        const baseUrl = getUrl();

        if (introAudio) {
            twiml.play(baseUrl + introAudio);
            const gather = twiml.gather({
                input: 'speech',
                action: `${baseUrl}/api/calls/twiml/respond/${callLogId}/intro`,
                method: 'POST',
                timeout: 6,
                speechTimeout: 'auto',
                language: 'en-IN',
            });
            const explainAudio = await generateCallAudio(log.complaint, 'explain');
            if (explainAudio) gather.play(baseUrl + explainAudio);
        } else {
            // Fallback: Twilio built-in Polly voice
            const complaint = log.complaint;
            const city = complaint.location?.city || 'your area';
            twiml.say({ voice: 'Polly.Aditi', language: 'en-IN' },
                `Hello, this is an automated assistant from JantaVoice, India's citizen grievance system. I am calling regarding a complaint about ${complaint.title} in ${city}. This is a ${complaint.priority} priority issue under ${complaint.category}.`
            );
            twiml.gather({
                input: 'speech',
                action: `${baseUrl}/api/calls/twiml/respond/${callLogId}/intro`,
                method: 'POST',
                timeout: 8,
                speechTimeout: 'auto',
                language: 'en-IN',
            });
        }

    } catch (err) {
        console.error('twimlStart error:', err.message);
        twiml.say({ voice: 'Polly.Aditi', language: 'en-IN' },
            'Hello, this is JantaVoice citizen grievance system. I am calling regarding a registered complaint. Please stay on the line.');
        twiml.gather({
            input: 'speech',
            action: `${getUrl()}/api/calls/twiml/respond/${callLogId}/intro`,
            method: 'POST', timeout: 8, speechTimeout: 'auto', language: 'en-IN',
        });
    }

    res.type('text/xml').send(twiml.toString());
};

// ── 4. TWIML RESPOND (officer speaks — AI replies) ──
exports.twimlRespond = async (req, res) => {
    const { callLogId, step } = req.params;
    const officerSpeech = req.body.SpeechResult || '';
    const dtmf = req.body.Digits || '';
    const twiml = new VoiceResponse();
    const baseUrl = getUrl();

    try {
        const log = await CallLog.findById(callLogId).populate('complaint');

        // Save what officer said
        if (officerSpeech) {
            await CallLog.findByIdAndUpdate(callLogId, {
                $push: { conversationLog: { speaker: 'OFFICER', text: officerSpeech, timestamp: new Date() } }
            });
            console.log(`📞 Officer [${step}]: "${officerSpeech}"`);
        }

        // AI generates contextual response using Groq
        const aiReply = await getAIReply(officerSpeech, step, log.complaint);
        await CallLog.findByIdAndUpdate(callLogId, {
            $push: { conversationLog: { speaker: 'AI', text: aiReply, timestamp: new Date() } }
        });

        const nextStep = getNextStep(step, officerSpeech, dtmf);
        console.log(`📞 AI reply [${step}→${nextStep}]: "${aiReply.substring(0, 80)}..."`);

        // Play AI reply
        const audioPath = await textToSpeech(aiReply, `${callLogId}_${step}_${Date.now()}`);
        if (audioPath) {
            twiml.play(baseUrl + audioPath);
        } else {
            twiml.say({ voice: 'Polly.Aditi', language: 'en-IN' }, aiReply);
        }

        if (nextStep === 'closing') {
            twiml.hangup();
            await CallLog.findByIdAndUpdate(callLogId, { status: 'Completed', completedAt: new Date() });
        } else {
            twiml.gather({
                input: 'speech',
                action: `${baseUrl}/api/calls/twiml/respond/${callLogId}/${nextStep}`,
                method: 'POST',
                timeout: 10,
                speechTimeout: 'auto',
                language: 'en-IN',
            });
        }

    } catch (err) {
        console.error('twimlRespond error:', err.message);
        twiml.say({ voice: 'Polly.Aditi', language: 'en-IN' },
            'Thank you for your time. This call has been recorded. The citizen will be notified. Goodbye.');
        twiml.hangup();
    }

    res.type('text/xml').send(twiml.toString());
};

// ── 5. TWILIO STATUS WEBHOOK ──
exports.callStatus = async (req, res) => {
    const { callLogId } = req.params;
    const { CallStatus, CallDuration } = req.body;
    const statusMap = {
        'initiated': 'Calling', 'ringing': 'Ringing', 'answered': 'In Progress',
        'completed': 'Completed', 'busy': 'No Answer', 'no-answer': 'No Answer', 'failed': 'Failed'
    };
    const update = { status: statusMap[CallStatus] || CallStatus };
    if (CallDuration) update.duration = parseInt(CallDuration);
    if (['completed', 'busy', 'no-answer', 'failed'].includes(CallStatus)) {
        update.completedAt = new Date();
    }
    await CallLog.findByIdAndUpdate(callLogId, update);
    if (CallStatus === 'completed') {
        setTimeout(() => doTranscription(callLogId), 6000);
    }
    console.log(`📞 Call ${callLogId} status: ${CallStatus} (${CallDuration}s)`);
    res.sendStatus(200);
};

// ── 6. RECORDING WEBHOOK ──
exports.recordingCallback = async (req, res) => {
    const { callLogId } = req.params;
    const { RecordingUrl, RecordingStatus } = req.body;
    if (RecordingStatus === 'completed' && RecordingUrl) {
        const url = RecordingUrl + '.mp3';
        await CallLog.findByIdAndUpdate(callLogId, { recordingUrl: url });
        console.log(`🎙️  Recording saved for ${callLogId}`);
        setTimeout(() => doTranscription(callLogId), 4000);
    }
    res.sendStatus(200);
};

// ── HELPER: Get AI reply using Groq ──
async function getAIReply(officerSpeech, step, complaint) {
    const city = complaint?.location?.city || 'your area';
    if (!officerSpeech) {
        const defaults = {
            intro: `I am calling from JantaVoice regarding a ${complaint?.priority || 'High'} priority complaint about ${complaint?.title || 'a civic issue'} in ${city}.`,
            confirm: `Can you confirm if this issue — ${complaint?.title} — falls under your department?`,
            status: `Can you provide the current status or expected resolution timeline for this issue?`,
            closing: `Thank you for your time. This response has been recorded. The citizen will be notified. Have a good day.`,
        };
        return defaults[step] || defaults.closing;
    }

    try {
        const Groq = require('groq-sdk');
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const res = await groq.chat.completions.create({
            model: process.env.GROQ_MODEL || 'llama3-8b-8192',
            messages: [{
                role: 'user',
                content: `You are an AI calling officer from JantaVoice India's civic complaint platform.
You are speaking with a government officer by phone about:
- Complaint: ${complaint?.title}
- Category: ${complaint?.category}
- Location: ${city}
- Priority: ${complaint?.priority}
- Call step: ${step}

The officer just said: "${officerSpeech}"

Generate a short natural spoken reply (max 50 words).
Be polite and professional. Push for a resolution commitment.
If officer says it's wrong department, politely ask who to contact instead.
Return ONLY the spoken response.`
            }],
            max_tokens: 120,
            temperature: 0.6,
        });
        return res.choices[0].message.content.trim();
    } catch (err) {
        console.error('Groq reply error:', err.message);
        return `Thank you for that information. Could you please provide a timeline for resolution of this ${complaint?.category} issue?`;
    }
}

// ── HELPER: Next call step ──
function getNextStep(step, speech, dtmf) {
    const lower = (speech || '').toLowerCase();
    if (dtmf === '9' || /goodbye|bye|hang up/.test(lower)) return 'closing';
    if (/wrong|not our|another|redirect|transfer/.test(lower)) return 'closing';
    const flow = { intro: 'confirm', confirm: 'status', status: 'closing', closing: 'closing' };
    return flow[step] || 'closing';
}

// ── HELPER: Transcribe recording after call ──
async function doTranscription(callLogId) {
    try {
        const log = await CallLog.findById(callLogId).populate({
            path: 'complaint',
            populate: { path: 'user', select: '_id name' }
        });
        if (!log) return;

        let transcript = log.transcript;
        if (!transcript && log.recordingUrl) {
            const result = await transcribeAudio(log.recordingUrl);
            transcript = result.transcript;
            await CallLog.findByIdAndUpdate(callLogId, {
                transcript,
                fullTranscript: result.fullText,
                status: 'Transcribed',
            });
        }

        // Groq summary of the call
        if (transcript) {
            const Groq = require('groq-sdk');
            const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
            const r = await groq.chat.completions.create({
                model: process.env.GROQ_MODEL || 'llama3-8b-8192',
                messages: [{
                    role: 'user',
                    content: `Summarize this government officer call in 3 bullet points.
Focus on: (1) resolution status, (2) promised timeline, (3) next steps.
Transcript:\n${transcript.substring(0, 1500)}`,
                }],
                max_tokens: 200,
            });
            const summary = r.choices[0].message.content;
            await CallLog.findByIdAndUpdate(callLogId, { summary });

            if (Notification && log.complaint?.user?._id) {
                await Notification.create({
                    user: log.complaint.user._id,
                    complaint: log.complaint._id,
                    type: 'call_completed',
                    message: `📞 AI call to ${log.targetDepartment} completed. Transcript ready. ${summary.substring(0, 100)}`,
                });
            }

            // Auto-update complaint status based on what officer said
            const lower = (log.fullTranscript || transcript || '').toLowerCase();
            let newStatus = null;
            if (/resolv|fixed|done|completed|action taken|sorted/.test(lower)) newStatus = 'In Progress';
            if (/reject|not our|wrong department|cannot/.test(lower)) newStatus = 'Under Review';
            if (newStatus && log.complaint?._id) {
                await Complaint.findByIdAndUpdate(log.complaint._id, { status: newStatus });
            }
        }
        console.log('✅ Transcription complete for', callLogId);
    } catch (err) {
        console.error('Transcription error:', err.message);
    }
}

// ── GET SINGLE LOG ──
exports.getLog = async (req, res) => {
    try {
        const log = await CallLog.findById(req.params.id)
            .populate('complaint', 'title category location priority status complaintId')
            .populate('initiatedBy', 'name');
        if (!log) return res.status(404).json({ success: false, message: 'Not found' });
        res.json({ success: true, callLog: log });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── GET ALL LOGS (admin) ──
exports.getAllLogs = async (req, res) => {
    try {
        const logs = await CallLog.find()
            .populate('complaint', 'title category status')
            .populate('initiatedBy', 'name')
            .sort('-createdAt').limit(100);
        res.json({ success: true, logs });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
