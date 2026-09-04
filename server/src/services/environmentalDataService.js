const EnvironmentalRecord = require('../models/EnvironmentalRecord');
const Area = require('../models/Area');
const { isValidDate } = require('../utils/timeUtils');

/**
 * Builds standard MongoDB filter object from query parameters.
 */
const buildRecordQuery = ({ city, area, startDate, endDate, landUse }) => {
  const query = {};

  if (city && city !== 'all') {
    query.city = new RegExp(city, 'i');
  }

  if (area && area !== 'all') {
    // Check if area is an ObjectId or name
    if (area.match(/^[0-9a-fA-F]{24}$/)) {
      query.area = area;
    }
  }

  if (landUse && landUse !== 'all') {
    query.landUse = landUse;
  }

  if (startDate || endDate) {
    query.date = {};
    if (startDate && isValidDate(startDate)) {
      query.date.$gte = new Date(startDate);
    }
    if (endDate && isValidDate(endDate)) {
      query.date.$lte = new Date(endDate);
    }
  }

  return query;
};

/**
 * Retrieves paginated list of environmental records.
 */
const getRecords = async (params) => {
  const {
    page = 1,
    limit = 20,
    sortBy = 'date',
    sortOrder = 'desc',
    search,
  } = params;

  const query = buildRecordQuery(params);

  // If search provided, find matching area IDs first
  if (search) {
    const matchingAreas = await Area.find({
      name: new RegExp(search, 'i'),
    }).select('_id');
    const areaIds = matchingAreas.map((a) => a._id);
    query.$or = [{ area: { $in: areaIds } }, { city: new RegExp(search, 'i') }];
  }

  const sortDirection = sortOrder === 'asc' ? 1 : -1;
  const sort = { [sortBy]: sortDirection };

  const parsedPage = Math.max(1, parseInt(page, 10));
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (parsedPage - 1) * parsedLimit;

  const total = await EnvironmentalRecord.countDocuments(query);
  const records = await EnvironmentalRecord.find(query)
    .populate('area', 'name city zone landUse populationDensity buildingDensity vegetation')
    .sort(sort)
    .skip(skip)
    .limit(parsedLimit)
    .lean();

  return {
    records,
    pagination: {
      total,
      page: parsedPage,
      limit: parsedLimit,
      pages: Math.ceil(total / parsedLimit) || 1,
    },
  };
};

/**
 * Retrieves a single observation record by ID.
 */
const getRecordById = async (id) => {
  return await EnvironmentalRecord.findById(id)
    .populate('area', 'name city zone landUse')
    .lean();
};

/**
 * Creates an environmental record. If area is specified, syncs snapshot fields if missing.
 */
const createRecord = async (recordData) => {
  if (recordData.area) {
    const area = await Area.findById(recordData.area);
    if (area) {
      if (!recordData.city) recordData.city = area.city;
      if (!recordData.landUse) recordData.landUse = area.landUse;
      if (recordData.populationDensity === undefined) recordData.populationDensity = area.populationDensity;
      if (recordData.buildingDensity === undefined) recordData.buildingDensity = area.buildingDensity;
      if (recordData.vegetation === undefined) recordData.vegetation = area.vegetation;
      if (recordData.latitude === undefined) recordData.latitude = area.latitude;
      if (recordData.longitude === undefined) recordData.longitude = area.longitude;
    }
  }

  const record = new EnvironmentalRecord(recordData);
  return await record.save();
};

/**
 * Updates an environmental record.
 */
const updateRecord = async (id, updateData) => {
  return await EnvironmentalRecord.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });
};

/**
 * Deletes an environmental record.
 */
const deleteRecord = async (id) => {
  return await EnvironmentalRecord.findByIdAndDelete(id);
};

/**
 * Computes preliminary data quality metrics across the dataset.
 */
const getDataQualityMetrics = async () => {
  const total = await EnvironmentalRecord.countDocuments();

  // Aggregate missing / boundary values
  const qualitySummary = await EnvironmentalRecord.aggregate([
    {
      $group: {
        _id: null,
        missingTemperature: {
          $sum: { $cond: [{ $ifNull: ['$temperature', false] }, 0, 1] },
        },
        missingHumidity: {
          $sum: { $cond: [{ $ifNull: ['$humidity', false] }, 0, 1] },
        },
        missingRainfall: {
          $sum: { $cond: [{ $ifNull: ['$rainfall', false] }, 0, 1] },
        },
        extremeHeatOutliers: {
          $sum: { $cond: [{ $gt: ['$temperature', 50] }, 1, 0] },
        },
        extremeColdOutliers: {
          $sum: { $cond: [{ $lt: ['$temperature', 0] }, 1, 0] },
        },
      },
    },
  ]);

  const stats = qualitySummary[0] || {
    missingTemperature: 0,
    missingHumidity: 0,
    missingRainfall: 0,
    extremeHeatOutliers: 0,
    extremeColdOutliers: 0,
  };

  // Check duplicate area + date records
  const [duplicateAgg, cityAgg, landUseAgg, dateAgg] = await Promise.all([
    EnvironmentalRecord.aggregate([
      {
        $group: {
          _id: { area: '$area', date: '$date' },
          count: { $sum: 1 },
        },
      },
      { $match: { count: { $gt: 1 } } },
      { $count: 'duplicatePairs' },
    ]),
    EnvironmentalRecord.aggregate([
      { $group: { _id: '$city', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    EnvironmentalRecord.aggregate([
      { $group: { _id: '$landUse', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    EnvironmentalRecord.aggregate([
      {
        $group: {
          _id: null,
          earliest: { $min: '$date' },
          latest: { $max: '$date' },
        },
      },
    ]),
  ]);

  const duplicateCount = duplicateAgg[0]?.duplicatePairs || 0;
  const dateRange = dateAgg[0] || { earliest: null, latest: null };

  return {
    totalRecords: total,
    completeness: total > 0 ? Number((((total * 3 - (stats.missingTemperature + stats.missingHumidity + stats.missingRainfall)) / (total * 3)) * 100).toFixed(1)) : 100,
    missingMetrics: {
      temperature: stats.missingTemperature,
      humidity: stats.missingHumidity,
      rainfall: stats.missingRainfall,
    },
    anomalies: {
      extremeHeatOutliers: stats.extremeHeatOutliers,
      extremeColdOutliers: stats.extremeColdOutliers,
      duplicates: duplicateCount,
    },
    distributions: {
      byCity: cityAgg.map((c) => ({ city: c._id || 'Unknown', count: c.count })),
      byLandUse: landUseAgg.map((l) => ({ landUse: l._id || 'Unknown', count: l.count })),
      dateCoverage: {
        earliest: dateRange.earliest,
        latest: dateRange.latest,
      },
    },
    evaluatedAt: new Date().toISOString(),
  };
};

module.exports = {
  getRecords,
  getRecordById,
  createRecord,
  updateRecord,
  deleteRecord,
  getDataQualityMetrics,
  buildRecordQuery,
};
