const EnvironmentalRecord = require('../../models/EnvironmentalRecord');
const { normalizeAnalyticsFilters } = require('../utils/filterNormalizer');
const { calculateMedian, calculateStdDev } = require('../utils/statsMath');

/**
 * Calculates detailed temperature statistics (mean, min, max, median, stdDev, and distribution).
 */
const getTemperatureSummary = async (filters = {}) => {
  const matchStage = normalizeAnalyticsFilters(filters);

  const [aggResult, records] = await Promise.all([
    EnvironmentalRecord.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          avgTemperature: { $avg: '$temperature' },
          minTemperature: { $min: '$temperature' },
          maxTemperature: { $max: '$temperature' },
          totalRecords: { $sum: 1 },
          binUnder30: { $sum: { $cond: [{ $lt: ['$temperature', 30] }, 1, 0] } },
          bin30To35: {
            $sum: {
              $cond: [{ $and: [{ $gte: ['$temperature', 30] }, { $lt: ['$temperature', 35] }] }, 1, 0],
            },
          },
          bin35To40: {
            $sum: {
              $cond: [{ $and: [{ $gte: ['$temperature', 35] }, { $lt: ['$temperature', 40] }] }, 1, 0],
            },
          },
          bin40Plus: { $sum: { $cond: [{ $gte: ['$temperature', 40] }, 1, 0] } },
        },
      },
    ]),
    // Sample temperatures for exact median & sample standard deviation
    EnvironmentalRecord.find(matchStage).select('temperature').limit(2000).lean(),
  ]);

  const temps = records.map((r) => r.temperature).filter((t) => typeof t === 'number' && !isNaN(t));
  const stats = aggResult[0] || {
    avgTemperature: 0,
    minTemperature: 0,
    maxTemperature: 0,
    totalRecords: 0,
    binUnder30: 0,
    bin30To35: 0,
    bin35To40: 0,
    bin40Plus: 0,
  };

  return {
    averageTemperature: Number((stats.avgTemperature || 0).toFixed(2)),
    minimumTemperature: Number((stats.minTemperature || 0).toFixed(1)),
    maximumTemperature: Number((stats.maxTemperature || 0).toFixed(1)),
    medianTemperature: calculateMedian(temps),
    standardDeviation: calculateStdDev(temps),
    sampleSize: stats.totalRecords,
    distribution: [
      { range: '< 30°C', count: stats.binUnder30, label: 'Cool / Mild' },
      { range: '30 - 34.9°C', count: stats.bin30To35, label: 'Moderate Heat' },
      { range: '35 - 39.9°C', count: stats.bin35To40, label: 'High Heat' },
      { range: '>= 40°C', count: stats.bin40Plus, label: 'Extreme Heat' },
    ],
  };
};

/**
 * Returns aggregated temperature trend over time (daily or monthly).
 */
const getTemperatureTrend = async (filters = {}, interval = 'daily') => {
  const matchStage = normalizeAnalyticsFilters(filters);
  const dateFormat = interval === 'monthly' ? '%Y-%m' : '%Y-%m-%d';

  const pipeline = [
    { $match: matchStage },
    {
      $group: {
        _id: { $dateToString: { format: dateFormat, date: '$date' } },
        averageTemperature: { $avg: '$temperature' },
        minimumTemperature: { $min: '$temperature' },
        maximumTemperature: { $max: '$temperature' },
        observationCount: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        _id: 0,
        date: '$_id',
        averageTemperature: { $round: ['$averageTemperature', 1] },
        minimumTemperature: { $round: ['$minimumTemperature', 1] },
        maximumTemperature: { $round: ['$maximumTemperature', 1] },
        observationCount: 1,
      },
    },
  ];

  return await EnvironmentalRecord.aggregate(pipeline);
};

/**
 * Groups temperature metrics by urban area, sorted by average temperature.
 */
const getTemperatureByArea = async (filters = {}) => {
  const matchStage = normalizeAnalyticsFilters(filters);

  const pipeline = [
    { $match: matchStage },
    {
      $group: {
        _id: '$area',
        averageTemperature: { $avg: '$temperature' },
        minimumTemperature: { $min: '$temperature' },
        maximumTemperature: { $max: '$temperature' },
        averageHumidity: { $avg: '$humidity' },
        averageTraffic: { $avg: '$traffic' },
        averageVegetation: { $avg: '$vegetation' },
        observationCount: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: 'areas',
        localField: '_id',
        foreignField: '_id',
        as: 'areaDoc',
      },
    },
    { $unwind: '$areaDoc' },
    {
      $project: {
        _id: 1,
        areaId: '$_id',
        area: '$areaDoc.name',
        zone: '$areaDoc.zone',
        landUse: '$areaDoc.landUse',
        averageTemperature: { $round: ['$averageTemperature', 1] },
        minimumTemperature: { $round: ['$minimumTemperature', 1] },
        maximumTemperature: { $round: ['$maximumTemperature', 1] },
        averageHumidity: { $round: ['$averageHumidity', 0] },
        averageTraffic: { $round: ['$averageTraffic', 0] },
        averageVegetation: { $round: ['$averageVegetation', 0] },
        populationDensity: '$areaDoc.populationDensity',
        observationCount: 1,
      },
    },
    { $sort: { averageTemperature: -1 } },
  ];

  return await EnvironmentalRecord.aggregate(pipeline);
};

/**
 * Groups temperature by Land-Use zoning category. Only returns categories present in the dataset.
 */
const getTemperatureByLandUse = async (filters = {}) => {
  const matchStage = normalizeAnalyticsFilters(filters);

  const pipeline = [
    { $match: matchStage },
    {
      $group: {
        _id: '$landUse',
        averageTemperature: { $avg: '$temperature' },
        minimumTemperature: { $min: '$temperature' },
        maximumTemperature: { $max: '$temperature' },
        averageVegetation: { $avg: '$vegetation' },
        averageHumidity: { $avg: '$humidity' },
        recordCount: { $sum: 1 },
      },
    },
    { $match: { _id: { $ne: null } } },
    {
      $project: {
        _id: 0,
        landUse: '$_id',
        averageTemperature: { $round: ['$averageTemperature', 1] },
        minimumTemperature: { $round: ['$minimumTemperature', 1] },
        maximumTemperature: { $round: ['$maximumTemperature', 1] },
        averageVegetation: { $round: ['$averageVegetation', 1] },
        averageHumidity: { $round: ['$averageHumidity', 1] },
        recordCount: 1,
      },
    },
    { $sort: { averageTemperature: -1 } },
  ];

  return await EnvironmentalRecord.aggregate(pipeline);
};

module.exports = {
  getTemperatureSummary,
  getTemperatureTrend,
  getTemperatureByArea,
  getTemperatureByLandUse,
};
