const EnvironmentalRecord = require('../../models/EnvironmentalRecord');
const { normalizeAnalyticsFilters } = require('../utils/filterNormalizer');
const { calculatePearsonCorrelation, CORRELATION_DISCLAIMER } = require('../utils/statsMath');

const CORRELATION_VARIABLES = [
  { key: 'temperature', label: 'Temperature (°C)' },
  { key: 'humidity', label: 'Humidity (%)' },
  { key: 'rainfall', label: 'Rainfall (mm)' },
  { key: 'vegetation', label: 'Vegetation (%)' },
  { key: 'traffic', label: 'Traffic Index' },
  { key: 'populationDensity', label: 'Population Density' },
  { key: 'buildingDensity', label: 'Building Density (%)' },
];

/**
 * Calculates a complete 7x7 Pearson correlation matrix across all numeric variables.
 */
const getCorrelationMatrix = async (filters = {}) => {
  const matchStage = normalizeAnalyticsFilters(filters);

  // Retrieve observation records
  const records = await EnvironmentalRecord.find(matchStage)
    .select('temperature humidity rainfall vegetation traffic populationDensity buildingDensity')
    .limit(2000)
    .lean();

  const keys = CORRELATION_VARIABLES.map((v) => v.key);
  const dataArrays = {};
  keys.forEach((k) => (dataArrays[k] = []));

  records.forEach((r) => {
    // Only include rows where all numeric variables are valid
    const allValid = keys.every((k) => typeof r[k] === 'number' && !isNaN(r[k]));
    if (allValid) {
      keys.forEach((k) => dataArrays[k].push(r[k]));
    }
  });

  const matrix = [];
  for (let i = 0; i < keys.length; i++) {
    const row = [];
    for (let j = 0; j < keys.length; j++) {
      if (i === j) {
        row.push({
          var1: keys[i],
          var2: keys[j],
          correlation: 1.0,
          strength: 'Perfect',
          direction: 'positive',
        });
      } else {
        const corr = calculatePearsonCorrelation(dataArrays[keys[i]], dataArrays[keys[j]]);
        row.push({
          var1: keys[i],
          var2: keys[j],
          correlation: corr.correlation,
          strength: corr.strength,
          direction: corr.direction,
        });
      }
    }
    matrix.push(row);
  }

  return {
    variables: CORRELATION_VARIABLES,
    matrix,
    sampleSize: dataArrays.temperature.length,
    disclaimer: CORRELATION_DISCLAIMER,
  };
};

/**
 * Returns pairwise correlations between target variable and all other variables.
 */
const getVariableCorrelations = async (filters = {}, target = 'temperature') => {
  const matchStage = normalizeAnalyticsFilters(filters);

  const records = await EnvironmentalRecord.find(matchStage)
    .select('temperature humidity rainfall vegetation traffic populationDensity buildingDensity')
    .limit(2000)
    .lean();

  const keys = CORRELATION_VARIABLES.map((v) => v.key).filter((k) => k !== target);
  const targetArr = [];
  const otherArrays = {};
  keys.forEach((k) => (otherArrays[k] = []));

  records.forEach((r) => {
    if (typeof r[target] === 'number') {
      targetArr.push(r[target]);
      keys.forEach((k) => {
        otherArrays[k].push(typeof r[k] === 'number' ? r[k] : 0);
      });
    }
  });

  const correlations = keys.map((key) => {
    const meta = CORRELATION_VARIABLES.find((v) => v.key === key);
    const corr = calculatePearsonCorrelation(otherArrays[key], targetArr);
    return {
      variable: key,
      label: meta ? meta.label : key,
      target,
      correlation: corr.correlation,
      strength: corr.strength,
      direction: corr.direction,
      summary: corr.summary,
      sampleSize: corr.sampleSize,
    };
  });

  // Sort by absolute correlation magnitude descending
  correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));

  return {
    target,
    correlations,
    sampleSize: targetArr.length,
    disclaimer: CORRELATION_DISCLAIMER,
  };
};

module.exports = {
  CORRELATION_VARIABLES,
  getCorrelationMatrix,
  getVariableCorrelations,
};
