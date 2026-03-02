const mongoose = require('mongoose');

const govTicketSchema = new mongoose.Schema({
    complaint: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    portal: { type: String, required: true }, // 'cpgrams', 'aaplesarkar', 'swachhata'
    portalName: String,
    ticketId: String,        // e.g. "GR2024048291"
    ticketUrl: String,       // direct link to check on govt portal
    submissionData: Object,  // what was submitted
    currentStatus: { type: String, default: 'Submitted' },
    statusHistory: [{
        status: String,        // "Submitted", "Under Process", "Sent to Ministry", "Disposed"
        details: String,
        timestamp: { type: Date, default: Date.now },
        isAutoUpdate: { type: Boolean, default: false }
    }],
    govResponse: String,
    expectedResolutionDays: { type: Number, default: 30 },
    isResolved: { type: Boolean, default: false },
    lastChecked: Date,
    checkCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('GovTicket', govTicketSchema);
