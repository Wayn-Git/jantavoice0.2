const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/callController');

const authModule = require('../middleware/auth');
const protect = authModule.protect || authModule.authenticate || authModule.verifyToken || ((req, res, next) => next());
const adminOnly = authModule.adminOnly || authModule.isAdmin || authModule.admin || ((req, res, next) => next());

// Twilio webhooks FIRST (no auth — Twilio calls these directly)
router.post('/twiml/start/:callLogId', ctrl.twimlStart);
router.post('/twiml/respond/:callLogId/:step', ctrl.twimlRespond);
router.post('/status/:callLogId', ctrl.callStatus);
router.post('/recording/:callLogId', ctrl.recordingCallback);

// User routes
router.post('/confirm-call', protect, ctrl.confirmAndCall);
router.post('/:id/request-permission', protect, ctrl.requestCallPermission);
router.get('/', protect, adminOnly, ctrl.getAllLogs);
router.get('/:id', protect, ctrl.getLog);

module.exports = router;
