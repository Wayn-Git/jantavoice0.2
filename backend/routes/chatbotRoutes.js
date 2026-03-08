const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/chatbotController');

// No auth on chatbot — anyone can use it
router.post('/chat', ctrl.chat);

module.exports = router;
