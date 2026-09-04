const express = require('express');
const router = express.Router();
const riskController = require('../controllers/riskController');

router.get('/summary', riskController.getSummary);
router.get('/ranking', riskController.getRanking);
router.get('/rankings', riskController.getRanking);
router.get('/comparison', riskController.getComparison);
router.get('/high-exposure', riskController.getHighExposure);
router.get('/methodology', riskController.getMethodology);
router.get('/config', riskController.getConfig);
router.put('/config', riskController.updateConfig);
router.post('/config/reset', riskController.resetConfig);
router.get('/:areaId', riskController.getAreaRisk);
router.get('/:areaId/history', riskController.getAreaRiskHistory);

module.exports = router;
