const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

router.get('/summary', dashboardController.getSummary);
router.get('/overview', dashboardController.getOverview);
router.get('/temperature-trend', dashboardController.getTemperatureTrend);
router.get('/temperature-by-area', dashboardController.getTemperatureByArea);
router.get('/land-use-summary', dashboardController.getLandUseSummary);
router.get('/environment-summary', dashboardController.getEnvironmentSummary);

module.exports = router;
