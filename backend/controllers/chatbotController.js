const { groq } = require('../config/groq');

const chat = async (req, res) => {
    try {
        const { message, conversationHistory = [], userId } = req.body;

        if (!message) {
            return res.status(400).json({ success: false, message: 'Message is required' });
        }

        const systemPrompt = `You are JantaBot, the helpful AI assistant for Janta Voice — 
India's civic complaint management platform.

You help Indian citizens with:
1. Filing complaints (guide them step by step)
2. Tracking complaint status
3. Understanding government portals (CPGRAMS, Aaple Sarkar, Swachhata)
4. Generating formal complaint letters
5. Explaining their rights as citizens
6. Escalating urgent complaints

Rules:
- Always respond in the same language the user writes in (Hindi, English, or Hinglish)
- Be warm, helpful, and empathetic — you are talking to regular Indian citizens
- Keep responses concise — 2-4 sentences max unless explaining a process
- If user wants to file a complaint: ask for the issue and location, then say "I'll help you file this — click the orange Report button or say 'file now'"
- If user asks about status: ask for their complaint ID or title
- If user says something like "pothole near my house" or describes an issue: offer to file it for them
- Always end with a helpful follow-up question or action suggestion
- Never make up specific government contact details
- Use emojis naturally

Platform facts:
- Complaints are auto-submitted to CPGRAMS after filing
- Automation engine runs every 30 minutes
- Formal letters can be generated with AI
- Gov portal status is checked every 4 hours`;

        const response = await groq.chat.completions.create({
            model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
            messages: [
                { role: 'system', content: systemPrompt },
                ...conversationHistory.slice(-10), // last 10 messages for context
                { role: 'user', content: message }
            ],
            max_tokens: 300,
            temperature: 0.7
        });

        const reply = response.choices[0].message.content;

        // SPECIAL INTENT DETECTION
        const msgLower = message.toLowerCase();
        let action = null;

        if (msgLower.includes('file') || msgLower.includes('report') || msgLower.includes('complaint about') || msgLower.includes('problem with')) {
            action = { type: 'open_report', label: '📢 File This Complaint' };
        } else if (msgLower.includes('track') || msgLower.includes('status') || msgLower.includes('where is my') || msgLower.includes('update')) {
            action = { type: 'open_tracker', label: '🔍 Track My Complaint' };
        } else if (msgLower.includes('letter') || msgLower.includes('formal') || msgLower.includes('official')) {
            action = { type: 'open_letter', label: '📄 Generate Letter' };
        } else if (msgLower.includes('government') || msgLower.includes('portal') || msgLower.includes('cpgrams') || msgLower.includes('submit')) {
            action = { type: 'open_gov', label: '🏛️ Open Gov Tracker' };
        }

        res.json({
            success: true,
            reply,
            timestamp: new Date(),
            action
        });

    } catch (error) {
        console.error('Chatbot error:', error);
        res.status(500).json({ success: false, message: 'Chatbot failed to respond' });
    }
};

module.exports = {
    chat
};
