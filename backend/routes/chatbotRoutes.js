const express = require('express');
const router = express.Router();
const { chat } = require('../controllers/chatbotController');

// Open route for chatbot
router.post('/chat', chat);

module.exports = router;
