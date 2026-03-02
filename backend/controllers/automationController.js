const mongoose = require('mongoose');
const cron = require('node-cron');
const Complaint = require('../models/Complaint');
const GovTicket = require('../models/GovTicket');
const Notification = require('../models/Notification');
const { groq } = require('../config/groq');

// --- INLINE MODELS ---
const autoLogSchema = new mongoose.Schema({
    ruleId: String,
    ruleName: String,
    complaintId: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint' },
    complaintTitle: String,
    action: String,
    result: String,
    success: { type: Boolean, default: true },
    timestamp: { type: Date, default: Date.now }
});
const AutomationLog = mongoose.model('AutomationLog', autoLogSchema);

const ruleSchema = new mongoose.Schema({
    id: String,
    name: String,
    description: String,
    trigger: String,
    triggerValue: mongoose.Schema.Types.Mixed,
    condition: Object,
    action: String,
    actionValue: mongoose.Schema.Types.Mixed,
    isActive: { type: Boolean, default: true },
    runCount: { type: Number, default: 0 },
    lastRun: Date,
    createdAt: { type: Date, default: Date.now }
});
const AutomationRule = mongoose.model('AutomationRule', ruleSchema);

// --- DEFAULT RULES ---
const DEFAULT_RULES = [
    {
        id: 'rule_1',
        name: 'Auto-escalate Critical complaints after 24h',
        description: 'Critical complaint with no update → move to In Progress automatically',
        trigger: 'time_elapsed',
        triggerValue: 24,
        condition: { priority: 'Critical', status: 'Reported' },
        action: 'change_status',
        actionValue: 'In Progress',
        isActive: true,
        runCount: 0
    },
    {
        id: 'rule_2',
        name: 'Auto-submit to Gov Portal when 10+ likes',
        description: 'Popular complaints get auto-submitted to CPGRAMS for faster resolution',
        trigger: 'likes_threshold',
        triggerValue: 10,
        condition: { status: 'Reported' },
        action: 'submit_to_gov',
        actionValue: 'cpgrams',
        isActive: true,
        runCount: 0
    },
    {
        id: 'rule_3',
        name: 'No update in 7 days — send reminder notification',
        description: 'If In Progress complaint has no status change for 7 days, notify user',
        trigger: 'no_update',
        triggerValue: 168,
        condition: { status: 'In Progress' },
        action: 'send_notification',
        actionValue: 'Your complaint has had no update in 7 days. We are following up.',
        isActive: true,
        runCount: 0
    },
    {
        id: 'rule_4',
        name: 'Auto-generate formal letter for High/Critical',
        description: 'When a High or Critical complaint is filed, auto-generate formal letter',
        trigger: 'on_create',
        triggerValue: null,
        condition: { priority: ['High', 'Critical'] },
        action: 'generate_letter',
        actionValue: true,
        isActive: true,
        runCount: 0
    },
    {
        id: 'rule_5',
        name: 'Auto-resolve if Gov Portal marks Disposed',
        description: 'When CPGRAMS/portal marks ticket as Disposed, mark complaint Resolved',
        trigger: 'gov_status_change',
        triggerValue: 'Disposed',
        condition: {},
        action: 'change_status',
        actionValue: 'Resolved',
        isActive: true,
        runCount: 0
    },
    {
        id: 'rule_6',
        name: 'AI status update message when status changes',
        description: 'Send AI-generated empathetic message to user when admin changes status',
        trigger: 'status_change',
        triggerValue: null,
        condition: {},
        action: 'ai_response',
        actionValue: 'generate_empathetic_update',
        isActive: true,
        runCount: 0
    }
];

// --- HELPER WRAPPER ---
const createNotification = async (userId, complaintId, type, message) => {
    await Notification.create({
        user: userId,
        complaint: complaintId,
        type: type, // Ensure this enum value exists in Notification schema if custom
        message: message
    });
};

const generateAIStatusMessage = async (complaint) => {
    try {
        const chat = await groq.chat.completions.create({
            messages: [{
                role: 'system',
                content: `Write a short empathetic update message (max 2 sentences) to an Indian citizen whose complaint about ${complaint.category}: ${complaint.title} is now ${complaint.status}. Be specific and reassuring. English only.`
            }],
            model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
            temperature: 0.5,
            max_tokens: 100,
        });
        return chat.choices[0]?.message?.content?.trim() || `Status updated to ${complaint.status}.`;
    } catch (err) {
        return `Status updated to ${complaint.status}.`;
    }
};

const generateLetterWithAI = async (complaint) => {
    try {
        const userObj = await mongoose.model('User').findById(complaint.user);
        const userName = userObj ? userObj.name : 'Citizen';

        const prompt = `Write a formal Indian government complaint letter for: 
Title: ${complaint.title}
Category: ${complaint.category}  
Description: ${complaint.description}
Location: ${complaint.location.address}, ${complaint.location.city}
Complainant: ${userName}

Format: 
- To: The Concerned Authority, [relevant dept]
- Subject: RE: Complaint Regarding [category] Issue
- Body: 3 paragraphs (introduction, issue details, requested action)
- Closing: Yours faithfully
Keep formal Indian government letter style. Under 300 words.`;

        const chat = await groq.chat.completions.create({
            messages: [{ role: 'system', content: prompt }],
            model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
            temperature: 0.2,
            max_tokens: 800,
        });
        return chat.choices[0]?.message?.content?.trim() || 'A formal letter could not be generated at this time.';
    } catch (err) {
        return 'Failed to automatically generate letter via AI.';
    }
};

// --- INITIALIZE RULES ---
const initDefaultRules = async () => {
    try {
        const count = await AutomationRule.countDocuments();
        if (count === 0) {
            await AutomationRule.insertMany(DEFAULT_RULES);
            console.log('🤖 Seeded default Automation Rules.');
        }
    } catch (e) {
        console.error('Failed to init rules:', e);
    }
};

// --- ACTION EXECUTOR ---
async function executeAction(complaint, rule) {
    const log = {
        ruleId: rule.id,
        ruleName: rule.name,
        complaintId: complaint._id,
        complaintTitle: complaint.title,
        action: rule.action
    };

    try {
        if (rule.action === 'change_status') {
            await Complaint.findByIdAndUpdate(complaint._id, {
                status: rule.actionValue,
                updatedAt: new Date(),
                $push: {
                    statusHistory: {
                        status: rule.actionValue,
                        changedAt: new Date(),
                        note: `Auto-updated by rule: ${rule.name}`,
                        // @ts-ignore
                        isAutomated: true
                    }
                }
            });
            await createNotification(
                complaint.user,
                complaint._id,
                'status_update',
                `🤖 Auto: Your complaint "${complaint.title.substring(0, 50)}" status changed to ${rule.actionValue}`
            );
            log.result = `Status changed to ${rule.actionValue}`;
        }

        else if (rule.action === 'submit_to_gov') {
            const existing = await GovTicket.findOne({ complaint: complaint._id });
            if (!existing) {
                const ticketId = 'GR' + new Date().getFullYear() + Math.floor(Math.random() * 900000 + 100000);
                await GovTicket.create({
                    complaint: complaint._id,
                    user: complaint.user,
                    portal: rule.actionValue,
                    portalName: 'CPGRAMS Auto',
                    ticketId,
                    ticketUrl: 'https://pgportal.gov.in/Home/GrievanceStatus',
                    currentStatus: 'Submitted',
                    statusHistory: [{ status: 'Submitted', details: 'Auto-submitted by Janta Voice Automation', isAutoUpdate: true }]
                });

                // As per prompt, updating complaint.govTicketId - note: our schema doesn't have govTicketId explicitly but we can just add a history note or update if schema allows.
                await Complaint.findByIdAndUpdate(complaint._id, {
                    $push: { statusHistory: { status: complaint.status, note: `Auto-submitted to Gov Portal. Ticket ID: ${ticketId}` } }
                });

                await createNotification(
                    complaint.user,
                    complaint._id,
                    'status_update', // using status_update as gov_submission isn't in notification enum by default
                    `🏛️ Auto: Your complaint was submitted to CPGRAMS. Ticket ID: ${ticketId}`
                );
                log.result = `Submitted to gov portal. Ticket: ${ticketId}`;
            } else {
                log.result = 'Already submitted to a gov portal';
            }
        }

        else if (rule.action === 'send_notification') {
            await createNotification(
                complaint.user,
                complaint._id,
                'status_update', // using status_update as automation isn't in notification enum
                `🤖 ${rule.actionValue}`
            );
            log.result = 'Notification sent';
        }

        else if (rule.action === 'generate_letter') {
            if (!complaint.formalLetter) {
                const letterText = await generateLetterWithAI(complaint);
                const refNumber = 'JV/' + new Date().getFullYear() + '/' + Math.floor(Math.random() * 90000 + 10000);
                await Complaint.findByIdAndUpdate(complaint._id, {
                    formalLetter: letterText,
                    referenceNumber: refNumber
                });
                await createNotification(
                    complaint.user,
                    complaint._id,
                    'status_update',
                    `📄 Auto: Formal complaint letter generated. Ref: ${refNumber}`
                );
                log.result = `Letter generated. Ref: ${refNumber}`;
            } else {
                log.result = 'Letter already exists';
            }
        }

        else if (rule.action === 'ai_response') {
            const aiMsg = await generateAIStatusMessage(complaint);
            await createNotification(
                complaint.user,
                complaint._id,
                'status_update',
                `🤖 ${aiMsg}`
            );
            log.result = 'AI message sent';
        }

        await AutomationLog.create({ ...log, success: true });

    } catch (err) {
        await AutomationLog.create({ ...log, success: false, result: err.message });
    }
}

// --- MAIN ENGINE ---
async function runEngineOnce() {
    console.log('🤖 Automation engine running...');
    const rules = await AutomationRule.find({ isActive: true });
    let totalActions = 0;

    for (const rule of rules) {
        try {
            let complaints = [];

            if (rule.trigger === 'time_elapsed') {
                const cutoff = new Date(Date.now() - rule.triggerValue * 60 * 60 * 1000);
                complaints = await Complaint.find({
                    ...rule.condition,
                    updatedAt: { $lt: cutoff }
                }).limit(20);
            }

            else if (rule.trigger === 'likes_threshold') {
                // Fallback approach as $where with size isn't always efficient/supported exactly like this in simple queries
                const all = await Complaint.find(rule.condition).limit(100);
                complaints = [];
                for (const c of all) {
                    const hasGov = await GovTicket.exists({ complaint: c._id });
                    if (c.likes.length >= rule.triggerValue && !hasGov) complaints.push(c);
                }
            }

            else if (rule.trigger === 'no_update') {
                const cutoff = new Date(Date.now() - rule.triggerValue * 60 * 60 * 1000);
                complaints = await Complaint.find({
                    ...rule.condition,
                    updatedAt: { $lt: cutoff }
                }).limit(20);
            }

            else if (rule.trigger === 'on_create') {
                // handled separately in complaint creation flow, skip here
                continue;
            }

            for (const complaint of complaints) {
                await executeAction(complaint, rule);
                totalActions++;
                await new Promise(r => setTimeout(r, 300)); // throttle
            }

            if (complaints.length > 0) {
                await AutomationRule.findByIdAndUpdate(rule._id, {
                    $inc: { runCount: 1 },
                    lastRun: new Date()
                });
            }

        } catch (err) {
            console.error('Rule failed:', rule.name, err.message);
        }
    }

    console.log(`🤖 Engine done: ${totalActions} actions taken`);
    return totalActions;
}

// --- SYNC ENGINE (ON_CREATE) ---
async function triggerOnCreateRules(complaint) {
    try {
        const rules = await AutomationRule.find({ trigger: 'on_create', isActive: true });
        for (const rule of rules) {
            const conditionMatch = Object.entries(rule.condition).every(([key, val]) => {
                if (Array.isArray(val)) return val.includes(complaint[key]);
                return complaint[key] === val;
            });
            if (conditionMatch) {
                await executeAction(complaint, rule);
            }
        }
    } catch (e) {
        console.error('Trigger onCreate failed:', e);
    }
}

// --- EXPORTED COMMAND ---
function startAutomationEngine() {
    initDefaultRules();
    // Run every 30 minutes
    cron.schedule('*/30 * * * *', runEngineOnce);
    // Also run once immediately on start (after 10 second delay)
    setTimeout(runEngineOnce, 10000);
    console.log('🤖 Automation engine started — runs every 30 minutes');
}

// --- CONTROLLER ROUTES ---
const getRules = async (req, res, next) => {
    try {
        const rules = await AutomationRule.find().sort({ id: 1 });
        res.json({ success: true, rules });
    } catch (err) { next(err); }
};

const toggleRule = async (req, res, next) => {
    try {
        const rule = await AutomationRule.findById(req.params.id);
        if (!rule) return res.status(404).json({ success: false, message: 'Rule not found' });
        rule.isActive = !rule.isActive;
        await rule.save();
        res.json({ success: true, rule });
    } catch (err) { next(err); }
};

const getLogs = async (req, res, next) => {
    try {
        const logs = await AutomationLog.find().sort({ timestamp: -1 }).limit(50).populate('complaintId', 'title');
        res.json({ success: true, logs });
    } catch (err) { next(err); }
};

const manualRun = async (req, res, next) => {
    try {
        const count = await runEngineOnce();
        res.json({ success: true, message: `Engine run complete. Actions taken: ${count}`, actionsCount: count });
    } catch (err) { next(err); }
};

module.exports = {
    startAutomationEngine,
    triggerOnCreateRules,
    getRules,
    toggleRule,
    getLogs,
    manualRun,
    AutomationRule,
    AutomationLog
};
