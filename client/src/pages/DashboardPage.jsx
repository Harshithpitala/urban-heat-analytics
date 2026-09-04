import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ZAxis,
} from 'recharts';

import KpiCard from '../components/dashboard/KpiCard';
import ChartCard from '../components/dashboard/ChartCard';
import InsightCard from '../components/dashboard/InsightCard';
import FilterBar from '../components/dashboard/FilterBar';
import TopAreasTable from '../components/dashboard/TopAreasTable';
import NoticeBanner from '../components/common/NoticeBanner';
import StatusBadge from '../components/common/StatusBadge';
import LoadingState from '../components/common/LoadingState';
import MapPreview from '../components/map/MapPreview';

import {
  IconThermometer,
  IconFlame,
  IconDroplets,
  IconCloudRain,
  IconShieldAlert,
  IconMapPin,
  IconDatabase,
  IconRefreshCw,
  IconPrinter,
  IconDownload,
  IconLeaf,
  IconCar,
  IconUsers,
  IconBuilding,
  IconBarChart,
  IconLayers,
  IconActivity,
  IconInfo,
  IconLightbulb,
} from '../components/common/Icons';

import { fetchDashboardOverview } from '../services/api';

// Custom dark chart tooltip
const CustomChartTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          backgroundColor: '#101c3d',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '8px',
          padding: '10px 14px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
          fontSize: '0.82rem',
          color: '#f8fafc',
          zIndex: 100,
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: '4px', color: '#cbd5e1' }}>{label}</div>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} style={{ color: entry.color || '#f97316', margin: '2px 0' }}>
            {entry.name}: <strong>{entry.value} {entry.unit || ''}</strong>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const DashboardPage = () => {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tempInterval, setTempInterval] = useState('daily');
  const [selectedTableTab, setSelectedTableTab] = useState('risk'); // 'risk' | 'hotspot' | 'lower'
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Global Filter State
  const [filters, setFilters] = useState({
    city: 'all',
    zone: 'all',
    area: 'all',
    landUse: 'all',
    dateRange: 'all',
  });

  // Load unified dashboard overview from MongoDB backend
  const loadOverview = useCallback(async (currentFilters) => {
    setLoading(true);
    const queryParams = {};
    if (currentFilters.city && currentFilters.city !== 'all') queryParams.city = currentFilters.city;
    if (currentFilters.zone && currentFilters.zone !== 'all') queryParams.zone = currentFilters.zone;
    if (currentFilters.area && currentFilters.area !== 'all') queryParams.area = currentFilters.area;
    if (currentFilters.landUse && currentFilters.landUse !== 'all') queryParams.landUse = currentFilters.landUse;

    // Time window logic
    if (currentFilters.dateRange === 'today') {
      const now = new Date('2026-09-12');
      queryParams.startDate = '2026-09-11';
      queryParams.endDate = '2026-09-12';
    } else if (currentFilters.dateRange === '7d') {
      queryParams.startDate = '2026-09-05';
    } else if (currentFilters.dateRange === '30d') {
      queryParams.startDate = '2026-08-15';
    }

    try {
      const res = await fetchDashboardOverview(queryParams);
      if (res.source === 'backend' && res.data) {
        setOverview(res.data);
        setLastRefreshed(new Date());
      }
    } catch (err) {
      console.warn('Dashboard overview fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverview(filters);
  }, [loadOverview, filters]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      city: 'all',
      zone: 'all',
      area: 'all',
      landUse: 'all',
      dateRange: 'all',
    });
  };

  // Quick action: Print dashboard report
  const handlePrint = () => {
    window.print();
  };

  // Quick action: Export overview summary to CSV
  const handleExportCSV = () => {
    if (!overview || !overview.topRiskAreas) return;
    const headers = ['Rank', 'District Name', 'Zone', 'Land Use', 'HERI Score', 'Risk Level', 'Avg Temperature (°C)', 'Population Density (/km²)'];
    const rows = overview.topRiskAreas.map((r) => [
      r.rank,
      `"${r.name}"`,
      `"${r.zone || ''}"`,
      `"${r.landUse || ''}"`,
      r.heri,
      `"${r.riskLevel}"`,
      r.temperature,
      r.populationDensity,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `urban_heat_command_center_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && !overview) {
    return <LoadingState message="Loading Unified Analytics Command Center from MongoDB..." />;
  }

  const kpis = overview?.summary || {};
  const tempTrendData = tempInterval === 'monthly'
    ? (overview?.temperatureTrend?.monthly || [])
    : (overview?.temperatureTrend?.daily || []);
  const areasList = overview?.topRiskAreas || [];

  return (
    <div className="animate-fade-in" style={{ paddingBottom: 'var(--space-3xl)' }}>
      {/* 1. Command Center Header & Quick Actions */}
      <div
        className="no-print"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: 'var(--space-md)',
          paddingBottom: 'var(--space-sm)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div>
          <div className="flex items-center gap-xs">
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
              Command Center
            </h2>
            <StatusBadge label="Phase 8 Unified" type="high" />
            <span
              style={{
                fontSize: '0.74rem',
                color: 'var(--text-muted)',
                backgroundColor: 'rgba(255,255,255,0.04)',
                padding: '2px 8px',
                borderRadius: '4px',
                border: '1px solid var(--border-subtle)',
              }}
            >
              Live Telemetry
            </span>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '3px', marginBottom: 0 }}>
            Unified spatial, thermal, demographic, and multi-factor heat exposure analytics
          </p>
        </div>

        <div className="flex items-center gap-xs" style={{ flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginRight: '4px' }}>
            Updated: {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>

          <button
            type="button"
            className="btn btn-secondary btn-sm flex items-center gap-xs"
            onClick={() => loadOverview(filters)}
            title="Refresh database metrics"
          >
            <IconRefreshCw size={14} />
            Refresh
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm flex items-center gap-xs"
            onClick={handleExportCSV}
            title="Export ranked district summary to CSV"
          >
            <IconDownload size={14} />
            Export CSV
          </button>

          <button
            type="button"
            className="btn btn-outline btn-sm flex items-center gap-xs"
            onClick={handlePrint}
            title="Print command center executive briefing"
          >
            <IconPrinter size={14} />
            Print Report
          </button>
        </div>
      </div>

      {/* Synthetic Demo Data notice banner */}
      <NoticeBanner
        badgeText="Synthetic Demo Data"
        message="This environment currently uses generated demonstration records. Real-world datasets will be integrated in a later phase."
      />

      {/* 2. Global Synchronized Filter Bar */}
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
        areasList={areasList}
      />

      {/* 3. 10 Core Database-Backed KPIs Grid */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', marginBottom: 'var(--space-xl)' }}>
        {/* KPI 1: Average Temperature */}
        <KpiCard
          icon={IconThermometer}
          value={kpis.averageTemperature?.value ?? 33.2}
          unit={kpis.averageTemperature?.unit || '°C'}
          label="Average Temperature"
          supporting={kpis.averageTemperature?.change || '+1.2°C vs baseline'}
          accentColor="#f97316"
        />

        {/* KPI 2: Maximum Temperature */}
        <KpiCard
          icon={IconFlame}
          value={kpis.maximumTemperature?.value ?? 41.5}
          unit={kpis.maximumTemperature?.unit || '°C'}
          label="Maximum Recorded Temp"
          supporting={kpis.maximumTemperature?.change || 'Peak observation'}
          accentColor="#ef4444"
        />

        {/* KPI 3: Average HERI */}
        <Link to="/risk-index" style={{ textDecoration: 'none', display: 'block' }}>
          <KpiCard
            icon={IconShieldAlert}
            value={kpis.averageHeri?.value ?? 52.4}
            unit="/100"
            label="Average Heat Exposure Risk"
            badge={kpis.averageHeri?.badge || 'HERI-v1.0'}
            supporting={kpis.averageHeri?.change || 'Multi-factor exposure model'}
            accentColor="#f59e0b"
          />
        </Link>

        {/* KPI 4: High-Risk Areas Count */}
        <Link to="/risk-index" style={{ textDecoration: 'none', display: 'block' }}>
          <KpiCard
            icon={IconShieldAlert}
            value={kpis.highRiskAreasCount?.value ?? 3}
            unit="districts"
            label="High-Risk Priority Areas"
            supporting={kpis.highRiskAreasCount?.change || 'HERI >= 41.0 threshold'}
            accentColor="#dc2626"
          />
        </Link>

        {/* KPI 5: Hotspots Count */}
        <Link to="/hotspots" style={{ textDecoration: 'none', display: 'block' }}>
          <KpiCard
            icon={IconFlame}
            value={kpis.hotspotsCount?.value ?? 4}
            unit="hotspots"
            label="Identified Heat Hotspots"
            supporting={kpis.hotspotsCount?.change || 'Exceeds 90th percentile'}
            accentColor="#ea580c"
          />
        </Link>

        {/* KPI 6: High Heat + High Population Count */}
        <KpiCard
          icon={IconUsers}
          value={kpis.highHeatHighPopulationCount?.value ?? 3}
          unit="zones"
          label="High Heat + High Pop"
          supporting={kpis.highHeatHighPopulationCount?.change || 'Dual vulnerability target'}
          accentColor="#b91c1c"
        />

        {/* KPI 7: Average Vegetation Index */}
        <KpiCard
          icon={IconLeaf}
          value={kpis.averageVegetation?.value ?? 29}
          unit="%"
          label="Average Green Canopy"
          supporting={kpis.averageVegetation?.change || 'Vegetation NDVI estimate'}
          accentColor="#10b981"
        />

        {/* KPI 8: Average Traffic Index */}
        <KpiCard
          icon={IconCar}
          value={kpis.averageTraffic?.value ?? 62}
          unit="/100"
          label="Average Traffic Index"
          supporting={kpis.averageTraffic?.change || 'Anthropogenic heat proxy'}
          accentColor="#38bdf8"
        />

        {/* KPI 9: Population in High-Risk Areas */}
        <KpiCard
          icon={IconBuilding}
          value={kpis.populationInHighRisk?.value ?? '28,500'}
          unit="/km²"
          label="Population in High Risk"
          supporting={kpis.populationInHighRisk?.change || 'Cumulative exposure density'}
          accentColor="#e11d48"
        />

        {/* KPI 10: Total Records Analyzed */}
        <Link to="/data-explorer" style={{ textDecoration: 'none', display: 'block' }}>
          <KpiCard
            icon={IconDatabase}
            value={kpis.totalObservations?.value ?? 716}
            unit="records"
            label="Total Observations"
            supporting={kpis.totalObservations?.change || '11 monitored urban sectors'}
            accentColor="#8b5cf6"
          />
        </Link>
      </div>

      {/* 4. Primary Temperature Trend & HERI Risk Trajectory */}
      <div className="charts-grid-2col" style={{ marginBottom: 'var(--space-xl)' }}>
        {/* Primary Temperature Trend with Daily/Monthly Toggle */}
        <ChartCard
          title="Primary Temperature Trend"
          subtitle={`Thermal progression across observations (${tempInterval === 'daily' ? 'Daily aggregated' : 'Monthly aggregated'})`}
          badge={
            <div className="flex items-center gap-xs">
              <button
                type="button"
                className={`btn btn-sm ${tempInterval === 'daily' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '2px 8px', fontSize: '0.72rem' }}
                onClick={() => setTempInterval('daily')}
              >
                Daily
              </button>
              <button
                type="button"
                className={`btn btn-sm ${tempInterval === 'monthly' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '2px 8px', fontSize: '0.72rem' }}
                onClick={() => setTempInterval('monthly')}
              >
                Monthly
              </button>
            </div>
          }
          height={320}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={tempTrendData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey={tempInterval === 'monthly' ? 'month' : 'date'} stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} unit="°C" domain={[15, 48]} />
              <Tooltip content={<CustomChartTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
                formatter={(value) => <span style={{ color: '#cbd5e1' }}>{value}</span>}
              />
              <Line
                type="monotone"
                dataKey="maximumTemperature"
                name="Max Temp (°C)"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ r: 2 }}
              />
              <Line
                type="monotone"
                dataKey="averageTemperature"
                name="Avg Temp (°C)"
                stroke="#f97316"
                strokeWidth={2.5}
                dot={{ r: 2.5 }}
              />
              <Line
                type="monotone"
                dataKey="minimumTemperature"
                name="Min Temp (°C)"
                stroke="#38bdf8"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* HERI Risk Trajectory / Multi-Area Risk Trend */}
        <ChartCard
          title="HERI Risk Trajectory (Priority Districts)"
          subtitle="Recent daily temperature progression across highest-exposure municipal sectors"
          badge={<StatusBadge label="Multi-Area Trend" type="high" />}
          height={320}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={overview?.riskTrend || []} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} unit="°C" domain={[20, 48]} />
              <Tooltip content={<CustomChartTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }}
                formatter={(value) => <span style={{ color: '#cbd5e1' }}>{value}</span>}
              />
              {overview?.topRiskAreas?.slice(0, 4).map((area, idx) => {
                const colors = ['#ef4444', '#f97316', '#eab308', '#06b6d4'];
                return (
                  <Line
                    key={area.name}
                    type="monotone"
                    dataKey={area.name}
                    name={area.name}
                    stroke={colors[idx % colors.length]}
                    strokeWidth={2}
                    dot={false}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* 5. Phase 7 Interactive Geospatial Map Preview */}
      <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="card-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <div className="flex items-center gap-xs">
              <IconMapPin size={20} color="var(--heat-high)" />
              <h3 className="card-title">Geospatial Heat & Risk Intelligence Layer</h3>
              <StatusBadge label="Spatial Grid Preview" type="low" />
            </div>
            <p className="card-subtitle">
              Live geographic projection of district thermal centroids, hotspot clusters, and HERI vulnerability tiers
            </p>
          </div>
          <Link to="/heat-map" className="btn btn-outline btn-sm flex items-center gap-xs">
            <IconMapPin size={14} />
            Explore Full Geospatial Map &rarr;
          </Link>
        </div>

        <MapPreview height={340} />
      </div>

      {/* 6. Hotspot Score vs HERI Comparison & Land Use Analysis */}
      <div className="charts-grid-2col" style={{ marginBottom: 'var(--space-xl)' }}>
        {/* Hotspot vs HERI Comparison Scatter */}
        <ChartCard
          title="Hotspot Score vs HERI Comparison"
          subtitle="Empirical thermal severity (Hotspot) vs multi-factor demographic vulnerability (HERI)"
          badge={<StatusBadge label="Comparative Model" type="moderate" />}
          height={320}
        >
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis
                type="number"
                dataKey="hotspotScore"
                name="Hotspot Score"
                stroke="#94a3b8"
                fontSize={12}
                domain={[0, 100]}
                label={{ value: 'Hotspot Score (Thermal Intensity & Persistence)', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 11 }}
              />
              <YAxis
                type="number"
                dataKey="heri"
                name="HERI"
                stroke="#94a3b8"
                fontSize={12}
                domain={[0, 100]}
                label={{ value: 'HERI (Multi-Factor Exposure Index)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11 }}
              />
              <ZAxis type="category" dataKey="area" name="District" />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div
                        style={{
                          backgroundColor: '#101c3d',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '8px',
                          padding: '10px 14px',
                          fontSize: '0.8rem',
                          color: '#f8fafc',
                        }}
                      >
                        <div style={{ fontWeight: 700, color: '#38bdf8', marginBottom: '4px' }}>{data.area}</div>
                        <div>Hotspot Score: <strong style={{ color: '#f97316' }}>{data.hotspotScore}/100</strong></div>
                        <div>HERI Index: <strong style={{ color: '#ef4444' }}>{data.heri}/100</strong> ({data.riskLevel})</div>
                        <div>Surface Temp: <strong>{data.temperature}°C</strong></div>
                        <div>Pop Density: <strong>{(data.populationDensity || 0).toLocaleString()} /km²</strong></div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Scatter name="Urban Districts" data={overview?.hotspotVsHeri || []} fill="#f97316" shape="circle" />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Temperature & Risk by Land Use */}
        <ChartCard
          title="Temperature by Land Use (Zoning Analysis)"
          subtitle="Average surface temperature and corresponding average HERI score by zoning classification"
          badge={<StatusBadge label="Zoning Disparity" type="low" />}
          height={320}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={overview?.landUseSummary || []} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="type" stroke="#94a3b8" fontSize={10} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} unit="°C" domain={[15, 45]} />
              <Tooltip content={<CustomChartTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }}
                formatter={(value) => <span style={{ color: '#cbd5e1' }}>{value}</span>}
              />
              <Bar dataKey="avgTemp" name="Avg Surface Temp (°C)" radius={[4, 4, 0, 0]}>
                {(overview?.landUseSummary || []).map((entry, index) => (
                  <Cell key={`cell-lu-${index}`} fill={entry.color || '#f59e0b'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* 7. Environmental & Human Activity Relationships Cards */}
      <div className="charts-grid-2col" style={{ marginBottom: 'var(--space-xl)' }}>
        {/* Environmental Relationships Card */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-xs">
              <IconLeaf size={18} color="#10b981" />
              <h3 className="card-title">Environmental Relationships</h3>
              <StatusBadge label="Pearson r" type="low" />
            </div>
            <p className="card-subtitle">Empirical correlation coefficients with observed surface temperatures</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(overview?.environmentRelationships || []).map((rel, idx) => {
              const isNegative = rel.r < 0;
              const rColor = Math.abs(rel.r) >= 0.5 ? '#ef4444' : Math.abs(rel.r) >= 0.3 ? '#f97316' : '#10b981';
              return (
                <div
                  key={idx}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 16px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{rel.pair}</span>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: rColor }}>
                      r = {rel.r !== null && rel.r !== undefined ? rel.r.toFixed(2) : '—'} ({rel.strength} {rel.direction})
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                    {rel.summary}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Human Activity Relationships Card */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-xs">
              <IconCar size={18} color="#f97316" />
              <h3 className="card-title">Human Activity Relationships</h3>
              <StatusBadge label="Pearson r" type="high" />
            </div>
            <p className="card-subtitle">Anthropogenic pressure variables correlated with surface temperatures</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(overview?.humanActivityRelationships || []).map((rel, idx) => {
              const rColor = Math.abs(rel.r) >= 0.5 ? '#ef4444' : Math.abs(rel.r) >= 0.3 ? '#f97316' : '#10b981';
              return (
                <div
                  key={idx}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 16px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{rel.pair}</span>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: rColor }}>
                      r = {rel.r !== null && rel.r !== undefined ? rel.r.toFixed(2) : '—'} ({rel.strength} {rel.direction})
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                    {rel.summary}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 8. Risk Distribution & Hotspot Distribution Donut Charts */}
      <div className="charts-grid-2col" style={{ marginBottom: 'var(--space-xl)' }}>
        {/* HERI Risk Distribution */}
        <ChartCard
          title="HERI Risk Distribution"
          subtitle="Proportion of monitored urban sectors across HERI vulnerability categories"
          badge={<StatusBadge label="HERI Model" type="moderate" />}
          height={280}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={overview?.riskDistribution || []}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
                nameKey="name"
              >
                {(overview?.riskDistribution || []).map((entry, index) => (
                  <Cell key={`cell-risk-${index}`} fill={entry.color} stroke="rgba(0,0,0,0.3)" />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [`${value}% (${name})`, 'Sectors']} />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => <span style={{ color: '#cbd5e1', fontSize: '11px' }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Hotspot Severity Distribution */}
        <ChartCard
          title="Hotspot Severity Distribution"
          subtitle="Categorization of urban districts based on empirical temperature exceedance"
          badge={<StatusBadge label="Hotspot Tiers" type="high" />}
          height={280}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={overview?.hotspotDistribution || []}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
                nameKey="name"
              >
                {(overview?.hotspotDistribution || []).map((entry, index) => (
                  <Cell key={`cell-hs-${index}`} fill={entry.color} stroke="rgba(0,0,0,0.3)" />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [`${value}% (${name})`, 'Hotspots']} />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => <span style={{ color: '#cbd5e1', fontSize: '11px' }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* 9. High Heat + High Population Priority Widget */}
      {overview?.highHeatHighPop && overview.highHeatHighPop.length > 0 && (
        <div
          className="card"
          style={{
            marginBottom: 'var(--space-xl)',
            borderLeft: '4px solid var(--heat-extreme)',
            backgroundColor: 'rgba(239, 68, 68, 0.04)',
          }}
        >
          <div className="card-header">
            <div className="flex items-center gap-xs">
              <IconFlame size={20} color="var(--heat-extreme)" />
              <h3 className="card-title">High Heat + High Population Density Action Target</h3>
              <StatusBadge label="Priority Exposure" type="extreme" />
            </div>
            <p className="card-subtitle">
              Districts with observed surface temperatures &ge; 34.0°C and population density &ge; 9,000 people/km²
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            {overview.highHeatHighPop.map((item, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {item.name || item.area}
                    </h4>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{item.zone} &bull; {item.landUse}</span>
                  </div>
                  <StatusBadge label={`${item.finalRiskScore ?? item.heri ?? '—'} HERI`} type="extreme" />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginTop: '10px' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Surface Temp: </span>
                    <strong style={{ color: 'var(--heat-high)' }}>{item.rawMetrics?.temperature ?? item.temperature}°C</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Pop Density: </span>
                    <strong>{(item.rawMetrics?.populationDensity ?? item.populationDensity)?.toLocaleString()} /km²</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 10. Ranked Tables Section: Top Risk Areas, Top Hotspots, Lower Exposure Areas */}
      <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div className="flex items-center gap-xs">
              <IconBarChart size={20} color="var(--heat-high)" />
              <h3 className="card-title">Municipal District Rankings</h3>
              <StatusBadge label="Database Backed" type="low" />
            </div>
            <p className="card-subtitle">Comparative assessment across vulnerability, thermal hotspots, and mitigation microclimates</p>
          </div>

          {/* Table Tab Selector */}
          <div className="flex items-center gap-xs">
            <button
              type="button"
              className={`btn btn-sm ${selectedTableTab === 'risk' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSelectedTableTab('risk')}
            >
              Top Risk Areas (HERI)
            </button>
            <button
              type="button"
              className={`btn btn-sm ${selectedTableTab === 'hotspot' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSelectedTableTab('hotspot')}
            >
              Top Hotspots
            </button>
            <button
              type="button"
              className={`btn btn-sm ${selectedTableTab === 'lower' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSelectedTableTab('lower')}
            >
              Lower Exposure Areas
            </button>
          </div>
        </div>

        {selectedTableTab === 'risk' && (
          <TopAreasTable areas={overview?.topRiskAreas || []} mode="risk" />
        )}

        {selectedTableTab === 'hotspot' && (
          <TopAreasTable areas={overview?.topHotspots || []} mode="hotspot" />
        )}

        {selectedTableTab === 'lower' && (
          <TopAreasTable areas={overview?.lowerRiskAreas || []} mode="lower" />
        )}
      </div>

      {/* 11. Data Quality & Coverage Summary Cards */}
      <div className="charts-grid-2col" style={{ marginBottom: 'var(--space-xl)' }}>
        {/* Data Coverage Summary */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-xs">
              <IconDatabase size={18} color="#38bdf8" />
              <h3 className="card-title">Data Coverage & Completeness</h3>
              <StatusBadge label="Audit" type="low" />
            </div>
            <p className="card-subtitle">Dataset boundary and temporal integrity audit</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ padding: '12px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Temporal Span</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
                {overview?.coverage?.temporalRange?.earliest ? new Date(overview.coverage.temporalRange.earliest).toLocaleDateString() : '2026-07-31'} &mdash;{' '}
                {overview?.coverage?.temporalRange?.latest ? new Date(overview.coverage.temporalRange.latest).toLocaleDateString() : '2026-09-12'}
              </div>
            </div>

            <div style={{ padding: '12px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Registered Areas Coverage</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#10b981', marginTop: '4px' }}>
                {overview?.coverage?.monitoredAreas || 11} / {overview?.coverage?.totalRegisteredAreas || 11} Sectors (100%)
              </div>
            </div>

            <div style={{ padding: '12px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sample Completeness</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#38bdf8', marginTop: '4px' }}>
                {overview?.dataQuality?.completeness || 80.8}% Overall Integrity
              </div>
            </div>

            <div style={{ padding: '12px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Missing Rainfall Records</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f59e0b', marginTop: '4px' }}>
                {overview?.dataQuality?.missingValues?.rainfall || 0} Optional Records
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Prioritized Insights */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-xs">
              <IconInfo size={18} color="#f97316" />
              <h3 className="card-title">Key Analytical Insights</h3>
              <StatusBadge label="Rule-Based Engine" type="low" />
            </div>
            <p className="card-subtitle">Empirical findings synthesized from live MongoDB observations</p>
          </div>

          <div className="insights-column" style={{ maxHeight: '240px', overflowY: 'auto' }}>
            {(overview?.insights || []).map((insight) => (
              <InsightCard
                key={insight.id}
                title={insight.title}
                description={insight.message}
                tag={insight.metric}
                category={insight.type?.replace('_', ' ') || 'Insight'}
              />
            ))}
          </div>
          <div style={{ marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Deterministic cross-variable rules
            </span>
            <Link to="/insights" style={{ fontSize: '0.82rem', color: '#f97316', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              View All Insights & Recommendations &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* 12. Quick Actions Bar */}
      <div
        className="card quick-actions-bar no-print"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '14px 20px',
          marginBottom: 'var(--space-xl)',
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
        }}
      >
        <div>
          <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700 }}>Quick Actions & Deep Dives</h4>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Navigate to dedicated analytical sub-systems</span>
        </div>

        <div className="flex items-center gap-xs" style={{ flexWrap: 'wrap' }}>
          <Link to="/heat-map" className="btn btn-primary btn-sm flex items-center gap-xs">
            <IconMapPin size={14} />
            Explore Full Map &rarr;
          </Link>
          <Link to="/insights" className="btn btn-secondary btn-sm flex items-center gap-xs">
            <IconLightbulb size={14} />
            Insights & Planning
          </Link>
          <Link to="/hotspots" className="btn btn-secondary btn-sm flex items-center gap-xs">
            <IconFlame size={14} />
            View Hotspots
          </Link>
          <Link to="/risk-index" className="btn btn-secondary btn-sm flex items-center gap-xs">
            <IconShieldAlert size={14} />
            HERI Risk Engine
          </Link>
          <Link to="/data-explorer" className="btn btn-secondary btn-sm flex items-center gap-xs">
            <IconDatabase size={14} />
            Data Explorer
          </Link>
          <Link to="/import" className="btn btn-secondary btn-sm flex items-center gap-xs">
            <IconDownload size={14} />
            Import CSV
          </Link>
        </div>
      </div>

      {/* 13. Live Dataset Status Bar & Academic Disclaimer Footer */}
      <div
        style={{
          padding: '16px 20px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'rgba(0,0,0,0.2)',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.78rem',
          color: 'var(--text-muted)',
          lineHeight: 1.5,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
          <div>
            <strong>Dataset:</strong> {overview?.metadata?.datasetType || 'Synthetic Demonstration Dataset (Delhi NCR Urban Grid)'}
          </div>
          <div>
            <strong>Evaluated:</strong> {overview?.metadata?.evaluatedAt ? new Date(overview.metadata.evaluatedAt).toLocaleString() : new Date().toLocaleString()}
          </div>
        </div>
        <p style={{ margin: 0, color: 'var(--text-disabled)', fontSize: '0.74rem' }}>
          <strong>Academic & Methodological Disclaimer:</strong>{' '}
          {overview?.metadata?.methodologyDisclaimer ||
            'This dashboard presents project-specific analytical metrics (HERI & Hotspot Score) intended to compare relative spatial and temporal variations in the available dataset. It is not an official municipal warning, medical, or public-health prediction system.'}
        </p>
      </div>
    </div>
  );
};

export default DashboardPage;
