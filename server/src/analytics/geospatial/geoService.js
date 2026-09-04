const Area = require('../../models/Area');
const EnvironmentalRecord = require('../../models/EnvironmentalRecord');
const heriService = require('../risk/heriService');
const hotspotService = require('../hotspots/hotspotService');
const { normalizeAnalyticsFilters } = require('../utils/filterNormalizer');

/**
 * Validates geographic coordinates within valid world ranges.
 * @param {number} lat - Latitude (-90 to 90)
 * @param {number} lon - Longitude (-180 to 180)
 * @returns {boolean}
 */
const validateCoordinates = (lat, lon) => {
  if (lat === null || lat === undefined || lon === null || lon === undefined) return false;
  const numLat = Number(lat);
  const numLon = Number(lon);
  if (isNaN(numLat) || isNaN(numLon)) return false;
  if (numLat < -90 || numLat > 90) return false;
  if (numLon < -180 || numLon > 180) return false;
  return true;
};

/**
 * Computes bounding box and centroid from a list of points.
 * @param {Array} points - Array of objects with latitude and longitude
 */
const computeBoundsAndCentroid = (points) => {
  if (!points || points.length === 0) {
    return {
      centroid: [28.6139, 77.209], // Default fallback (Metro City center)
      bounds: [
        [28.4, 77.0],
        [28.8, 77.4],
      ],
      zoom: 11,
    };
  }

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLon = Infinity;
  let maxLon = -Infinity;
  let sumLat = 0;
  let sumLon = 0;

  for (const pt of points) {
    minLat = Math.min(minLat, pt.latitude);
    maxLat = Math.max(maxLat, pt.latitude);
    minLon = Math.min(minLon, pt.longitude);
    maxLon = Math.max(maxLon, pt.longitude);
    sumLat += pt.latitude;
    sumLon += pt.longitude;
  }

  const centerLat = Number((sumLat / points.length).toFixed(6));
  const centerLon = Number((sumLon / points.length).toFixed(6));

  return {
    centroid: [centerLat, centerLon],
    bounds: [
      [Number(minLat.toFixed(6)), Number(minLon.toFixed(6))],
      [Number(maxLat.toFixed(6)), Number(maxLon.toFixed(6))],
    ],
    zoom: 11,
  };
};

/**
 * Determines whether an area qualifies as High Heat + High Population
 * Based on relative thresholds: Temp >= 34°C and Pop Density >= 9,000 residents/km²
 */
const checkHighHeatHighPop = (temperature, populationDensity) => {
  const temp = Number(temperature) || 0;
  const pop = Number(populationDensity) || 0;
  return temp >= 34.0 && pop >= 9000;
};

/**
 * Core Geospatial Map Service
 * Combines Area coordinates, observational statistics, Hotspot Scores, and HERI Risk Scores.
 */
const getGeospatialAreas = async (filters = {}) => {
  // 1. Fetch risk rankings (which also aggregates raw environmental metrics)
  const riskResult = await heriService.getRiskRankings(filters);
  const riskRankings = riskResult.rankings || [];

  // 2. Fetch hotspot rankings for Hotspot Score integration
  const hotspotResult = await hotspotService.getHotspotRankings(filters);
  const hotspotRankings = hotspotResult.rankings || [];
  const hotspotMap = new Map(hotspotRankings.map((h) => [h.areaId.toString(), h]));

  const validMapAreas = [];
  let unavailableCount = 0;

  for (const r of riskRankings) {
    const lat = r.latitude;
    const lon = r.longitude;

    if (!validateCoordinates(lat, lon)) {
      unavailableCount++;
      continue;
    }

    const hs = hotspotMap.get(r.areaId.toString()) || {};
    const temp = r.rawMetrics?.temperature ?? 0;
    const pop = r.rawMetrics?.populationDensity ?? r.populationDensity ?? 0;
    const bldg = r.rawMetrics?.buildingDensity ?? r.buildingDensity ?? 0;
    const veg = r.rawMetrics?.vegetation ?? r.vegetation ?? 0;
    const traffic = r.rawMetrics?.traffic ?? 0;
    const hum = r.rawMetrics?.humidity ?? 0;
    const rain = r.rawMetrics?.rainfall ?? 0;

    const isHighHeatHighPop = checkHighHeatHighPop(temp, pop);

    // Apply special mode filter if specified
    if (filters.mode === 'high_heat_high_pop' && !isHighHeatHighPop) {
      continue;
    }

    validMapAreas.push({
      areaId: r.areaId,
      name: r.area,
      city: r.city || 'Metro City',
      zone: r.zone || 'General Zone',
      landUse: r.landUse || 'Mixed Use',
      latitude: Number(lat),
      longitude: Number(lon),
      coordinates: [Number(lon), Number(lat)], // Standard [longitude, latitude] GeoJSON order
      // Environmental & Risk Indicators
      temperature: temp,
      humidity: hum,
      rainfall: rain,
      traffic: traffic,
      populationDensity: pop,
      buildingDensity: bldg,
      vegetation: veg,
      // Phase 5 Hotspot Indicators
      hotspotScore: hs.hotspotScore !== undefined ? hs.hotspotScore : null,
      hotspotSeverity: hs.severity || 'Normal',
      hotspotType: hs.type || 'Stable Low-Heat',
      hotspotFrequency: hs.hotspotFrequency || 0,
      // Phase 6 HERI Indicators
      heri: r.finalRiskScore !== undefined ? r.finalRiskScore : null,
      riskLevel: r.riskLevel || 'Insufficient Data',
      dataCompleteness: r.dataCompleteness || 0,
      riskDriverSummary: r.riskDriverSummary || '',
      factorContributions: r.factorContributions || [],
      // Analytical Classifications
      isHighHeatHighPop,
      notes: 'Synthetic Demo Geographic Data',
    });
  }

  // Compute bounding box and centroid based on active, filtered areas
  const spatialMeta = computeBoundsAndCentroid(validMapAreas);

  return {
    areas: validMapAreas,
    totalAreas: validMapAreas.length,
    unavailableCount,
    centroid: spatialMeta.centroid,
    bounds: spatialMeta.bounds,
    zoom: spatialMeta.zoom,
  };
};

/**
 * Returns high-level spatial summary metrics for the map view.
 */
const getGeospatialSummary = async (filters = {}) => {
  const { areas, totalAreas, unavailableCount, centroid, bounds } = await getGeospatialAreas(filters);

  let totalHeri = 0;
  let scoredHeriCount = 0;
  let totalTemp = 0;
  let extremeCount = 0;
  let veryHighCount = 0;
  let highCount = 0;
  let highHeatHighPopCount = 0;

  for (const a of areas) {
    if (a.heri !== null && !isNaN(a.heri)) {
      totalHeri += a.heri;
      scoredHeriCount++;
    }
    totalTemp += a.temperature;

    if (a.riskLevel === 'Extreme') extremeCount++;
    else if (a.riskLevel === 'Very High') veryHighCount++;
    else if (a.riskLevel === 'High') highCount++;

    if (a.isHighHeatHighPop) highHeatHighPopCount++;
  }

  const avgHeri = scoredHeriCount > 0 ? Number((totalHeri / scoredHeriCount).toFixed(1)) : 0;
  const avgTemp = totalAreas > 0 ? Number((totalTemp / totalAreas).toFixed(1)) : 0;

  // Get total observation record count and date span from DB
  const recordCount = await EnvironmentalRecord.countDocuments();
  const dateSpan = await EnvironmentalRecord.aggregate([
    {
      $group: {
        _id: null,
        minDate: { $min: '$date' },
        maxDate: { $max: '$date' },
      },
    },
  ]);

  const minDate = dateSpan[0]?.minDate ? new Date(dateSpan[0].minDate).toISOString().split('T')[0] : '2026-05-01';
  const maxDate = dateSpan[0]?.maxDate ? new Date(dateSpan[0].maxDate).toISOString().split('T')[0] : '2026-09-30';

  return {
    areasShown: totalAreas,
    unavailableCount,
    extremeRiskCount: extremeCount,
    veryHighRiskCount: veryHighCount,
    highRiskCount: highCount,
    highHeatHighPopCount,
    averageHeri: avgHeri,
    averageTemperature: avgTemp,
    centroid,
    bounds,
    dataSource: {
      type: 'Synthetic Demo Geographic Data',
      totalRecords: recordCount,
      dateRange: `${minDate} to ${maxDate}`,
    },
    methodVersion: 'HERI-v1.0 / Geo-v1.0',
  };
};

/**
 * Returns RFC 7946 compliant GeoJSON FeatureCollection.
 */
const getGeospatialGeoJson = async (filters = {}) => {
  const { areas, unavailableCount, centroid, bounds } = await getGeospatialAreas(filters);

  const features = areas.map((a) => ({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [a.longitude, a.latitude], // GeoJSON standard [lon, lat]
    },
    properties: {
      areaId: a.areaId,
      name: a.name,
      city: a.city,
      zone: a.zone,
      landUse: a.landUse,
      temperature: a.temperature,
      humidity: a.humidity,
      rainfall: a.rainfall,
      traffic: a.traffic,
      populationDensity: a.populationDensity,
      buildingDensity: a.buildingDensity,
      vegetation: a.vegetation,
      hotspotScore: a.hotspotScore,
      hotspotSeverity: a.hotspotSeverity,
      hotspotType: a.hotspotType,
      heri: a.heri,
      riskLevel: a.riskLevel,
      dataCompleteness: a.dataCompleteness,
      isHighHeatHighPop: a.isHighHeatHighPop,
    },
  }));

  return {
    type: 'FeatureCollection',
    metadata: {
      count: features.length,
      unavailableCount,
      centroid,
      bounds,
      generatedAt: new Date().toISOString(),
    },
    features,
  };
};

module.exports = {
  validateCoordinates,
  computeBoundsAndCentroid,
  checkHighHeatHighPop,
  getGeospatialAreas,
  getGeospatialSummary,
  getGeospatialGeoJson,
};
