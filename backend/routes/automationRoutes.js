const router = require('express').Router();
const ctrl = require('../controllers/automationController');
const { protect, adminOnly } = require('../middleware/auth');  // use your existing auth middleware names
router.get('/rules', protect, adminOnly, ctrl.getRules);
router.put('/rules/:id', protect, adminOnly, ctrl.toggleRule);
router.get('/logs', protect, adminOnly, ctrl.getLogs);
router.post('/run-now', protect, adminOnly, ctrl.manualRun);
module.exports = router;
