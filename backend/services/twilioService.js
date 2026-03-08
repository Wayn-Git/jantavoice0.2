const twilio = require('twilio');
const { getUrl } = require('./ngrokService');

function getClient() {
    if (!process.env.TWILIO_ACCOUNT_SID || process.env.TWILIO_ACCOUNT_SID.includes('your_')) {
        return null;
    }
    return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

async function placeCall(toNumber, complaintId, callLogId) {
    const client = getClient();
    if (!client) {
        console.log('⚠️  Twilio not configured — demo mode, no real call placed');
        return { sid: 'DEMO_' + Date.now(), status: 'demo' };
    }

    const baseUrl = getUrl();
    console.log('📞 Placing call to:', toNumber, 'webhook:', baseUrl + '/api/calls/twiml/start/' + callLogId);

    const call = await client.calls.create({
        to: toNumber,
        from: process.env.TWILIO_PHONE_NUMBER,
        url: `${baseUrl}/api/calls/twiml/start/${callLogId}`,
        statusCallback: `${baseUrl}/api/calls/status/${callLogId}`,
        statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
        statusCallbackMethod: 'POST',
        record: true,
        recordingStatusCallback: `${baseUrl}/api/calls/recording/${callLogId}`,
        recordingStatusCallbackMethod: 'POST',
        timeout: 30,
        machineDetection: 'DetectMessageEnd',
    });

    return call;
}

async function getCall(callSid) {
    const client = getClient();
    if (!client || callSid.startsWith('DEMO_')) return { status: 'demo' };
    return client.calls(callSid).fetch();
}

function isTwilioConfigured() {
    return !!(process.env.TWILIO_ACCOUNT_SID && !process.env.TWILIO_ACCOUNT_SID.includes('your_'));
}

module.exports = { placeCall, getCall, isTwilioConfigured };
