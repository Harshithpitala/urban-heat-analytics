const EnvironmentalRecord = require('../../models/EnvironmentalRecord');
const Area = require('../../models/Area');
const hotspotService = require('../hotspots/hotspotService');
const { normalizeAnalyticsFilters } = require('../utils/filterNormalizer');

const METHOD_VERSION = 'HERI-v1.0';

// Configurable Project Default Weights (must sum to 100)
let activeWeights = {
  temperature: 35,
  populationDensity: 20,
  humidity: 10,
  buildingDensity: 10,
  traffic: 10,
  vegetation: 10,
  rainfall: 5,
};

const DEFAULT_WEIGHTS = { ...activeWeights };

/**
 * Validates that weights are non-negative numbers summing to exactly 100.
 */
const validateWeights = (weights) => {
  if (!weights || typeof weights !== 'object') {
    return { valid: false, message: 'Weights must be an object' };
  }

  const keys = ['temperature', 'populationDensity', 'humidity', 'buildingDensity', 'traffic', 'vegetation', 'rainfall'];
  let sum = 0;

  for (const key of keys) {
    const val = Number(weights[key]);
    if (isNaN(val) || val < 0) {
      return { valid: false, message: `Weight for ${key} must be a non-negative number` };
    }
    sum += val;
  }

  if (Math.abs(sum - 100) > 0.01) {
    return { valid: false, message: `Total weight must sum to 100%. Current sum: ${sum.toFixed(1)}%` };
  }

  return { valid: true };
};

/**
 * Min-Max normalization with zero-division safeguard.
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @param {boolean} isProtective - If true, invert normalization (higher value = lower risk)
 */
const normalizeMetric = (value, min, max, isProtective = false) => {
  if (value === null || value === undefined || isNaN(value)) return null;
  if (max <= min) return 50.0; // Neutral fallback when all dataset values are identical

  const ratio = (value - min) / (max - min);
  const clamped = Math.max(0, Math.min(1, ratio));

  return isProtective ? (1 - clamped) * 100 : clamped * 100;
};

/**
 * Classifies HERI risk level from score (0-100).
 */
const classifyRiskLevel = (score) => {
  if (score === null || score === undefined) return 'Insufficient Data';
  if (score >= 81.0) return 'Extreme';
  if (score >= 61.0) return 'Very High';
  if (score >= 41.0) return 'High';
  if (score >= 21.0) return 'Moderate';
  return 'Low';
};

/**
 * Synthesizes transparent rule-based risk driver summary for an area.
 */
const generateRiskDriverSummary = (name, heri, riskLevel, factorContributions) => {
  if (heri === null || riskLevel === 'Insufficient Data') {
    return `${name} has insufficient baseline observation telemetry to compute a reliable Heat Exposure Risk Index (HERI).`;
  }

  // Identify top 2 contributing factors
  const sortedFactors = [...factorContributions].sort((a, b) => b.contributionRatio - a.contributionRatio);
  const top1 = sortedFactors[0];
  const top2 = sortedFactors[1];

  let text = `${name} is classified as having ${riskLevel} heat exposure potential with an overall HERI of ${heri}/100. `;

  if (riskLevel === 'Extreme' || riskLevel === 'Very High' || riskLevel === 'High') {
    text += `The primary exposure drivers are ${top1?.label || 'elevated temperature'} (${top1?.contribution}/${top1?.maxWeight} pts) and ${top2?.label || 'urban density'} (${top2?.contribution}/${top2?.maxWeight} pts).`;
  } else if (riskLevel === 'Moderate') {
    text += `Environmental hazard and human exposure metrics remain within moderate thresholds across observed indicators.`;
  } else {
    text += `Protective environmental conditions (such as high urban vegetation canopy) combined with lower baseline temperatures mitigate relative exposure.`;
  }

  return text;
};

/**
 * Computes HERI across all urban areas based on stored MongoDB records and active weights.
 */
const computeAllAreasHERI = async (filters = {}, customWeights = null) => {
  const matchStage = normalizeAnalyticsFilters(filters);
  const weightsToUse = customWeights || activeWeights;

  const weightValidation = validateWeights(weightsToUse);
  if (!weightValidation.valid) {
    throw new Error(weightValidation.message);
  }

  // 1. Fetch Area metadata
  const areaFilter = {};
  if (filters.city && filters.city !== 'all' && filters.city !== 'All Cities') {
    areaFilter.city = new RegExp(`^${filters.city.trim()}$`, 'i');
  }
  if (filters.zone && filters.zone !== 'all' && filters.zone !== 'All Zones') {
    areaFilter.zone = new RegExp(`^${filters.zone.trim()}$`, 'i');
  }
  if (filters.landUse && filters.landUse !== 'all' && filters.landUse !== 'All Land Uses') {
    areaFilter.landUse = new RegExp(`^${filters.landUse.trim()}$`, 'i');
  }
  const allAreas = await Area.find(areaFilter).lean();

  // 2. Aggregate telemetry per area
  const areaStatsAgg = await EnvironmentalRecord.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$area',
        avgTemperature: { $avg: '$temperature' },
        avgHumidity: { $avg: '$humidity' },
        avgRainfall: { $avg: '$rainfall' },
        avgTraffic: { $avg: '$traffic' },
        avgVegetation: { $avg: '$vegetation' },
        avgPopulationDensity: { $avg: '$populationDensity' },
        avgBuildingDensity: { $avg: '$buildingDensity' },
        observationCount: { $sum: 1 },
      },
    },
  ]);

  const statsMap = new Map();
  areaStatsAgg.forEach((s) => statsMap.set(s._id.toString(), s));

  // 3. Compute global dataset min and max bounds across all records
  const globalBoundsAgg = await EnvironmentalRecord.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        minTemp: { $min: '$temperature' },
        maxTemp: { $max: '$temperature' },
        minHum: { $min: '$humidity' },
        maxHum: { $max: '$humidity' },
        minRain: { $min: '$rainfall' },
        maxRain: { $max: '$rainfall' },
        minTraffic: { $min: '$traffic' },
        maxTraffic: { $max: '$traffic' },
        minVeg: { $min: '$vegetation' },
        maxVeg: { $max: '$vegetation' },
        minPop: { $min: '$populationDensity' },
        maxPop: { $max: '$populationDensity' },
        minBldg: { $min: '$buildingDensity' },
        maxBldg: { $max: '$buildingDensity' },
      },
    },
  ]);

  const b = globalBoundsAgg[0] || {
    minTemp: 20, maxTemp: 45,
    minHum: 30, maxHum: 90,
    minRain: 0, maxRain: 50,
    minTraffic: 10, maxTraffic: 90,
    minVeg: 5, maxVeg: 80,
    minPop: 1000, maxPop: 25000,
    minBldg: 10, maxBldg: 90,
  };

  // 4. Fetch Phase 5 Hotspot scores for comparison
  const hotspotData = await hotspotService.getHotspotRankings(filters, { limit: 100 });
  const hotspotScoreMap = new Map();
  hotspotData.rankings.forEach((r) => hotspotScoreMap.set(r.areaId.toString(), r.hotspotScore));

  // 5. Evaluate HERI for each area
  const results = [];

  for (const area of allAreas) {
    const s = statsMap.get(area._id.toString());
    const obsCount = s ? s.observationCount : 0;

    // Use area model demographics as fallback if record aggregate is missing
    const tempVal = s ? s.avgTemperature : null;
    const humVal = s ? s.avgHumidity : null;
    const rainVal = s ? s.avgRainfall : null;
    const trafficVal = s ? s.avgTraffic : null;
    // Prioritize master Area document attributes for static demographics and canopy, fallback to telemetry average
    const vegVal = area.vegetation !== undefined && area.vegetation !== null ? area.vegetation : (s && s.avgVegetation !== null ? s.avgVegetation : null);
    const popVal = area.populationDensity !== undefined && area.populationDensity !== null ? area.populationDensity : (s && s.avgPopulationDensity !== null ? s.avgPopulationDensity : null);
    const bldgVal = area.buildingDensity !== undefined && area.buildingDensity !== null ? area.buildingDensity : (s && s.avgBuildingDensity !== null ? s.avgBuildingDensity : null);

    // Normalizations [0 - 100]
    const normTemp = normalizeMetric(tempVal, b.minTemp, b.maxTemp, false);
    const normHum = normalizeMetric(humVal, b.minHum, b.maxHum, false);
    const normRain = normalizeMetric(rainVal, b.minRain, b.maxRain, false);
    const normTraffic = normalizeMetric(trafficVal, b.minTraffic, b.maxTraffic, false);
    const normVeg = normalizeMetric(vegVal, b.minVeg, b.maxVeg, true); // Protective (inverted)
    const normPop = normalizeMetric(popVal, b.minPop, b.maxPop, false);
    const normBldg = normalizeMetric(bldgVal, b.minBldg, b.maxBldg, false);

    // Track available vs missing factors
    const factors = [
      { key: 'temperature', label: 'Ambient Temperature', norm: normTemp, raw: tempVal, unit: '°C', weight: weightsToUse.temperature, critical: true },
      { key: 'populationDensity', label: 'Population Density', norm: normPop, raw: popVal, unit: '/km²', weight: weightsToUse.populationDensity, critical: true },
      { key: 'humidity', label: 'Relative Humidity', norm: normHum, raw: humVal, unit: '%', weight: weightsToUse.humidity, critical: false },
      { key: 'buildingDensity', label: 'Building Density', norm: normBldg, raw: bldgVal, unit: '%', weight: weightsToUse.buildingDensity, critical: true },
      { key: 'traffic', label: 'Traffic Intensity', norm: normTraffic, raw: trafficVal, unit: '/100', weight: weightsToUse.traffic, critical: false },
      { key: 'vegetation', label: 'Vegetation Cover', norm: normVeg, raw: vegVal, unit: '%', weight: weightsToUse.vegetation, critical: true },
      { key: 'rainfall', label: 'Precipitation', norm: normRain, raw: rainVal, unit: 'mm', weight: weightsToUse.rainfall, critical: false },
    ];

    const availableFactors = factors.filter((f) => f.norm !== null);
    const missingFactors = factors.filter((f) => f.norm === null).map((f) => f.key);
    const completeness = Number(((availableFactors.length / factors.length) * 100).toFixed(1));

    // Data sufficiency check: Require at least 4 valid factors and minimum observations
    if (obsCount < 3 || availableFactors.length < 4 || normTemp === null) {
      results.push({
        areaId: area._id,
        area: area.name,
        city: area.city,
        zone: area.zone || 'General Zone',
        landUse: area.landUse,
        latitude: area.latitude,
        longitude: area.longitude,
        finalRiskScore: null,
        riskLevel: 'Insufficient Data',
        dataCompleteness: completeness,
        missingFactors,
        observationCount: obsCount,
        factorContributions: [],
        rawMetrics: {
          temperature: tempVal !== null ? Number(tempVal.toFixed(1)) : null,
          populationDensity: popVal || 0,
          buildingDensity: bldgVal || 0,
          traffic: trafficVal !== null ? Number(trafficVal.toFixed(0)) : null,
          vegetation: vegVal || 0,
          humidity: humVal !== null ? Number(humVal.toFixed(1)) : null,
          rainfall: rainVal !== null ? Number(rainVal.toFixed(1)) : null,
        },
        hotspotScore: hotspotScoreMap.get(area._id.toString()) || null,
        riskDriverSummary: generateRiskDriverSummary(area.name, null, 'Insufficient Data', []),
        methodVersion: METHOD_VERSION,
      });
      continue;
    }

    // Dynamic Weight Renormalization: Rescale available weights to sum to 100%
    const totalActiveWeight = availableFactors.reduce((acc, f) => acc + f.weight, 0);
    let weightedSum = 0;
    const factorContributions = [];

    for (const f of availableFactors) {
      const renormalizedWeight = (f.weight / totalActiveWeight) * 100;
      const contribution = Number(((f.norm * renormalizedWeight) / 100).toFixed(1));
      weightedSum += contribution;

      factorContributions.push({
        factor: f.key,
        label: f.label,
        rawValue: f.raw !== null ? Number(f.raw.toFixed(1)) : null,
        unit: f.unit,
        normalizedScore: Number(f.norm.toFixed(1)),
        assignedWeight: f.weight,
        renormalizedWeight: Number(renormalizedWeight.toFixed(1)),
        maxWeight: Number(renormalizedWeight.toFixed(1)),
        contribution,
        contributionRatio: Number((f.norm / 100).toFixed(2)),
      });
    }

    const finalRiskScore = Number(Math.max(0, Math.min(100, weightedSum)).toFixed(1));
    const riskLevel = classifyRiskLevel(finalRiskScore);

    results.push({
      areaId: area._id,
      area: area.name,
      city: area.city,
      zone: area.zone || 'General Zone',
      landUse: area.landUse,
      latitude: area.latitude,
      longitude: area.longitude,
      finalRiskScore,
      riskLevel,
      dataCompleteness: completeness,
      missingFactors,
      observationCount: obsCount,
      factorContributions,
      rawMetrics: {
        temperature: tempVal !== null ? Number(tempVal.toFixed(1)) : 0,
        populationDensity: popVal || 0,
        buildingDensity: bldgVal || 0,
        traffic: trafficVal !== null ? Number(trafficVal.toFixed(0)) : 0,
        vegetation: vegVal || 0,
        humidity: humVal !== null ? Number(humVal.toFixed(1)) : 0,
        rainfall: rainVal !== null ? Number(rainVal.toFixed(1)) : 0,
      },
      hotspotScore: hotspotScoreMap.get(area._id.toString()) || null,
      riskDriverSummary: generateRiskDriverSummary(area.name, finalRiskScore, riskLevel, factorContributions),
      methodVersion: METHOD_VERSION,
    });
  }

  return {
    areas: results,
    weightsUsed: weightsToUse,
    globalBounds: b,
    methodVersion: METHOD_VERSION,
  };
};

/**
 * Returns Municipal Risk Summary KPIs.
 */
const getRiskSummary = async (filters = {}, customWeights = null) => {
  const { areas, weightsUsed, methodVersion } = await computeAllAreasHERI(filters, customWeights);

  const scoredAreas = areas.filter((a) => a.finalRiskScore !== null);
  const totalScored = scoredAreas.length;

  const avgHeri = totalScored > 0
    ? Number((scoredAreas.reduce((acc, a) => acc + a.finalRiskScore, 0) / totalScored).toFixed(1))
    : 0;

  const highestHeriArea = scoredAreas.reduce((prev, curr) => (curr.finalRiskScore > (prev?.finalRiskScore || -1) ? curr : prev), null);
  const lowestHeriArea = scoredAreas.reduce((prev, curr) => (curr.finalRiskScore < (prev?.finalRiskScore || 999) ? curr : prev), null);

  const extremeCount = scoredAreas.filter((a) => a.riskLevel === 'Extreme').length;
  const veryHighCount = scoredAreas.filter((a) => a.riskLevel === 'Very High').length;
  const highCount = scoredAreas.filter((a) => a.riskLevel === 'High').length;
  const moderateCount = scoredAreas.filter((a) => a.riskLevel === 'Moderate').length;
  const lowCount = scoredAreas.filter((a) => a.riskLevel === 'Low').length;
  const insufficientCount = areas.length - totalScored;

  return {
    averageHeri: avgHeri,
    highestHeri: highestHeriArea ? highestHeriArea.finalRiskScore : 0,
    highestHeriArea: highestHeriArea ? highestHeriArea.area : 'None',
    lowestHeri: lowestHeriArea ? lowestHeriArea.finalRiskScore : 0,
    lowestHeriArea: lowestHeriArea ? lowestHeriArea.area : 'None',
    totalAreas: areas.length,
    scoredAreasCount: totalScored,
    distribution: {
      extreme: extremeCount,
      veryHigh: veryHighCount,
      high: highCount,
      moderate: moderateCount,
      low: lowCount,
      insufficientData: insufficientCount,
    },
    weightsUsed,
    methodVersion,
    disclaimer: 'HERI is a project-specific analytical index developed for this application. It is intended to compare relative heat exposure patterns within the available dataset and is not an official heat-warning, medical, or public-health risk model.',
  };
};

/**
 * Returns Ranked Areas sorted by HERI or specified parameter.
 */
const getRiskRankings = async (filters = {}, options = {}) => {
  const { sortBy = 'finalRiskScore', order = 'desc', limit = 50, riskLevel } = options;
  const { areas, weightsUsed, methodVersion } = await computeAllAreasHERI(filters, options.weights);

  let filtered = [...areas];

  if (riskLevel && riskLevel !== 'all' && riskLevel !== 'All Levels') {
    filtered = filtered.filter((a) => a.riskLevel.toLowerCase() === riskLevel.toLowerCase());
  }

  const isAsc = order === 'asc';
  filtered.sort((a, b) => {
    const valA = a[sortBy] !== null && a[sortBy] !== undefined ? a[sortBy] : (isAsc ? 9999 : -9999);
    const valB = b[sortBy] !== null && b[sortBy] !== undefined ? b[sortBy] : (isAsc ? 9999 : -9999);
    if (typeof valA === 'string') {
      return isAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return isAsc ? valA - valB : valB - valA;
  });

  const ranked = filtered.slice(0, Number(limit)).map((item, idx) => ({
    rank: idx + 1,
    ...item,
  }));

  return {
    totalCount: filtered.length,
    rankings: ranked,
    weightsUsed,
    methodVersion,
  };
};

/**
 * Returns detailed HERI profile for a single Area.
 */
const getAreaRiskDetails = async (areaId, filters = {}, customWeights = null) => {
  const { areas, weightsUsed, methodVersion } = await computeAllAreasHERI(filters, customWeights);
  const area = areas.find((a) => a.areaId.toString() === areaId.toString());

  if (!area) {
    throw new Error(`Area ${areaId} not found`);
  }

  // Calculate position rank
  const sorted = [...areas].sort((a, b) => (b.finalRiskScore || 0) - (a.finalRiskScore || 0));
  const rank = sorted.findIndex((a) => a.areaId.toString() === areaId.toString()) + 1;

  return {
    ...area,
    rank,
    weightsUsed,
    methodVersion,
    notes: 'Factor contributions represent relative linear components of the analytical index and should not be interpreted as direct clinical risks.',
  };
};

/**
 * Returns historical daily HERI time series for a single area.
 */
const getAreaRiskHistory = async (areaId, customWeights = null) => {
  const weightsToUse = customWeights || activeWeights;
  const records = await EnvironmentalRecord.find({ area: areaId })
    .sort({ date: 1 })
    .lean();

  const area = await Area.findById(areaId).lean();
  if (!area) throw new Error('Area not found');

  const history = records.map((r) => {
    const normTemp = normalizeMetric(r.temperature, 20, 45, false) || 50;
    const normHum = normalizeMetric(r.humidity, 30, 90, false) || 50;
    const normRain = normalizeMetric(r.rainfall, 0, 50, false) || 50;
    const normTraffic = normalizeMetric(r.traffic, 10, 90, false) || 50;
    const normVeg = normalizeMetric(r.vegetation || area.vegetation, 5, 80, true) || 50;
    const normPop = normalizeMetric(r.populationDensity || area.populationDensity, 1000, 25000, false) || 50;
    const normBldg = normalizeMetric(r.buildingDensity || area.buildingDensity, 10, 90, false) || 50;

    const heri = Number(
      (
        (normTemp * weightsToUse.temperature +
          normPop * weightsToUse.populationDensity +
          normHum * weightsToUse.humidity +
          normBldg * weightsToUse.buildingDensity +
          normTraffic * weightsToUse.traffic +
          normVeg * weightsToUse.vegetation +
          normRain * weightsToUse.rainfall) /
        100
      ).toFixed(1)
    );

    return {
      date: new Date(r.date).toISOString().split('T')[0],
      riskScore: heri,
      riskLevel: classifyRiskLevel(heri),
      temperature: r.temperature,
    };
  });

  return {
    areaId,
    areaName: area.name,
    history,
  };
};

/**
 * Returns Phase 5 Hotspot Score vs Phase 6 HERI comparison coordinates.
 */
const getHotspotVsHERIComparison = async (filters = {}) => {
  const { areas } = await computeAllAreasHERI(filters);

  const comparisonData = areas
    .filter((a) => a.finalRiskScore !== null && a.hotspotScore !== null)
    .map((a) => ({
      areaId: a.areaId,
      area: a.area,
      zone: a.zone,
      landUse: a.landUse,
      hotspotScore: a.hotspotScore,
      heri: a.finalRiskScore,
      riskLevel: a.riskLevel,
      populationDensity: a.rawMetrics.populationDensity,
      temperature: a.rawMetrics.temperature,
    }));

  return {
    comparison: comparisonData,
    explanation: 'Hotspot Score measures thermal hazard intensity and frequency, whereas HERI incorporates demographic exposure and protective vegetation mitigation.',
  };
};

/**
 * Returns High Heat + High Population areas requiring prioritized attention.
 */
const getHighHeatHighPopulation = async (filters = {}) => {
  const { areas } = await computeAllAreasHERI(filters);

  // Filter areas with temperature >= 35°C and populationDensity >= 10,000 /km²
  const highExposureAreas = areas
    .filter(
      (a) =>
        a.rawMetrics.temperature >= 34.0 &&
        a.rawMetrics.populationDensity >= 9000
    )
    .sort((a, b) => (b.finalRiskScore || 0) - (a.finalRiskScore || 0));

  return {
    count: highExposureAreas.length,
    areas: highExposureAreas,
    criteria: 'Average Temperature ≥ 34.0°C and Population Density ≥ 9,000 residents/km²',
  };
};

/**
 * Returns complete methodology documentation and active configuration.
 */
const getHERIMethodology = () => {
  return {
    title: 'Heat Exposure Risk Index (HERI) Methodology',
    version: METHOD_VERSION,
    description: 'A multi-criteria analytical index combining thermal intensity, built environment exposure, human density, and protective canopy coverage into a standardized 0–100 scale.',
    formula: 'HERI = (w_temp × NormTemp) + (w_pop × NormPop) + (w_bldg × NormBldg) + (w_traffic × NormTraffic) + (w_hum × NormHum) + (w_veg × NormVegInv) + (w_rain × NormRain)',
    defaultWeights: DEFAULT_WEIGHTS,
    activeWeights: { ...activeWeights },
    normalizationMethod: 'Min-Max normalization to [0, 100] with neutral fallback (50) for uniform metrics and inverse scaling for protective vegetation.',
    missingDataStrategy: 'Proportional weight renormalization across active indicators with an Insufficient Data cutoff when fewer than 4 factors or observations are present.',
    riskTiers: [
      { range: '81.0 - 100.0', label: 'Extreme', description: 'Severe multi-factor thermal and human exposure priority' },
      { range: '61.0 - 80.9', label: 'Very High', description: 'Substantial heat hazard compounded by density' },
      { range: '41.0 - 60.9', label: 'High', description: 'Elevated baseline heat exposure' },
      { range: '21.0 - 40.9', label: 'Moderate', description: 'Manageable urban environmental conditions' },
      { range: '0.0 - 20.9', label: 'Low', description: 'Well-mitigated or cooler district' },
    ],
    disclaimer: 'HERI is a project-specific analytical index developed for this application. It is intended to compare relative heat exposure patterns within the available dataset and is not an official heat-warning, medical, or public-health risk model.',
  };
};

/**
 * Updates active weights in memory (retaining validation safeguards).
 */
const updateActiveWeights = (newWeights) => {
  const validation = validateWeights(newWeights);
  if (!validation.valid) {
    throw new Error(validation.message);
  }

  activeWeights = {
    temperature: Number(newWeights.temperature),
    populationDensity: Number(newWeights.populationDensity),
    humidity: Number(newWeights.humidity),
    buildingDensity: Number(newWeights.buildingDensity),
    traffic: Number(newWeights.traffic),
    vegetation: Number(newWeights.vegetation),
    rainfall: Number(newWeights.rainfall),
  };

  return { success: true, activeWeights: { ...activeWeights } };
};

/**
 * Resets active weights to default project configuration.
 */
const resetWeightsToDefault = () => {
  activeWeights = { ...DEFAULT_WEIGHTS };
  return { success: true, activeWeights: { ...activeWeights } };
};

module.exports = {
  validateWeights,
  normalizeMetric,
  classifyRiskLevel,
  computeAllAreasHERI,
  getRiskSummary,
  getRiskRankings,
  getAreaRiskDetails,
  getAreaRiskHistory,
  getHotspotVsHERIComparison,
  getHighHeatHighPopulation,
  getHERIMethodology,
  updateActiveWeights,
  resetWeightsToDefault,
};
