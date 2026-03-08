const cron = require('node-cron');
const Complaint = require('../models/Complaint');
const Notification = (() => { try { return require('../models/Notification'); } catch { return null; } })();
const { ESCALATION_DAYS } = require('../config/constants');

async function runEscalations() {
    const now = new Date();
    const complaints = await Complaint.find({
        status: { $in: ['Submitted', 'Under Review', 'In Progress'] },
        isFake: false,
        nextEscalationAt: { $lte: now }
    }).populate('user', '_id name');

    for (const c of complaints) {
        const days = (now - c.createdAt) / 86400000;
        let acted = false;

        if (days >= ESCALATION_DAYS.level3 && c.escalationLevel < 3) {
            c.escalationLevel = 3;
            c.status = 'Escalated';
            c.statusHistory.push({ status: 'Escalated', changedAt: now, note: 'Auto-escalated to State Portal after 7 days', isAutomated: true });
            if (Notification) await Notification.create({ user: c.user._id, complaint: c._id, type: 'escalation', message: `📈 Escalated to State Grievance Portal: "${c.title}"` });
            acted = true;
        } else if (days >= ESCALATION_DAYS.level2 && c.escalationLevel < 2) {
            c.escalationLevel = 2;
            c.statusHistory.push({ status: 'In Progress', changedAt: now, note: 'Escalated to higher authority after 5 days', isAutomated: true });

            // Trigger follow-up AI call on Day 5
            try {
                const { callScript } = require('./groqService');
                const { placeCall } = require('./twilioService');
                const CallLog = require('../models/CallLog');

                const script = await callScript(c);
                const log = await CallLog.create({
                    complaint: c._id,
                    targetDepartment: c.department || c.category,
                    script,
                    status: 'Calling',
                    conversationLog: []
                });

                if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_ACCOUNT_SID !== 'your_twilio_account_sid_here') {
                    const call = await placeCall(
                        process.env.TEST_OFFICER_PHONE || process.env.TWILIO_PHONE_NUMBER,
                        c._id,
                        log._id
                    );
                    await CallLog.findByIdAndUpdate(log._id, { twilioCallSid: call.sid });
                }

                if (Notification) await Notification.create({
                    user: c.user._id,
                    complaint: c._id,
                    type: 'escalation',
                    message: `📞 Follow-up AI call placed to ${c.department || c.category} (Day 5 escalation).`
                });
            } catch (callErr) {
                console.error('Escalation call failed:', callErr.message);
            }

            acted = true;
        } else if (days >= ESCALATION_DAYS.level1 && c.escalationLevel < 1) {
            c.escalationLevel = 1;
            if (Notification) await Notification.create({ user: c.user._id, complaint: c._id, type: 'reminder', message: `⏰ Reminder sent to department for: "${c.title}"` });
            acted = true;
        }

        if (acted) {
            c.nextEscalationAt = new Date(now.getTime() + 2 * 86400000);
            c.updatedAt = now;
            await c.save();
        }
    }
    if (complaints.length) console.log(`📈 Escalation: ${complaints.length} complaints checked`);
}

exports.startEscalationChecker = () => {
    cron.schedule('*/10 * * * *', runEscalations);
    setTimeout(runEscalations, 12000);
    console.log('📈 Escalation engine started — every 10 min');
};
