const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['status_update', 'like', 'comment', 'admin_note', 'welcome', 'gov_update', 'gov_submission', 'escalation', 'reminder', 'submission'],
    required: true,
  },
  message: { type: String, required: true },
  complaint: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint' },
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

notificationSchema.index({ user: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
