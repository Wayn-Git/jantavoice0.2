async function runChecks() {
    console.log("=== CHECK 1 ===");
    const deps = [
        'express', 'mongoose', 'dotenv', 'bcryptjs', 'jsonwebtoken',
        'multer', 'cors', 'morgan', 'groq-sdk', 'axios', 'node-cron',
        'pdfkit', 'twilio', 'ngrok', 'uuid', 'express-rate-limit'
    ];
    deps.forEach(d => {
        try { require(d); console.log('✅', d); }
        catch (e) { console.log('❌ MISSING:', d); }
    });

    console.log("=== CHECK 2 ===");
    require('dotenv').config();
    const required = ['MONGODB_URI', 'JWT_SECRET', 'GROQ_API_KEY', 'PORT'];
    const optional = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER', 'ELEVENLABS_API_KEY', 'DEEPGRAM_API_KEY', 'OPENWEATHER_API_KEY', 'NGROK_AUTH_TOKEN', 'PUBLIC_URL', 'AUTO_CHECK_ENABLED'];
    console.log('--- REQUIRED ---');
    required.forEach(k => console.log(process.env[k] ? '✅ ' + k : '❌ MISSING: ' + k));
    console.log('--- OPTIONAL (for full features) ---');
    optional.forEach(k => console.log(process.env[k] && !process.env[k].includes('your_') ? '✅ ' + k : '⚠️  NOT SET: ' + k));

    console.log("=== CHECK 3 ===");
    const mongoose = require('mongoose');
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB connected');
        await mongoose.disconnect();
    } catch (e) { console.log('❌ MongoDB FAILED:', e.message); }

    console.log("=== CHECK 4 ===");
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const models = ['User', 'Complaint', 'Notification', 'GovTicket', 'AutomationRule', 'AutomationLog', 'CallLog'];
        models.forEach(m => {
            try { require('./models/' + m); console.log('✅ Model:', m); }
            catch (e) { console.log('❌ Model FAILED:', m, '|', e.message); }
        });
        await mongoose.disconnect();
    } catch (e) { console.log('❌ DB connect failed:', e.message); }

    console.log("=== CHECK 5 ===");
    const services = ['./services/groqService', './services/twilioService', './services/elevenLabsService', './services/deepgramService', './services/ngrokService', './services/escalationService'];
    services.forEach(s => {
        try { const mod = require(s); console.log('✅', s, '| exports:', Object.keys(mod).join(', ')); }
        catch (e) { console.log('❌ FAILED:', s, '|', e.message); }
    });

    console.log("=== CHECK 6 ===");
    const ctrls = ['authController', 'complaintController', 'govPortalController', 'automationController', 'callController', 'chatbotController', 'aqiController'];
    ctrls.forEach(c => {
        try { const mod = require('./controllers/' + c); console.log('✅', c, '| functions:', Object.keys(mod).join(', ')); }
        catch (e) { console.log('❌ FAILED:', c, '|', e.message); }
    });

    console.log("=== CHECK 7 ===");
    const routes = ['authRoutes', 'complaintRoutes', 'govPortalRoutes', 'automationRoutes', 'callRoutes', 'chatbotRoutes', 'aqiRoutes'];
    routes.forEach(r => {
        try { require('./routes/' + r); console.log('✅ Route:', r); }
        catch (e) { console.log('❌ Route FAILED:', r, '|', e.message); }
    });

    console.log("=== CHECK 8 ===");
    try {
        const { analyzeComplaint } = require('./services/groqService');
        const r = await analyzeComplaint('Broken street light near Gandhi Chowk Pune');
        console.log('✅ Groq AI works | category:', r?.category, '| priority:', r?.priority);
    } catch (e) { console.log('❌ Groq AI FAILED:', e.message); }

    console.log("=== CHECK 9 ===");
    try {
        const ctrl = require('./controllers/aqiController');
        const mockReq = { query: { lat: '18.5204', lon: '73.8567' } };
        const mockRes = { json: (d) => console.log('✅ AQI works:', JSON.stringify(d).substring(0, 120)), status: (c) => ({ json: (d) => console.log('❌ AQI status ' + c + ':', d.message) }) };
        await ctrl.getAQI(mockReq, mockRes);
    } catch (e) { console.log('❌ AQI FAILED:', e.message); }

    console.log("=== CHECK 10 ===");
    process.env.NODE_ENV = 'test';
    try {
        const app = require('./server');
        console.log('✅ server.js loads without crash');
    } catch (e) {
        console.log('❌ server.js CRASHED:', e.message);
    }
    setTimeout(() => process.exit(0), 2000);
}
runChecks();
