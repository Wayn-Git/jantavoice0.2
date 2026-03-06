const router = require('express').Router();
const ctrl = require('../controllers/callController');
const { protect, adminOnly } = require('../middleware/auth');
router.post('/:id/initiate', protect, adminOnly, ctrl.initiateCall);
router.get('/:id', protect, ctrl.getLog);
module.exports = router;
