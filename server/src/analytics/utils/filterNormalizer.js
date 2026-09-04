const mongoose = require('mongoose');

/**
 * Normalized Filter Processor
 * Translates HTTP query parameters into uniform MongoDB $match query criteria.
 */
const normalizeAnalyticsFilters = (filters = {}) => {
  const match = {};

  // 1. City Filter
  if (filters.city && filters.city !== 'all' && filters.city !== 'All Cities') {
    match.city = new RegExp(`^${filters.city.trim()}$`, 'i');
  }

  // 2. Area Filter (supports ObjectId or Area Name)
  if (filters.area && filters.area !== 'all' && filters.area !== 'All Areas') {
    if (mongoose.Types.ObjectId.isValid(filters.area)) {
      match.area = new mongoose.Types.ObjectId(filters.area);
    } else {
      // Area name filter
      match.areaName = new RegExp(filters.area.trim(), 'i');
    }
  }

  // 3. Zone Filter
  if (filters.zone && filters.zone !== 'all' && filters.zone !== 'All Zones') {
    match.zone = new RegExp(`^${filters.zone.trim()}$`, 'i');
  }

  // 4. Land Use Filter
  if (filters.landUse && filters.landUse !== 'all' && filters.landUse !== 'All Land Uses') {
    match.landUse = new RegExp(`^${filters.landUse.trim()}$`, 'i');
  }

  // 5. Date Range Filter
  if (filters.startDate || filters.endDate) {
    match.date = {};
    if (filters.startDate) {
      const start = new Date(filters.startDate);
      if (!isNaN(start.getTime())) {
        match.date.$gte = start;
      }
    }
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      if (!isNaN(end.getTime())) {
        // If date string does not include time, include the full day
        if (filters.endDate.length <= 10) {
          end.setUTCHours(23, 59, 59, 999);
        }
        match.date.$lte = end;
      }
    }
    if (Object.keys(match.date).length === 0) {
      delete match.date;
    }
  }

  return match;
};

module.exports = {
  normalizeAnalyticsFilters,
};
