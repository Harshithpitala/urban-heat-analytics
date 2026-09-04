const express = require('express');
const router = express.Router();

const healthRoutes = require('./healthRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const areaRoutes = require('./areaRoutes');
const environmentalDataRoutes = require('./environmentalDataRoutes');
const importRoutes = require('./importRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const hotspotRoutes = require('./hotspotRoutes');
const riskRoutes = require('./riskRoutes');
const mapRoutes = require('./mapRoutes');
const insightRoutes = require('./insightRoutes');
const recommendationRoutes = require('./recommendationRoutes');

router.use('/health', healthRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/areas', areaRoutes);
router.use('/data', environmentalDataRoutes);
router.use('/import', importRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/hotspots', hotspotRoutes);
router.use('/risk', riskRoutes);
router.use('/map', mapRoutes);
router.use('/insights', insightRoutes);
router.use('/recommendations', recommendationRoutes);

module.exports = router;

