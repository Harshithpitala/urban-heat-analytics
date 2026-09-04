const express = require('express');
const router = express.Router();
const hotspotController = require('../controllers/hotspotController');

router.get('/summary', hotspotController.getSummary);
router.get('/ranking', hotspotController.getRankings);
router.get('/rankings', hotspotController.getRankings);
router.get('/persistence', hotspotController.getPersistence);
router.get('/recent', hotspotController.getRecent);
router.get('/methodology', hotspotController.getMethodology);
router.get('/:areaId', hotspotController.getDetails);

module.exports = router;
