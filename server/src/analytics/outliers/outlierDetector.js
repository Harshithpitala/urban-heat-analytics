const EnvironmentalRecord = require('../../models/EnvironmentalRecord');
const { normalizeAnalyticsFilters } = require('../utils/filterNormalizer');
const { calculateIQR, calculateMean, calculateStdDev } = require('../utils/statsMath');

/**
 * Statistical Temperature Outlier Detector
 * Methodology: Interquartile Range (IQR) rule:
 * - Upper Bound = Q3 + 1.5 * IQR
 * - Lower Bound = Q1 - 1.5 * IQR
 * Wording: "Statistical temperature outlier" (avoids premature or unsubstantiated "heatwave" claims).
 */
const detectTemperatureOutliers = async (filters = {}) => {
  const matchStage = normalizeAnalyticsFilters(filters);

  // Retrieve records
  const records = await EnvironmentalRecord.find(matchStage)
    .populate('area', 'name zone landUse')
    .select('area date temperature humidity traffic')
    .sort({ date: -1 })
    .lean();

  if (records.length < 4) {
    return {
      method: 'Interquartile Range (IQR) Rule [Q1 - 1.5*IQR, Q3 + 1.5*IQR]',
      sampleSize: records.length,
      outlierCount: 0,
      outliers: [],
      message: 'Insufficient observations to calculate statistically robust outlier thresholds.',
    };
  }

  const temps = records.map((r) => r.temperature).filter((t) => typeof t === 'number' && !isNaN(t));
  const mean = calculateMean(temps);
  const stdDev = calculateStdDev(temps);
  const iqrStats = calculateIQR(temps);

  const outliers = [];

  records.forEach((r) => {
    const temp = r.temperature;
    if (temp > iqrStats.upperBound) {
      outliers.push({
        recordId: r._id,
        area: r.area?.name || 'Unknown Area',
        zone: r.area?.zone || 'General Zone',
        date: r.date,
        temperature: temp,
        type: 'Statistical Upper Outlier',
        deviation: Number((temp - iqrStats.upperBound).toFixed(1)),
        zScore: stdDev > 0 ? Number(((temp - mean) / stdDev).toFixed(2)) : 0,
        context: {
          humidity: r.humidity,
          traffic: r.traffic,
        },
      });
    } else if (temp < iqrStats.lowerBound) {
      outliers.push({
        recordId: r._id,
        area: r.area?.name || 'Unknown Area',
        zone: r.area?.zone || 'General Zone',
        date: r.date,
        temperature: temp,
        type: 'Statistical Lower Outlier',
        deviation: Number((iqrStats.lowerBound - temp).toFixed(1)),
        zScore: stdDev > 0 ? Number(((temp - mean) / stdDev).toFixed(2)) : 0,
        context: {
          humidity: r.humidity,
          traffic: r.traffic,
        },
      });
    }
  });

  return {
    method: 'Interquartile Range (IQR) Rule [Q1 - 1.5*IQR, Q3 + 1.5*IQR]',
    thresholds: {
      q1: iqrStats.q1,
      median: iqrStats.median,
      q3: iqrStats.q3,
      iqr: iqrStats.iqr,
      lowerBound: iqrStats.lowerBound,
      upperBound: iqrStats.upperBound,
      mean,
      stdDev,
    },
    sampleSize: temps.length,
    outlierCount: outliers.length,
    outlierPercentage: Number(((outliers.length / temps.length) * 100).toFixed(1)),
    outliers: outliers.slice(0, 100), // Cap at 100 for API efficiency
    disclaimer:
      'Identified values represent statistical temperature outliers relative to the observed distribution. They do not constitute official meteorological heatwave declarations.',
  };
};

module.exports = {
  detectTemperatureOutliers,
};
