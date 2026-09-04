const analytics = require('../analytics');
const { successResponse, errorResponse } = require('../utils/response');

const getSummary = async (req, res, next) => {
  try {
    const data = await analytics.getAnalyticsSummary(req.query);
    return res.status(200).json({
      success: true,
      data: data.summary,
      meta: data.meta,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

const getTemperatureStats = async (req, res, next) => {
  try {
    const data = await analytics.getTemperatureSummary(req.query);
    return successResponse(res, data, 'Temperature statistics calculated');
  } catch (error) {
    next(error);
  }
};

const getTemperatureTrend = async (req, res, next) => {
  try {
    const { interval = 'daily' } = req.query;
    const data = await analytics.getTemperatureTrend(req.query, interval);
    return successResponse(res, data, 'Temperature trend calculated');
  } catch (error) {
    next(error);
  }
};

const getTemperatureByArea = async (req, res, next) => {
  try {
    const data = await analytics.getTemperatureByArea(req.query);
    return successResponse(res, data, 'Temperature by area calculated');
  } catch (error) {
    next(error);
  }
};

const getTemperatureByLandUse = async (req, res, next) => {
  try {
    const data = await analytics.getTemperatureByLandUse(req.query);
    return successResponse(res, data, 'Temperature by land-use calculated');
  } catch (error) {
    next(error);
  }
};

const getEnvironmentSummary = async (req, res, next) => {
  try {
    const data = await analytics.getEnvironmentSummary(req.query);
    return successResponse(res, data, 'Environmental summary calculated');
  } catch (error) {
    next(error);
  }
};

const getEnvironmentTrends = async (req, res, next) => {
  try {
    const data = await analytics.getEnvironmentTrends(req.query);
    return successResponse(res, data, 'Environmental trends calculated');
  } catch (error) {
    next(error);
  }
};

const getEnvironmentRelationships = async (req, res, next) => {
  try {
    const data = await analytics.getEnvironmentRelationships(req.query);
    return successResponse(res, data, 'Environmental relationships calculated');
  } catch (error) {
    next(error);
  }
};

const getHumanActivitySummary = async (req, res, next) => {
  try {
    const data = await analytics.getHumanActivitySummary(req.query);
    return successResponse(res, data, 'Human activity summary calculated');
  } catch (error) {
    next(error);
  }
};

const getHumanActivityRelationships = async (req, res, next) => {
  try {
    const data = await analytics.getHumanActivityRelationships(req.query);
    return successResponse(res, data, 'Human activity relationships calculated');
  } catch (error) {
    next(error);
  }
};

const getTrafficByArea = async (req, res, next) => {
  try {
    const data = await analytics.getTrafficByArea(req.query);
    return successResponse(res, data, 'Traffic by area calculated');
  } catch (error) {
    next(error);
  }
};

const getCorrelations = async (req, res, next) => {
  try {
    const { target = 'temperature' } = req.query;
    const data = await analytics.getVariableCorrelations(req.query, target);
    return successResponse(res, data, 'Correlations calculated');
  } catch (error) {
    next(error);
  }
};

const getCorrelationMatrix = async (req, res, next) => {
  try {
    const data = await analytics.getCorrelationMatrix(req.query);
    return successResponse(res, data, 'Correlation matrix calculated');
  } catch (error) {
    next(error);
  }
};

const getMonthly = async (req, res, next) => {
  try {
    const data = await analytics.getMonthlyAnalytics(req.query);
    return successResponse(res, data, 'Monthly analytics calculated');
  } catch (error) {
    next(error);
  }
};

const getSeasonal = async (req, res, next) => {
  try {
    const data = await analytics.getSeasonalAnalytics(req.query);
    return successResponse(res, data, 'Seasonal analytics calculated');
  } catch (error) {
    next(error);
  }
};

const getZones = async (req, res, next) => {
  try {
    const data = await analytics.getZoneSummary(req.query);
    return successResponse(res, data, 'Zone analytics calculated');
  } catch (error) {
    next(error);
  }
};

const compare = async (req, res, next) => {
  try {
    const { areas } = req.query;
    if (!areas) {
      return errorResponse(res, 'Please provide areas query parameter (e.g. ?areas=id1,id2)', 400);
    }
    const data = await analytics.compareAreas(areas);
    return successResponse(res, data, 'Area comparison benchmark calculated');
  } catch (error) {
    next(error);
  }
};

const getOutliers = async (req, res, next) => {
  try {
    const data = await analytics.detectTemperatureOutliers(req.query);
    return successResponse(res, data, 'Statistical temperature outliers calculated');
  } catch (error) {
    next(error);
  }
};

const getCoverage = async (req, res, next) => {
  try {
    const data = await analytics.getDataCoverage(req.query);
    return successResponse(res, data, 'Data coverage audit calculated');
  } catch (error) {
    next(error);
  }
};

const getInsights = async (req, res, next) => {
  try {
    const data = await analytics.generateRuleBasedInsights(req.query);
    return successResponse(res, data, 'Rule-based analytics insights synthesized');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSummary,
  getTemperatureStats,
  getTemperatureTrend,
  getTemperatureByArea,
  getTemperatureByLandUse,
  getEnvironmentSummary,
  getEnvironmentTrends,
  getEnvironmentRelationships,
  getHumanActivitySummary,
  getHumanActivityRelationships,
  getTrafficByArea,
  getCorrelations,
  getCorrelationMatrix,
  getMonthly,
  getSeasonal,
  getZones,
  compare,
  getOutliers,
  getCoverage,
  getInsights,
};
