const dashboardService = require('../services/dashboardService');
const { successResponse } = require('../utils/response');

const getSummary = async (req, res, next) => {
  try {
    const summary = await dashboardService.getSummaryMetrics(req.query);
    return successResponse(res, summary, 'Dashboard summary retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getTemperatureTrend = async (req, res, next) => {
  try {
    const trend = await dashboardService.getTemperatureTrend(req.query);
    return successResponse(res, trend, 'Temperature trend retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getTemperatureByArea = async (req, res, next) => {
  try {
    const areas = await dashboardService.getTemperatureByArea(req.query);
    return successResponse(res, areas, 'Temperature by area retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getLandUseSummary = async (req, res, next) => {
  try {
    const landUse = await dashboardService.getLandUseSummary(req.query);
    return successResponse(res, landUse, 'Land use summary retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getEnvironmentSummary = async (req, res, next) => {
  try {
    const envSummary = await dashboardService.getEnvironmentSummary(req.query);
    return successResponse(res, envSummary, 'Environmental summary retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getOverview = async (req, res, next) => {
  try {
    const overview = await dashboardService.getDashboardOverview(req.query);
    return successResponse(res, overview, 'Dashboard overview retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSummary,
  getTemperatureTrend,
  getTemperatureByArea,
  getLandUseSummary,
  getEnvironmentSummary,
  getOverview,
};
