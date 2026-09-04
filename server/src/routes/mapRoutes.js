const express = require('express');
const router = express.Router();
const mapController = require('../controllers/mapController');

/**
 * Phase 7: Geospatial Intelligence Map REST Endpoints
 * Base path: /api/map
 */

router.get('/summary', mapController.getMapSummary);
router.get('/areas', mapController.getMapAreas);
router.get('/geojson', mapController.getMapGeoJson);

module.exports = router;
