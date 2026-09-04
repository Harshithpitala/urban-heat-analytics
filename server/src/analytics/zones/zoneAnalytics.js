const EnvironmentalRecord = require('../../models/EnvironmentalRecord');
const { normalizeAnalyticsFilters } = require('../utils/filterNormalizer');

/**
 * Groups environmental & activity metrics by municipal administrative zone.
 */
const getZoneSummary = async (filters = {}) => {
  const matchStage = normalizeAnalyticsFilters(filters);

  const pipeline = [
    { $match: matchStage },
    {
      $lookup: {
        from: 'areas',
        localField: 'area',
        foreignField: '_id',
        as: 'areaDoc',
      },
    },
    { $unwind: '$areaDoc' },
    {
      $group: {
        _id: { $ifNull: ['$areaDoc.zone', 'Central Zone'] },
        averageTemperature: { $avg: '$temperature' },
        minTemperature: { $min: '$temperature' },
        maxTemperature: { $max: '$temperature' },
        averageHumidity: { $avg: '$humidity' },
        averageRainfall: { $avg: '$rainfall' },
        averageTraffic: { $avg: '$traffic' },
        averageVegetation: { $avg: '$vegetation' },
        averagePopulationDensity: { $avg: '$populationDensity' },
        averageBuildingDensity: { $avg: '$buildingDensity' },
        observationCount: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        zone: '$_id',
        averageTemperature: { $round: ['$averageTemperature', 1] },
        minTemperature: { $round: ['$minTemperature', 1] },
        maxTemperature: { $round: ['$maxTemperature', 1] },
        averageHumidity: { $round: ['$averageHumidity', 1] },
        averageRainfall: { $round: ['$averageRainfall', 1] },
        averageTraffic: { $round: ['$averageTraffic', 0] },
        averageVegetation: { $round: ['$averageVegetation', 1] },
        averagePopulationDensity: { $round: ['$averagePopulationDensity', 0] },
        averageBuildingDensity: { $round: ['$averageBuildingDensity', 1] },
        observationCount: 1,
      },
    },
    { $sort: { averageTemperature: -1 } },
  ];

  return await EnvironmentalRecord.aggregate(pipeline);
};

module.exports = {
  getZoneSummary,
};
