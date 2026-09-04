const {
  generateRuleBasedInsights,
  deduplicateAndSynthesizeInsights,
} = require('../analytics/insights/insightEngine');
const { successResponse, errorResponse } = require('../utils/response');

// Memory cache for active insight evaluation
let insightCache = {
  data: null,
  cachedAt: null,
  cacheKey: '',
};

const getCacheKey = (filters = {}) => JSON.stringify(filters);

const getCachedOrFreshInsights = async (filters = {}) => {
  const key = getCacheKey(filters);
  const now = Date.now();
  // 60-second cache window
  if (insightCache.data && insightCache.cacheKey === key && now - insightCache.cachedAt < 60000) {
    return insightCache.data;
  }

  const rawRes = await generateRuleBasedInsights(filters);
  const rawInsights = Array.isArray(rawRes) ? rawRes : (rawRes.insights || []);
  const synthesized = deduplicateAndSynthesizeInsights(rawInsights);

  insightCache = {
    data: synthesized,
    cachedAt: now,
    cacheKey: key,
  };

  return synthesized;
};

/**
 * GET /api/insights
 * Filterable, searchable, sorted list of data-driven insights.
 */
const getInsights = async (req, res, next) => {
  try {
    const {
      category,
      priority,
      severity,
      area,
      landUse,
      search,
      limit,
      page = 1,
      ...filters
    } = req.query;

    const allInsights = await getCachedOrFreshInsights(filters);
    let filtered = [...allInsights];

    // Filter by category
    if (category && category.toLowerCase() !== 'all') {
      filtered = filtered.filter(
        (i) => (i.category || '').toLowerCase() === category.toLowerCase()
      );
    }

    // Filter by priority / severity
    const targetSeverity = priority || severity;
    if (targetSeverity && targetSeverity.toLowerCase() !== 'all') {
      filtered = filtered.filter(
        (i) => (i.severity || '').toLowerCase() === targetSeverity.toLowerCase()
      );
    }

    // Filter by area
    if (area && area.toLowerCase() !== 'all') {
      filtered = filtered.filter(
        (i) =>
          (i.areaName || '').toLowerCase().includes(area.toLowerCase()) ||
          String(i.areaId || '') === String(area)
      );
    }

    // Filter by land use
    if (landUse && landUse.toLowerCase() !== 'all') {
      filtered = filtered.filter(
        (i) => (i.landUse || '').toLowerCase() === landUse.toLowerCase()
      );
    }

    // Free text search
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(
        (i) =>
          (i.title || '').toLowerCase().includes(q) ||
          (i.summary || '').toLowerCase().includes(q) ||
          (i.detailedExplanation || '').toLowerCase().includes(q) ||
          (i.areaName || '').toLowerCase().includes(q) ||
          (i.category || '').toLowerCase().includes(q)
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
        categories: ['Heat', 'Environment', 'Human Activity', 'Risk', 'Data Quality'],
        severities: ['Critical', 'High', 'Medium', 'Low'],
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/insights/summary
 * KPI summary statistics for the insights engine.
 */
const getInsightsSummary = async (req, res, next) => {
  try {
    const allInsights = await getCachedOrFreshInsights(req.query);

    const summary = {
      totalInsights: allInsights.length,
      byCategory: {
        Heat: allInsights.filter((i) => i.category === 'Heat').length,
        Environment: allInsights.filter((i) => i.category === 'Environment').length,
        'Human Activity': allInsights.filter((i) => i.category === 'Human Activity').length,
        Risk: allInsights.filter((i) => i.category === 'Risk').length,
        'Data Quality': allInsights.filter((i) => i.category === 'Data Quality').length,
      },
      byPriority: {
        Critical: allInsights.filter((i) => i.severity === 'Critical').length,
        High: allInsights.filter((i) => i.severity === 'High').length,
        Medium: allInsights.filter((i) => i.severity === 'Medium').length,
        Low: allInsights.filter((i) => i.severity === 'Low').length,
      },
      byDataSupport: {
        'Strong Data Support': allInsights.filter((i) => i.confidence === 'Strong Data Support').length,
        'Moderate Data Support': allInsights.filter((i) => i.confidence === 'Moderate Data Support').length,
        'Limited Data Support': allInsights.filter((i) => i.confidence === 'Limited Data Support').length,
      },
      criticalInsights: allInsights.filter((i) => i.severity === 'Critical').slice(0, 3),
      topAreasMentioned: Array.from(
        new Set(
          allInsights
            .filter((i) => i.areaName && !i.areaName.includes('Multi-Area'))
            .map((i) => i.areaName)
        )
      ).slice(0, 5),
      generatedAt: new Date().toISOString(),
    };

    return successResponse(res, summary, 'Insights summary retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/insights/:id
 * Detailed insight inspection by unique ID.
 */
const getInsightById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const allInsights = await getCachedOrFreshInsights(req.query);
    const insight = allInsights.find((i) => String(i.id) === String(id));

    if (!insight) {
      return errorResponse(res, `Insight with ID '${id}' not found`, 404);
    }

    return successResponse(res, insight, 'Insight details retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/insights/refresh
 * Explicit cache invalidation and re-generation.
 */
const refreshInsights = async (req, res, next) => {
  try {
    insightCache = { data: null, cachedAt: null, cacheKey: '' };
    const fresh = await getCachedOrFreshInsights(req.body || {});
    return successResponse(
      res,
      {
        count: fresh.length,
        refreshedAt: new Date().toISOString(),
      },
      'Insights successfully refreshed'
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInsights,
  getInsightsSummary,
  getInsightById,
  refreshInsights,
};
