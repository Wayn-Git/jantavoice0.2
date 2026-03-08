const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/callController');

// Find your actual auth middleware export names from middleware/auth.js
// and replace 'protect' and 'adminOnly' below with the correct names
const authMiddleware = require('../middleware/auth');
const protect = authMiddleware.protect || authMiddleware.authenticate || authMiddleware.verifyToken || authMiddleware;
const adminOnly = authMiddleware.adminOnly || authMiddleware.isAdmin || authMiddleware.admin || ((req, res, next) => next());

// ── User routes ──
router.post('/:id/request-permission', protect, ctrl.requestCallPermission);
router.post('/confirm-call', protect, ctrl.confirmAndCall);
router.get('/:id', protect, ctrl.getLog);

// ── Twilio webhooks (no auth — Twilio calls these) ──
router.post('/twiml/start/:callLogId', ctrl.twimlStart);
router.post('/twiml/respond/:callLogId/:step', ctrl.twimlRespond);
router.post('/status/:callLogId', ctrl.callStatus);
router.post('/recording/:callLogId', ctrl.recordingCallback);

// ── Admin ──
router.get('/', protect, adminOnly, ctrl.getAllLogs);

module.exports = router;
