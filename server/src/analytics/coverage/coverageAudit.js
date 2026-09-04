const EnvironmentalRecord = require('../../models/EnvironmentalRecord');
const Area = require('../../models/Area');
const { normalizeAnalyticsFilters } = require('../utils/filterNormalizer');

/**
 * Data Coverage and Reliability Audit
 */
const getDataCoverage = async (filters = {}) => {
  const matchStage = normalizeAnalyticsFilters(filters);

  const [dateRangeAgg, totalRecords, areaCoverageAgg, monthCoverageAgg, nullAgg, totalAreasCount] = await Promise.all([
    EnvironmentalRecord.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          earliestDate: { $min: '$date' },
          latestDate: { $max: '$date' },
        },
      },
    ]),
    EnvironmentalRecord.countDocuments(matchStage),
    EnvironmentalRecord.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$area',
          count: { $sum: 1 },
          firstRecord: { $min: '$date' },
          lastRecord: { $max: '$date' },
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
          _id: 0,
          areaId: '$_id',
          areaName: '$areaDoc.name',
          zone: '$areaDoc.zone',
          observations: '$count',
        },
      },
      { $sort: { observations: -1 } },
    ]),
    EnvironmentalRecord.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          month: '$_id',
          observations: '$count',
        },
      },
    ]),
    EnvironmentalRecord.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          missingTemp: { $sum: { $cond: [{ $ifNull: ['$temperature', false] }, 0, 1] } },
          missingHum: { $sum: { $cond: [{ $ifNull: ['$humidity', false] }, 0, 1] } },
          missingRain: { $sum: { $cond: [{ $ifNull: ['$rainfall', false] }, 0, 1] } },
          missingTraffic: { $sum: { $cond: [{ $ifNull: ['$traffic', false] }, 0, 1] } },
          missingVeg: { $sum: { $cond: [{ $ifNull: ['$vegetation', false] }, 0, 1] } },
        },
      },
    ]),
    Area.countDocuments(),
  ]);

  const dateStats = dateRangeAgg[0] || { earliestDate: null, latestDate: null };
  const nullStats = nullAgg[0] || { missingTemp: 0, missingHum: 0, missingRain: 0, missingTraffic: 0, missingVeg: 0 };

  const totalPossibleValues = totalRecords * 5;
  const missingCount =
    nullStats.missingTemp +
    nullStats.missingHum +
    nullStats.missingRain +
    nullStats.missingTraffic +
    nullStats.missingVeg;
  const completeness =
    totalPossibleValues > 0
      ? Number((((totalPossibleValues - missingCount) / totalPossibleValues) * 100).toFixed(1))
      : 100;

  return {
    temporalRange: {
      earliest: dateStats.earliestDate,
      latest: dateStats.latestDate,
    },
    sampleMetrics: {
      totalObservations: totalRecords,
      monitoredAreas: areaCoverageAgg.length,
      totalRegisteredAreas: totalAreasCount,
      completenessPercentage: completeness,
    },
    observationsPerArea: areaCoverageAgg,
    observationsPerMonth: monthCoverageAgg,
    missingValues: {
      temperature: nullStats.missingTemp,
      humidity: nullStats.missingHum,
      rainfall: nullStats.missingRain,
      traffic: nullStats.missingTraffic,
      vegetation: nullStats.missingVeg,
    },
  };
};

module.exports = {
  getDataCoverage,
};
