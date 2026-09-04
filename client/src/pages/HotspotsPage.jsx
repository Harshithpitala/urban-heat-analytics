import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  Legend,
} from 'recharts';
import NoticeBanner from '../components/common/NoticeBanner';
import LoadingState from '../components/common/LoadingState';
import ChartCard from '../components/dashboard/ChartCard';
import StatusBadge from '../components/common/StatusBadge';
import {
  IconFlame,
  IconMapPin,
  IconThermometer,
  IconShieldAlert,
  IconSearch,
  IconX,
} from '../components/common/Icons';
import {
  fetchHotspotSummary,
  fetchHotspotRankings,
  fetchHotspotRecent,
  fetchAreaHotspotDetails,
} from '../services/api';

const SEVERITY_COLORS = {
  Extreme: '#dc2626',
  'Very High': '#f97316',
  High: '#f59e0b',
  Moderate: '#38bdf8',
  Low: '#10b981',
  'Insufficient Data': '#64748b',
};

const HotspotsPage = () => {
  // Threshold percentile setting: 85, 90, 95
  const [percentile, setPercentile] = useState(90);

  // Filters
  const [filters, setFilters] = useState({
    city: 'All Cities',
    landUse: 'All Land Uses',
    severity: 'All Severities',
    type: 'All Types',
    search: '',
  });

  // Data states
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [rankings, setRankings] = useState([]);
  const [recentChanges, setRecentChanges] = useState([]);

  // Selected area for detailed inspection modal
  const [selectedArea, setSelectedArea] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Methodology panel toggle
  const [showMethodology, setShowMethodology] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);

    const queryParams = { percentile };
    if (filters.city !== 'All Cities') queryParams.city = filters.city;
    if (filters.landUse !== 'All Land Uses') queryParams.landUse = filters.landUse;
    if (filters.severity !== 'All Severities') queryParams.severity = filters.severity;
    if (filters.type !== 'All Types') queryParams.type = filters.type;

    try {
      const [sumRes, rankRes, recentRes] = await Promise.all([
        fetchHotspotSummary(queryParams),
        fetchHotspotRankings(queryParams),
        fetchHotspotRecent(queryParams),
      ]);

      if (sumRes.success) setSummary(sumRes.data);
      if (rankRes.success) setRankings(rankRes.data);
      if (recentRes.success) setRecentChanges(recentRes.data);
    } catch (err) {
      console.error('Failed to load hotspot data:', err);
    } finally {
      setLoading(false);
    }
  }, [percentile, filters.city, filters.landUse, filters.severity, filters.type]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  // Handle Area Detail modal inspect
  const handleInspectArea = async (areaId) => {
    setDetailLoading(true);
    try {
      const res = await fetchAreaHotspotDetails(areaId, { percentile });
      if (res.success) {
        setSelectedArea(res.data);
      }
    } catch (err) {
      console.error('Failed to load area hotspot details:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  // Export Hotspot Report to CSV
  const handleExportCSV = () => {
    if (displayedRankings.length === 0) return;

    const headers = [
      'Rank',
      'Area',
      'City',
      'Zone',
      'Land Use',
      'Average Temperature (°C)',
      'Maximum Temperature (°C)',
      'Hotspot Frequency (%)',
      'Hotspot Score (0-100)',
      'Severity',
      'Hotspot Type',
      'Recent Temp Change (°C)',
      'Observations',
    ];

    const rows = displayedRankings.map((r) => [
      r.rank,
      `"${(r.area || '').replace(/"/g, '""')}"`,
      `"${(r.city || '').replace(/"/g, '""')}"`,
      `"${(r.zone || '').replace(/"/g, '""')}"`,
      `"${(r.landUse || '').replace(/"/g, '""')}"`,
      r.averageTemperature,
      r.maximumTemperature,
      `${r.hotspotFrequency}%`,
      r.hotspotScore !== null ? r.hotspotScore : 'N/A',
      r.severity,
      r.type,
      r.recentTemperatureChange !== undefined ? `${r.recentTemperatureChange > 0 ? '+' : ''}${r.recentTemperatureChange}` : '0',
      r.observationCount,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `urban_heat_hotspot_report_p${percentile}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-fade-in">
      {/* Notice Banner with Academic Causality Disclaimer */}
      <NoticeBanner
        badgeText="Urban Heat Hotspot Engine"
        message="Identifying persistent microclimate hotspots via empirical percentile thresholds. Note: Hotspot detection describes relative temperature patterns in the available dataset and does not constitute an official public heat warning system."
      />

      {/* Threshold Configuration & Methodology Bar */}
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
          background: 'rgba(249, 115, 22, 0.04)',
          border: '1px solid rgba(249, 115, 22, 0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              High-Temperature Threshold:
            </span>
            <span
              style={{
                fontSize: '1.1rem',
                fontWeight: 800,
                color: 'var(--heat-high)',
                background: 'rgba(249, 115, 22, 0.15)',
                padding: '2px 10px',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              {summary?.hotspotThreshold || 0}°C
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              ({summary?.thresholdMethod || `${percentile}th Percentile`})
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Cutoff:</span>
            {[85, 90, 95].map((p) => (
              <button
                key={p}
                type="button"
                className={`btn btn-sm ${percentile === p ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '2px 8px', fontSize: '0.78rem' }}
                onClick={() => setPercentile(p)}
              >
                {p}th %
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setShowMethodology(!showMethodology)}
          >
            {showMethodology ? 'Hide Methodology' : 'How Hotspots Are Identified'}
          </button>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={handleExportCSV}
            disabled={displayedRankings.length === 0}
          >
            Export Hotspot Report (CSV)
          </button>
        </div>
      </div>

      {/* Methodology Explanatory Panel (Collapsible) */}
      {showMethodology && (
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
              <h3 className="card-title">How Hotspots Are Identified</h3>
              <p className="card-subtitle">Transparent, Multidimensional Mathematical Scoring (0–100)</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-lg)', fontSize: '0.86rem', lineHeight: 1.6 }}>
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--heat-high)', marginBottom: '4px' }}>
                1. Empirical Percentile Threshold
              </h4>
              <p style={{ color: 'var(--text-secondary)' }}>
                Rather than an arbitrary static cutoff, the system computes the <strong>{percentile}th percentile</strong> of all valid observations ({summary?.hotspotThreshold}°C). Any reading exceeding this is classified as a high-temperature observation.
              </p>
            </div>

            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--heat-high)', marginBottom: '4px' }}>
                2. Hotspot Score Formula (0–100)
              </h4>
              <p style={{ color: 'var(--text-secondary)' }}>
                <code>Hotspot Score = (0.30 × NormAvg) + (0.20 × NormMax) + (0.30 × Freq%) + (0.20 × Persistence)</code>
                <br />
                Reflects thermal intensity and temporal persistence only. Does not incorporate population or social risk factors.
              </p>
            </div>

            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--heat-high)', marginBottom: '4px' }}>
                3. Severity & Typology
              </h4>
              <p style={{ color: 'var(--text-secondary)' }}>
                &bull; <strong>Persistent</strong>: Exceeds threshold in &ge; 30% of observations.<br />
                &bull; <strong>Emerging</strong>: Recent window is &ge; +1.0°C higher than historical average.<br />
                &bull; <strong>Insufficient Data</strong>: Fewer than 5 observations logged.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="kpi-grid" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="card">
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Monitored Urban Areas
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0' }}>
            {summary?.totalAreas || 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Total sectors in query scope
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Hotspot Areas (High+)
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--heat-high)', margin: '4px 0' }}>
            {summary?.hotspotAreas || 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Score &ge; 41 on 0-100 scale
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Persistent Hotspots
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#dc2626', margin: '4px 0' }}>
            {summary?.persistentHotspots || 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Repeated threshold exceedance
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Peak Recorded Temp
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#ef4444', margin: '4px 0' }}>
            {summary?.highestTemperature || 0}°C
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Single highest observation
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Peak Hotspot Score
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--heat-high)', margin: '4px 0' }}>
            {summary?.highestHotspotScore || 0}/100
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Max area composite score
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Mean Hotspot Score
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#38bdf8', margin: '4px 0' }}>
            {summary?.averageHotspotScore || 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Municipal baseline average
          </div>
        </div>
      </div>

      {/* Query Filter & Search Bar */}
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
          <label className="filter-label">Severity Level</label>
          <select
            className="filter-select"
            value={filters.severity}
            onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
          >
            <option value="All Severities">All Severities</option>
            <option value="Extreme">Extreme (81-100)</option>
            <option value="Very High">Very High (61-80)</option>
            <option value="High">High (41-60)</option>
            <option value="Moderate">Moderate (21-40)</option>
            <option value="Low">Low (0-20)</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Hotspot Typology</label>
          <select
            className="filter-select"
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          >
            <option value="All Types">All Typologies</option>
            <option value="Persistent Hotspot">Persistent Hotspot</option>
            <option value="Emerging Hotspot">Emerging Hotspot</option>
            <option value="Temporary Hotspot">Temporary Hotspot</option>
            <option value="Stable Low-Heat Area">Stable Low-Heat Area</option>
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
                severity: 'All Severities',
                type: 'All Types',
                search: '',
              })
            }
          >
            Reset Filters
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingState message="Calculating empirical percentile cutoffs and area Hotspot Scores..." />
      ) : (
        <>
          {/* Top Hotspots Table */}
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
                <IconFlame size={18} color="var(--heat-high)" />
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Urban Heat Hotspot Rankings</h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  ({displayedRankings.length} areas evaluated)
                </span>
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Sorted by Hotspot Score (0–100)
              </span>
            </div>

            <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>Rank</th>
                    <th>Area</th>
                    <th>Zoning</th>
                    <th>Avg Temp</th>
                    <th>Max Temp</th>
                    <th>Exceedance %</th>
                    <th style={{ width: '160px' }}>Hotspot Score</th>
                    <th>Severity</th>
                    <th>Typology</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedRankings.length === 0 ? (
                    <tr>
                      <td colSpan={10} style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--text-muted)' }}>
                        No urban areas match the active filter criteria.
                      </td>
                    </tr>
                  ) : (
                    displayedRankings.map((row) => {
                      const scoreColor = SEVERITY_COLORS[row.severity] || '#64748b';
                      return (
                        <tr key={row.areaId}>
                          <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>#{row.rank}</td>
                          <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row.area}</td>
                          <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{row.landUse}</td>
                          <td style={{ fontWeight: 600 }}>{row.averageTemperature}°C</td>
                          <td style={{ color: row.maximumTemperature >= summary?.hotspotThreshold ? 'var(--heat-extreme)' : 'inherit' }}>
                            {row.maximumTemperature}°C
                          </td>
                          <td style={{ fontWeight: 600, color: row.hotspotFrequency >= 25 ? 'var(--heat-high)' : 'inherit' }}>
                            {row.hotspotFrequency}%
                          </td>
                          <td>
                            {row.hotspotScore !== null ? (
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
                                      width: `${row.hotspotScore}%`,
                                      height: '100%',
                                      background: scoreColor,
                                      borderRadius: '3px',
                                    }}
                                  />
                                </div>
                                <span style={{ fontWeight: 700, fontSize: '0.88rem', minWidth: '24px', color: scoreColor }}>
                                  {row.hotspotScore}
                                </span>
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-disabled)' }}>N/A</span>
                            )}
                          </td>
                          <td>
                            <StatusBadge
                              label={row.severity}
                              type={
                                row.severity === 'Extreme'
                                  ? 'extreme'
                                  : row.severity === 'Very High' || row.severity === 'High'
                                  ? 'high'
                                  : row.severity === 'Moderate'
                                  ? 'moderate'
                                  : 'low'
                              }
                            />
                          </td>
                          <td style={{ fontSize: '0.82rem', fontWeight: 500 }}>{row.type}</td>
                          <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <Link
                              to={`/heat-map?areaId=${row.areaId}&layer=hotspot`}
                              className="btn btn-outline btn-sm"
                              style={{ padding: '3px 8px', fontSize: '0.74rem', marginRight: '6px' }}
                            >
                              View on Map
                            </Link>
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              style={{ padding: '3px 8px', fontSize: '0.74rem' }}
                              onClick={() => handleInspectArea(row.areaId)}
                            >
                              Inspect
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

          {/* Visualizations Grid */}
          <div className="charts-grid-2col" style={{ marginBottom: 'var(--space-2xl)' }}>
            {/* 1. Hotspot Frequency By Area Bar Chart */}
            <ChartCard
              title="Threshold Exceedance Frequency (%)"
              subtitle={`Percentage of observations exceeding the ${percentile}th percentile (${summary?.hotspotThreshold}°C)`}
            >
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={rankings} margin={{ top: 10, right: 20, left: 0, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="area" stroke="var(--text-muted)" fontSize={11} angle={-25} textAnchor="end" />
                  <YAxis stroke="var(--text-muted)" fontSize={11} unit="%" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--bg-elevated)',
                      borderColor: 'var(--border-subtle)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <Bar dataKey="hotspotFrequency" name="Exceedance Frequency %" fill="var(--heat-high)" radius={[4, 4, 0, 0]}>
                    {rankings.map((entry) => (
                      <Cell key={entry.areaId} fill={SEVERITY_COLORS[entry.severity] || 'var(--heat-high)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* 2. Recent vs Historical Temperature Swing Chart */}
            <ChartCard
              title="Recent vs Historical Temperature Trajectory"
              subtitle="Comparison of recent 7-day observation window vs historical baseline"
            >
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={recentChanges} margin={{ top: 10, right: 20, left: 0, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="area" stroke="var(--text-muted)" fontSize={11} angle={-25} textAnchor="end" />
                  <YAxis stroke="var(--text-muted)" fontSize={11} unit="°C" domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--bg-elevated)',
                      borderColor: 'var(--border-subtle)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="historicalAverageTemperature" name="Historical Avg" fill="#38bdf8" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="recentAverageTemperature" name="Recent 7-Day Avg" fill="var(--heat-high)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </>
      )}

      {/* Area Details Modal Drawer */}
      {selectedArea && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 'var(--space-md)',
          }}
          onClick={() => setSelectedArea(null)}
        >
          <div
            className="card animate-fade-in"
            style={{
              maxWidth: '650px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              border: '1px solid var(--border-glow)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card-header" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-md)' }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Rank #{selectedArea.rank} Hotspot Profile
                </span>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {selectedArea.area}
                </h3>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                  {selectedArea.zone} &bull; {selectedArea.landUse} &bull; {selectedArea.city}
                </p>
              </div>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setSelectedArea(null)}
              >
                <IconX size={16} />
              </button>
            </div>

            {/* Score & Classification Header */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: 'var(--space-sm)',
                margin: 'var(--space-md) 0',
              }}
            >
              <div style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Hotspot Score</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--heat-high)' }}>
                  {selectedArea.hotspotScore !== null ? `${selectedArea.hotspotScore}/100` : 'N/A'}
                </div>
              </div>

              <div style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Severity Level</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: '4px' }}>
                  <StatusBadge label={selectedArea.severity} type={selectedArea.severity === 'Extreme' ? 'extreme' : 'high'} />
                </div>
              </div>

              <div style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Typology</div>
                <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
                  {selectedArea.type}
                </div>
              </div>

              <div style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Recent Trajectory</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: selectedArea.recentTemperatureChange > 0 ? '#ef4444' : '#10b981', marginTop: '2px' }}>
                  {selectedArea.recentTemperatureChange > 0 ? `+${selectedArea.recentTemperatureChange}°C` : `${selectedArea.recentTemperatureChange}°C`}
                </div>
              </div>
            </div>

            {/* Generated Explanation */}
            <div style={{ background: 'rgba(249, 115, 22, 0.08)', border: '1px solid rgba(249, 115, 22, 0.25)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-md)' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--heat-high)', marginBottom: '4px' }}>
                Statistical Explanation:
              </div>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                {selectedArea.explanation}
              </p>
            </div>

            {/* Observation Metrics Breakdown */}
            <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
              &bull; <strong>Average Temperature:</strong> {selectedArea.averageTemperature}°C<br />
              &bull; <strong>Peak Recorded Temperature:</strong> {selectedArea.maximumTemperature}°C<br />
              &bull; <strong>Observations &ge; {selectedArea.hotspotThreshold}°C:</strong> {selectedArea.highTempObservationCount} of {selectedArea.observationCount} total ({selectedArea.hotspotFrequency}%)<br />
              &bull; <strong>Historical Baseline:</strong> {selectedArea.historicalAverageTemperature}°C vs <strong>Recent 7-Day Window:</strong> {selectedArea.recentAverageTemperature}°C<br />
              &bull; <strong>Methodology Note:</strong> {selectedArea.methodologyNotes}
            </div>

            {/* Phase 9 Hotspot Interpretation & Action Link */}
            <div
              style={{
                marginTop: 'var(--space-md)',
                backgroundColor: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: 'var(--radius-md)',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div>
                <div style={{ fontSize: '0.78rem', color: '#34d399', fontWeight: 600, textTransform: 'uppercase' }}>
                  Phase 9 Planning Consideration
                </div>
                <div style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
                  Evaluate targeted canopy expansion and cool roof retrofits for this sector.
                </div>
              </div>
              <Link
                to={`/insights?tab=recommendations`}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.78rem', color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.4)' }}
              >
                View Recommendations &rarr;
              </Link>
            </div>

            <div style={{ marginTop: 'var(--space-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Link
                to={`/heat-map?layer=hotspot&area=${encodeURIComponent(selectedArea.area)}`}
                className="btn btn-outline btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <IconMapPin size={14} />
                Inspect on Map
              </Link>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setSelectedArea(null)}
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HotspotsPage;
