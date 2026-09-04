import React, { useState, useEffect, useCallback } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import NoticeBanner from '../components/common/NoticeBanner';
import LoadingState from '../components/common/LoadingState';
import ChartCard from '../components/dashboard/ChartCard';
import FilterBar from '../components/dashboard/FilterBar';
import StatusBadge from '../components/common/StatusBadge';
import {
  fetchAnalyticsEnvironmentSummary,
  fetchAnalyticsEnvironmentTrends,
  fetchAnalyticsEnvironmentRelationships,
  fetchAnalyticsTempByLandUse,
} from '../services/api';

const EnvironmentPage = () => {
  const [filters, setFilters] = useState({
    city: 'All Cities',
    area: 'All Areas',
    zone: 'All Zones',
    landUse: 'All Land Uses',
    dateRange: 'All Dates',
  });

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [relationships, setRelationships] = useState(null);
  const [landUseData, setLandUseData] = useState([]);

  const loadData = useCallback(async () => {
    setLoading(true);

    const queryParams = {};
    if (filters.city !== 'All Cities') queryParams.city = filters.city;
    if (filters.area !== 'All Areas') queryParams.area = filters.area;
    if (filters.zone !== 'All Zones') queryParams.zone = filters.zone;
    if (filters.landUse !== 'All Land Uses') queryParams.landUse = filters.landUse;

    try {
      const [sumRes, trendsRes, relRes, luRes] = await Promise.all([
        fetchAnalyticsEnvironmentSummary(queryParams),
        fetchAnalyticsEnvironmentTrends(queryParams),
        fetchAnalyticsEnvironmentRelationships(queryParams),
        fetchAnalyticsTempByLandUse(queryParams),
      ]);

      if (sumRes.success) setSummary(sumRes.data);
      if (trendsRes.success) setTrends(trendsRes.data);
      if (relRes.success) setRelationships(relRes.data?.relationships);
      if (luRes.success) setLandUseData(luRes.data);
    } catch (err) {
      console.error('Failed to load environment analytics:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFilterChange = (key, val) => {
    setFilters((prev) => ({ ...prev, [key]: val }));
  };

  const handleResetFilters = () => {
    setFilters({
      city: 'All Cities',
      area: 'All Areas',
      zone: 'All Zones',
      landUse: 'All Land Uses',
      dateRange: 'All Dates',
    });
  };

  return (
    <div className="animate-fade-in">
      {/* Notice Banner with Academic Causality Disclaimer */}
      <NoticeBanner
        badgeText="Environmental Analytics Engine"
        message="Evaluating multi-source meteorological variables and urban vegetation indices. Note: Observed correlations indicate statistical associations, not direct causal relationships."
      />

      {/* Filter Bar */}
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
      />

      {loading ? (
        <LoadingState message="Aggregating environmental observations and correlation matrices..." />
      ) : (
        <>
          {/* Environmental KPI Summary Cards */}
          <div className="kpi-grid" style={{ marginBottom: 'var(--space-xl)' }}>
            <div className="card">
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Average Ambient Temp
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--heat-high)', margin: '4px 0' }}>
                {summary?.temperature?.average || 0}°C
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Across {summary?.sampleSize || 0} observations
              </div>
            </div>

            <div className="card">
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Relative Humidity
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#38bdf8', margin: '4px 0' }}>
                {summary?.humidity?.average || 0}%
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Range: {summary?.humidity?.min}% - {summary?.humidity?.max}%
              </div>
            </div>

            <div className="card">
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Precipitation (Total)
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#818cf8', margin: '4px 0' }}>
                {summary?.rainfall?.total || 0} mm
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Mean daily: {summary?.rainfall?.average || 0} mm
              </div>
            </div>

            <div className="card">
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Vegetation Index (NDVI)
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--eco-emerald)', margin: '4px 0' }}>
                {summary?.vegetation?.average || 0}%
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Mean urban canopy coverage
              </div>
            </div>
          </div>

          {/* Environmental Time-Series Trends */}
          <div className="charts-grid-2col" style={{ marginBottom: 'var(--space-xl)' }}>
            <ChartCard
              title="Environmental Telemetry Trends Over Time"
              subtitle="Coordinated observation of temperature (°C) and relative humidity (%)"
            >
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={trends} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--bg-elevated)',
                      borderColor: 'var(--border-subtle)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="temperature" name="Temp (°C)" stroke="var(--heat-high)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="humidity" name="Humidity (%)" stroke="#38bdf8" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              title="Precipitation & Canopy Growth Telemetry"
              subtitle="Daily rainfall volume (mm) and vegetation canopy index (%)"
            >
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={trends} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--bg-elevated)',
                      borderColor: 'var(--border-subtle)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="vegetation" name="Vegetation (%)" stroke="var(--eco-emerald)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="rainfall" name="Rainfall (mm)" stroke="#818cf8" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Scatter Relationships with Pearson Correlation Badges */}
          <div style={{ marginBottom: 'var(--space-md)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Environmental Relationships & Statistical Correlations
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              Scatter point distributions showing local observation pairs with Pearson correlation coefficient (r).
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
            {/* 1. Temp vs Vegetation */}
            <ChartCard
              title="Vegetation Canopy vs Temperature"
              subtitle={
                relationships?.vegetationVsTemperature?.correlation
                  ? `Pearson r = ${relationships.vegetationVsTemperature.correlation.correlation} • ${relationships.vegetationVsTemperature.correlation.summary}`
                  : 'Scatter relationship'
              }
            >
              <ResponsiveContainer width="100%" height={260}>
                <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis type="number" dataKey="vegetation" name="Vegetation" unit="%" stroke="var(--text-muted)" fontSize={11} />
                  <YAxis type="number" dataKey="temperature" name="Temp" unit="°C" stroke="var(--text-muted)" fontSize={11} domain={['auto', 'auto']} />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    contentStyle={{
                      backgroundColor: 'var(--bg-elevated)',
                      borderColor: 'var(--border-subtle)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <Scatter name="Observations" data={relationships?.vegetationVsTemperature?.data || []} fill="var(--eco-emerald)" />
                </ScatterChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* 2. Temp vs Humidity */}
            <ChartCard
              title="Relative Humidity vs Temperature"
              subtitle={
                relationships?.humidityVsTemperature?.correlation
                  ? `Pearson r = ${relationships.humidityVsTemperature.correlation.correlation} • ${relationships.humidityVsTemperature.correlation.summary}`
                  : 'Scatter relationship'
              }
            >
              <ResponsiveContainer width="100%" height={260}>
                <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis type="number" dataKey="humidity" name="Humidity" unit="%" stroke="var(--text-muted)" fontSize={11} />
                  <YAxis type="number" dataKey="temperature" name="Temp" unit="°C" stroke="var(--text-muted)" fontSize={11} domain={['auto', 'auto']} />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    contentStyle={{
                      backgroundColor: 'var(--bg-elevated)',
                      borderColor: 'var(--border-subtle)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <Scatter name="Observations" data={relationships?.humidityVsTemperature?.data || []} fill="#38bdf8" />
                </ScatterChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* 3. Temp vs Rainfall */}
            <ChartCard
              title="Precipitation vs Temperature"
              subtitle={
                relationships?.rainfallVsTemperature?.correlation
                  ? `Pearson r = ${relationships.rainfallVsTemperature.correlation.correlation} • ${relationships.rainfallVsTemperature.correlation.summary}`
                  : 'Scatter relationship'
              }
            >
              <ResponsiveContainer width="100%" height={260}>
                <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis type="number" dataKey="rainfall" name="Rainfall" unit="mm" stroke="var(--text-muted)" fontSize={11} />
                  <YAxis type="number" dataKey="temperature" name="Temp" unit="°C" stroke="var(--text-muted)" fontSize={11} domain={['auto', 'auto']} />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    contentStyle={{
                      backgroundColor: 'var(--bg-elevated)',
                      borderColor: 'var(--border-subtle)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <Scatter name="Observations" data={relationships?.rainfallVsTemperature?.data || []} fill="#818cf8" />
                </ScatterChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Land-Use Zoning Comparison Bar Chart */}
          <div className="card" style={{ marginBottom: 'var(--space-2xl)' }}>
            <div className="card-header">
              <div>
                <h3 className="card-title">Zoning & Land-Use Thermal Disparity</h3>
                <p className="card-subtitle">Mean surface temperature by zoning category</p>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={landUseData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="landUse" stroke="var(--text-muted)" fontSize={11} angle={-25} textAnchor="end" />
                <YAxis stroke="var(--text-muted)" fontSize={11} domain={['auto', 'auto']} unit="°C" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-elevated)',
                    borderColor: 'var(--border-subtle)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                  }}
                />
                <Bar dataKey="averageTemperature" name="Avg Temp (°C)" fill="var(--heat-high)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
};

export default EnvironmentPage;
