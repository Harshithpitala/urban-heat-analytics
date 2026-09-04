const express = require('express');
const router = express.Router();
const insightController = require('../controllers/insightController');

// GET /api/insights/summary
router.get('/summary', insightController.getInsightsSummary);

// POST /api/insights/refresh
router.post('/refresh', insightController.refreshInsights);

// GET /api/insights/:id
router.get('/:id', insightController.getInsightById);

// GET /api/insights
router.get('/', insightController.getInsights);

module.exports = router;
