const mongoose = require('mongoose');
const EnvironmentalRecord = require('../../models/EnvironmentalRecord');
const Area = require('../../models/Area');
const { normalizeAnalyticsFilters } = require('../utils/filterNormalizer');

const DEFAULT_WEIGHTS = {
  averageTemperatureWeight: 0.3,
  maximumTemperatureWeight: 0.2,
  highTemperatureFrequencyWeight: 0.3,
  persistenceWeight: 0.2,
};

const MIN_OBSERVATIONS_THRESHOLD = 5;

/**
 * Calculates empirical temperature percentile threshold (default 90th percentile).
 * @param {Object} matchStage
 * @param {number} percentile - e.g. 85, 90, 95
 * @returns {Promise<{threshold: number, totalObservations: number, percentile: number}>}
 */
const calculateHotspotThreshold = async (matchStage = {}, percentile = 90) => {
  const p = Math.max(50, Math.min(99, Number(percentile) || 90));

  const records = await EnvironmentalRecord.find({
    ...matchStage,
    temperature: { $exists: true, $ne: null },
  })
    .select('temperature')
    .sort({ temperature: 1 })
    .lean();

  if (records.length === 0) {
    return { threshold: 38.0, totalObservations: 0, percentile: p };
  }

  const index = Math.min(
    records.length - 1,
    Math.max(0, Math.floor((p / 100) * records.length))
  );
  const threshold = Number(records[index].temperature.toFixed(1));

  return {
    threshold,
    totalObservations: records.length,
    percentile: p,
  };
};

/**
 * Classifies Hotspot Severity from Hotspot Score (0-100).
 */
const classifySeverity = (score) => {
  if (score === null || score === undefined) return 'Insufficient Data';
  if (score >= 81) return 'Extreme';
  if (score >= 61) return 'Very High';
  if (score >= 41) return 'High';
  if (score >= 21) return 'Moderate';
  return 'Low';
};

/**
 * Classifies Hotspot Typology.
 */
const classifyHotspotType = (frequency, recentDelta, observationCount, distinctDatesCount) => {
  if (observationCount < MIN_OBSERVATIONS_THRESHOLD) {
    return 'Insufficient Data';
  }
  if (frequency >= 30 && distinctDatesCount >= 3) {
    return 'Persistent Hotspot';
  }
  if (recentDelta >= 1.0) {
    return 'Emerging Hotspot';
  }
  if (frequency >= 10) {
    return 'Temporary Hotspot';
  }
  return 'Stable Low-Heat Area';
};

/**
 * Generates transparent textual explanation for an area's hotspot profile.
 */
const generateAreaExplanation = (name, score, severity, type, frequency, recentDelta, observationCount) => {
  if (observationCount < MIN_OBSERVATIONS_THRESHOLD) {
    return `${name} has fewer than ${MIN_OBSERVATIONS_THRESHOLD} recorded observations (${observationCount} logged), which is insufficient for reliable hotspot categorization.`;
  }

  let text = `${name} is classified as a ${type} with a ${severity} severity level (Hotspot Score: ${score}/100). `;

  if (type === 'Persistent Hotspot') {
    text += `Approximately ${frequency}% of its recorded observations crossed the high-temperature threshold across multiple observation periods.`;
  } else if (type === 'Emerging Hotspot') {
    text += `Recent observations indicate an upward thermal swing (+${recentDelta}°C) compared to its historical baseline in the active dataset.`;
  } else if (type === 'Temporary Hotspot') {
    text += `It experienced episodic threshold exceedances (${frequency}% frequency) without sustained multi-date thermal persistence.`;
  } else {
    text += `It consistently remains within safe temperature bounds with minimal threshold exceedances (${frequency}% frequency).`;
  }

  return text;
};

/**
 * Computes comprehensive hotspot metrics across all urban areas.
 */
const getHotspotMetrics = async (filters = {}, options = {}) => {
  const matchStage = normalizeAnalyticsFilters(filters);
  const percentile = Number(options.percentile) || 90;

  // 1. Calculate high-temperature threshold
  const { threshold, totalObservations } = await calculateHotspotThreshold(matchStage, percentile);

  // 2. Pre-load all Areas
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

  // 3. Find global dataset temperature min and max for normalization
  const globalTempAgg = await EnvironmentalRecord.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        minTemp: { $min: '$temperature' },
        maxTemp: { $max: '$temperature' },
        latestDate: { $max: '$date' },
      },
    },
  ]);
  const globalMin = globalTempAgg[0]?.minTemp || 20;
  const globalMax = globalTempAgg[0]?.maxTemp || 45;
  const tempSpan = Math.max(1, globalMax - globalMin);

  // Recent date window threshold (last 7 days of dataset)
  const datasetLatest = globalTempAgg[0]?.latestDate ? new Date(globalTempAgg[0].latestDate) : new Date();
  const recentCutoff = new Date(datasetLatest);
  recentCutoff.setUTCDate(recentCutoff.getUTCDate() - 7);

  // 4. Area-level aggregation
  const areaStatsAgg = await EnvironmentalRecord.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$area',
        averageTemperature: { $avg: '$temperature' },
        maximumTemperature: { $max: '$temperature' },
        minimumTemperature: { $min: '$temperature' },
        totalObservations: { $sum: 1 },
        highTempObservations: {
          $sum: { $cond: [{ $gte: ['$temperature', threshold] }, 1, 0] },
        },
        distinctDates: {
          $addToSet: {
            $cond: [
              { $gte: ['$temperature', threshold] },
              { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
              '$$REMOVE',
            ],
          },
        },
        // Recent observations window
        recentAvgTemp: {
          $avg: {
            $cond: [{ $gte: ['$date', recentCutoff] }, '$temperature', null],
          },
        },
        recentCount: {
          $sum: {
            $cond: [{ $gte: ['$date', recentCutoff] }, 1, 0],
          },
        },
        historicalAvgTemp: {
          $avg: {
            $cond: [{ $lt: ['$date', recentCutoff] }, '$temperature', null],
          },
        },
      },
    },
  ]);

  const statsMap = new Map();
  areaStatsAgg.forEach((s) => statsMap.set(s._id.toString(), s));

  // 5. Compute Hotspot Scores and Typologies
  const areaResults = [];

  for (const area of allAreas) {
    const s = statsMap.get(area._id.toString());
    const obsCount = s ? s.totalObservations : 0;
    const highTempCount = s ? s.highTempObservations : 0;
    const avgTemp = s ? Number(s.averageTemperature.toFixed(1)) : 0;
    const maxTemp = s ? Number(s.maximumTemperature.toFixed(1)) : 0;
    const minTemp = s ? Number(s.minimumTemperature.toFixed(1)) : 0;
    const distinctDatesCount = s && Array.isArray(s.distinctDates) ? s.distinctDates.length : 0;

    const frequency = obsCount > 0 ? Number(((highTempCount / obsCount) * 100).toFixed(1)) : 0;

    const recentAvg = s && s.recentAvgTemp !== null ? Number(s.recentAvgTemp.toFixed(1)) : avgTemp;
    const historicalAvg = s && s.historicalAvgTemp !== null ? Number(s.historicalAvgTemp.toFixed(1)) : avgTemp;
    const recentDelta = Number((recentAvg - historicalAvg).toFixed(1));

    if (obsCount < MIN_OBSERVATIONS_THRESHOLD) {
      areaResults.push({
        areaId: area._id,
        area: area.name,
        city: area.city,
        zone: area.zone || 'General Zone',
        landUse: area.landUse,
        latitude: area.latitude,
        longitude: area.longitude,
        averageTemperature: avgTemp,
        maximumTemperature: maxTemp,
        minimumTemperature: minTemp,
        observationCount: obsCount,
        highTempObservationCount: highTempCount,
        hotspotFrequency: 0,
        hotspotScore: null,
        severity: 'Insufficient Data',
        type: 'Insufficient Data',
        recentAverageTemperature: recentAvg,
        historicalAverageTemperature: historicalAvg,
        recentTemperatureChange: recentDelta,
        explanation: generateAreaExplanation(area.name, null, 'Insufficient Data', 'Insufficient Data', 0, 0, obsCount),
      });
      continue;
    }

    // Component normalization [0 - 100]
    const normAvg = Math.max(0, Math.min(100, ((avgTemp - globalMin) / tempSpan) * 100));
    const normMax = Math.max(0, Math.min(100, ((maxTemp - globalMin) / tempSpan) * 100));
    const normFreq = Math.max(0, Math.min(100, frequency));
    const persistenceScore = Math.max(0, Math.min(100, frequency * (distinctDatesCount >= 3 ? 1.0 : 0.6)));

    // Weighted composite Hotspot Score (0 - 100)
    const rawScore =
      DEFAULT_WEIGHTS.averageTemperatureWeight * normAvg +
      DEFAULT_WEIGHTS.maximumTemperatureWeight * normMax +
      DEFAULT_WEIGHTS.highTemperatureFrequencyWeight * normFreq +
      DEFAULT_WEIGHTS.persistenceWeight * persistenceScore;

    const hotspotScore = Math.round(Math.max(0, Math.min(100, rawScore)));
    const severity = classifySeverity(hotspotScore);
    const type = classifyHotspotType(frequency, recentDelta, obsCount, distinctDatesCount);

    areaResults.push({
      areaId: area._id,
      area: area.name,
      city: area.city,
      zone: area.zone || 'General Zone',
      landUse: area.landUse,
      latitude: area.latitude,
      longitude: area.longitude,
      averageTemperature: avgTemp,
      maximumTemperature: maxTemp,
      minimumTemperature: minTemp,
      observationCount: obsCount,
      highTempObservationCount: highTempCount,
      distinctHotspotDates: distinctDatesCount,
      hotspotFrequency: frequency,
      hotspotScore,
      severity,
      type,
      recentAverageTemperature: recentAvg,
      historicalAverageTemperature: historicalAvg,
      recentTemperatureChange: recentDelta,
      explanation: generateAreaExplanation(area.name, hotspotScore, severity, type, frequency, recentDelta, obsCount),
    });
  }

  return {
    threshold,
    percentile,
    totalObservations,
    areas: areaResults,
  };
};

/**
 * Returns High-Level Hotspot Summary KPIs.
 */
const getHotspotSummary = async (filters = {}, percentile = 90) => {
  const { threshold, totalObservations, areas } = await getHotspotMetrics(filters, { percentile });

  const validScoredAreas = areas.filter((a) => a.hotspotScore !== null);
  const hotspotAreas = validScoredAreas.filter((a) => a.hotspotScore >= 41); // High, Very High, Extreme
  const extremeHotspots = validScoredAreas.filter((a) => a.severity === 'Extreme');
  const persistentHotspots = validScoredAreas.filter((a) => a.type === 'Persistent Hotspot');

  const maxTemp = validScoredAreas.reduce((acc, a) => Math.max(acc, a.maximumTemperature), 0);
  const maxScore = validScoredAreas.reduce((acc, a) => Math.max(acc, a.hotspotScore), 0);
  const avgScore =
    validScoredAreas.length > 0
      ? Math.round(validScoredAreas.reduce((acc, a) => acc + a.hotspotScore, 0) / validScoredAreas.length)
      : 0;

  return {
    totalAreas: areas.length,
    hotspotAreas: hotspotAreas.length,
    extremeHotspotAreas: extremeHotspots.length,
    persistentHotspots: persistentHotspots.length,
    highestTemperature: maxTemp,
    highestHotspotScore: maxScore,
    averageHotspotScore: avgScore,
    hotspotThreshold: threshold,
    thresholdMethod: `${percentile}th Percentile Rule`,
    totalObservations,
    severityBreakdown: {
      extreme: extremeHotspots.length,
      veryHigh: validScoredAreas.filter((a) => a.severity === 'Very High').length,
      high: validScoredAreas.filter((a) => a.severity === 'High').length,
      moderate: validScoredAreas.filter((a) => a.severity === 'Moderate').length,
      low: validScoredAreas.filter((a) => a.severity === 'Low').length,
      insufficientData: areas.length - validScoredAreas.length,
    },
    typeBreakdown: {
      persistent: persistentHotspots.length,
      emerging: validScoredAreas.filter((a) => a.type === 'Emerging Hotspot').length,
      temporary: validScoredAreas.filter((a) => a.type === 'Temporary Hotspot').length,
      stable: validScoredAreas.filter((a) => a.type === 'Stable Low-Heat Area').length,
      insufficientData: areas.length - validScoredAreas.length,
    },
  };
};

/**
 * Returns Ranked Areas based on Hotspot Score or selected parameter.
 */
const getHotspotRankings = async (filters = {}, options = {}) => {
  const { sortBy = 'hotspotScore', order = 'desc', limit = 50, percentile = 90, severity, type } = options;
  const { threshold, areas } = await getHotspotMetrics(filters, { percentile });

  let filtered = [...areas];

  // Optional in-memory filters for severity and type
  if (severity && severity !== 'all' && severity !== 'All Severities') {
    filtered = filtered.filter((a) => a.severity.toLowerCase() === severity.toLowerCase());
  }
  if (type && type !== 'all' && type !== 'All Types') {
    filtered = filtered.filter((a) => a.type.toLowerCase() === type.toLowerCase());
  }

  // Sort areas
  const isAsc = order === 'asc';
  filtered.sort((a, b) => {
    const valA = a[sortBy] !== null ? a[sortBy] : (isAsc ? 9999 : -9999);
    const valB = b[sortBy] !== null ? b[sortBy] : (isAsc ? 9999 : -9999);
    if (typeof valA === 'string') {
      return isAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return isAsc ? valA - valB : valB - valA;
  });

  // Assign 1-indexed rankings
  const ranked = filtered.slice(0, Number(limit)).map((item, idx) => ({
    rank: idx + 1,
    ...item,
  }));

  return {
    threshold,
    percentile,
    totalCount: filtered.length,
    rankings: ranked,
  };
};

/**
 * Returns detailed hotspot profile for a specific Area.
 */
const getAreaHotspotDetails = async (areaId, filters = {}, percentile = 90) => {
  const { threshold, areas } = await getHotspotMetrics(filters, { percentile });
  const area = areas.find((a) => a.areaId.toString() === areaId.toString());

  if (!area) {
    throw new Error(`Area ${areaId} not found`);
  }

  // Rank position among all areas
  const sorted = [...areas].sort((a, b) => (b.hotspotScore || 0) - (a.hotspotScore || 0));
  const rank = sorted.findIndex((a) => a.areaId.toString() === areaId.toString()) + 1;

  return {
    ...area,
    rank,
    hotspotThreshold: threshold,
    thresholdMethod: `${percentile}th Percentile Rule`,
    methodologyNotes: 'Hotspot Score is a relative temperature and persistence index (0-100). It does not include population or vulnerability weights.',
  };
};

/**
 * Returns Hotspot Methodology documentation & formula weights.
 */
const getHotspotMethodology = () => {
  return {
    title: 'Urban Heat Hotspot Detection Methodology',
    formula: 'Hotspot Score = (0.30 × NormAvgTemp) + (0.20 × NormMaxTemp) + (0.30 × HotspotFrequency) + (0.20 × PersistenceScore)',
    weights: DEFAULT_WEIGHTS,
    thresholdMethods: [
      { name: '90th Percentile (Default)', value: 90, description: 'Classifies the top 10% highest dataset observations as high heat.' },
      { name: '85th Percentile', value: 85, description: 'Captures a broader set of elevated thermal observations.' },
      { name: '95th Percentile', value: 95, description: 'Isolates only the top 5% most severe thermal extremes.' },
    ],
    severityScales: [
      { range: '81 - 100', label: 'Extreme', description: 'Severe and sustained high-temperature cluster' },
      { range: '61 - 80', label: 'Very High', description: 'Consistently elevated baseline with frequent spikes' },
      { range: '41 - 60', label: 'High', description: 'Moderate heat persistence with periodic exceedances' },
      { range: '21 - 40', label: 'Moderate', description: 'Occasional mild heat events' },
      { range: '0 - 20', label: 'Low', description: 'Stable cooler thermal microclimate' },
    ],
    disclaimer:
      'This project-specific model identifies relative heat patterns in the available dataset. It is not an official government heat warning system.',
  };
};

module.exports = {
  calculateHotspotThreshold,
  getHotspotMetrics,
  getHotspotSummary,
  getHotspotRankings,
  getAreaHotspotDetails,
  getHotspotMethodology,
};
