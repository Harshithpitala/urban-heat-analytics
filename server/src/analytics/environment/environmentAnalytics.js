const EnvironmentalRecord = require('../../models/EnvironmentalRecord');
const { normalizeAnalyticsFilters } = require('../utils/filterNormalizer');
const { calculatePearsonCorrelation } = require('../utils/statsMath');

/**
 * Returns summary statistics for environmental variables (Humidity, Rainfall, Vegetation, Temp).
 */
const getEnvironmentSummary = async (filters = {}) => {
  const matchStage = normalizeAnalyticsFilters(filters);

  const agg = await EnvironmentalRecord.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        avgHumidity: { $avg: '$humidity' },
        minHumidity: { $min: '$humidity' },
        maxHumidity: { $max: '$humidity' },
        avgRainfall: { $avg: '$rainfall' },
        totalRainfall: { $sum: '$rainfall' },
        maxRainfall: { $max: '$rainfall' },
        avgVegetation: { $avg: '$vegetation' },
        minVegetation: { $min: '$vegetation' },
        maxVegetation: { $max: '$vegetation' },
        avgTemperature: { $avg: '$temperature' },
        sampleSize: { $sum: 1 },
      },
    },
  ]);

  const data = agg[0] || {
    avgHumidity: 0,
    minHumidity: 0,
    maxHumidity: 0,
    avgRainfall: 0,
    totalRainfall: 0,
    maxRainfall: 0,
    avgVegetation: 0,
    minVegetation: 0,
    maxVegetation: 0,
    avgTemperature: 0,
    sampleSize: 0,
  };

  return {
    humidity: {
      average: Number((data.avgHumidity || 0).toFixed(1)),
      min: Number((data.minHumidity || 0).toFixed(0)),
      max: Number((data.maxHumidity || 0).toFixed(0)),
    },
    rainfall: {
      average: Number((data.avgRainfall || 0).toFixed(1)),
      total: Number((data.totalRainfall || 0).toFixed(1)),
      max: Number((data.maxRainfall || 0).toFixed(1)),
    },
    vegetation: {
      average: Number((data.avgVegetation || 0).toFixed(1)),
      min: Number((data.minVegetation || 0).toFixed(0)),
      max: Number((data.maxVegetation || 0).toFixed(0)),
    },
    temperature: {
      average: Number((data.avgTemperature || 0).toFixed(1)),
    },
    sampleSize: data.sampleSize,
  };
};

/**
 * Returns daily time-series trends for environmental variables.
 */
const getEnvironmentTrends = async (filters = {}) => {
  const matchStage = normalizeAnalyticsFilters(filters);

  return await EnvironmentalRecord.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        temperature: { $avg: '$temperature' },
        humidity: { $avg: '$humidity' },
        rainfall: { $sum: '$rainfall' },
        vegetation: { $avg: '$vegetation' },
        observationCount: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        _id: 0,
        date: '$_id',
        temperature: { $round: ['$temperature', 1] },
        humidity: { $round: ['$humidity', 1] },
        rainfall: { $round: ['$rainfall', 1] },
        vegetation: { $round: ['$vegetation', 1] },
        observationCount: 1,
      },
    },
  ]);
};

/**
 * Groups environmental parameters by area.
 */
const getEnvironmentByArea = async (filters = {}) => {
  const matchStage = normalizeAnalyticsFilters(filters);

  return await EnvironmentalRecord.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$area',
        avgTemperature: { $avg: '$temperature' },
        avgHumidity: { $avg: '$humidity' },
        avgRainfall: { $avg: '$rainfall' },
        avgVegetation: { $avg: '$vegetation' },
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
        _id: 0,
        areaId: '$_id',
        area: '$areaDoc.name',
        zone: '$areaDoc.zone',
        landUse: '$areaDoc.landUse',
        temperature: { $round: ['$avgTemperature', 1] },
        humidity: { $round: ['$avgHumidity', 1] },
        rainfall: { $round: ['$avgRainfall', 1] },
        vegetation: { $round: ['$avgVegetation', 1] },
        observationCount: 1,
      },
    },
    { $sort: { temperature: -1 } },
  ]);
};

/**
 * Returns scatter plot relationship datasets and Pearson correlation stats:
 * 1. Temperature vs Vegetation (NDVI)
 * 2. Temperature vs Humidity
 * 3. Temperature vs Rainfall
 */
const getEnvironmentRelationships = async (filters = {}) => {
  const matchStage = normalizeAnalyticsFilters(filters);

  // Retrieve observation records
  const records = await EnvironmentalRecord.find(matchStage)
    .select('temperature humidity rainfall vegetation')
    .limit(1000)
    .lean();

  const tempArr = [];
  const vegArr = [];
  const humArr = [];
  const rainArr = [];

  const tempVsVegetation = [];
  const tempVsHumidity = [];
  const tempVsRainfall = [];

  records.forEach((r) => {
    if (typeof r.temperature === 'number') {
      tempArr.push(r.temperature);

      if (typeof r.vegetation === 'number') {
        vegArr.push(r.vegetation);
        tempVsVegetation.push({ temperature: r.temperature, vegetation: r.vegetation });
      }
      if (typeof r.humidity === 'number') {
        humArr.push(r.humidity);
        tempVsHumidity.push({ temperature: r.temperature, humidity: r.humidity });
      }
      if (typeof r.rainfall === 'number') {
        rainArr.push(r.rainfall);
        tempVsRainfall.push({ temperature: r.temperature, rainfall: r.rainfall });
      }
    }
  });

  const vegCorr = calculatePearsonCorrelation(vegArr, tempArr);
  const humCorr = calculatePearsonCorrelation(humArr, tempArr);
  const rainCorr = calculatePearsonCorrelation(rainArr, tempArr);

  return {
    relationships: {
      vegetationVsTemperature: {
        data: tempVsVegetation.slice(0, 300),
        correlation: vegCorr,
        description: 'Relationship between urban canopy coverage / NDVI and surface temperature.',
      },
      humidityVsTemperature: {
        data: tempVsHumidity.slice(0, 300),
        correlation: humCorr,
        description: 'Relationship between relative humidity and ambient temperature.',
      },
      rainfallVsTemperature: {
        data: tempVsRainfall.slice(0, 300),
        correlation: rainCorr,
        description: 'Relationship between precipitation accumulation and ambient temperature.',
      },
    },
  };
};

module.exports = {
  getEnvironmentSummary,
  getEnvironmentTrends,
  getEnvironmentByArea,
  getEnvironmentRelationships,
};
