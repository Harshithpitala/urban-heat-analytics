const Area = require('../../models/Area');
const { getTemperatureByArea } = require('../temperature/temperatureAnalytics');
const { getVariableCorrelations } = require('../correlation/correlationEngine');
const { getTrafficByArea } = require('../humanActivity/humanActivityAnalytics');
const hotspotService = require('../hotspots/hotspotService');
const heriService = require('../risk/heriService');

/**
 * Phase 9 Configurable Recommendation Thresholds
 * Transparent, relative benchmarks for non-prescriptive urban planning considerations.
 */
const REC_THRESHOLDS = {
  highTemp: 35.0,
  moderateTemp: 33.0,
  lowVegetation: 25.0,
  veryLowVegetation: 15.0,
  highBuildingDensity: 70.0,
  veryHighBuildingDensity: 80.0,
  highTrafficFlow: 70.0,
  veryHighTrafficFlow: 80.0,
  highPopulationDensity: 9000,
  veryHighPopulationDensity: 12000,
  highHeriRisk: 60.0,
  criticalHeriRisk: 75.0,
};

/**
 * Generates transparent, explainable, rule-based recommendations.
 * Follows strict non-prescriptive phrasing ('evaluate', 'consider', 'prioritize monitoring').
 *
 * @param {Object} filters - Query filters (dateRange, season, landUse, etc.)
 * @returns {Promise<{ recommendations: Array, summary: Object }>}
 */
const generateRuleBasedRecommendations = async (filters = {}) => {
  const [
    areas,
    areaTemps,
    areaTraffic,
    tempCorrRes,
    hotspotRes,
    heriRes,
    highExposureRes,
  ] = await Promise.all([
    Area.find({}).lean().catch(() => []),
    getTemperatureByArea(filters).catch(() => []),
    getTrafficByArea(filters).catch(() => []),
    getVariableCorrelations(filters, 'temperature').catch(() => ({ correlations: [] })),
    hotspotService.getHotspotRankings(filters).catch(() => ({ rankings: [] })),
    heriService.getRiskRankings(filters).catch(() => ({ rankings: [] })),
    heriService.getHighHeatHighPopulation(filters).catch(() => ({ highExposureAreas: [] })),
  ]);

  // Create fast lookup maps by areaId or areaName
  const tempMap = new Map();
  areaTemps.forEach((t) => {
    tempMap.set(String(t.areaId || t.area), t);
    tempMap.set(String(t.area), t);
  });

  const trafficMap = new Map();
  areaTraffic.forEach((t) => {
    trafficMap.set(String(t.areaId || t.area), t);
    trafficMap.set(String(t.area), t);
  });

  const hotspotMap = new Map();
  (hotspotRes.rankings || []).forEach((h) => {
    hotspotMap.set(String(h.areaId || h.areaName), h);
    hotspotMap.set(String(h.areaName), h);
  });

  const heriMap = new Map();
  (heriRes.rankings || []).forEach((r) => {
    heriMap.set(String(r.areaId || r.areaName), r);
    heriMap.set(String(r.areaName), r);
  });

  const highExpSet = new Set(
    (highExposureRes.highExposureAreas || highExposureRes.areas || []).map((a) =>
      String(a.areaId || a.name || a.areaName)
    )
  );

  const rawRecs = [];

  // =========================================================================
  // 1. POPULATION EXPOSURE RECOMMENDATIONS
  // =========================================================================
  areas.forEach((area) => {
    const areaId = String(area._id);
    const tempInfo = tempMap.get(areaId) || tempMap.get(area.name);
    const heriInfo = heriMap.get(areaId) || heriMap.get(area.name);
    const avgTemp = tempInfo?.averageTemperature ?? 32.0;
    const heriScore = heriInfo?.heriScore ?? 50.0;
    const popDensity = area.populationDensity || 0;

    const isHighExposure =
      highExpSet.has(areaId) ||
      highExpSet.has(area.name) ||
      (popDensity >= REC_THRESHOLDS.highPopulationDensity && avgTemp >= REC_THRESHOLDS.highTemp);

    if (isHighExposure || (popDensity >= REC_THRESHOLDS.veryHighPopulationDensity && avgTemp >= REC_THRESHOLDS.moderateTemp)) {
      const isCritical = popDensity >= REC_THRESHOLDS.veryHighPopulationDensity || avgTemp >= 36.0 || heriScore >= REC_THRESHOLDS.criticalHeriRisk;

      rawRecs.push({
        id: `rec-pop-${areaId}`,
        category: 'Population Exposure',
        title: `Prioritize Thermal Monitoring & Pedestrian Shade in ${area.name}`,
        action: `Evaluate deploying shaded transit shelters, temporary misting stations, and drinking water access points along high-traffic pedestrian corridors in ${area.name}.`,
        reason: `High population density (${popDensity.toLocaleString()} people/km²) directly coincides with elevated mean temperatures (${avgTemp.toFixed(1)}°C) and a HERI risk score of ${heriScore.toFixed(1)}, amplifying aggregate human thermal exposure.`,
        priority: isCritical ? 'Critical' : 'High',
        timeHorizon: 'Immediate / Short-Term (0-6 months)',
        targetLayer: 'population',
        areaId,
        areaName: area.name,
        landUse: area.landUse || 'Mixed',
        coordinates: area.latitude && area.longitude ? { lat: area.latitude, lng: area.longitude } : (area.coordinates || null),
        supportingMetrics: {
          'Population Density': `${popDensity.toLocaleString()} /km²`,
          'Average Temperature': `${avgTemp.toFixed(1)}°C`,
          'HERI Risk Score': `${heriScore.toFixed(1)}/100`,
          'Land Use': area.landUse || 'Mixed',
        },
        potentialBenefits: [
          'Reduces peak solar radiation exposure for vulnerable transit commuters.',
          'Provides accessible hydration and cooling checkpoints during extreme afternoon hours.',
          'Targets civic resources where population density maximizes public health impact.',
        ],
        implementationConsiderations: 'Coordinate with municipal transit authorities to assess rights-of-way for rapid shade structure deployment.',
        confidence: 'Strong Data Support',
        createdAt: new Date().toISOString(),
      });
    }
  });

  // =========================================================================
  // 2. VEGETATION RECOMMENDATIONS
  // =========================================================================
  // Area-specific vegetation deficit
  areas.forEach((area) => {
    const areaId = String(area._id);
    const tempInfo = tempMap.get(areaId) || tempMap.get(area.name);
    const heriInfo = heriMap.get(areaId) || heriMap.get(area.name);
    const hotspotInfo = hotspotMap.get(areaId) || hotspotMap.get(area.name);

    const avgTemp = tempInfo?.averageTemperature ?? 32.0;
    const heriScore = heriInfo?.heriScore ?? 50.0;
    const hotspotScore = hotspotInfo?.hotspotScore ?? 40.0;
    const vegPct = area.vegetationCover !== undefined ? area.vegetationCover : (area.vegetation || 20);

    const isThermalHot = avgTemp >= REC_THRESHOLDS.moderateTemp || heriScore >= REC_THRESHOLDS.highHeriRisk || hotspotScore >= 50.0;
    const isVegDeficit = vegPct <= REC_THRESHOLDS.lowVegetation;

    if (isThermalHot && isVegDeficit) {
      const isCritical = vegPct <= REC_THRESHOLDS.veryLowVegetation && avgTemp >= REC_THRESHOLDS.highTemp;

      rawRecs.push({
        id: `rec-veg-${areaId}`,
        category: 'Vegetation',
        title: `Evaluate Urban Greening & Canopy Expansion in ${area.name}`,
        action: `Consider targeted tree canopy enhancement, pocket green spaces, and vertical vegetated facades in ${area.name} to rebuild natural evapotranspirative cooling capacity.`,
        reason: `Area records critically constrained vegetative cover (${vegPct.toFixed(1)}%) alongside elevated thermal indicators (${avgTemp.toFixed(1)}°C avg temp, ${hotspotScore.toFixed(1)} hotspot score).`,
        priority: isCritical ? 'Critical' : 'High',
        timeHorizon: 'Medium-Term (6-18 months)',
        targetLayer: 'vegetation',
        areaId,
        areaName: area.name,
        landUse: area.landUse || 'Urban',
        coordinates: area.latitude && area.longitude ? { lat: area.latitude, lng: area.longitude } : (area.coordinates || null),
        supportingMetrics: {
          'Vegetation Cover': `${vegPct.toFixed(1)}%`,
          'Average Temperature': `${avgTemp.toFixed(1)}°C`,
          'Hotspot Score': `${hotspotScore.toFixed(1)}/100`,
          'HERI Risk Score': `${heriScore.toFixed(1)}/100`,
        },
        potentialBenefits: [
          'Enhances microclimate cooling through sustained evapotranspiration.',
          'Increases solar interception, lowering surface pavement absorption.',
          'Improves local stormwater absorption and biodiversity.',
        ],
        implementationConsiderations: 'Prioritize drought-tolerant, low-water native tree species with broad canopy structures suitable for urban sidewalk pits.',
        confidence: 'Strong Data Support',
        createdAt: new Date().toISOString(),
      });
    }
  });

  // System-wide vegetation observation
  const vegCorr = (tempCorrRes.correlations || []).find((c) => c.variable === 'vegetation');
  if (vegCorr && vegCorr.pearsonR <= -0.3) {
    rawRecs.push({
      id: 'rec-veg-systemwide-canopy',
      category: 'Vegetation',
      title: 'City-Wide Canopy Preservation & Bioswale Strategy',
      action: 'Evaluate establishing minimum green-cover mandates for all municipal redevelopment projects and preserving mature tree clusters.',
      reason: `The dataset demonstrates a statistically meaningful negative correlation (r = ${vegCorr.pearsonR.toFixed(2)}) between vegetation coverage and surface temperatures across all monitored districts.`,
      priority: 'Medium',
      timeHorizon: 'Long-Term Strategic (1-3 years)',
      targetLayer: 'vegetation',
      areaId: null,
      areaName: 'City-Wide Portfolio',
      landUse: 'All Zones',
      coordinates: null,
      supportingMetrics: {
        'Vegetation Correlation (r)': vegCorr.pearsonR.toFixed(2),
        'Direction': 'Negative Association (More green = cooler temperatures)',
        'Significance': vegCorr.strength || 'Moderate',
      },
      potentialBenefits: [
        'Institutionalizes microclimate mitigation into master municipal planning.',
        'Prevents cumulative green infrastructure loss in rapidly developing zones.',
      ],
      implementationConsiderations: 'Requires cross-departmental coordination between urban zoning, parks and recreation, and transportation authorities.',
      confidence: 'Strong Data Support',
      createdAt: new Date().toISOString(),
    });
  }

  // =========================================================================
  // 3. URBAN DENSITY RECOMMENDATIONS
  // =========================================================================
  areas.forEach((area) => {
    const areaId = String(area._id);
    const tempInfo = tempMap.get(areaId) || tempMap.get(area.name);
    const bldDensity = area.buildingDensity || 0;
    const avgTemp = tempInfo?.averageTemperature ?? 32.0;

    if (bldDensity >= REC_THRESHOLDS.highBuildingDensity && avgTemp >= REC_THRESHOLDS.moderateTemp) {
      const isHighPriority = bldDensity >= REC_THRESHOLDS.veryHighBuildingDensity || avgTemp >= REC_THRESHOLDS.highTemp;

      rawRecs.push({
        id: `rec-dense-${areaId}`,
        category: 'Urban Density',
        title: `Evaluate Cool Roof & Reflective Surface Standards in ${area.name}`,
        action: `Explore municipal incentives for retrofitting flat commercial and residential rooftops with high-albedo cool roof membranes and converting impervious surface lots to permeable pavers.`,
        reason: `Dense building configuration (${bldDensity.toFixed(1)}% building density) combined with elevated average temperature (${avgTemp.toFixed(1)}°C) creates urban canyon heat trapping and limits radiative nocturnal cooling.`,
        priority: isHighPriority ? 'High' : 'Medium',
        timeHorizon: 'Medium-Term (6-18 months)',
        targetLayer: 'building',
        areaId,
        areaName: area.name,
        landUse: area.landUse || 'High Density',
        coordinates: area.latitude && area.longitude ? { lat: area.latitude, lng: area.longitude } : (area.coordinates || null),
        supportingMetrics: {
          'Building Density': `${bldDensity.toFixed(1)}%`,
          'Average Temperature': `${avgTemp.toFixed(1)}°C`,
          'Impervious Surface Index': `${Math.min(100, Math.round(bldDensity * 1.1))}%`,
        },
        potentialBenefits: [
          'Reduces sensible heat transfer from building envelopes into surrounding street canyons.',
          'Lowers building indoor cooling loads and energy expenditures.',
          'Reduces peak nighttime heat retention.',
        ],
        implementationConsiderations: 'Assess building code requirements for Solar Reflectance Index (SRI) >= 78 for flat roof replacements.',
        confidence: 'Moderate Data Support',
        createdAt: new Date().toISOString(),
      });
    }
  });

  // =========================================================================
  // 4. TRAFFIC RECOMMENDATIONS
  // =========================================================================
  areas.forEach((area) => {
    const areaId = String(area._id);
    const tempInfo = tempMap.get(areaId) || tempMap.get(area.name);
    const trafficInfo = trafficMap.get(areaId) || trafficMap.get(area.name);
    const trafficVal = trafficInfo?.traffic !== undefined ? trafficInfo.traffic : (area.trafficFlow || 50);
    const avgTemp = tempInfo?.averageTemperature ?? 32.0;

    if (trafficVal >= REC_THRESHOLDS.highTrafficFlow && avgTemp >= REC_THRESHOLDS.moderateTemp) {
      const isHighPriority = trafficVal >= REC_THRESHOLDS.veryHighTrafficFlow || avgTemp >= REC_THRESHOLDS.highTemp;

      rawRecs.push({
        id: `rec-traf-${areaId}`,
        category: 'Traffic',
        title: `Assess Shaded Transit Buffers & Flow Optimization in ${area.name}`,
        action: `Consider evaluating targeted roadside bioswales, reflective bus-lane surfacing, and signal-optimized traffic progression along primary arterial corridors in ${area.name}.`,
        reason: `High vehicular traffic flow index (${trafficVal.toFixed(1)}/100) coincides with elevated localized temperatures (${avgTemp.toFixed(1)}°C), indicating combined anthropogenic heat dissipation and pedestrian transit exposure.`,
        priority: isHighPriority ? 'High' : 'Medium',
        timeHorizon: 'Immediate / Short-Term (0-6 months)',
        targetLayer: 'traffic',
        areaId,
        areaName: area.name,
        landUse: area.landUse || 'Transit Corridor',
        coordinates: area.latitude && area.longitude ? { lat: area.latitude, lng: area.longitude } : (area.coordinates || null),
        supportingMetrics: {
          'Traffic Flow Index': `${trafficVal.toFixed(1)}/100`,
          'Average Temperature': `${avgTemp.toFixed(1)}°C`,
          'Anthropogenic Heat Indicator': trafficVal >= 75 ? 'Elevated' : 'Moderate',
        },
        potentialBenefits: [
          'Decreases localized vehicular idle times and associated engine heat dissipation.',
          'Buffers active sidewalk users from direct roadside thermal plumes.',
          'Integrates stormwater drainage with microclimate cooling along major roads.',
        ],
        implementationConsiderations: 'Pilot adaptive signal timing along high-congestion intersections to minimize vehicular queueing during afternoon thermal peaks.',
        confidence: 'Moderate Data Support',
        createdAt: new Date().toISOString(),
      });
    }
  });

  // =========================================================================
  // 5. LAND USE SPECIFIC RECOMMENDATIONS
  // =========================================================================
  areas.forEach((area) => {
    const areaId = String(area._id);
    const tempInfo = tempMap.get(areaId) || tempMap.get(area.name);
    const avgTemp = tempInfo?.averageTemperature ?? 32.0;
    const landUse = (area.landUse || '').toLowerCase();

    // Industrial land use recommendation
    if (landUse.includes('industrial') && avgTemp >= REC_THRESHOLDS.moderateTemp) {
      rawRecs.push({
        id: `rec-lu-ind-${areaId}`,
        category: 'Land Use',
        title: `Establish Industrial Perimeter Thermal Buffer in ${area.name}`,
        action: `Evaluate perimeter tree buffers and cool storage yard paving standards around heavy industrial facilities in ${area.name} to buffer thermal spillover into adjacent residential sectors.`,
        reason: `Industrial zoning in ${area.name} combines large expansive roof surfaces, heavy transport staging, and elevated average temperatures (${avgTemp.toFixed(1)}°C).`,
        priority: 'High',
        timeHorizon: 'Long-Term Strategic (1-3 years)',
        targetLayer: 'landUse',
        areaId,
        areaName: area.name,
        landUse: area.landUse,
        coordinates: area.latitude && area.longitude ? { lat: area.latitude, lng: area.longitude } : (area.coordinates || null),
        supportingMetrics: {
          'Zoning Classification': area.landUse,
          'Average Temperature': `${avgTemp.toFixed(1)}°C`,
          'Buffer Recommendation': '15-meter dense vegetative boundary',
        },
        potentialBenefits: [
          'Insulates surrounding neighborhoods from industrial heat island spillover.',
          'Provides dual acoustic and particulate matter absorption benefits.',
        ],
        implementationConsiderations: 'Work with industrial facility operators on joint greening covenants and perimeter landscaping.',
        confidence: 'Moderate Data Support',
        createdAt: new Date().toISOString(),
      });
    }

    // Commercial land use recommendation
    if (landUse.includes('commercial') && avgTemp >= REC_THRESHOLDS.moderateTemp) {
      rawRecs.push({
        id: `rec-lu-comm-${areaId}`,
        category: 'Land Use',
        title: `Incorporate Pedestrian Arcade Shading in ${area.name} Commercial Core`,
        action: `Explore architectural guidelines for continuous sidewalk awnings, colonnades, and covered walkways along primary commercial shopping strips in ${area.name}.`,
        reason: `Commercial core features dense daytime pedestrian activity amidst elevated ambient surface heat (${avgTemp.toFixed(1)}°C) and high thermal massing.`,
        priority: 'Medium',
        timeHorizon: 'Medium-Term (6-18 months)',
        targetLayer: 'landUse',
        areaId,
        areaName: area.name,
        landUse: area.landUse,
        coordinates: area.latitude && area.longitude ? { lat: area.latitude, lng: area.longitude } : (area.coordinates || null),
        supportingMetrics: {
          'Zoning Classification': area.landUse,
          'Average Temperature': `${avgTemp.toFixed(1)}°C`,
          'Pedestrian Footfall': 'High Daytime Commercial Activity',
        },
        potentialBenefits: [
          'Protects retail foot traffic from direct solar radiation.',
          'Supports outdoor commercial vitality during warm weather periods.',
        ],
        implementationConsiderations: 'Integrate canopy requirements into commercial facade improvement grant programs.',
        confidence: 'Moderate Data Support',
        createdAt: new Date().toISOString(),
      });
    }
  });

  // Priority weight sorting order
  const priorityWeight = { Critical: 4, High: 3, Medium: 2, Low: 1 };
  rawRecs.sort((a, b) => {
    const pDiff = (priorityWeight[b.priority] || 1) - (priorityWeight[a.priority] || 1);
    if (pDiff !== 0) return pDiff;
    return a.title.localeCompare(b.title);
  });

  // Deduplication by ID
  const seenIds = new Set();
  const dedupedRecs = rawRecs.filter((r) => {
    if (seenIds.has(r.id)) return false;
    seenIds.add(r.id);
    return true;
  });

  // Summary aggregation
  const summary = {
    totalRecommendations: dedupedRecs.length,
    byCategory: {
      'Vegetation': dedupedRecs.filter((r) => r.category === 'Vegetation').length,
      'Urban Density': dedupedRecs.filter((r) => r.category === 'Urban Density').length,
      'Traffic': dedupedRecs.filter((r) => r.category === 'Traffic').length,
      'Population Exposure': dedupedRecs.filter((r) => r.category === 'Population Exposure').length,
      'Land Use': dedupedRecs.filter((r) => r.category === 'Land Use').length,
    },
    byPriority: {
      'Critical': dedupedRecs.filter((r) => r.priority === 'Critical').length,
      'High': dedupedRecs.filter((r) => r.priority === 'High').length,
      'Medium': dedupedRecs.filter((r) => r.priority === 'Medium').length,
      'Low': dedupedRecs.filter((r) => r.priority === 'Low').length,
    },
    topActionAreas: Array.from(
      new Set(
        dedupedRecs
          .filter((r) => r.areaName && r.areaName !== 'City-Wide Portfolio')
          .map((r) => r.areaName)
      )
    ).slice(0, 5),
    generatedAt: new Date().toISOString(),
  };

  return {
    recommendations: dedupedRecs,
    summary,
  };
};

module.exports = {
  REC_THRESHOLDS,
  generateRuleBasedRecommendations,
};
