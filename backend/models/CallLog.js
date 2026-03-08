const mongoose = require('mongoose');
const callLogSchema = new mongoose.Schema({
    complaint: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint', required: true },
    initiatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    targetDepartment: { type: String, required: true },
    targetOfficer: { type: String, default: 'Duty Officer' },
    script: { type: String },        // AI-generated call script
    transcript: { type: String },        // conversation transcript
    status: {
        type: String,
        enum: ['Awaiting Permission', 'Script Generated', 'Calling', 'Answered', 'In Progress', 'No Answer', 'Completed', 'Transcribed', 'Failed', 'Ringing'],
        default: 'Awaiting Permission'
    },
    duration: { type: Number, default: 0 },  // seconds
    twilioCallSid: { type: String },        // for future Twilio integration
    officerPhone: { type: String },
    calledAt: { type: Date },
    completedAt: { type: Date },
    recordingUrl: { type: String },
    transcript: { type: String },
    fullTranscript: { type: String },
    summary: { type: String },
    userPermission: { type: Boolean, default: false },
    conversationLog: [{
        speaker: { type: String, enum: ['AI', 'OFFICER'] },
        text: { type: String },
        timestamp: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('CallLog', callLogSchema);
