const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

// 1. Master Summary
router.get('/summary', analyticsController.getSummary);

// 2. Temperature Analytics
router.get('/temperature/stats', analyticsController.getTemperatureStats);
router.get('/temperature/trend', analyticsController.getTemperatureTrend);
router.get('/temperature/by-area', analyticsController.getTemperatureByArea);
router.get('/temperature/by-land-use', analyticsController.getTemperatureByLandUse);

// 3. Environmental Analytics
router.get('/environment/summary', analyticsController.getEnvironmentSummary);
router.get('/environment/trends', analyticsController.getEnvironmentTrends);
router.get('/environment/relationships', analyticsController.getEnvironmentRelationships);

// 4. Human Activity Analytics
router.get('/human-activity/summary', analyticsController.getHumanActivitySummary);
router.get('/human-activity/relationships', analyticsController.getHumanActivityRelationships);
router.get('/human-activity/by-area', analyticsController.getTrafficByArea);

// 5. Correlation Engine
router.get('/correlations', analyticsController.getCorrelations);
router.get('/correlation-matrix', analyticsController.getCorrelationMatrix);

// 6. Temporal & Spatial Patterns
router.get('/monthly', analyticsController.getMonthly);
router.get('/seasonal', analyticsController.getSeasonal);
router.get('/zones', analyticsController.getZones);

// 7. Comparison, Outliers, Coverage & Rule-Based Insights
router.get('/compare', analyticsController.compare);
router.get('/outliers', analyticsController.getOutliers);
router.get('/coverage', analyticsController.getCoverage);
router.get('/insights', analyticsController.getInsights);

module.exports = router;
