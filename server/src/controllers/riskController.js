const heriService = require('../analytics/risk/heriService');
const { successResponse, errorResponse } = require('../utils/response');

const getSummary = async (req, res, next) => {
  try {
    const data = await heriService.getRiskSummary(req.query);
    return res.status(200).json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

const getRanking = async (req, res, next) => {
  try {
    const data = await heriService.getRiskRankings(req.query, req.query);
    return res.status(200).json({
      success: true,
      data: data.rankings,
      meta: {
        totalCount: data.totalCount,
        weightsUsed: data.weightsUsed,
        methodVersion: data.methodVersion,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

const getAreaRisk = async (req, res, next) => {
  try {
    const { areaId } = req.params;
    const data = await heriService.getAreaRiskDetails(areaId, req.query);
    return successResponse(res, data, 'Area risk details calculated');
  } catch (error) {
    next(error);
  }
};

const getAreaRiskHistory = async (req, res, next) => {
  try {
    const { areaId } = req.params;
    const data = await heriService.getAreaRiskHistory(areaId);
    return successResponse(res, data, 'Area risk history calculated');
  } catch (error) {
    next(error);
  }
};

const getComparison = async (req, res, next) => {
  try {
    const data = await heriService.getHotspotVsHERIComparison(req.query);
    return successResponse(res, data, 'Hotspot vs HERI comparison coordinates');
  } catch (error) {
    next(error);
  }
};

const getHighExposure = async (req, res, next) => {
  try {
    const data = await heriService.getHighHeatHighPopulation(req.query);
    return successResponse(res, data, 'High Heat / High Population areas retrieved');
  } catch (error) {
    next(error);
  }
};

const getMethodology = (req, res) => {
  const data = heriService.getHERIMethodology();
  return successResponse(res, data, 'HERI methodology specification');
};

const getConfig = (req, res) => {
  const methodology = heriService.getHERIMethodology();
  return successResponse(
    res,
    {
      activeWeights: methodology.activeWeights,
      defaultWeights: methodology.defaultWeights,
      version: methodology.version,
    },
    'HERI active weight configuration'
  );
};

const updateConfig = (req, res) => {
  try {
    const { weights } = req.body;
    if (!weights) {
      return errorResponse(res, 'weights object is required in request body', 400);
    }
    const result = heriService.updateActiveWeights(weights);
    return successResponse(res, result, 'HERI configuration weights updated successfully');
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
};

const resetConfig = (req, res) => {
  const result = heriService.resetWeightsToDefault();
  return successResponse(res, result, 'HERI configuration reset to project defaults');
};

module.exports = {
  getSummary,
  getRanking,
  getAreaRisk,
  getAreaRiskHistory,
  getComparison,
  getHighExposure,
  getMethodology,
  getConfig,
  updateConfig,
  resetConfig,
};
