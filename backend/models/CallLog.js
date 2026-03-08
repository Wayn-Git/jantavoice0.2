const mongoose = require('mongoose');

const callLogSchema = new mongoose.Schema({
    complaint: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint', required: true },
    initiatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    targetDepartment: { type: String, required: true },
    officerPhone: { type: String },
    script: { type: String },
    transcript: { type: String },
    fullTranscript: { type: String },
    summary: { type: String },
    status: { type: String, enum: ['Awaiting Permission', 'Script Generated', 'Calling', 'Ringing', 'In Progress', 'Completed', 'Transcribed', 'No Answer', 'Failed', 'Demo Mode'], default: 'Script Generated' },
    duration: { type: Number, default: 0 },
    twilioCallSid: { type: String },
    recordingUrl: { type: String },
    userPermission: { type: Boolean, default: false },
    calledAt: { type: Date },
    completedAt: { type: Date },
    conversationLog: [{ speaker: { type: String, enum: ['AI', 'OFFICER'] }, text: String, timestamp: { type: Date, default: Date.now } }],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CallLog', callLogSchema);
