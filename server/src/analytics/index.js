const EnvironmentalRecord = require('../models/EnvironmentalRecord');
const Area = require('../models/Area');
const { normalizeAnalyticsFilters } = require('./utils/filterNormalizer');
const temperatureAnalytics = require('./temperature/temperatureAnalytics');
const environmentAnalytics = require('./environment/environmentAnalytics');
const humanActivityAnalytics = require('./humanActivity/humanActivityAnalytics');
const correlationEngine = require('./correlation/correlationEngine');
const trendAnalytics = require('./trends/trendAnalytics');
const zoneAnalytics = require('./zones/zoneAnalytics');
const areaComparison = require('./compare/areaComparison');
const outlierDetector = require('./outliers/outlierDetector');
const coverageAudit = require('./coverage/coverageAudit');
const insightEngine = require('./insights/insightEngine');
const recommendationEngine = require('./recommendations/recommendationEngine');

/**
 * High-level Analytics Summary encompassing core environmental and human activity KPIs.
 */
const getAnalyticsSummary = async (filters = {}) => {
  const matchStage = normalizeAnalyticsFilters(filters);

  const [kpiAgg, totalAreas] = await Promise.all([
    EnvironmentalRecord.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          avgTemperature: { $avg: '$temperature' },
          minTemperature: { $min: '$temperature' },
          maxTemperature: { $max: '$temperature' },
          avgHumidity: { $avg: '$humidity' },
          avgRainfall: { $avg: '$rainfall' },
          avgTraffic: { $avg: '$traffic' },
          avgVegetation: { $avg: '$vegetation' },
          avgBuildingDensity: { $avg: '$buildingDensity' },
          avgPopulationDensity: { $avg: '$populationDensity' },
          totalObservations: { $sum: 1 },
          highHeatCount: { $sum: { $cond: [{ $gte: ['$temperature', 38] }, 1, 0] } },
        },
      },
    ]),
    Area.countDocuments(filters.city && filters.city !== 'all' ? { city: new RegExp(filters.city, 'i') } : {}),
  ]);

  const kpis = kpiAgg[0] || {
    avgTemperature: 0,
    minTemperature: 0,
    maxTemperature: 0,
    avgHumidity: 0,
    avgRainfall: 0,
    avgTraffic: 0,
    avgVegetation: 0,
    avgBuildingDensity: 0,
    avgPopulationDensity: 0,
    totalObservations: 0,
    highHeatCount: 0,
  };

  return {
    summary: {
      averageTemperature: Number((kpis.avgTemperature || 0).toFixed(1)),
      minimumTemperature: Number((kpis.minTemperature || 0).toFixed(1)),
      maximumTemperature: Number((kpis.maxTemperature || 0).toFixed(1)),
      averageHumidity: Number((kpis.avgHumidity || 0).toFixed(1)),
      averageRainfall: Number((kpis.avgRainfall || 0).toFixed(1)),
      averageTraffic: Number((kpis.avgTraffic || 0).toFixed(0)),
      averageVegetation: Number((kpis.avgVegetation || 0).toFixed(1)),
      averageBuildingDensity: Number((kpis.avgBuildingDensity || 0).toFixed(1)),
      averagePopulationDensity: Number((kpis.avgPopulationDensity || 0).toFixed(0)),
      numberOfAreas: totalAreas,
      numberOfObservations: kpis.totalObservations,
      highHeatObservations: kpis.highHeatCount,
    },
    meta: {
      isDatabaseBacked: true,
      appliedFilters: filters,
      disclaimer: 'This environment currently uses generated demonstration records. Real-world datasets will be integrated in a later phase.',
    },
  };
};

module.exports = {
  getAnalyticsSummary,
  ...temperatureAnalytics,
  ...environmentAnalytics,
  ...humanActivityAnalytics,
  ...correlationEngine,
  ...trendAnalytics,
  ...zoneAnalytics,
  ...areaComparison,
  ...outlierDetector,
  ...coverageAudit,
  ...insightEngine,
  ...recommendationEngine,
};

