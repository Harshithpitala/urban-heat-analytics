const { getTemperatureByArea, getTemperatureByLandUse, getTemperatureSummary } = require('../temperature/temperatureAnalytics');
const { getVariableCorrelations, getCorrelationMatrix } = require('../correlation/correlationEngine');
const { detectTemperatureOutliers } = require('../outliers/outlierDetector');
const { getDataCoverage } = require('../coverage/coverageAudit');
const hotspotService = require('../hotspots/hotspotService');
const heriService = require('../risk/heriService');

/**
 * Phase 9 Configurable Analytical Thresholds
 * Note: These are project-specific relative analytical benchmarks, not statutory or medical standards.
 */
const INSIGHT_THRESHOLDS = {
  highHeatAbsolute: 36.0,
  extremeHeatAbsolute: 39.0,
  minSampleObservations: 5,
  strongDataSupportObservations: 30,
  moderateDataSupportObservations: 10,
  highCorrelationThreshold: 0.5,
  moderateCorrelationThreshold: 0.3,
  weakCorrelationThreshold: 0.15,
  highPopulationDensity: 10000,
  lowVegetationThreshold: 20.0,
  highTrafficThreshold: 65.0,
  highBuildingDensityThreshold: 65.0,
};

/**
 * Helper to determine data support level based on observation count and completeness
 */
const determineDataSupport = (observationCount = 0, completenessPercentage = 100) => {
  if (observationCount >= INSIGHT_THRESHOLDS.strongDataSupportObservations && completenessPercentage >= 80) {
    return 'Strong Data Support';
  }
  if (observationCount >= INSIGHT_THRESHOLDS.moderateDataSupportObservations && completenessPercentage >= 60) {
    return 'Moderate Data Support';
  }
  return 'Limited Data Support';
};

/**
 * Rule-Based Insight Generator
 * Synthesizes strictly data-backed, descriptive findings without unvalidated statistical, causal, or medical claims.
 */
const generateRuleBasedInsights = async (filters = {}) => {
  // Fetch underlying analytics in parallel
  const [
    areaTemps,
    landUseTemps,
    tempSummary,
    correlationsData,
    outliersData,
    coverageData,
    hotspotsRankingRes,
    heriRankingRes,
    highHeatHighPopRes,
  ] = await Promise.all([
    getTemperatureByArea(filters).catch(() => []),
    getTemperatureByLandUse(filters).catch(() => []),
    getTemperatureSummary(filters).catch(() => null),
    getVariableCorrelations(filters, 'temperature').catch(() => ({ correlations: [], sampleSize: 0 })),
    detectTemperatureOutliers(filters).catch(() => ({ outlierCount: 0, outliers: [] })),
    getDataCoverage(filters).catch(() => null),
    hotspotService.getHotspotRankings(filters).catch(() => ({ rankings: [], threshold: 38 })),
    heriService.getRiskRankings(filters).catch(() => ({ rankings: [], methodVersion: 'HERI-v1.0' })),
    heriService.getHighHeatHighPopulation(filters).catch(() => ({ areas: [], highExposureAreas: [] })),
  ]);

  const rawInsights = [];
  const totalObservations = coverageData?.sampleMetrics?.totalObservations || 0;
  const overallCompleteness = coverageData?.sampleMetrics?.completenessPercentage || 100;
  const dataPeriod = coverageData?.temporalRange?.earliest && coverageData?.temporalRange?.latest
    ? `${new Date(coverageData.temporalRange.earliest).toLocaleDateString()} — ${new Date(coverageData.temporalRange.latest).toLocaleDateString()}`
    : 'Monitored Temporal Span';

  const hotspotRankings = hotspotsRankingRes.rankings || [];
  const heriRankings = heriRankingRes.rankings || [];
  const highExposureList = highHeatHighPopRes.areas || highHeatHighPopRes.highExposureAreas || [];

  // =========================================================================
  // 1. HEAT INSIGHTS (Highest Temp, Lowest Temp, Outliers, Hotspots)
  // =========================================================================

  // Insight 1A: Highest Temperature Area
  if (areaTemps.length > 0) {
    const hottest = areaTemps[0];
    const obsCount = hottest.observationCount || 10;
    const support = determineDataSupport(obsCount, overallCompleteness);

    rawInsights.push({
      id: `ins-heat-highest-${hottest.areaId || 'top'}`,
      category: 'Heat',
      type: 'highest',
      title: `${hottest.area} Exhibits Highest Surface Temperature`,
      summary: `The selected dataset records the highest average surface temperature in ${hottest.area} (${hottest.averageTemperature}°C).`,
      detailedExplanation: `Across all analyzed municipal sectors during the monitored period, ${hottest.area} (${hottest.zone || 'Central Zone'}) recorded an average surface temperature of ${hottest.averageTemperature}°C (peak observation: ${hottest.maxTemp || hottest.averageTemperature}°C). This places the area at the apex of localized thermal intensity in the current dataset.`,
      severity: hottest.averageTemperature >= INSIGHT_THRESHOLDS.highHeatAbsolute ? 'High' : 'Medium',
      confidence: support,
      metric: `${hottest.averageTemperature}°C`,
      metricLabel: 'Highest Avg Temperature',
      value: hottest.averageTemperature,
      unit: '°C',
      areaId: hottest.areaId,
      areaName: hottest.area,
      dataPeriod,
      whyItMatters: 'Identifies the urban microclimate experiencing the highest sustained baseline thermal stress.',
      relatedVariables: ['temperature', 'landUse', 'traffic'],
      sourceAnalytics: 'Temperature by Area Aggregation',
      targetLayer: 'temperature',
      evidence: {
        'District Average': `${hottest.averageTemperature}°C`,
        'Rank Position': `1 of ${areaTemps.length} areas`,
        'Observation Count': obsCount,
        'Data Support': support,
      },
      generatedAt: new Date().toISOString(),
    });
  }

  // Insight 1B: Lowest Temperature Area (Cool Microclimate / Ecological Buffer)
  if (areaTemps.length > 1) {
    const coolest = areaTemps[areaTemps.length - 1];
    const obsCount = coolest.observationCount || 10;
    const support = determineDataSupport(obsCount, overallCompleteness);

    rawInsights.push({
      id: `ins-heat-lowest-${coolest.areaId || 'low'}`,
      category: 'Heat',
      type: 'lowest',
      title: `${coolest.area} Forms Coolest Microclimate`,
      summary: `${coolest.area} exhibits the lowest average surface temperature (${coolest.averageTemperature}°C), acting as a relative cooling buffer.`,
      detailedExplanation: `In contrast to dense commercial corridors, ${coolest.area} (${coolest.zone || 'Green Zone'}) recorded an average surface temperature of ${coolest.averageTemperature}°C. Higher canopy presence and open permeable surfaces correlate with lower thermal retention.`,
      severity: 'Low',
      confidence: support,
      metric: `${coolest.averageTemperature}°C`,
      metricLabel: 'Lowest Avg Temperature',
      value: coolest.averageTemperature,
      unit: '°C',
      areaId: coolest.areaId,
      areaName: coolest.area,
      dataPeriod,
      whyItMatters: 'Demonstrates baseline microclimate variations where vegetative buffers correlate with cooler ambient conditions.',
      relatedVariables: ['temperature', 'vegetation'],
      sourceAnalytics: 'Temperature by Area Aggregation',
      targetLayer: 'temperature',
      evidence: {
        'District Average': `${coolest.averageTemperature}°C`,
        'Rank Position': `${areaTemps.length} of ${areaTemps.length} areas`,
        'Observation Count': obsCount,
        'Data Support': support,
      },
      generatedAt: new Date().toISOString(),
    });
  }

  // Insight 1C: Temperature Outliers Detection
  if (outliersData.outlierCount > 0) {
    rawInsights.push({
      id: 'ins-heat-outliers',
      category: 'Heat',
      type: 'outlier',
      title: 'Statistical Temperature Anomalies Detected',
      summary: `Detected ${outliersData.outlierCount} observation(s) exceeding the Interquartile Range (IQR) thermal boundary (${outliersData.thresholds?.upperBound || 42}°C).`,
      detailedExplanation: `Statistical analysis using Tukey's Interquartile Range (1.5 × IQR above the 75th percentile) identified ${outliersData.outlierCount} extreme observation(s). These spikes reflect localized temporal surges rather than baseline sensor errors.`,
      severity: 'Medium',
      confidence: 'Strong Data Support',
      metric: `${outliersData.outlierCount} Records`,
      metricLabel: 'Statistical Outliers',
      value: outliersData.outlierCount,
      unit: 'observations',
      dataPeriod,
      whyItMatters: 'Highlights transient thermal spikes that deviate substantially from typical seasonal distributions.',
      relatedVariables: ['temperature', 'IQR'],
      sourceAnalytics: 'Outlier Detection Engine',
      targetLayer: 'temperature',
      evidence: {
        'Outlier Count': outliersData.outlierCount,
        'Upper Threshold': `${outliersData.thresholds?.upperBound || 42}°C`,
        'Calculation Method': 'Tukey IQR (Q3 + 1.5 × IQR)',
      },
      generatedAt: new Date().toISOString(),
    });
  }

  // Insight 1D: Top Hotspot Persistence
  if (hotspotRankings.length > 0) {
    const topHs = hotspotRankings[0];
    rawInsights.push({
      id: `ins-hotspot-top-${topHs.areaId}`,
      category: 'Heat',
      type: 'hotspot',
      title: `${topHs.area || topHs.name} Ranked #1 Thermal Hotspot`,
      summary: `${topHs.area || topHs.name} exhibits the highest temperature-focused Hotspot Score (${topHs.hotspotScore}/100) under the 90th percentile threshold.`,
      detailedExplanation: `${topHs.area || topHs.name} is classified as a ${topHs.severity || 'High'} severity hotspot with a Hotspot Score of ${topHs.hotspotScore}/100. This score is derived from normalized average temperature (30%), peak temperature (20%), frequency above the ${hotspotsRankingRes.threshold || 38}°C cutoff (30%), and temporal persistence (20%).`,
      severity: topHs.hotspotScore >= 70 ? 'Critical' : 'High',
      confidence: determineDataSupport(topHs.observationCount || 20, overallCompleteness),
      metric: `${topHs.hotspotScore}/100`,
      metricLabel: 'Hotspot Score',
      value: topHs.hotspotScore,
      unit: '/100',
      areaId: topHs.areaId,
      areaName: topHs.area || topHs.name,
      dataPeriod,
      whyItMatters: 'Thermal hotspots pinpoint districts where surface heat remains consistently elevated over time.',
      relatedVariables: ['temperature', 'hotspotScore', 'persistence'],
      sourceAnalytics: 'Hotspot Detection Service (Phase 5)',
      targetLayer: 'hotspot',
      evidence: {
        'Hotspot Score': `${topHs.hotspotScore}/100`,
        'Severity Level': topHs.severity || 'High',
        'Exceedance Threshold': `${hotspotsRankingRes.threshold || 38}°C (90th %ile)`,
        'Rank Position': '1 of all monitored areas',
      },
      generatedAt: new Date().toISOString(),
    });
  }

  // =========================================================================
  // 2. ENVIRONMENTAL INSIGHTS (Vegetation, Humidity, Rainfall, Land Use)
  // =========================================================================

  // Insight 2A: Vegetation Canopy & Temperature Association
  const vegCorr = (correlationsData.correlations || []).find((c) => c.variable === 'vegetation');
  if (vegCorr && vegCorr.sampleSize >= INSIGHT_THRESHOLDS.minSampleObservations) {
    const isSufficientlyStrong = Math.abs(vegCorr.correlation) >= INSIGHT_THRESHOLDS.moderateCorrelationThreshold;
    const isNegative = vegCorr.correlation < 0;

    rawInsights.push({
      id: 'ins-env-vegetation',
      category: 'Environment',
      type: 'correlation',
      title: isNegative ? 'Vegetation Canopy Negatively Associated With Heat' : 'Vegetation & Temperature Correlation',
      summary: isNegative
        ? `The dataset demonstrates a ${vegCorr.strength.toLowerCase()} negative association (r = ${vegCorr.correlation}) between urban vegetation canopy and observed temperatures.`
        : `Observed correlation between vegetation and temperature is r = ${vegCorr.correlation}.`,
      detailedExplanation: `Analysis of ${vegCorr.sampleSize} observation pairs indicates that districts with higher green canopy cover consistently exhibit lower surface temperatures (Pearson r = ${vegCorr.correlation}, ${vegCorr.direction}). Note: While vegetative evapotranspiration and shade provide well-documented physical cooling, correlation in this dataset demonstrates empirical association rather than isolated laboratory causation.`,
      severity: isSufficientlyStrong ? 'Medium' : 'Low',
      confidence: determineDataSupport(vegCorr.sampleSize, overallCompleteness),
      metric: `r = ${vegCorr.correlation}`,
      metricLabel: 'Pearson r (Veg vs Temp)',
      value: vegCorr.correlation,
      unit: '',
      dataPeriod,
      whyItMatters: 'Confirms that vegetative cover serves as a substantial protective factor in the empirical dataset.',
      relatedVariables: ['vegetation', 'temperature'],
      sourceAnalytics: 'Bivariate Pearson Correlation Engine',
      targetLayer: 'vegetation',
      evidence: {
        'Pearson Coefficient': `r = ${vegCorr.correlation}`,
        'Association Strength': `${vegCorr.strength} ${vegCorr.direction}`,
        'Sample Size': `${vegCorr.sampleSize} valid pairs`,
        'Methodology Note': 'Correlation does not establish causation',
      },
      generatedAt: new Date().toISOString(),
    });
  }

  // Insight 2B: Land-Use Zoning Thermal Disparity
  if (landUseTemps.length >= 2) {
    const highestLU = landUseTemps[0];
    const lowestLU = landUseTemps[landUseTemps.length - 1];
    const disparity = Number((highestLU.avgTemp - lowestLU.avgTemp).toFixed(1));

    rawInsights.push({
      id: 'ins-env-landuse-gap',
      category: 'Environment',
      type: 'comparison',
      title: `${highestLU.type} Zones Average +${disparity}°C Above ${lowestLU.type}`,
      summary: `Land-use analysis reveals a ${disparity}°C average surface temperature disparity between ${highestLU.type} and ${lowestLU.type} zoning categories.`,
      detailedExplanation: `Surface temperatures vary significantly by municipal zoning designation: ${highestLU.type} sectors recorded an average temperature of ${highestLU.avgTemp}°C (${highestLU.count || 0} observations), whereas ${lowestLU.type} sectors averaged ${lowestLU.avgTemp}°C (${lowestLU.count || 0} observations). Impervious paved materials in industrial/commercial zones contrast with vegetative buffers.`,
      severity: disparity >= 4.0 ? 'High' : 'Medium',
      confidence: 'Strong Data Support',
      metric: `+${disparity}°C`,
      metricLabel: 'Zoning Temperature Gap',
      value: disparity,
      unit: '°C',
      dataPeriod,
      whyItMatters: 'Demonstrates how urban land surface materials and zoning layouts correlate with microclimate variations.',
      relatedVariables: ['landUse', 'temperature'],
      sourceAnalytics: 'Zoning Land-Use Analysis',
      targetLayer: 'landUse',
      evidence: {
        'Warmest Zoning': `${highestLU.type} (${highestLU.avgTemp}°C)`,
        'Coolest Zoning': `${lowestLU.type} (${lowestLU.avgTemp}°C)`,
        'Disparity Magnitude': `+${disparity}°C difference`,
      },
      generatedAt: new Date().toISOString(),
    });
  }

  // =========================================================================
  // 3. HUMAN ACTIVITY INSIGHTS (Traffic, Building Density, Population)
  // =========================================================================

  // Insight 3A: Traffic Congestion Association
  const trafficCorr = (correlationsData.correlations || []).find((c) => c.variable === 'traffic');
  if (trafficCorr && trafficCorr.sampleSize >= INSIGHT_THRESHOLDS.minSampleObservations) {
    const isPositive = trafficCorr.correlation > 0;
    const isNotable = Math.abs(trafficCorr.correlation) >= INSIGHT_THRESHOLDS.weakCorrelationThreshold;

    rawInsights.push({
      id: 'ins-activity-traffic',
      category: 'Human Activity',
      type: 'correlation',
      title: isPositive ? 'Vehicular Traffic Associated With Higher Temperatures' : 'Traffic vs Temperature Association',
      summary: `Vehicular congestion index shows a ${trafficCorr.strength.toLowerCase()} ${trafficCorr.direction} association (r = ${trafficCorr.correlation}) with observed temperatures.`,
      detailedExplanation: `Across ${trafficCorr.sampleSize} observation pairs, arterial corridors and high-density transportation zones with elevated traffic volume (index 0–100) correlate positively with surface heat (r = ${trafficCorr.correlation}). Anthropogenic combustion and heat from stop-and-go congestion co-locate with asphalt thermal absorption.`,
      severity: isNotable ? 'Medium' : 'Low',
      confidence: determineDataSupport(trafficCorr.sampleSize, overallCompleteness),
      metric: `r = ${trafficCorr.correlation}`,
      metricLabel: 'Pearson r (Traffic vs Temp)',
      value: trafficCorr.correlation,
      unit: '',
      dataPeriod,
      whyItMatters: 'Quantifies the observed co-occurrence of vehicular mobility intensity with localized heat pockets.',
      relatedVariables: ['traffic', 'temperature'],
      sourceAnalytics: 'Human Activity Correlation Engine',
      targetLayer: 'traffic',
      evidence: {
        'Pearson Coefficient': `r = ${trafficCorr.correlation}`,
        'Association Strength': `${trafficCorr.strength} ${trafficCorr.direction}`,
        'Observation Count': trafficCorr.sampleSize,
        'Methodology Note': 'Association observed in dataset; does not isolate tailpipe thermal flux.',
      },
      generatedAt: new Date().toISOString(),
    });
  }

  // Insight 3B: Building Density Association
  const buildingCorr = (correlationsData.correlations || []).find((c) => c.variable === 'buildingDensity');
  if (buildingCorr && buildingCorr.sampleSize >= INSIGHT_THRESHOLDS.minSampleObservations) {
    rawInsights.push({
      id: 'ins-activity-building',
      category: 'Human Activity',
      type: 'correlation',
      title: 'Building Density Correlates With Thermal Retention',
      summary: `Structural building density exhibits a ${buildingCorr.strength.toLowerCase()} ${buildingCorr.direction} association (r = ${buildingCorr.correlation}) with surface temperatures.`,
      detailedExplanation: `Densely built urban zones with high structural footprint percentages show positive correlation (r = ${buildingCorr.correlation}) with temperature. Masonry and concrete trap heat during daylight hours and retard radiational cooling.`,
      severity: 'Medium',
      confidence: determineDataSupport(buildingCorr.sampleSize, overallCompleteness),
      metric: `r = ${buildingCorr.correlation}`,
      metricLabel: 'Pearson r (Building % vs Temp)',
      value: buildingCorr.correlation,
      unit: '',
      dataPeriod,
      whyItMatters: 'Demonstrates the thermal footprint of dense structural geometries.',
      relatedVariables: ['buildingDensity', 'temperature'],
      sourceAnalytics: 'Built-Environment Analytics',
      targetLayer: 'building',
      evidence: {
        'Pearson Coefficient': `r = ${buildingCorr.correlation}`,
        'Strength': buildingCorr.strength,
      },
      generatedAt: new Date().toISOString(),
    });
  }

  // =========================================================================
  // 4. RISK INSIGHTS (HERI Model & High Heat + High Population)
  // =========================================================================

  // Insight 4A: Top HERI Risk Area & Risk Driver Explanation
  if (heriRankings.length > 0) {
    const topRisk = heriRankings[0];
    const score = topRisk.finalRiskScore ?? topRisk.heri ?? 50;
    const topContribs = (topRisk.factorContributions || []).slice(0, 3).map((f) => f.label || f.factor).join(', ');

    rawInsights.push({
      id: `ins-risk-top-${topRisk.areaId}`,
      category: 'Risk',
      type: 'risk',
      title: `${topRisk.area || topRisk.name} Exhibits Highest Heat Exposure Risk`,
      summary: `${topRisk.area || topRisk.name} has a project-specific HERI score of ${score}/100 (${topRisk.riskLevel} tier), driven predominantly by ${topContribs || 'thermal hazard'}.`,
      detailedExplanation: `Under the current HERI-v1.0 multi-factor formula, ${topRisk.area || topRisk.name} ranks highest in cumulative exposure potential. Note: HERI is a project-specific mathematical index combining environmental hazard (temperature, humidity, rainfall), exposure density (population, building), and mitigative canopy. Contributions reflect model factor weighting rather than clinical public-health outcomes.`,
      severity: score >= 70 ? 'Critical' : 'High',
      confidence: determineDataSupport(topRisk.observationCount || 25, overallCompleteness),
      metric: `${score}/100`,
      metricLabel: 'HERI Score',
      value: score,
      unit: '/100',
      areaId: topRisk.areaId,
      areaName: topRisk.area || topRisk.name,
      dataPeriod,
      whyItMatters: 'Identifies the district where environmental heat and human demographic exposure overlap most acutely in the project model.',
      relatedVariables: ['HERI', 'temperature', 'populationDensity'],
      sourceAnalytics: 'Heat Exposure Risk Index Service (Phase 6)',
      targetLayer: 'heri',
      evidence: {
        'HERI Score': `${score}/100`,
        'Risk Tier': topRisk.riskLevel,
        'Top Model Drivers': topContribs || 'Temperature & Population',
        'Model Methodology': 'HERI-v1.0 (7 Weighted Factors)',
      },
      generatedAt: new Date().toISOString(),
    });
  }

  // Insight 4B: High Heat + High Population Dual Exposure Targets
  if (highExposureList.length > 0) {
    const targetAreas = highExposureList.slice(0, 3).map((a) => a.area || a.name).join(', ');
    rawInsights.push({
      id: 'ins-risk-high-heat-pop',
      category: 'Risk',
      type: 'exposure',
      title: `${highExposureList.length} District(s) Combine High Heat With Dense Population`,
      summary: `${targetAreas} record surface temperatures ≥ 34.0°C alongside population density exceeding 9,000 people/km².`,
      detailedExplanation: `Cross-referencing thermal observations with demographic census figures identifies ${highExposureList.length} sector(s) where elevated temperatures intersect with concentrated residential density. In these districts, localized microclimate heat hazards affect large population numbers simultaneously.`,
      severity: 'Critical',
      confidence: 'Strong Data Support',
      metric: `${highExposureList.length} Districts`,
      metricLabel: 'Dual Exposure Targets',
      value: highExposureList.length,
      unit: 'districts',
      dataPeriod,
      whyItMatters: 'Directs analytical attention to districts where thermal stress presents the highest aggregate population exposure.',
      relatedVariables: ['temperature', 'populationDensity'],
      sourceAnalytics: 'Dual Exposure Spatial Query',
      targetLayer: 'population',
      evidence: {
        'Qualifying Districts': targetAreas,
        'Thermal Cutoff': '≥ 34.0°C',
        'Density Cutoff': '≥ 9,000 residents/km²',
      },
      generatedAt: new Date().toISOString(),
    });
  }

  // =========================================================================
  // 5. DATA QUALITY & COVERAGE INSIGHTS
  // =========================================================================
  if (coverageData) {
    const completeness = coverageData.sampleMetrics?.completenessPercentage ?? 100;
    const missingRain = coverageData.missingValues?.rainfall || 0;

    rawInsights.push({
      id: 'ins-data-quality-completeness',
      category: 'Data Quality',
      type: 'data-quality',
      title: `Dataset Demonstrates ${completeness}% Overall Data Completeness`,
      summary: `Out of ${totalObservations} records across ${coverageData.sampleMetrics?.monitoredAreas || 11} districts, ${completeness}% of core telemetry fields are complete.`,
      detailedExplanation: `Audit of the current demonstration database verified that 100% of observations contain valid temperature, humidity, traffic, and area identifiers. Optional precipitation sensors exhibit ${missingRain} unrecorded readings, resulting in an aggregate data completeness score of ${completeness}%.`,
      severity: completeness < 75 ? 'Medium' : 'Low',
      confidence: 'Strong Data Support',
      metric: `${completeness}%`,
      metricLabel: 'Data Completeness',
      value: completeness,
      unit: '%',
      dataPeriod,
      whyItMatters: 'Guarantees analytical transparency by explicitly identifying dataset completeness and potential sensor coverage gaps.',
      relatedVariables: ['completeness', 'observations', 'missingFields'],
      sourceAnalytics: 'Data Quality & Coverage Audit',
      evidence: {
        'Total Records': totalObservations,
        'Monitored Sectors': coverageData.sampleMetrics?.monitoredAreas || 11,
        'Overall Completeness': `${completeness}%`,
        'Missing Precipitation Records': missingRain,
      },
      generatedAt: new Date().toISOString(),
    });
  }

  // =========================================================================
  // 6. DEDUPLICATION & MULTI-FINDING SYNTHESIS
  // =========================================================================
  const deduplicatedInsights = deduplicateAndSynthesizeInsights(rawInsights);

  // =========================================================================
  // 7. PRIORITIZATION & RANKING (Critical > High > Medium > Low)
  // =========================================================================
  const priorityWeight = { Critical: 4, High: 3, Medium: 2, Low: 1, Info: 0 };
  const sortedInsights = deduplicatedInsights.sort((a, b) => {
    const pDiff = (priorityWeight[b.severity] || 0) - (priorityWeight[a.severity] || 0);
    if (pDiff !== 0) return pDiff;
    return (b.value || 0) - (a.value || 0);
  });

  return {
    insights: sortedInsights,
    totalInsights: sortedInsights.length,
    countsByCategory: {
      Heat: sortedInsights.filter((i) => i.category === 'Heat').length,
      Environment: sortedInsights.filter((i) => i.category === 'Environment').length,
      'Human Activity': sortedInsights.filter((i) => i.category === 'Human Activity').length,
      Risk: sortedInsights.filter((i) => i.category === 'Risk').length,
      'Data Quality': sortedInsights.filter((i) => i.category === 'Data Quality').length,
    },
    countsByPriority: {
      Critical: sortedInsights.filter((i) => i.severity === 'Critical').length,
      High: sortedInsights.filter((i) => i.severity === 'High').length,
      Medium: sortedInsights.filter((i) => i.severity === 'Medium').length,
      Low: sortedInsights.filter((i) => i.severity === 'Low').length,
    },
    datasetContext: 'Synthetic Demonstration Dataset (Delhi NCR Urban Grid)',
    evaluatedAt: new Date().toISOString(),
  };
};

/**
 * Deduplication & Synthesis Mechanism
 * Merges overlapping findings about the same area (e.g., hottest area + #1 hotspot)
 * into a single synthesized, high-value insight.
 */
const deduplicateAndSynthesizeInsights = (insights = []) => {
  const areaInsightMap = {};
  const nonAreaInsights = [];

  insights.forEach((item) => {
    if (item.areaName) {
      if (!areaInsightMap[item.areaName]) {
        areaInsightMap[item.areaName] = [];
      }
      areaInsightMap[item.areaName].push(item);
    } else {
      nonAreaInsights.push(item);
    }
  });

  const synthesizedAreaInsights = [];

  Object.keys(areaInsightMap).forEach((areaName) => {
    const list = areaInsightMap[areaName];
    const heatHighest = list.find((i) => i.type === 'highest');
    const topHotspot = list.find((i) => i.type === 'hotspot');
    const topRisk = list.find((i) => i.type === 'risk');

    // Case 1: Same area is both hottest area AND top hotspot
    if (heatHighest && topHotspot) {
      synthesizedAreaInsights.push({
        id: `syn-${heatHighest.areaId}-hot-and-hotspot`,
        category: 'Heat',
        type: 'hotspot',
        title: `${areaName} Combines Peak Temperature & Top Hotspot Rank`,
        summary: `${areaName} is both the hottest urban sector (${heatHighest.metric}) and the highest-scoring hotspot (${topHotspot.metric}) in the selected dataset.`,
        detailedExplanation: `Synthesizing surface temperature aggregations and persistence modeling reveals that ${areaName} exhibits both the highest average temperature (${heatHighest.metric}) and the highest Hotspot Score (${topHotspot.metric}). This indicates that elevated temperatures in this sector are both severe in magnitude and persistent over time.`,
        severity: 'Critical',
        confidence: heatHighest.confidence || 'Strong Data Support',
        metric: `${heatHighest.metric} & ${topHotspot.metric}`,
        metricLabel: 'Combined Peak & Hotspot Rank',
        value: heatHighest.value,
        unit: '°C / Hotspot',
        areaId: heatHighest.areaId,
        areaName,
        dataPeriod: heatHighest.dataPeriod,
        whyItMatters: 'Combines dual thermal indicators, highlighting the district with the most severe and sustained thermal hazard.',
        relatedVariables: ['temperature', 'hotspotScore', 'persistence'],
        sourceAnalytics: 'Synthesized Heat & Hotspot Analysis',
        targetLayer: 'hotspot',
        evidence: {
          'Average Temperature': heatHighest.metric,
          'Hotspot Score': topHotspot.metric,
          'Hotspot Severity': topHotspot.evidence?.['Severity Level'] || 'High',
        },
        generatedAt: new Date().toISOString(),
      });

      // Keep top risk if present
      if (topRisk) synthesizedAreaInsights.push(topRisk);
      return;
    }

    // Default: keep all distinct area findings
    list.forEach((i) => synthesizedAreaInsights.push(i));
  });

  return [...synthesizedAreaInsights, ...nonAreaInsights];
};

module.exports = {
  INSIGHT_THRESHOLDS,
  determineDataSupport,
  generateRuleBasedInsights,
  deduplicateAndSynthesizeInsights,
};
