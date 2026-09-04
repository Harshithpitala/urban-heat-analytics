const EnvironmentalRecord = require('../../models/EnvironmentalRecord');
const { normalizeAnalyticsFilters } = require('../utils/filterNormalizer');

const MONTH_NAMES = [
  '',
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/**
 * Monthly environmental and activity aggregation.
 */
const getMonthlyAnalytics = async (filters = {}) => {
  const matchStage = normalizeAnalyticsFilters(filters);

  const pipeline = [
    { $match: matchStage },
    {
      $group: {
        _id: { $month: '$date' },
        avgTemperature: { $avg: '$temperature' },
        minTemperature: { $min: '$temperature' },
        maxTemperature: { $max: '$temperature' },
        avgHumidity: { $avg: '$humidity' },
        totalRainfall: { $sum: '$rainfall' },
        avgRainfall: { $avg: '$rainfall' },
        avgTraffic: { $avg: '$traffic' },
        avgVegetation: { $avg: '$vegetation' },
        observationCount: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        _id: 0,
        monthNumber: '$_id',
        month: {
          $arrayElemAt: [MONTH_NAMES, '$_id'],
        },
        averageTemperature: { $round: ['$avgTemperature', 1] },
        minimumTemperature: { $round: ['$minTemperature', 1] },
        maximumTemperature: { $round: ['$maxTemperature', 1] },
        averageHumidity: { $round: ['$avgHumidity', 1] },
        averageRainfall: { $round: ['$avgRainfall', 1] },
        totalRainfall: { $round: ['$totalRainfall', 1] },
        averageTraffic: { $round: ['$avgTraffic', 0] },
        averageVegetation: { $round: ['$avgVegetation', 1] },
        observationCount: 1,
      },
    },
  ];

  return await EnvironmentalRecord.aggregate(pipeline);
};

/**
 * Seasonal environmental profile using India-focused meteorological categorization:
 * - Winter: Dec-Feb (12, 1, 2)
 * - Summer: Mar-May (3, 4, 5)
 * - Monsoon: Jun-Sep (6, 7, 8, 9)
 * - Post-Monsoon: Oct-Nov (10, 11)
 */
const getSeasonalAnalytics = async (filters = {}) => {
  const matchStage = normalizeAnalyticsFilters(filters);

  const pipeline = [
    { $match: matchStage },
    {
      $project: {
        temperature: 1,
        humidity: 1,
        rainfall: 1,
        traffic: 1,
        vegetation: 1,
        month: { $month: '$date' },
      },
    },
    {
      $addFields: {
        season: {
          $switch: {
            branches: [
              {
                case: { $in: ['$month', [12, 1, 2]] },
                then: 'Winter',
              },
              {
                case: { $in: ['$month', [3, 4, 5]] },
                then: 'Summer',
              },
              {
                case: { $in: ['$month', [6, 7, 8, 9]] },
                then: 'Monsoon',
              },
              {
                case: { $in: ['$month', [10, 11]] },
                then: 'Post-Monsoon',
              },
            ],
            default: 'General Season',
          },
        },
      },
    },
    {
      $group: {
        _id: '$season',
        averageTemperature: { $avg: '$temperature' },
        minTemperature: { $min: '$temperature' },
        maxTemperature: { $max: '$temperature' },
        averageHumidity: { $avg: '$humidity' },
        averageRainfall: { $avg: '$rainfall' },
        totalRainfall: { $sum: '$rainfall' },
        averageTraffic: { $avg: '$traffic' },
        averageVegetation: { $avg: '$vegetation' },
        observationCount: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        season: '$_id',
        averageTemperature: { $round: ['$averageTemperature', 1] },
        minimumTemperature: { $round: ['$minTemperature', 1] },
        maximumTemperature: { $round: ['$maxTemperature', 1] },
        averageHumidity: { $round: ['$averageHumidity', 1] },
        averageRainfall: { $round: ['$averageRainfall', 1] },
        totalRainfall: { $round: ['$totalRainfall', 1] },
        averageTraffic: { $round: ['$averageTraffic', 0] },
        averageVegetation: { $round: ['$averageVegetation', 1] },
        observationCount: 1,
      },
    },
  ];

  return await EnvironmentalRecord.aggregate(pipeline);
};

module.exports = {
  getMonthlyAnalytics,
  getSeasonalAnalytics,
};
