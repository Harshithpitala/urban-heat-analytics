const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendationController');

// GET /api/recommendations/summary
router.get('/summary', recommendationController.getRecommendationsSummary);

// GET /api/recommendations/:id
router.get('/:id', recommendationController.getRecommendationById);

// GET /api/recommendations
router.get('/', recommendationController.getRecommendations);

module.exports = router;
