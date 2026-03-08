const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/automationController');

const authModule = require('../middleware/auth');
const protect = authModule.protect || authModule.authenticate || authModule.verifyToken || ((req, res, next) => next());
const adminOnly = authModule.adminOnly || authModule.isAdmin || authModule.admin || ((req, res, next) => next());

router.get('/rules', protect, adminOnly, ctrl.getRules);
router.put('/rules/:id', protect, adminOnly, ctrl.toggleRule);
router.get('/logs', protect, adminOnly, ctrl.getLogs);
router.post('/run-now', protect, adminOnly, ctrl.manualRun);

module.exports = router;
