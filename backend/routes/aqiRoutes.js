const router = require('express').Router();
const ctrl = require('../controllers/aqiController');
router.get('/', ctrl.getAQI);
module.exports = router;
