import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

import ChartCard from '../components/dashboard/ChartCard';
import StatusBadge from '../components/common/StatusBadge';
import LoadingState from '../components/common/LoadingState';
import NoticeBanner from '../components/common/NoticeBanner';
import {
  IconMapPin,
  IconThermometer,
  IconFlame,
  IconDroplets,
  IconCloudRain,
  IconCar,
  IconLeaf,
  IconBuilding,
  IconUsers,
  IconShieldAlert,
} from '../components/common/Icons';
import { fetchAreaDetails, fetchAreaHotspotDetails, fetchAreaRiskDetails } from '../services/api';

const AreaDetailsPage = () => {
  const { id } = useParams();
  const [area, setArea] = useState(null);
  const [hotspot, setHotspot] = useState(null);
  const [risk, setRisk] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadArea = async () => {
      setLoading(true);
      setError(null);
      try {
        const [res, hsRes, riskRes] = await Promise.all([
          fetchAreaDetails(id),
          fetchAreaHotspotDetails(id),
          fetchAreaRiskDetails(id),
        ]);

        if (isMounted) {
          if (res.success && res.data) {
            setArea(res.data);
          } else {
            setError(res.error || 'Area not found');
          }
          if (hsRes?.success && hsRes.data) {
            setHotspot(hsRes.data);
          }
          if (riskRes?.success && riskRes.data) {
            setRisk(riskRes.data);
          }
        }
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadArea();
    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return <LoadingState message="Loading area telemetry and metadata..." />;
  }

  if (error || !area) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 'var(--space-3xl)', maxWidth: '640px', margin: 'var(--space-2xl) auto' }}>
        <h3 style={{ color: 'var(--heat-extreme)', marginBottom: '8px' }}>Area Not Found</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-md)', fontSize: '0.9rem' }}>
          Unable to locate area record with ID: <code style={{ color: 'var(--heat-high)' }}>{id}</code>.
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 'var(--space-xl)' }}>
          The requested identifier may have a typo or was removed. Please select an active district from the Data Explorer or Risk Index.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Link to="/data-explorer" className="btn btn-primary btn-sm">
            &larr; Return to Data Explorer
          </Link>
          <Link to="/risk-index" className="btn btn-outline btn-sm">
            View Risk Index
          </Link>
        </div>
      </div>
    );
  }

  const { summary, recentRecords } = area;

  // Format records for history chart
  const historyChartData = (recentRecords || []).map((r) => ({
    time: new Date(r.date).toISOString().replace('T', ' ').substring(5, 16),
    temperature: r.temperature,
    humidity: r.humidity,
    traffic: r.traffic,
  }));

  return (
    <div className="animate-fade-in">
      <NoticeBanner
        badgeText="MongoDB Area Details"
        message={`Observational profile and historical telemetry for ${area.name} retrieved directly from MongoDB.`}
      />

      {/* Header Banner */}
      <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <IconMapPin size={22} color="var(--heat-high)" />
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {area.name}
              </h2>
              <StatusBadge
                label={area.landUse}
                type={area.landUse === 'Green Space' ? 'low' : area.landUse === 'Industrial' ? 'extreme' : 'moderate'}
              />
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem' }}>
              {area.city} &bull; {area.zone} &bull; Coordinates: [{area.latitude?.toFixed(4)}, {area.longitude?.toFixed(4)}]
            </p>
            {area.description && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '8px', maxWidth: '750px' }}>
                {area.description}
              </p>
            )}
          </div>

          <div className="flex gap-xs">
            <Link to={`/heat-map?areaId=${area._id}`} className="btn btn-outline btn-sm flex items-center gap-xs">
              <IconMapPin size={14} /> View on Map
            </Link>
            <Link to="/data-explorer" className="btn btn-secondary btn-sm">
              &larr; Data Explorer
            </Link>
            <Link to="/dashboard" className="btn btn-primary btn-sm">
              Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Baseline Metadata & Demographics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
        <div className="card" style={{ padding: 'var(--space-md)' }}>
          <div className="flex items-center gap-xs" style={{ color: '#38bdf8', marginBottom: '4px' }}>
            <IconUsers size={18} />
            <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 600, color: 'var(--text-muted)' }}>
              Population Density
            </span>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>
            {area.populationDensity?.toLocaleString()} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/km²</span>
          </div>
        </div>

        <div className="card" style={{ padding: 'var(--space-md)' }}>
          <div className="flex items-center gap-xs" style={{ color: '#f59e0b', marginBottom: '4px' }}>
            <IconBuilding size={18} />
            <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 600, color: 'var(--text-muted)' }}>
              Building Density
            </span>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>
            {area.buildingDensity}%
          </div>
        </div>

        <div className="card" style={{ padding: 'var(--space-md)' }}>
          <div className="flex items-center gap-xs" style={{ color: '#10b981', marginBottom: '4px' }}>
            <IconLeaf size={18} />
            <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 600, color: 'var(--text-muted)' }}>
              Vegetation Cover
            </span>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>
            {area.vegetation}%
          </div>
        </div>

        <div className="card" style={{ padding: 'var(--space-md)' }}>
          <div className="flex items-center gap-xs" style={{ color: '#f97316', marginBottom: '4px' }}>
            <IconThermometer size={18} />
            <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 600, color: 'var(--text-muted)' }}>
              Total Observations
            </span>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>
            {summary?.totalObservations || 0} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>records</span>
          </div>
        </div>
      </div>

      {/* Hotspot Detection & Persistence Profile */}
      {hotspot && (
        <div className="card" style={{ marginBottom: 'var(--space-xl)', border: '1px solid rgba(249, 115, 22, 0.3)', background: 'rgba(249, 115, 22, 0.03)' }}>
          <div className="card-header" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-sm)' }}>
            <div>
              <div className="flex items-center gap-xs">
                <IconFlame size={18} color="var(--heat-high)" />
                <h3 className="card-title">Urban Heat Hotspot Profile</h3>
                <StatusBadge label={hotspot.severity} type={hotspot.severity === 'Extreme' ? 'extreme' : 'high'} />
              </div>
              <p className="card-subtitle">
                Relative thermal intensity, exceedance frequency, and temporal persistence
              </p>
            </div>
            <Link to="/hotspots" className="btn btn-outline btn-sm">
              View Hotspots Console &rarr;
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-md)', margin: 'var(--space-md) 0' }}>
            <div style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Hotspot Score</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--heat-high)' }}>
                {hotspot.hotspotScore !== null ? `${hotspot.hotspotScore}/100` : 'N/A'}
              </div>
            </div>

            <div style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Typology</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
                {hotspot.type}
              </div>
            </div>

            <div style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Exceedance Freq</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: hotspot.hotspotFrequency >= 25 ? 'var(--heat-high)' : 'inherit' }}>
                {hotspot.hotspotFrequency}%
              </div>
            </div>

            <div style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Recent Trajectory</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: hotspot.recentTemperatureChange > 0 ? '#ef4444' : '#10b981' }}>
                {hotspot.recentTemperatureChange > 0 ? `+${hotspot.recentTemperatureChange}°C` : `${hotspot.recentTemperatureChange}°C`}
              </div>
            </div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: 'var(--space-sm) var(--space-md)', borderRadius: 'var(--radius-sm)', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
            <strong>Statistical Assessment:</strong> {hotspot.explanation}
          </div>
        </div>
      )}

      {/* Heat Exposure Risk Index (HERI) Profile */}
      {risk && (
        <div className="card" style={{ marginBottom: 'var(--space-xl)', border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.02)' }}>
          <div className="card-header" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-sm)' }}>
            <div>
              <div className="flex items-center gap-xs">
                <IconShieldAlert size={18} color="var(--heat-high)" />
                <h3 className="card-title">Heat Exposure Risk Index (HERI)</h3>
                <StatusBadge label={risk.riskLevel} type={risk.riskLevel === 'Extreme' ? 'extreme' : 'high'} />
              </div>
              <p className="card-subtitle">
                Multi-criteria analytical index combining thermal intensity, population exposure, and protective canopy
              </p>
            </div>
            <Link to="/risk-index" className="btn btn-outline btn-sm">
              View Risk Console &rarr;
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-md)', margin: 'var(--space-md) 0' }}>
            <div style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>HERI Score</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--heat-high)' }}>
                {risk.finalRiskScore !== null ? `${risk.finalRiskScore}/100` : 'N/A'}
              </div>
            </div>

            <div style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Risk Tier</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '6px' }}>
                {risk.riskLevel}
              </div>
            </div>

            <div style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Municipal Rank</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                #{risk.rank}
              </div>
            </div>

            <div style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Completeness</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: risk.dataCompleteness >= 85 ? '#10b981' : '#f59e0b' }}>
                {risk.dataCompleteness}%
              </div>
            </div>
          </div>

          <div style={{ background: 'rgba(249, 115, 22, 0.06)', border: '1px solid rgba(249, 115, 22, 0.2)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-md)' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--heat-high)', marginBottom: '4px' }}>
              Why this area has this score:
            </div>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
              {risk.riskDriverSummary}
            </p>
          </div>

          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <strong>Factor Contributions: </strong>
            {risk.factorContributions?.map((fc) => `${fc.label}: ${fc.contribution}/${fc.maxWeight} pts`).join(' • ')}
          </div>
        </div>
      )}

      {/* Observation Summary Metrics */}
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 'var(--space-md)', color: 'var(--text-primary)' }}>
          Observation Summary Statistics
        </h3>

        <div className="kpi-grid">
          <div className="card">
            <div className="flex items-center justify-between" style={{ marginBottom: '8px' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Average Temperature</span>
              <IconThermometer size={18} color="#f97316" />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--heat-high)' }}>
              {summary?.avgTemperature}°C
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Min: {summary?.minTemperature}°C &bull; Max: {summary?.maxTemperature}°C
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between" style={{ marginBottom: '8px' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Maximum Temperature</span>
              <IconFlame size={18} color="#ef4444" />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--heat-extreme)' }}>
              {summary?.maxTemperature}°C
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Peak thermal anomaly
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between" style={{ marginBottom: '8px' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Average Humidity</span>
              <IconDroplets size={18} color="#38bdf8" />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#38bdf8' }}>
              {summary?.avgHumidity}%
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Ambient moisture level
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between" style={{ marginBottom: '8px' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Average Traffic Index</span>
              <IconCar size={18} color="#f59e0b" />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#f59e0b' }}>
              {summary?.avgTraffic}/100
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Vehicular congestion intensity
            </div>
          </div>
        </div>
      </div>

      {/* Observation History Line Chart */}
      <ChartCard
        title={`${area.name} — Temperature & Telemetry History`}
        subtitle="Chronological observation records logged in MongoDB database"
        badge={<StatusBadge label="Database Verified" type="low" />}
        height={340}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={historyChartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} tickLine={false} />
            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} unit="°C" domain={[15, 48]} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#101c3d',
                borderColor: 'rgba(255,255,255,0.15)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '12px',
              }}
            />
            <Legend
              wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
              formatter={(val) => <span style={{ color: '#cbd5e1' }}>{val}</span>}
            />
            <Line
              type="monotone"
              dataKey="temperature"
              name="Temperature (°C)"
              stroke="#ef4444"
              strokeWidth={2.5}
              dot={{ r: 2 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="humidity"
              name="Humidity (%)"
              stroke="#38bdf8"
              strokeWidth={1.8}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="traffic"
              name="Traffic Index"
              stroke="#f59e0b"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Phase 9: Analytical Observations & Planning Opportunities */}
      <div
        className="card"
        style={{
          marginTop: 'var(--space-xl)',
          backgroundColor: 'var(--color-bg-card, #1e293b)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '10px',
          padding: '24px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IconLeaf size={20} color="#10b981" />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                Analytical Observations & Planning Opportunities
              </h3>
            </div>
            <p style={{ fontSize: '0.84rem', color: '#94a3b8', margin: '4px 0 0 0' }}>
              Deterministic microclimate findings and rule-based municipal considerations for {area.name}
            </p>
          </div>

          <Link
            to="/insights?tab=recommendations"
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.4)' }}
          >
            Explore All City Interventions &rarr;
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {/* Opportunity 1: Green Cover */}
          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              padding: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#34d399', textTransform: 'uppercase' }}>
                Vegetative Canopy
              </span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Cover: {area.vegetationCover || area.vegetation}%</span>
            </div>
            <div style={{ fontSize: '0.86rem', color: '#e2e8f0', lineHeight: 1.5 }}>
              {(area.vegetationCover || area.vegetation || 0) <= 25
                ? `Critically low vegetation cover in ${area.name} accelerates sensible heat retention. Consider pocket park additions and vertical facade greening along pedestrian links.`
                : `Moderate vegetation cover provides baseline microclimate buffering. Focus on preserving mature canopy corridors and bioswales.`}
            </div>
          </div>

          {/* Opportunity 2: Urban Density & Built Environment */}
          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              padding: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f59e0b', textTransform: 'uppercase' }}>
                Surface Albedo & Density
              </span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Density: {area.buildingDensity}%</span>
            </div>
            <div style={{ fontSize: '0.86rem', color: '#e2e8f0', lineHeight: 1.5 }}>
              {area.buildingDensity >= 70
                ? `High structural density promotes street canyon heat entrapment. Evaluate cool roof retrofits with SRI >= 78 and permeable ground pavements.`
                : `Balanced structural density provides open ventilation channels. Maintain prevailing airflow paths during future zoning approvals.`}
            </div>
          </div>

          {/* Opportunity 3: Human Exposure & Public Health */}
          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              padding: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#38bdf8', textTransform: 'uppercase' }}>
                Pedestrian Exposure
              </span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Pop: {(area.populationDensity || 0).toLocaleString()} /km²</span>
            </div>
            <div style={{ fontSize: '0.86rem', color: '#e2e8f0', lineHeight: 1.5 }}>
              {area.populationDensity >= 9000
                ? `High demographic concentration amplifies cumulative exposure risk. Prioritize shaded transit stops and temporary hydration misting points during afternoon peaks.`
                : `Demographic density is low-to-moderate. Focus heat mitigations on primary transport hubs and commercial congregation areas.`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AreaDetailsPage;
