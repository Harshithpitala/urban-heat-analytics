import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';
import NoticeBanner from '../components/common/NoticeBanner';
import LoadingState from '../components/common/LoadingState';
import ChartCard from '../components/dashboard/ChartCard';
import StatusBadge from '../components/common/StatusBadge';
import {
  IconShieldAlert,
  IconFlame,
  IconUsers,
  IconThermometer,
  IconSearch,
  IconSliders,
  IconCheck,
  IconRefreshCw,
} from '../components/common/Icons';
import {
  fetchRiskSummary,
  fetchRiskRankings,
  fetchAreaRiskDetails,
  fetchAreaRiskHistory,
  fetchRiskComparison,
  fetchHighHeatHighPopulation,
  fetchRiskConfig,
  updateRiskConfig,
  resetRiskConfig,
} from '../services/api';

const RISK_TIER_COLORS = {
  Extreme: '#dc2626',
  'Very High': '#f97316',
  High: '#f59e0b',
  Moderate: '#38bdf8',
  Low: '#10b981',
  'Insufficient Data': '#64748b',
};

const RiskIndexPage = () => {
  // Query Filters
  const [filters, setFilters] = useState({
    city: 'All Cities',
    landUse: 'All Land Uses',
    riskLevel: 'All Levels',
    search: '',
  });

  // Loading and core data states
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [rankings, setRankings] = useState([]);
  const [comparisonPoints, setComparisonPoints] = useState([]);
  const [highExposureSectors, setHighExposureSectors] = useState([]);

  // Selected Area for deep inspection
  const [selectedAreaId, setSelectedAreaId] = useState(null);
  const [selectedAreaDetails, setSelectedAreaDetails] = useState(null);
  const [selectedAreaHistory, setSelectedAreaHistory] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Weight Configuration panel states
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [activeWeights, setActiveWeights] = useState({
    temperature: 35,
    populationDensity: 20,
    humidity: 10,
    buildingDensity: 10,
    traffic: 10,
    vegetation: 10,
    rainfall: 5,
  });
  const [configFeedback, setConfigFeedback] = useState(null);

  // Load summary, rankings, comparison, and high exposure sectors
  const loadData = useCallback(async () => {
    setLoading(true);

    const queryParams = {};
    if (filters.city !== 'All Cities') queryParams.city = filters.city;
    if (filters.landUse !== 'All Land Uses') queryParams.landUse = filters.landUse;
    if (filters.riskLevel !== 'All Levels') queryParams.riskLevel = filters.riskLevel;

    try {
      const [sumRes, rankRes, compRes, expRes, cfgRes] = await Promise.all([
        fetchRiskSummary(queryParams),
        fetchRiskRankings(queryParams),
        fetchRiskComparison(queryParams),
        fetchHighHeatHighPopulation(queryParams),
        fetchRiskConfig(),
      ]);

      if (sumRes.success) setSummary(sumRes.data);
      if (rankRes.success && Array.isArray(rankRes.data)) {
        setRankings(rankRes.data);
        if (rankRes.data.length > 0 && !selectedAreaId) {
          setSelectedAreaId(rankRes.data[0].areaId);
        }
      }
      if (compRes.success) setComparisonPoints(compRes.data?.comparison || []);
      if (expRes.success) setHighExposureSectors(expRes.data?.areas || []);
      if (cfgRes.success) setActiveWeights(cfgRes.data?.activeWeights);
    } catch (err) {
      console.error('Failed to load risk index data:', err);
    } finally {
      setLoading(false);
    }
  }, [filters.city, filters.landUse, filters.riskLevel]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load specific details and history whenever selectedAreaId changes
  useEffect(() => {
    if (!selectedAreaId) return;

    let isMounted = true;
    const fetchDetails = async () => {
      setDetailsLoading(true);
      try {
        const [detRes, histRes] = await Promise.all([
          fetchAreaRiskDetails(selectedAreaId),
          fetchAreaRiskHistory(selectedAreaId),
        ]);

        if (isMounted) {
          if (detRes.success) setSelectedAreaDetails(detRes.data);
          if (histRes.success) setSelectedAreaHistory(histRes.data?.history || []);
        }
      } catch (err) {
        console.error('Failed to load area risk details:', err);
      } finally {
        if (isMounted) setDetailsLoading(false);
      }
    };

    fetchDetails();
    return () => {
      isMounted = false;
    };
  }, [selectedAreaId]);

  // Filter rankings by search text in memory
  const displayedRankings = rankings.filter((item) => {
    if (!filters.search.trim()) return true;
    const term = filters.search.toLowerCase();
    return (
      item.area?.toLowerCase().includes(term) ||
      item.zone?.toLowerCase().includes(term) ||
      item.landUse?.toLowerCase().includes(term)
    );
  });

  // Weight adjustments handler
  const handleWeightChange = (key, val) => {
    const num = Math.max(0, Math.min(100, Number(val) || 0));
    setActiveWeights((prev) => ({ ...prev, [key]: num }));
  };

  const totalWeightSum = Object.values(activeWeights).reduce((a, b) => a + Number(b || 0), 0);

  const handleSaveWeights = async () => {
    if (Math.abs(totalWeightSum - 100) > 0.01) {
      setConfigFeedback({ type: 'error', message: `Weights must total 100%. Currently: ${totalWeightSum}%` });
      return;
    }

    try {
      await updateRiskConfig(activeWeights);
      setConfigFeedback({ type: 'success', message: 'Weights saved! Recalculating index...' });
      setTimeout(() => setConfigFeedback(null), 3000);
      loadData();
    } catch (err) {
      setConfigFeedback({ type: 'error', message: err.message });
    }
  };

  const handleResetWeights = async () => {
    try {
      const res = await resetRiskConfig();
      if (res.success) {
        setActiveWeights(res.data?.activeWeights);
        setConfigFeedback({ type: 'success', message: 'Reset to project default weights.' });
        setTimeout(() => setConfigFeedback(null), 3000);
        loadData();
      }
    } catch (err) {
      setConfigFeedback({ type: 'error', message: err.message });
    }
  };

  // Export CSV Handler
  const handleExportCSV = () => {
    if (displayedRankings.length === 0) return;

    const headers = [
      'Rank',
      'Area',
      'City',
      'Zone',
      'Land Use',
      'HERI Score (0-100)',
      'Risk Level',
      'Average Temperature (°C)',
      'Population Density (/km²)',
      'Building Density (%)',
      'Vegetation Cover (%)',
      'Traffic Index',
      'Relative Humidity (%)',
      'Precipitation (mm)',
      'Data Completeness (%)',
    ];

    const rows = displayedRankings.map((r) => [
      r.rank,
      `"${(r.area || '').replace(/"/g, '""')}"`,
      `"${(r.city || '').replace(/"/g, '""')}"`,
      `"${(r.zone || '').replace(/"/g, '""')}"`,
      `"${(r.landUse || '').replace(/"/g, '""')}"`,
      r.finalRiskScore !== null ? r.finalRiskScore : 'N/A',
      r.riskLevel,
      r.rawMetrics?.temperature ?? 'N/A',
      r.rawMetrics?.populationDensity ?? 'N/A',
      r.rawMetrics?.buildingDensity ?? 'N/A',
      r.rawMetrics?.vegetation ?? 'N/A',
      r.rawMetrics?.traffic ?? 'N/A',
      r.rawMetrics?.humidity ?? 'N/A',
      r.rawMetrics?.rainfall ?? 'N/A',
      `${r.dataCompleteness}%`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'urban_heat_exposure_risk_index_report.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-fade-in">
      {/* Notice Banner with Strict Academic/Portfolio Disclaimer */}
      <NoticeBanner
        badgeText="Heat Exposure Risk Index (HERI-v1.0)"
        message="HERI is a project-specific analytical index developed for this application. It is intended to compare relative heat exposure patterns within the available dataset and is not an official heat-warning, medical, or public-health risk model."
      />

      {/* Top Controls: Weight Configuration Toggle & Export */}
      <div
        className="card"
        style={{
          marginBottom: 'var(--space-xl)',
          padding: 'var(--space-md) var(--space-xl)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--space-md)',
          background: 'rgba(239, 68, 68, 0.03)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Active Method:
            </span>
            <span
              style={{
                fontSize: '0.9rem',
                fontWeight: 700,
                color: 'var(--heat-high)',
                background: 'rgba(249, 115, 22, 0.12)',
                padding: '3px 8px',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              {summary?.methodVersion || 'HERI-v1.0'}
            </span>
          </div>

          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Combines Thermal Hazard (35%), Human Exposure (20%), and Urban Context (45%)
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm flex items-center gap-xs"
            onClick={() => setShowConfigPanel(!showConfigPanel)}
          >
            <IconSliders size={15} />
            {showConfigPanel ? 'Close Weights Panel' : 'Customize Model Weights'}
          </button>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={handleExportCSV}
            disabled={displayedRankings.length === 0}
          >
            Export Risk Report (CSV)
          </button>
        </div>
      </div>

      {/* Weight Configuration & Real-Time Preview Panel (Collapsible) */}
      {showConfigPanel && (
        <div
          className="card animate-fade-in"
          style={{
            marginBottom: 'var(--space-xl)',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-glow)',
          }}
        >
          <div className="card-header">
            <div>
              <h3 className="card-title">Multi-Criteria Weight Configuration</h3>
              <p className="card-subtitle">
                Adjust the relative importance of thermal, human, and built-environment indicators. All weights must sum to exactly 100%.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '0.92rem',
                  fontWeight: 800,
                  color: totalWeightSum === 100 ? '#10b981' : '#ef4444',
                }}
              >
                Total: {totalWeightSum}%
              </span>
            </div>
          </div>

          {configFeedback && (
            <div
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                marginBottom: 'var(--space-md)',
                fontSize: '0.84rem',
                background: configFeedback.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                color: configFeedback.type === 'error' ? '#ef4444' : '#10b981',
              }}
            >
              {configFeedback.message}
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 'var(--space-md)',
              marginBottom: 'var(--space-lg)',
            }}
          >
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Ambient Temp ({activeWeights.temperature}%)
              </label>
              <input
                type="range"
                min="0"
                max="60"
                value={activeWeights.temperature}
                onChange={(e) => handleWeightChange('temperature', e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Population Density ({activeWeights.populationDensity}%)
              </label>
              <input
                type="range"
                min="0"
                max="50"
                value={activeWeights.populationDensity}
                onChange={(e) => handleWeightChange('populationDensity', e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Building Density ({activeWeights.buildingDensity}%)
              </label>
              <input
                type="range"
                min="0"
                max="30"
                value={activeWeights.buildingDensity}
                onChange={(e) => handleWeightChange('buildingDensity', e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Traffic Intensity ({activeWeights.traffic}%)
              </label>
              <input
                type="range"
                min="0"
                max="30"
                value={activeWeights.traffic}
                onChange={(e) => handleWeightChange('traffic', e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Vegetation Canopy ({activeWeights.vegetation}%)
              </label>
              <input
                type="range"
                min="0"
                max="30"
                value={activeWeights.vegetation}
                onChange={(e) => handleWeightChange('vegetation', e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Relative Humidity ({activeWeights.humidity}%)
              </label>
              <input
                type="range"
                min="0"
                max="30"
                value={activeWeights.humidity}
                onChange={(e) => handleWeightChange('humidity', e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Precipitation ({activeWeights.rainfall}%)
              </label>
              <input
                type="range"
                min="0"
                max="20"
                value={activeWeights.rainfall}
                onChange={(e) => handleWeightChange('rainfall', e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-outline btn-sm flex items-center gap-xs"
              onClick={handleResetWeights}
            >
              <IconRefreshCw size={14} />
              Reset to Defaults
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm flex items-center gap-xs"
              onClick={handleSaveWeights}
              disabled={totalWeightSum !== 100}
            >
              <IconCheck size={14} />
              Apply Weight Profile
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="kpi-grid" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="card">
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Municipal Average HERI
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--heat-high)', margin: '4px 0' }}>
            {summary?.averageHeri || 0} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/100</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Across {summary?.scoredAreasCount || 0} evaluated sectors
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Highest Risk Sector
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#dc2626', margin: '6px 0' }}>
            {summary?.highestHeriArea || 'None'}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Peak Index: {summary?.highestHeri || 0}/100
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Extreme Risk Sectors
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#dc2626', margin: '4px 0' }}>
            {summary?.distribution?.extreme || 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            HERI &ge; 81.0 (Critical priority)
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Very High Risk Sectors
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#f97316', margin: '4px 0' }}>
            {summary?.distribution?.veryHigh || 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            HERI 61.0 - 80.9
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            High Risk Sectors
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#f59e0b', margin: '4px 0' }}>
            {summary?.distribution?.high || 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            HERI 41.0 - 60.9
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Moderate / Low Sectors
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#10b981', margin: '4px 0' }}>
            {(summary?.distribution?.moderate || 0) + (summary?.distribution?.low || 0)}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Well-buffered microclimates
          </div>
        </div>
      </div>

      {/* Selected Area Highlight Profile */}
      {selectedAreaDetails && (
        <div
          className="card animate-fade-in"
          style={{
            marginBottom: 'var(--space-2xl)',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-glow)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 'var(--space-md)',
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: 'var(--space-md)',
            }}
          >
            <div>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                Selected District Heat Exposure Profile
              </span>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0' }}>
                {selectedAreaDetails.area}
              </h2>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                {selectedAreaDetails.zone} &bull; {selectedAreaDetails.landUse} &bull; {selectedAreaDetails.city} &bull; Rank #{selectedAreaDetails.rank} of {summary?.scoredAreasCount}
              </p>
              <div style={{ marginTop: '8px' }}>
                <Link
                  to={`/heat-map?areaId=${selectedAreaDetails.areaId}&layer=heri`}
                  className="btn btn-outline btn-sm"
                  style={{ padding: '3px 10px', fontSize: '0.76rem' }}
                >
                  View on Geospatial Map &rarr;
                </Link>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  Data Completeness
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: selectedAreaDetails.dataCompleteness >= 85 ? '#10b981' : '#f59e0b' }}>
                  {selectedAreaDetails.dataCompleteness}%
                </div>
              </div>

              <div
                style={{
                  background: 'var(--bg-elevated)',
                  border: `2px solid ${RISK_TIER_COLORS[selectedAreaDetails.riskLevel] || 'var(--border-subtle)'}`,
                  padding: '10px 20px',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  Final HERI
                </div>
                <div
                  style={{
                    fontSize: '2rem',
                    fontWeight: 900,
                    color: RISK_TIER_COLORS[selectedAreaDetails.riskLevel] || 'var(--text-primary)',
                    lineHeight: 1.1,
                  }}
                >
                  {selectedAreaDetails.finalRiskScore}
                </div>
                <StatusBadge
                  label={selectedAreaDetails.riskLevel}
                  type={
                    selectedAreaDetails.riskLevel === 'Extreme'
                      ? 'extreme'
                      : selectedAreaDetails.riskLevel === 'Very High' || selectedAreaDetails.riskLevel === 'High'
                      ? 'high'
                      : selectedAreaDetails.riskLevel === 'Moderate'
                      ? 'moderate'
                      : 'low'
                  }
                />
              </div>
            </div>
          </div>

          {/* Transparent Risk Driver Summary Text */}
          <div
            style={{
              margin: 'var(--space-md) 0',
              padding: 'var(--space-md)',
              background: 'rgba(249, 115, 22, 0.06)',
              border: '1px solid rgba(249, 115, 22, 0.25)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--heat-high)', marginBottom: '4px' }}>
              Analytical Risk Driver Assessment:
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
              {selectedAreaDetails.riskDriverSummary}
            </p>
          </div>

          {/* Factor Contribution Chart (Contribution to Project Risk Score) */}
          <div style={{ marginTop: 'var(--space-lg)' }}>
            <div className="card-header" style={{ marginBottom: '8px' }}>
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Contribution to Project Risk Score
                </h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Points contributed by each normalized factor out of its assigned component weight
                </p>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                layout="vertical"
                data={selectedAreaDetails.factorContributions}
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                <XAxis type="number" stroke="var(--text-muted)" fontSize={11} domain={[0, 40]} unit=" pts" />
                <YAxis type="category" dataKey="label" stroke="var(--text-muted)" fontSize={11} width={90} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-elevated)',
                    borderColor: 'var(--border-subtle)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                  }}
                  formatter={(val, name, props) => [
                    `${val} pts (Normalized: ${props.payload.normalizedScore}/100, Weight: ${props.payload.maxWeight}%)`,
                    'Contribution',
                  ]}
                />
                <Bar dataKey="contribution" fill="var(--heat-high)" radius={[0, 4, 4, 0]}>
                  {selectedAreaDetails.factorContributions?.map((entry) => (
                    <Cell
                      key={entry.factor}
                      fill={entry.factor === 'vegetation' ? 'var(--eco-emerald)' : 'var(--heat-high)'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="filter-bar" style={{ marginBottom: 'var(--space-lg)' }}>
        <div className="header-search" style={{ width: '100%', maxWidth: '280px' }}>
          <IconSearch size={16} color="var(--text-disabled)" />
          <input
            type="text"
            placeholder="Search area name..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>

        <div className="filter-group">
          <label className="filter-label">Risk Tier</label>
          <select
            className="filter-select"
            value={filters.riskLevel}
            onChange={(e) => setFilters({ ...filters, riskLevel: e.target.value })}
          >
            <option value="All Levels">All Risk Tiers</option>
            <option value="Extreme">Extreme (81 - 100)</option>
            <option value="Very High">Very High (61 - 80.9)</option>
            <option value="High">High (41 - 60.9)</option>
            <option value="Moderate">Moderate (21 - 40.9)</option>
            <option value="Low">Low (0 - 20.9)</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Land Use</label>
          <select
            className="filter-select"
            value={filters.landUse}
            onChange={(e) => setFilters({ ...filters, landUse: e.target.value })}
          >
            <option value="All Land Uses">All Land Uses</option>
            <option value="Commercial">Commercial</option>
            <option value="Industrial">Industrial</option>
            <option value="Residential">Residential</option>
            <option value="Green Space">Green Space</option>
            <option value="Transportation">Transportation</option>
            <option value="Mixed Use">Mixed Use</option>
          </select>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'flex-end' }}>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() =>
              setFilters({
                city: 'All Cities',
                landUse: 'All Land Uses',
                riskLevel: 'All Levels',
                search: '',
              })
            }
          >
            Reset Filters
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingState message="Evaluating multi-criteria normalization and computing Heat Exposure Risk Indices..." />
      ) : (
        <>
          {/* Main Risk Ranking Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 'var(--space-2xl)' }}>
            <div
              style={{
                padding: 'var(--space-md) var(--space-xl)',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div className="flex items-center gap-xs">
                <IconShieldAlert size={18} color="var(--heat-high)" />
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Heat Exposure Risk Ranking</h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  ({displayedRankings.length} districts evaluated)
                </span>
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Sorted by Composite HERI (0–100)
              </span>
            </div>

            <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>Rank</th>
                    <th>Area</th>
                    <th>Zoning</th>
                    <th style={{ width: '180px' }}>HERI Score</th>
                    <th>Risk Tier</th>
                    <th>Avg Temp</th>
                    <th>Pop Density</th>
                    <th>Building %</th>
                    <th>Vegetation %</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedRankings.length === 0 ? (
                    <tr>
                      <td colSpan={10} style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--text-muted)' }}>
                        No districts match the active filter criteria.
                      </td>
                    </tr>
                  ) : (
                    displayedRankings.map((row) => {
                      const tierColor = RISK_TIER_COLORS[row.riskLevel] || '#64748b';
                      const isSelected = row.areaId === selectedAreaId;
                      return (
                        <tr
                          key={row.areaId}
                          style={{
                            backgroundColor: isSelected ? 'rgba(249, 115, 22, 0.06)' : 'transparent',
                            cursor: 'pointer',
                          }}
                          onClick={() => setSelectedAreaId(row.areaId)}
                        >
                          <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>#{row.rank}</td>
                          <td style={{ fontWeight: 600, color: isSelected ? 'var(--heat-high)' : 'var(--text-primary)' }}>
                            {row.area}
                          </td>
                          <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{row.landUse}</td>
                          <td>
                            {row.finalRiskScore !== null ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div
                                  style={{
                                    flex: 1,
                                    height: '6px',
                                    borderRadius: '3px',
                                    background: 'rgba(255, 255, 255, 0.08)',
                                    overflow: 'hidden',
                                  }}
                                >
                                  <div
                                    style={{
                                      width: `${row.finalRiskScore}%`,
                                      height: '100%',
                                      background: tierColor,
                                      borderRadius: '3px',
                                    }}
                                  />
                                </div>
                                <span style={{ fontWeight: 700, fontSize: '0.88rem', minWidth: '28px', color: tierColor }}>
                                  {row.finalRiskScore}
                                </span>
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-disabled)' }}>N/A</span>
                            )}
                          </td>
                          <td>
                            <StatusBadge
                              label={row.riskLevel}
                              type={
                                row.riskLevel === 'Extreme'
                                  ? 'extreme'
                                  : row.riskLevel === 'Very High' || row.riskLevel === 'High'
                                  ? 'high'
                                  : row.riskLevel === 'Moderate'
                                  ? 'moderate'
                                  : 'low'
                              }
                            />
                          </td>
                          <td style={{ fontWeight: 600 }}>{row.rawMetrics?.temperature ?? 0}°C</td>
                          <td style={{ fontSize: '0.82rem' }}>
                            {row.rawMetrics?.populationDensity?.toLocaleString()} <span style={{ color: 'var(--text-muted)' }}>/km²</span>
                          </td>
                          <td style={{ fontSize: '0.82rem' }}>{row.rawMetrics?.buildingDensity}%</td>
                          <td style={{ fontSize: '0.82rem', color: 'var(--eco-emerald)' }}>{row.rawMetrics?.vegetation}%</td>
                          <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <Link
                              to={`/heat-map?areaId=${row.areaId}&layer=heri`}
                              className="btn btn-outline btn-sm"
                              style={{ padding: '3px 8px', fontSize: '0.74rem', marginRight: '6px' }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              View on Map
                            </Link>
                            <button
                              type="button"
                              className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-outline'}`}
                              style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAreaId(row.areaId);
                              }}
                            >
                              {isSelected ? 'Active' : 'Select'}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Visualizations: Risk History & Hotspot Score vs HERI Comparison */}
          <div className="charts-grid-2col" style={{ marginBottom: 'var(--space-2xl)' }}>
            {/* Chart 1: Risk History Time Series */}
            <ChartCard
              title={`Heat Exposure Risk Over Time — ${selectedAreaDetails?.area || 'Selected District'}`}
              subtitle="Daily trajectory of calculated Heat Exposure Risk Index (HERI)"
            >
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={selectedAreaHistory} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} domain={[0, 100]} unit="" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--bg-elevated)',
                      borderColor: 'var(--border-subtle)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                    }}
                    formatter={(val) => [`${val} / 100`, 'HERI Score']}
                  />
                  <Line
                    type="monotone"
                    dataKey="riskScore"
                    name="HERI Score"
                    stroke="var(--heat-high)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Chart 2: Phase 5 Hotspot Score vs Phase 6 HERI Scatter Plot */}
            <ChartCard
              title="Hotspot Score vs HERI Comparison"
              subtitle="Comparing pure Thermal Hazard (X) with Multi-Factor Human Exposure (Y)"
            >
              <ResponsiveContainer width="100%" height={280}>
                <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis
                    type="number"
                    dataKey="hotspotScore"
                    name="Hotspot Score"
                    unit=""
                    domain={[0, 100]}
                    stroke="var(--text-muted)"
                    fontSize={11}
                  />
                  <YAxis
                    type="number"
                    dataKey="heri"
                    name="HERI"
                    unit=""
                    domain={[0, 100]}
                    stroke="var(--text-muted)"
                    fontSize={11}
                  />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    contentStyle={{
                      backgroundColor: 'var(--bg-elevated)',
                      borderColor: 'var(--border-subtle)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                    }}
                    formatter={(val, name) => [val, name]}
                  />
                  <Scatter name="Districts" data={comparisonPoints} fill="var(--heat-high)">
                    {comparisonPoints.map((entry) => (
                      <Cell key={entry.areaId} fill={RISK_TIER_COLORS[entry.riskLevel] || 'var(--heat-high)'} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* High Heat + High Population Priority Sectors */}
          <div className="card" style={{ marginBottom: 'var(--space-2xl)' }}>
            <div className="card-header">
              <div>
                <div className="flex items-center gap-xs">
                  <IconUsers size={18} color="var(--heat-high)" />
                  <h3 className="card-title">Areas Requiring Greater Heat-Monitoring Attention</h3>
                </div>
                <p className="card-subtitle">
                  Districts exhibiting both elevated average temperature (&ge; 34°C) and dense population (&ge; 9,000 residents/km²)
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-md)' }}>
              {highExposureSectors.map((sector) => (
                <div
                  key={sector.areaId}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-md)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {sector.area}
                    </h4>
                    <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--heat-high)' }}>
                      {sector.finalRiskScore}/100
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    {sector.zone} &bull; {sector.landUse}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    &bull; <strong>Average Temp:</strong> {sector.rawMetrics?.temperature}°C<br />
                    &bull; <strong>Population Density:</strong> {sector.rawMetrics?.populationDensity?.toLocaleString()} /km²<br />
                    &bull; <strong>Canopy Cover:</strong> {sector.rawMetrics?.vegetation}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RiskIndexPage;
