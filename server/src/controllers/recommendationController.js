const {
  generateRuleBasedRecommendations,
} = require('../analytics/recommendations/recommendationEngine');
const { successResponse, errorResponse } = require('../utils/response');

// Memory cache for active recommendations
let recCache = {
  data: null,
  cachedAt: null,
  cacheKey: '',
};

const getCacheKey = (filters = {}) => JSON.stringify(filters);

const getCachedOrFreshRecommendations = async (filters = {}) => {
  const key = getCacheKey(filters);
  const now = Date.now();
  if (recCache.data && recCache.cacheKey === key && now - recCache.cachedAt < 60000) {
    return recCache.data;
  }

  const result = await generateRuleBasedRecommendations(filters);
  recCache = {
    data: result,
    cachedAt: now,
    cacheKey: key,
  };

  return result;
};

/**
 * GET /api/recommendations
 * Filterable, searchable list of rule-based planning recommendations.
 */
const getRecommendations = async (req, res, next) => {
  try {
    const {
      category,
      priority,
      area,
      landUse,
      search,
      limit,
      page = 1,
      ...filters
    } = req.query;

    const { recommendations, summary } = await getCachedOrFreshRecommendations(filters);
    let filtered = [...recommendations];

    // Filter by category
    if (category && category.toLowerCase() !== 'all') {
      filtered = filtered.filter(
        (r) => (r.category || '').toLowerCase() === category.toLowerCase()
      );
    }

    // Filter by priority
    if (priority && priority.toLowerCase() !== 'all') {
      filtered = filtered.filter(
        (r) => (r.priority || '').toLowerCase() === priority.toLowerCase()
      );
    }

    // Filter by area
    if (area && area.toLowerCase() !== 'all') {
      filtered = filtered.filter(
        (r) =>
          (r.areaName || '').toLowerCase().includes(area.toLowerCase()) ||
          String(r.areaId || '') === String(area)
      );
    }

    // Filter by land use
    if (landUse && landUse.toLowerCase() !== 'all') {
      filtered = filtered.filter(
        (r) => (r.landUse || '').toLowerCase() === landUse.toLowerCase()
      );
    }

    // Search query
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(
        (r) =>
          (r.title || '').toLowerCase().includes(q) ||
          (r.action || '').toLowerCase().includes(q) ||
          (r.reason || '').toLowerCase().includes(q) ||
          (r.areaName || '').toLowerCase().includes(q) ||
          (r.category || '').toLowerCase().includes(q)
      );
    }

    const totalCount = filtered.length;
    let paginated = filtered;
    if (limit && !isNaN(Number(limit))) {
      const numLimit = parseInt(limit, 10);
      const numPage = parseInt(page, 10) || 1;
      const start = (numPage - 1) * numLimit;
      paginated = filtered.slice(start, start + numLimit);
    }

    return res.status(200).json({
      success: true,
      data: paginated,
      meta: {
        total: totalCount,
        count: paginated.length,
        page: parseInt(page, 10) || 1,
        limit: limit ? parseInt(limit, 10) : totalCount,
        summary,
        categories: ['Vegetation', 'Urban Density', 'Traffic', 'Population Exposure', 'Land Use'],
        priorities: ['Critical', 'High', 'Medium', 'Low'],
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/recommendations/summary
 * Summary metrics of generated recommendations.
 */
const getRecommendationsSummary = async (req, res, next) => {
  try {
    const { summary } = await getCachedOrFreshRecommendations(req.query);
    return successResponse(res, summary, 'Recommendations summary retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/recommendations/:id
 * Retrieve single recommendation with extensive planning rationale and metrics.
 */
const getRecommendationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { recommendations } = await getCachedOrFreshRecommendations(req.query);
    const rec = recommendations.find((r) => String(r.id) === String(id));

    if (!rec) {
      return errorResponse(res, `Recommendation with ID '${id}' not found`, 404);
    }

    return successResponse(res, rec, 'Recommendation details retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRecommendations,
  getRecommendationsSummary,
  getRecommendationById,
};
