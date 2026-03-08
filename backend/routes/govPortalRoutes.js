const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/govPortalController');

const authModule = require('../middleware/auth');
const protect = authModule.protect || authModule.authenticate || authModule.verifyToken || ((req, res, next) => next());

router.post('/submit/:id', protect, ctrl.submitToPortal);
router.get('/status/:id', protect, ctrl.checkStatus);
router.get('/my-tickets', protect, ctrl.getMyTickets);
router.post('/track-manual', protect, ctrl.trackManual);

module.exports = router;
