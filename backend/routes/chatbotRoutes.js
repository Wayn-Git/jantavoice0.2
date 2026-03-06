const router = require('express').Router();
const ctrl = require('../controllers/chatbotController');
router.post('/chat', ctrl.chat);
module.exports = router;
