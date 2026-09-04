/**
 * Statistical Math Utilities
 * Pure mathematical routines for descriptive statistics, Pearson correlation, IQR outlier detection, and interpretation.
 */

const CORRELATION_DISCLAIMER =
  'Correlation indicates descriptive association between variables. It does not prove that one variable causes the other.';

/**
 * Calculates arithmetic mean.
 */
const calculateMean = (numbers) => {
  if (!numbers || numbers.length === 0) return 0;
  const sum = numbers.reduce((acc, val) => acc + val, 0);
  return Number((sum / numbers.length).toFixed(2));
};

/**
 * Calculates median.
 */
const calculateMedian = (numbers) => {
  if (!numbers || numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  return Number(median.toFixed(2));
};

/**
 * Calculates sample standard deviation.
 */
const calculateStdDev = (numbers) => {
  if (!numbers || numbers.length <= 1) return 0;
  const mean = numbers.reduce((acc, val) => acc + val, 0) / numbers.length;
  const variance = numbers.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (numbers.length - 1);
  return Number(Math.sqrt(variance).toFixed(2));
};

/**
 * Calculates Interquartile Range (IQR) and identifies bounds.
 */
const calculateIQR = (numbers) => {
  if (!numbers || numbers.length < 4) {
    return { q1: 0, median: 0, q3: 0, iqr: 0, lowerBound: 0, upperBound: 0 };
  }
  const sorted = [...numbers].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const median = calculateMedian(sorted);
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = Number((q3 - q1).toFixed(2));
  const lowerBound = Number((q1 - 1.5 * iqr).toFixed(2));
  const upperBound = Number((q3 + 1.5 * iqr).toFixed(2));

  return { q1, median, q3, iqr, lowerBound, upperBound };
};

/**
 * Interprets Pearson correlation coefficient strength.
 * 0.00-0.19: Very weak
 * 0.20-0.39: Weak
 * 0.40-0.59: Moderate
 * 0.60-0.79: Strong
 * 0.80-1.00: Very strong
 */
const interpretCorrelation = (r) => {
  const absR = Math.abs(r);
  let strength = 'Very weak';
  if (absR >= 0.8) strength = 'Very strong';
  else if (absR >= 0.6) strength = 'Strong';
  else if (absR >= 0.4) strength = 'Moderate';
  else if (absR >= 0.2) strength = 'Weak';

  let direction = 'near-zero';
  if (r > 0.05) direction = 'positive';
  else if (r < -0.05) direction = 'negative';

  return {
    strength,
    direction,
    summary: `${strength} ${direction} association`,
  };
};

/**
 * Calculates Pearson correlation coefficient (r) between two numeric arrays.
 */
const calculatePearsonCorrelation = (xArr, yArr) => {
  if (!xArr || !yArr || xArr.length !== yArr.length || xArr.length < 3) {
    return {
      correlation: 0,
      strength: 'Insufficient data',
      direction: 'neutral',
      sampleSize: xArr ? xArr.length : 0,
      disclaimer: CORRELATION_DISCLAIMER,
    };
  }

  const n = xArr.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  let sumY2 = 0;

  for (let i = 0; i < n; i++) {
    const x = xArr[i];
    const y = yArr[i];
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
    sumY2 += y * y;
  }

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  if (denominator === 0) {
    return {
      correlation: 0,
      strength: 'Constant variable',
      direction: 'near-zero',
      sampleSize: n,
      disclaimer: CORRELATION_DISCLAIMER,
    };
  }

  const r = Number(Math.max(-1, Math.min(1, numerator / denominator)).toFixed(2));
  const { strength, direction, summary } = interpretCorrelation(r);

  return {
    correlation: r,
    strength,
    direction,
    summary,
    sampleSize: n,
    disclaimer: CORRELATION_DISCLAIMER,
  };
};

module.exports = {
  CORRELATION_DISCLAIMER,
  calculateMean,
  calculateMedian,
  calculateStdDev,
  calculateIQR,
  interpretCorrelation,
  calculatePearsonCorrelation,
};
