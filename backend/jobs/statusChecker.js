// Runs every 10 minutes — checks all complaints and notifies of changes
const cron = require('node-cron');
const Complaint = require('../models/Complaint');
const GovTicket = require('../models/GovTicket');
const Notification = require('../models/Notification');

async function checkAllComplaintStatuses() {
    const now = new Date();
    console.log('⏱️  10-min status check running at', now.toLocaleTimeString('en-IN'));

    try {
        // Check gov tickets for status progression
        const tickets = await GovTicket.find({ isResolved: false }).populate('complaint', 'title user');
        let updates = 0;

        for (const ticket of tickets) {
            const hoursOld = (now - new Date(ticket.createdAt)) / 3600000;
            const steps = [
                { hours: 2, status: 'Under Review', details: 'Grievance officer reviewing your complaint.' },
                { hours: 24, status: 'Sent to Department', details: 'Forwarded to concerned department.' },
                { hours: 72, status: 'In Progress', details: 'Field visit scheduled. Officer assigned.' },
                { hours: 168, status: 'Action Taken', details: 'Remedial action initiated.' },
                { hours: 360, status: 'Disposed', details: 'Complaint resolved.' }
            ];

            const newStep = steps.filter(s => hoursOld >= s.hours).pop();
            if (!newStep) continue;

            const lastStatus = ticket.statusHistory[ticket.statusHistory.length - 1]?.status;
            if (lastStatus !== newStep.status) {
                ticket.statusHistory.push({ status: newStep.status, details: newStep.details, isAutoUpdate: true, timestamp: now });
                ticket.currentStatus = newStep.status;
                if (newStep.status === 'Disposed') {
                    ticket.isResolved = true;
                    await Complaint.findByIdAndUpdate(ticket.complaint._id, { status: 'Resolved' });
                }
                await ticket.save();

                if (ticket.complaint?.user) {
                    await Notification.create({
                        user: ticket.complaint.user,
                        complaint: ticket.complaint._id,
                        type: 'gov_update',
                        message: `🏛️ Portal update: "${newStep.status}" — ${newStep.details}`
                    });
                }
                updates++;
            }
        }

        // Check complaints stuck in same status for too long
        const stuckComplaints = await Complaint.find({
            status: { $in: ['Submitted', 'Under Review'] },
            updatedAt: { $lt: new Date(now - 48 * 3600000) }, // 48h no update
            isFake: false
        }).limit(20);

        for (const c of stuckComplaints) {
            await Notification.create({
                user: c.user,
                complaint: c._id,
                type: 'reminder',
                message: `⏰ Your complaint "${c.title}" status check: Still "${c.status}". Our team is following up.`
            });
        }

        console.log(`⏱️  Status check done: ${updates} ticket updates, ${stuckComplaints.length} stuck complaints notified`);
    } catch (err) {
        console.error('Status checker error:', err.message);
    }
}

exports.startStatusChecker = () => {
    cron.schedule('*/10 * * * *', checkAllComplaintStatuses);
    setTimeout(checkAllComplaintStatuses, 8000);
    console.log('⏱️  10-min status checker started');
};
