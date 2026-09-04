import React, { useState, useEffect, useCallback } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import NoticeBanner from '../components/common/NoticeBanner';
import LoadingState from '../components/common/LoadingState';
import ChartCard from '../components/dashboard/ChartCard';
import FilterBar from '../components/dashboard/FilterBar';
import {
  fetchAnalyticsHumanActivitySummary,
  fetchAnalyticsHumanActivityRelationships,
  fetchAnalyticsTrafficByArea,
} from '../services/api';

const HumanActivityPage = () => {
  const [filters, setFilters] = useState({
    city: 'All Cities',
    area: 'All Areas',
    zone: 'All Zones',
    landUse: 'All Land Uses',
    dateRange: 'All Dates',
  });

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [relationships, setRelationships] = useState(null);
  const [trafficByArea, setTrafficByArea] = useState([]);

  const loadData = useCallback(async () => {
    setLoading(true);

    const queryParams = {};
    if (filters.city !== 'All Cities') queryParams.city = filters.city;
    if (filters.area !== 'All Areas') queryParams.area = filters.area;
    if (filters.zone !== 'All Zones') queryParams.zone = filters.zone;
    if (filters.landUse !== 'All Land Uses') queryParams.landUse = filters.landUse;

    try {
      const [sumRes, relRes, trafficRes] = await Promise.all([
        fetchAnalyticsHumanActivitySummary(queryParams),
        fetchAnalyticsHumanActivityRelationships(queryParams),
        fetchAnalyticsTrafficByArea(queryParams),
      ]);

      if (sumRes.success) setSummary(sumRes.data);
      if (relRes.success) setRelationships(relRes.data?.relationships);
      if (trafficRes.success) setTrafficByArea(trafficRes.data);
    } catch (err) {
      console.error('Failed to load human activity analytics:', err);
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
        badgeText="Human Activity & Structural Density"
        message="Correlating vehicular traffic volumes, population density, and building surface footprints with thermal patterns. Note: Correlation reflects observed statistical association, not causation."
      />

      {/* Filter Bar */}
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
      />

      {loading ? (
        <LoadingState message="Calculating vehicular congestion models and demographic density associations..." />
      ) : (
        <>
          {/* Human Activity KPI Summary Cards */}
          <div className="kpi-grid" style={{ marginBottom: 'var(--space-xl)' }}>
            <div className="card">
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Vehicular Traffic Index
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--heat-high)', margin: '4px 0' }}>
                {summary?.traffic?.average || 0}/100
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Peak recorded: {summary?.traffic?.max || 0}/100
              </div>
            </div>

            <div className="card">
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Mean Population Density
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#38bdf8', margin: '4px 0' }}>
                {summary?.populationDensity?.average?.toLocaleString() || 0}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Residents / commuters per km²
              </div>
            </div>

            <div className="card">
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Mean Building Density
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#f59e0b', margin: '4px 0' }}>
                {summary?.buildingDensity?.average || 0}%
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Impervious built-up surface area
              </div>
            </div>

            <div className="card">
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Analyzed Observations
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0' }}>
                {summary?.sampleSize?.toLocaleString() || 0}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Telemetry records evaluated
              </div>
            </div>
          </div>

          {/* Traffic Levels By Area Bar Chart */}
          <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
            <div className="card-header">
              <div>
                <h3 className="card-title">Vehicular Traffic Index by Urban Sector</h3>
                <p className="card-subtitle">Comparative congestion intensity across monitored districts</p>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trafficByArea} margin={{ top: 10, right: 20, left: 0, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="area" stroke="var(--text-muted)" fontSize={11} angle={-25} textAnchor="end" />
                <YAxis stroke="var(--text-muted)" fontSize={11} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-elevated)',
                    borderColor: 'var(--border-subtle)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                  }}
                />
                <Bar dataKey="traffic" name="Traffic Index (0-100)" fill="var(--heat-high)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Scatter Relationships with Pearson Correlation Badges */}
          <div style={{ marginBottom: 'var(--space-md)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Human Activity Relationships & Statistical Correlations
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              Scatter point distributions showing local observation pairs with Pearson correlation coefficient (r).
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
            {/* 1. Temp vs Traffic */}
            <ChartCard
              title="Traffic Index vs Temperature"
              subtitle={
                relationships?.trafficVsTemperature?.correlation
                  ? `Pearson r = ${relationships.trafficVsTemperature.correlation.correlation} • ${relationships.trafficVsTemperature.correlation.summary}`
                  : 'Scatter relationship'
              }
            >
              <ResponsiveContainer width="100%" height={260}>
                <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis type="number" dataKey="traffic" name="Traffic" unit="/100" stroke="var(--text-muted)" fontSize={11} />
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
                  <Scatter name="Observations" data={relationships?.trafficVsTemperature?.data || []} fill="var(--heat-high)" />
                </ScatterChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* 2. Temp vs Building Density */}
            <ChartCard
              title="Building Density vs Temperature"
              subtitle={
                relationships?.buildingDensityVsTemperature?.correlation
                  ? `Pearson r = ${relationships.buildingDensityVsTemperature.correlation.correlation} • ${relationships.buildingDensityVsTemperature.correlation.summary}`
                  : 'Scatter relationship'
              }
            >
              <ResponsiveContainer width="100%" height={260}>
                <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis type="number" dataKey="buildingDensity" name="Building %" unit="%" stroke="var(--text-muted)" fontSize={11} />
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
                  <Scatter name="Observations" data={relationships?.buildingDensityVsTemperature?.data || []} fill="#f59e0b" />
                </ScatterChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* 3. Temp vs Population Density */}
            <ChartCard
              title="Population Density vs Temperature"
              subtitle={
                relationships?.populationDensityVsTemperature?.correlation
                  ? `Pearson r = ${relationships.populationDensityVsTemperature.correlation.correlation} • ${relationships.populationDensityVsTemperature.correlation.summary}`
                  : 'Scatter relationship'
              }
            >
              <ResponsiveContainer width="100%" height={260}>
                <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis type="number" dataKey="populationDensity" name="Pop Density" stroke="var(--text-muted)" fontSize={11} />
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
                  <Scatter name="Observations" data={relationships?.populationDensityVsTemperature?.data || []} fill="#38bdf8" />
                </ScatterChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Correlation Interpretation Summary Section */}
          <div className="card" style={{ marginBottom: 'var(--space-2xl)' }}>
            <div className="card-header">
              <div>
                <h3 className="card-title">Statistical Correlation Interpretation</h3>
                <p className="card-subtitle">Methodology & Academic Disclaimers</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-md)' }}>
              <div style={{ background: 'var(--bg-surface)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)' }}>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Vehicular Traffic Association
                </h4>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Vehicular density demonstrates a <strong>{relationships?.trafficVsTemperature?.correlation?.summary || 'positive association'}</strong> (r = {relationships?.trafficVsTemperature?.correlation?.correlation || 0}) with surface and ambient temperatures, consistent with anthropogenic heat dissipation from combustion engines and asphalt absorption.
                </p>
              </div>

              <div style={{ background: 'var(--bg-surface)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)' }}>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Structural Density Association
                </h4>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Impervious building surface percentage shows a <strong>{relationships?.buildingDensityVsTemperature?.correlation?.summary || 'positive association'}</strong> (r = {relationships?.buildingDensityVsTemperature?.correlation?.correlation || 0}) with temperature, reflecting reduced evaporative cooling and higher thermal mass storage in dense masonry.
                </p>
              </div>

              <div style={{ background: 'var(--bg-surface)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)' }}>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: '#fbbf24', marginBottom: '6px' }}>
                  Academic Causality Note
                </h4>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  <em>"Correlation indicates descriptive association between variables. It does not prove that one variable causes the other."</em> These statistical observations serve as descriptive inputs for multi-criteria assessment in later phases.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default HumanActivityPage;
