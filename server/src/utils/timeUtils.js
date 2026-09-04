/**
 * Time utility functions for consistent temporal and seasonal extraction.
 * Timezone Strategy: UTC ISO standard timestamps are used for all stored MongoDB Date records.
 */

/**
 * Extracts zero-indexed or 1-indexed month number from a Date.
 * @param {Date|string} dateInput
 * @returns {number} Month number (1 for Jan, 12 for Dec)
 */
const getMonthNumber = (dateInput) => {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return null;
  return d.getUTCMonth() + 1;
};

/**
 * Derives standard meteorological season for environmental analysis:
 * - Winter: December, January, February (12, 1, 2)
 * - Spring: March, April, May (3, 4, 5)
 * - Summer: June, July, August (6, 7, 8)
 * - Autumn / Monsoon: September, October, November (9, 10, 11)
 * @param {Date|string} dateInput
 * @returns {string} Season name
 */
const getSeasonFromDate = (dateInput) => {
  const month = getMonthNumber(dateInput);
  if (!month) return 'Unknown';

  if (month === 12 || month === 1 || month === 2) {
    return 'Winter';
  } else if (month >= 3 && month <= 5) {
    return 'Spring';
  } else if (month >= 6 && month <= 8) {
    return 'Summer';
  } else {
    return 'Autumn';
  }
};

/**
 * Validates whether an input represents a valid date.
 * @param {any} dateInput
 * @returns {boolean}
 */
const isValidDate = (dateInput) => {
  if (!dateInput) return false;
  const d = new Date(dateInput);
  return !isNaN(d.getTime());
};

module.exports = {
  getMonthNumber,
  getSeasonFromDate,
  isValidDate,
};
