import axios from 'axios';
import {
  summaryKpiData,
  temperatureTrendData,
  areaTemperatureData,
  landUseData,
  trafficVsTempData,
  vegetationVsTempData,
  riskDistributionData,
} from '../data';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
});

/**
 * Checks backend health endpoint (/api/health)
 */
export const checkApiHealth = async () => {
  try {
    const response = await apiClient.get('/health');
    return {
      connected: true,
      data: response.data,
    };
  } catch (error) {
    return {
      connected: false,
      error: error.message,
    };
  }
};

/**
 * Fetches unified dashboard overview for Phase 8 Command Center.
 */
export const fetchDashboardOverview = async (params = {}) => {
  try {
    const response = await apiClient.get('/dashboard/overview', { params });
    if (response.data && response.data.success && response.data.data) {
      return {
        source: 'backend',
        data: response.data.data,
      };
    }
    throw new Error('Invalid backend response format');
  } catch (error) {
    return {
      source: 'error',
      error: error.message,
    };
  }
};

/**
 * Fetches dashboard summary KPI metrics from backend.
 */
export const fetchDashboardSummary = async (params = {}) => {
  try {
    const response = await apiClient.get('/dashboard/summary', { params });
    if (response.data && response.data.success && response.data.data) {
      return {
        source: 'backend',
        kpis: response.data.data.kpis,
        meta: response.data.data.meta,
      };
    }
    throw new Error('Invalid backend response format');
  } catch (error) {
    return {
      source: 'local-fallback',
      kpis: summaryKpiData,
      meta: {
        isDatabaseBacked: false,
        disclaimer: 'This environment currently uses generated demonstration records. Real-world datasets will be integrated in a later phase.',
      },
    };
  }
};

/**
 * Fetches temperature trend time series.
 */
export const fetchTemperatureTrend = async (params = {}) => {
  try {
    const response = await apiClient.get('/dashboard/temperature-trend', { params });
    if (response.data?.success && Array.isArray(response.data.data) && response.data.data.length > 0) {
      return response.data.data;
    }
    return temperatureTrendData;
  } catch (error) {
    return temperatureTrendData;
  }
};

/**
 * Fetches area-wise temperature comparison.
 */
export const fetchTemperatureByArea = async (params = {}) => {
  try {
    const response = await apiClient.get('/dashboard/temperature-by-area', { params });
    if (response.data?.success && Array.isArray(response.data.data) && response.data.data.length > 0) {
      return response.data.data;
    }
    return areaTemperatureData;
  } catch (error) {
    return areaTemperatureData;
  }
};

/**
 * Fetches land-use temperature breakdown.
 */
export const fetchLandUseSummary = async (params = {}) => {
  try {
    const response = await apiClient.get('/dashboard/land-use-summary', { params });
    if (response.data?.success && Array.isArray(response.data.data) && response.data.data.length > 0) {
      return response.data.data;
    }
    return landUseData;
  } catch (error) {
    return landUseData;
  }
};

/**
 * Fetches environment scatter pairs and risk distribution.
 */
export const fetchEnvironmentSummary = async (params = {}) => {
  try {
    const response = await apiClient.get('/dashboard/environment-summary', { params });
    if (response.data?.success && response.data.data) {
      return response.data.data;
    }
    return {
      vegetationVsTemp: vegetationVsTempData,
      trafficVsTemp: trafficVsTempData,
      riskDistribution: riskDistributionData,
    };
  } catch (error) {
    return {
      vegetationVsTemp: vegetationVsTempData,
      trafficVsTemp: trafficVsTempData,
      riskDistribution: riskDistributionData,
    };
  }
};

/**
 * Fetches list of urban areas with optional filters and pagination.
 */
export const fetchAreas = async (params = {}) => {
  try {
    const response = await apiClient.get('/areas', { params });
    return response.data;
  } catch (error) {
    return {
      success: false,
      data: [],
      error: error.message,
    };
  }
};

/**
 * Fetches detailed metadata, observation summary, and recent trends for a single area.
 */
export const fetchAreaDetails = async (id) => {
  try {
    const response = await apiClient.get(`/areas/${id}`);
    return response.data;
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Fetches paginated environmental observation records.
 */
export const fetchEnvironmentalRecords = async (params = {}) => {
  try {
    const response = await apiClient.get('/data', { params });
    return response.data;
  } catch (error) {
    return {
      success: false,
      data: [],
      error: error.message,
    };
  }
};

/**
 * Fetches data quality metrics and distribution statistics.
 */
export const fetchDataQuality = async () => {
  try {
    const response = await apiClient.get('/data/quality');
    return response.data;
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

/* =========================================================
   PHASE 3: CSV Ingestion & Import Management API Methods
========================================================= */

export const uploadAndValidateCSV = async (file, customMapping = {}) => {
  const formData = new FormData();
  formData.append('file', file);
  if (Object.keys(customMapping).length > 0) {
    formData.append('mapping', JSON.stringify(customMapping));
  }

  try {
    const response = await apiClient.post('/import/validate', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    const msg = error.response?.data?.message || error.message;
    throw new Error(msg);
  }
};

export const commitImportJob = async (jobId, duplicateStrategy = 'skip') => {
  try {
    const response = await apiClient.post('/import/commit', {
      jobId,
      duplicateStrategy,
    });
    return response.data;
  } catch (error) {
    const msg = error.response?.data?.message || error.message;
    throw new Error(msg);
  }
};

export const fetchImportHistory = async (page = 1, limit = 10) => {
  try {
    const response = await apiClient.get('/import/history', {
      params: { page, limit },
    });
    return response.data;
  } catch (error) {
    return {
      success: false,
      data: [],
      error: error.message,
    };
  }
};

export const fetchImportJobDetails = async (id) => {
  try {
    const response = await apiClient.get(`/import/${id}`);
    return response.data;
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

export const getImportErrorDownloadUrl = (jobId) => {
  const baseURL = import.meta.env.VITE_API_URL || '/api';
  return `${baseURL}/import/${jobId}/errors`;
};

export const downloadCSVTemplate = async () => {
  try {
    const response = await apiClient.get('/import/template', {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'urban_heat_template.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to download template:', error);
  }
};

export const deleteImportJob = async (id) => {
  try {
    const response = await apiClient.delete(`/import/${id}`);
    return response.data;
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

/* =========================================================
   PHASE 4: Core Data Analytics Engine API Methods
========================================================= */

/**
 * Master analytics summary across environmental and human mobility variables.
 */
export const fetchAnalyticsSummary = async (params = {}) => {
  try {
    const response = await apiClient.get('/analytics/summary', { params });
    return response.data;
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Temperature statistics (mean, min, max, median, stdDev, and distribution).
 */
export const fetchAnalyticsTempStats = async (params = {}) => {
  try {
    const response = await apiClient.get('/analytics/temperature/stats', { params });
    return response.data;
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Time-series temperature trend (daily or monthly).
 */
export const fetchAnalyticsTempTrend = async (params = {}) => {
  try {
    const response = await apiClient.get('/analytics/temperature/trend', { params });
    return response.data;
  } catch (error) {
    return { success: false, data: [], error: error.message };
  }
};

/**
 * Temperature grouped by urban district/area.
 */
export const fetchAnalyticsTempByArea = async (params = {}) => {
  try {
    const response = await apiClient.get('/analytics/temperature/by-area', { params });
    return response.data;
  } catch (error) {
    return { success: false, data: [], error: error.message };
  }
};

/**
 * Temperature grouped by zoning land-use category.
 */
export const fetchAnalyticsTempByLandUse = async (params = {}) => {
  try {
    const response = await apiClient.get('/analytics/temperature/by-land-use', { params });
    return response.data;
  } catch (error) {
    return { success: false, data: [], error: error.message };
  }
};

/**
 * Multi-variable environmental summary (humidity, rainfall, vegetation, temp).
 */
export const fetchAnalyticsEnvironmentSummary = async (params = {}) => {
  try {
    const response = await apiClient.get('/analytics/environment/summary', { params });
    return response.data;
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Multi-variable environmental time-series trends.
 */
export const fetchAnalyticsEnvironmentTrends = async (params = {}) => {
  try {
    const response = await apiClient.get('/analytics/environment/trends', { params });
    return response.data;
  } catch (error) {
    return { success: false, data: [], error: error.message };
  }
};

/**
 * Environmental scatter relationship datasets and Pearson correlation stats.
 */
export const fetchAnalyticsEnvironmentRelationships = async (params = {}) => {
  try {
    const response = await apiClient.get('/analytics/environment/relationships', { params });
    return response.data;
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Human activity summary (traffic, building density, population density).
 */
export const fetchAnalyticsHumanActivitySummary = async (params = {}) => {
  try {
    const response = await apiClient.get('/analytics/human-activity/summary', { params });
    return response.data;
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Human activity scatter relationships and Pearson correlation stats.
 */
export const fetchAnalyticsHumanActivityRelationships = async (params = {}) => {
  try {
    const response = await apiClient.get('/analytics/human-activity/relationships', { params });
    return response.data;
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Traffic levels grouped by area.
 */
export const fetchAnalyticsTrafficByArea = async (params = {}) => {
  try {
    const response = await apiClient.get('/analytics/human-activity/by-area', { params });
    return response.data;
  } catch (error) {
    return { success: false, data: [], error: error.message };
  }
};

/**
 * Pairwise correlations for a target variable against all numeric variables.
 */
export const fetchAnalyticsCorrelations = async (params = {}) => {
  try {
    const response = await apiClient.get('/analytics/correlations', { params });
    return response.data;
  } catch (error) {
    return { success: false, data: [], error: error.message };
  }
};

/**
 * 7x7 Pearson correlation matrix.
 */
export const fetchAnalyticsCorrelationMatrix = async (params = {}) => {
  try {
    const response = await apiClient.get('/analytics/correlation-matrix', { params });
    return response.data;
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Monthly environmental and activity aggregation.
 */
export const fetchAnalyticsMonthly = async (params = {}) => {
  try {
    const response = await apiClient.get('/analytics/monthly', { params });
    return response.data;
  } catch (error) {
    return { success: false, data: [], error: error.message };
  }
};

/**
 * India-focused seasonal environmental profiles.
 */
export const fetchAnalyticsSeasonal = async (params = {}) => {
  try {
    const response = await apiClient.get('/analytics/seasonal', { params });
    return response.data;
  } catch (error) {
    return { success: false, data: [], error: error.message };
  }
};

/**
 * Municipal administrative zone metrics.
 */
export const fetchAnalyticsZones = async (params = {}) => {
  try {
    const response = await apiClient.get('/analytics/zones', { params });
    return response.data;
  } catch (error) {
    return { success: false, data: [], error: error.message };
  }
};

/**
 * Side-by-side area benchmark comparison.
 */
export const fetchAnalyticsAreaComparison = async (areas) => {
  try {
    const response = await apiClient.get('/analytics/compare', { params: { areas } });
    return response.data;
  } catch (error) {
    return { success: false, data: [], error: error.message };
  }
};

/**
 * Statistical temperature outlier detection (IQR rule).
 */
export const fetchAnalyticsOutliers = async (params = {}) => {
  try {
    const response = await apiClient.get('/analytics/outliers', { params });
    return response.data;
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Data coverage, temporal span, and sample completeness audit.
 */
export const fetchAnalyticsCoverage = async (params = {}) => {
  try {
    const response = await apiClient.get('/analytics/coverage', { params });
    return response.data;
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Rule-based data-driven insights synthesized from live analytics.
 */
export const fetchAnalyticsInsights = async (params = {}) => {
  try {
    const response = await apiClient.get('/analytics/insights', { params });
    return response.data;
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/* =========================================================
   PHASE 5: Urban Heat Hotspot Detection & Area Ranking APIs
========================================================= */

/**
 * High-level hotspot summary KPIs.
 */
export const fetchHotspotSummary = async (params = {}) => {
  try {
    const response = await apiClient.get('/hotspots/summary', { params });
    return response.data;
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Ranked urban heat hotspots with sorting and filters.
 */
export const fetchHotspotRankings = async (params = {}) => {
  try {
    const response = await apiClient.get('/hotspots/ranking', { params });
    return response.data;
  } catch (error) {
    return { success: false, data: [], error: error.message };
  }
};

/**
 * Detailed hotspot profile and explanation for a specific area.
 */
export const fetchAreaHotspotDetails = async (areaId, params = {}) => {
  try {
    const response = await apiClient.get(`/hotspots/${areaId}`, { params });
    return response.data;
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Hotspot persistence metrics.
 */
export const fetchHotspotPersistence = async (params = {}) => {
  try {
    const response = await apiClient.get('/hotspots/persistence', { params });
    return response.data;
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Recent vs historical thermal comparison.
 */
export const fetchHotspotRecent = async (params = {}) => {
  try {
    const response = await apiClient.get('/hotspots/recent', { params });
    return response.data;
  } catch (error) {
    return { success: false, data: [], error: error.message };
  }
};

/**
 * Hotspot detection methodology and component weights.
 */
export const fetchHotspotMethodology = async () => {
  try {
    const response = await apiClient.get('/hotspots/methodology');
    return response.data;
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/* =========================================================
   PHASE 6: Heat Exposure Risk Index (HERI) API Methods
========================================================= */

/**
 * High-level municipal HERI summary KPIs and risk distribution.
 */
export const fetchRiskSummary = async (params = {}) => {
  try {
    const response = await apiClient.get('/risk/summary', { params });
    return response.data;
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Ranked areas by Heat Exposure Risk Index (HERI).
 */
export const fetchRiskRankings = async (params = {}) => {
  try {
    const response = await apiClient.get('/risk/ranking', { params });
    return response.data;
  } catch (error) {
    return { success: false, data: [], error: error.message };
  }
};

/**
 * Detailed HERI profile, factor contributions, and drivers for a single area.
 */
export const fetchAreaRiskDetails = async (areaId, params = {}) => {
  try {
    const response = await apiClient.get(`/risk/${areaId}`, { params });
    return response.data;
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Historical daily HERI time series for a single area.
 */
export const fetchAreaRiskHistory = async (areaId, params = {}) => {
  try {
    const response = await apiClient.get(`/risk/${areaId}/history`, { params });
    return response.data;
  } catch (error) {
    return { success: false, data: [], error: error.message };
  }
};

/**
 * Phase 5 Hotspot Score vs Phase 6 HERI comparison scatter coordinates.
 */
export const fetchRiskComparison = async (params = {}) => {
  try {
    const response = await apiClient.get('/risk/comparison', { params });
    return response.data;
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Areas with both high heat and high population density requiring prioritized monitoring.
 */
export const fetchHighHeatHighPopulation = async (params = {}) => {
  try {
    const response = await apiClient.get('/risk/high-exposure', { params });
    return response.data;
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * HERI methodology documentation and active version.
 */
export const fetchRiskMethodology = async () => {
  try {
    const response = await apiClient.get('/risk/methodology');
    return response.data;
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Active and default weight configuration.
 */
export const fetchRiskConfig = async () => {
  try {
    const response = await apiClient.get('/risk/config');
    return response.data;
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Updates active HERI weights.
 */
export const updateRiskConfig = async (weights) => {
  try {
    const response = await apiClient.put('/risk/config', { weights });
    return response.data;
  } catch (error) {
    const msg = error.response?.data?.message || error.message;
    throw new Error(msg);
  }
};

/**
 * Resets HERI weights to default project configuration.
 */
export const resetRiskConfig = async () => {
  try {
    const response = await apiClient.post('/risk/config/reset');
    return response.data;
  } catch (error) {
    const msg = error.response?.data?.message || error.message;
    throw new Error(msg);
  }
};

/* =========================================================
   PHASE 7: Geospatial Intelligence Map API Methods
========================================================= */

/**
 * Fetch geographic area markers with environmental, hotspot, and risk indicators.
 */
export const fetchMapAreas = async (params = {}) => {
  try {
    const response = await apiClient.get('/map/areas', { params });
    return response.data;
  } catch (error) {
    return { success: false, data: { areas: [], totalAreas: 0, unavailableCount: 0 }, error: error.message };
  }
};

/**
 * High-level spatial summary metrics (counts, averages, centroid, date range).
 */
export const fetchMapSummary = async (params = {}) => {
  try {
    const response = await apiClient.get('/map/summary', { params });
    return response.data;
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * RFC 7946 compliant GeoJSON FeatureCollection.
 */
export const fetchMapGeoJson = async (params = {}) => {
  try {
    const response = await apiClient.get('/map/geojson', { params });
    return response.data;
  } catch (error) {
    return { type: 'FeatureCollection', features: [], error: error.message };
  }
};

/* =========================================================
   PHASE 9: Data-Driven Insights & Recommendations API
========================================================= */

/**
 * Fetches filtered and sorted data-driven insights.
 */
export const fetchInsights = async (params = {}) => {
  try {
    const response = await apiClient.get('/insights', { params });
    return response.data;
  } catch (error) {
    return {
      success: false,
      data: [],
      meta: { total: 0 },
      error: error.message,
    };
  }
};

/**
 * Fetches high-level summary KPIs for insights engine.
 */
export const fetchInsightsSummary = async (params = {}) => {
  try {
    const response = await apiClient.get('/insights/summary', { params });
    return response.data;
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error.message,
    };
  }
};

/**
 * Fetches single insight by ID with extensive evidence.
 */
export const fetchInsightById = async (id, params = {}) => {
  try {
    const response = await apiClient.get(`/insights/${id}`, { params });
    return response.data;
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error.message,
    };
  }
};

/**
 * Triggers server-side insight regeneration and cache flush.
 */
export const refreshInsights = async (payload = {}) => {
  try {
    const response = await apiClient.post('/insights/refresh', payload);
    return response.data;
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Fetches filtered and sorted rule-based planning recommendations.
 */
export const fetchRecommendations = async (params = {}) => {
  try {
    const response = await apiClient.get('/recommendations', { params });
    return response.data;
  } catch (error) {
    return {
      success: false,
      data: [],
      meta: { total: 0 },
      error: error.message,
    };
  }
};

/**
 * Fetches high-level summary KPIs for recommendations.
 */
export const fetchRecommendationsSummary = async (params = {}) => {
  try {
    const response = await apiClient.get('/recommendations/summary', { params });
    return response.data;
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error.message,
    };
  }
};

/**
 * Fetches single recommendation by ID with implementation considerations.
 */
export const fetchRecommendationById = async (id, params = {}) => {
  try {
    const response = await apiClient.get(`/recommendations/${id}`, { params });
    return response.data;
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error.message,
    };
  }
};


