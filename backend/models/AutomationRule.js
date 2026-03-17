const mongoose = require('mongoose');

const automationRuleSchema = new mongoose.Schema({
    ruleId: { type: String, unique: true },
    name: { type: String, required: true },
    description: String,
    trigger: { 
        type: String, 
        enum: ['time_elapsed', 'likes_threshold', 'gov_status_change', 'priority_level', 'no_update', 'on_create', 'status_change'] 
    },
    triggerValue: mongoose.Schema.Types.Mixed,
    condition: { type: mongoose.Schema.Types.Mixed, default: {} },
    action: { 
        type: String, 
        enum: ['change_status', 'send_notification', 'escalate_priority', 'submit_to_gov', 'generate_letter', 'send_email', 'ai_response'] 
    },
    actionValue: mongoose.Schema.Types.Mixed,
    isActive: { type: Boolean, default: true },
    runCount: { type: Number, default: 0 },
    lastRun: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('AutomationRule', automationRuleSchema);
