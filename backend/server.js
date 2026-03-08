require('dotenv').config();
const { checkAPIKeys } = require('./utils/apiKeyChecker');
checkAPIKeys();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const mongoSanitize = require('express-mongo-sanitize');

const connectDB = require('./config/db');
const { general } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const govPortalRoutes = require('./routes/govPortalRoutes');
const automationRoutes = require('./routes/automationRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');

const app = express();

// Connect DB
connectDB();

// Security
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(mongoSanitize());

// CORS
app.use(cors({
  origin: [process.env.FRONTEND_URL || 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

// Rate limiting
app.use(general);

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads/audio', express.static(path.join(__dirname, 'uploads/audio')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date(), env: process.env.NODE_ENV });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/gov', govPortalRoutes);
app.use('/api/automation', automationRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/calls', require('./routes/callRoutes'));
app.use('/api/aqi', require('./routes/aqiRoutes'));

// 404
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

async function startServer() {
  // Start ngrok FIRST (so PUBLIC_URL is ready before anything else)
  const { startNgrok } = require('./services/ngrokService');
  await startNgrok(PORT);

  app.listen(PORT, () => {
    // Serve uploaded audio files
    app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

    // Check API keys
    try {
      const { checkAPIKeys } = require('./utils/apiKeyChecker');
      checkAPIKeys();
    } catch (e) { /* skip if not found */ }

    // Start background services
    try {
      if (process.env.AUTO_CHECK_ENABLED === 'true') {
        const { startAutomationEngine } = require('./controllers/automationController');
        const { startGovCheckCron } = require('./controllers/govPortalController');
        const { startEscalationChecker } = require('./services/escalationService');
        const { startStatusChecker } = require('./jobs/statusChecker');
        startAutomationEngine();
        startGovCheckCron();
        startEscalationChecker();
        startStatusChecker();
      }
    } catch (e) { console.error('Background services error:', e.message); }

    const ngrokUrl = process.env.PUBLIC_URL || 'http://localhost:' + PORT;

    console.log('\n╔══════════════════════════════════════════╗');
    console.log('║   🇮🇳  JANTA VOICE SERVER v3.0            ║');
    console.log('╠══════════════════════════════════════════╣');
    console.log(`║  🚀 Local:   http://localhost:${PORT}        ║`);
    console.log(`║  🚇 Public:  ${ngrokUrl.substring(0, 38)}  ║`);
    console.log(`║  📞 Twilio webhook ready at /api/calls   ║`);
    console.log('╚══════════════════════════════════════════╝\n');
  });
}

startServer().catch(err => {
  console.error('Server startup failed:', err.message);
  process.exit(1);
});

module.exports = app;
