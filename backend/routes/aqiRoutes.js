const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/aqiController');

router.get('/', ctrl.getAQI);
router.get('/city', ctrl.getAQIByCity);
router.get('/cities', ctrl.getMajorCities);
router.get('/forecast', ctrl.getForecast);

module.exports = router;
