const EnvironmentalRecord = require('../../models/EnvironmentalRecord');
const { normalizeAnalyticsFilters } = require('../utils/filterNormalizer');
const { calculatePearsonCorrelation } = require('../utils/statsMath');

/**
 * Returns high-level summary of human mobility and urban structural density.
 */
const getHumanActivitySummary = async (filters = {}) => {
  const matchStage = normalizeAnalyticsFilters(filters);

  const agg = await EnvironmentalRecord.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        avgTraffic: { $avg: '$traffic' },
        minTraffic: { $min: '$traffic' },
        maxTraffic: { $max: '$traffic' },
        avgPopulationDensity: { $avg: '$populationDensity' },
        avgBuildingDensity: { $avg: '$buildingDensity' },
        avgTemperature: { $avg: '$temperature' },
        sampleSize: { $sum: 1 },
      },
    },
  ]);

  const data = agg[0] || {
    avgTraffic: 0,
    minTraffic: 0,
    maxTraffic: 0,
    avgPopulationDensity: 0,
    avgBuildingDensity: 0,
    avgTemperature: 0,
    sampleSize: 0,
  };

  return {
    traffic: {
      average: Number((data.avgTraffic || 0).toFixed(1)),
      min: Number((data.minTraffic || 0).toFixed(0)),
      max: Number((data.maxTraffic || 0).toFixed(0)),
    },
    populationDensity: {
      average: Number((data.avgPopulationDensity || 0).toFixed(0)),
    },
    buildingDensity: {
      average: Number((data.avgBuildingDensity || 0).toFixed(1)),
    },
    temperature: {
      average: Number((data.avgTemperature || 0).toFixed(1)),
    },
    sampleSize: data.sampleSize,
  };
};

/**
 * Returns scatter relationship datasets and Pearson correlation stats:
 * 1. Temperature vs Traffic Intensity
 * 2. Temperature vs Building Density
 * 3. Temperature vs Population Density
 */
const getHumanActivityRelationships = async (filters = {}) => {
  const matchStage = normalizeAnalyticsFilters(filters);

  const records = await EnvironmentalRecord.find(matchStage)
    .select('temperature traffic populationDensity buildingDensity')
    .limit(1000)
    .lean();

  const tempArr = [];
  const trafficArr = [];
  const bldgArr = [];
  const popArr = [];

  const tempVsTraffic = [];
  const tempVsBuilding = [];
  const tempVsPopulation = [];

  records.forEach((r) => {
    if (typeof r.temperature === 'number') {
      tempArr.push(r.temperature);

      if (typeof r.traffic === 'number') {
        trafficArr.push(r.traffic);
        tempVsTraffic.push({ temperature: r.temperature, traffic: r.traffic });
      }
      if (typeof r.buildingDensity === 'number') {
        bldgArr.push(r.buildingDensity);
        tempVsBuilding.push({ temperature: r.temperature, buildingDensity: r.buildingDensity });
      }
      if (typeof r.populationDensity === 'number') {
        popArr.push(r.populationDensity);
        tempVsPopulation.push({ temperature: r.temperature, populationDensity: r.populationDensity });
      }
    }
  });

  const trafficCorr = calculatePearsonCorrelation(trafficArr, tempArr);
  const bldgCorr = calculatePearsonCorrelation(bldgArr, tempArr);
  const popCorr = calculatePearsonCorrelation(popArr, tempArr);

  return {
    relationships: {
      trafficVsTemperature: {
        data: tempVsTraffic.slice(0, 300),
        correlation: trafficCorr,
        description: 'Association between vehicular mobility intensity and local thermal observations.',
      },
      buildingDensityVsTemperature: {
        data: tempVsBuilding.slice(0, 300),
        correlation: bldgCorr,
        description: 'Association between urban built-up surface percentage and recorded temperatures.',
      },
      populationDensityVsTemperature: {
        data: tempVsPopulation.slice(0, 300),
        correlation: popCorr,
        description: 'Association between residential/commercial human density and temperatures.',
      },
    },
  };
};

/**
 * Groups traffic metrics by area.
 */
const getTrafficByArea = async (filters = {}) => {
  const matchStage = normalizeAnalyticsFilters(filters);

  return await EnvironmentalRecord.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$area',
        avgTraffic: { $avg: '$traffic' },
        avgTemperature: { $avg: '$temperature' },
        avgPopulationDensity: { $avg: '$populationDensity' },
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
        traffic: { $round: ['$avgTraffic', 0] },
        temperature: { $round: ['$avgTemperature', 1] },
        populationDensity: '$areaDoc.populationDensity',
        buildingDensity: '$areaDoc.buildingDensity',
        observationCount: 1,
      },
    },
    { $sort: { traffic: -1 } },
  ]);
};

module.exports = {
  getHumanActivitySummary,
  getHumanActivityRelationships,
  getTrafficByArea,
};
