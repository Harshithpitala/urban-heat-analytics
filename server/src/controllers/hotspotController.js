const hotspotService = require('../analytics/hotspots/hotspotService');
const { successResponse, errorResponse } = require('../utils/response');

const getSummary = async (req, res, next) => {
  try {
    const { percentile = 90 } = req.query;
    const data = await hotspotService.getHotspotSummary(req.query, percentile);
    return res.status(200).json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

const getRankings = async (req, res, next) => {
  try {
    const data = await hotspotService.getHotspotRankings(req.query, req.query);
    return res.status(200).json({
      success: true,
      data: data.rankings,
      meta: {
        threshold: data.threshold,
        percentile: data.percentile,
        totalCount: data.totalCount,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

const getDetails = async (req, res, next) => {
  try {
    const { areaId } = req.params;
    const { percentile = 90 } = req.query;
    const data = await hotspotService.getAreaHotspotDetails(areaId, req.query, percentile);
    return successResponse(res, data, 'Area hotspot details retrieved');
  } catch (error) {
    next(error);
  }
};

const getPersistence = async (req, res, next) => {
  try {
    const { percentile = 90 } = req.query;
    const { areas, threshold } = await hotspotService.getHotspotMetrics(req.query, { percentile });
    const persistenceList = areas.map((a) => ({
      areaId: a.areaId,
      area: a.area,
      observationCount: a.observationCount,
      highTempObservationCount: a.highTempObservationCount,
      hotspotFrequency: a.hotspotFrequency,
      type: a.type,
      severity: a.severity,
    }));
    return successResponse(res, { threshold, persistenceList }, 'Hotspot persistence data calculated');
  } catch (error) {
    next(error);
  }
};

const getRecent = async (req, res, next) => {
  try {
    const { percentile = 90 } = req.query;
    const { areas } = await hotspotService.getHotspotMetrics(req.query, { percentile });
    const recentComparison = areas.map((a) => ({
      areaId: a.areaId,
      area: a.area,
      recentAverageTemperature: a.recentAverageTemperature,
      historicalAverageTemperature: a.historicalAverageTemperature,
      recentTemperatureChange: a.recentTemperatureChange,
      type: a.type,
    }));
    return successResponse(res, recentComparison, 'Recent vs historical thermal change calculated');
  } catch (error) {
    next(error);
  }
};

const getMethodology = (req, res) => {
  const data = hotspotService.getHotspotMethodology();
  return successResponse(res, data, 'Hotspot methodology guidelines');
};

module.exports = {
  getSummary,
  getRankings,
  getDetails,
  getPersistence,
  getRecent,
  getMethodology,
};
