const mongoose = require('mongoose');

const govTicketSchema = new mongoose.Schema({
    complaint: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    portal: { type: String, required: true },
    portalName: { type: String },
    portalUrl: { type: String },
    trackUrl: { type: String },
    ticketId: { type: String },
    submissionData: { type: Object },
    currentStatus: { type: String, default: 'Submitted' },
    statusHistory: [{ status: String, details: String, timestamp: { type: Date, default: Date.now }, isAutoUpdate: { type: Boolean, default: false } }],
    govResponse: { type: String },
    expectedResolutionDays: { type: Number, default: 30 },
    isResolved: { type: Boolean, default: false },
    lastChecked: { type: Date },
    checkCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('GovTicket', govTicketSchema);
