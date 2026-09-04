const Area = require('../models/Area');
const EnvironmentalRecord = require('../models/EnvironmentalRecord');

/**
 * Retrieves paginated list of areas with optional filtering.
 */
const getAreas = async ({ city, landUse, search, page = 1, limit = 50 }) => {
  const query = {};

  if (city && city !== 'all') {
    query.city = new RegExp(city, 'i');
  }

  if (landUse && landUse !== 'all') {
    query.landUse = landUse;
  }

  if (search) {
    query.$or = [
      { name: new RegExp(search, 'i') },
      { zone: new RegExp(search, 'i') },
      { city: new RegExp(search, 'i') },
    ];
  }

  const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
  const total = await Area.countDocuments(query);
  const areas = await Area.find(query)
    .sort({ name: 1 })
    .skip(skip)
    .limit(parseInt(limit, 10))
    .lean();

  return {
    areas,
    pagination: {
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      pages: Math.ceil(total / limit) || 1,
    },
  };
};

/**
 * Retrieves a single area by ID, including computed observation summary metrics
 * and recent temperature history for charts.
 */
const getAreaById = async (id) => {
  const area = await Area.findById(id).lean();
  if (!area) {
    return null;
  }

  // Aggregate observations for this area
  const summaryAgg = await EnvironmentalRecord.aggregate([
    { $match: { area: area._id } },
    {
      $group: {
        _id: '$area',
        avgTemperature: { $avg: '$temperature' },
        maxTemperature: { $max: '$temperature' },
        minTemperature: { $min: '$temperature' },
        avgHumidity: { $avg: '$humidity' },
        avgRainfall: { $avg: '$rainfall' },
        avgTraffic: { $avg: '$traffic' },
        avgVegetation: { $avg: '$vegetation' },
        totalObservations: { $sum: 1 },
      },
    },
  ]);

  const summary = summaryAgg[0] || {
    avgTemperature: 0,
    maxTemperature: 0,
    minTemperature: 0,
    avgHumidity: 0,
    avgRainfall: 0,
    avgTraffic: 0,
    avgVegetation: 0,
    totalObservations: 0,
  };

  // Recent 30 observations for time-series trend line
  const recentRecords = await EnvironmentalRecord.find({ area: area._id })
    .sort({ date: 1 })
    .limit(40)
    .select('date temperature humidity traffic rainfall')
    .lean();

  return {
    ...area,
    summary: {
      avgTemperature: Number((summary.avgTemperature || 0).toFixed(1)),
      maxTemperature: Number((summary.maxTemperature || 0).toFixed(1)),
      minTemperature: Number((summary.minTemperature || 0).toFixed(1)),
      avgHumidity: Math.round(summary.avgHumidity || 0),
      avgRainfall: Number((summary.avgRainfall || 0).toFixed(1)),
      avgTraffic: Math.round(summary.avgTraffic || 0),
      avgVegetation: Math.round(summary.avgVegetation || 0),
      totalObservations: summary.totalObservations,
    },
    recentRecords: recentRecords.map((r) => ({
      date: r.date,
      temperature: r.temperature,
      humidity: r.humidity,
      traffic: r.traffic,
      rainfall: r.rainfall,
    })),
  };
};

/**
 * Creates a new Area.
 */
const createArea = async (areaData) => {
  const area = new Area(areaData);
  return await area.save();
};

/**
 * Updates an existing Area.
 */
const updateArea = async (id, updateData) => {
  return await Area.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });
};

/**
 * Deletes an Area and cascades deletion to associated EnvironmentalRecords.
 */
const deleteArea = async (id) => {
  const area = await Area.findByIdAndDelete(id);
  if (area) {
    await EnvironmentalRecord.deleteMany({ area: id });
  }
  return area;
};

module.exports = {
  getAreas,
  getAreaById,
  createArea,
  updateArea,
  deleteArea,
};
