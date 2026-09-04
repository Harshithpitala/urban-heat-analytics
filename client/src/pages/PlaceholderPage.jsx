import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../components/common/StatusBadge';
import {
  IconMapPin,
  IconFlame,
  IconActivity,
  IconLeaf,
  IconShieldAlert,
  IconDatabase,
  IconLightbulb,
  IconUpload,
  IconArrowRight,
  IconCheckCircle,
} from '../components/common/Icons';

const placeholderConfigs = {
  'heat-map': {
    title: 'Geospatial Heat Map Visualization',
    phase: 'Phase 2',
    icon: IconMapPin,
    accentColor: '#ef4444',
    summary: 'Interactive high-resolution raster and vector heat contour mapping engine.',
    plannedFeatures: [
      'Leaflet / Mapbox GIS layer integration with OpenStreetMap tiles',
      'Continuous thermal surface interpolations (Kriging / IDW algorithms)',
      'Time-slider for 24-hour diurnal heat island expansion playback',
      'Polygon layer overlays for municipal ward and zoning boundaries',
      'Microclimate sensor telemetry pins with live tooltip inspection',
    ],
  },
  hotspots: {
    title: 'Heat Hotspot Detection Engine',
    phase: 'Phase 2',
    icon: IconFlame,
    accentColor: '#f97316',
    summary: 'Statistical cluster detection for localized extreme urban heat anomalies.',
    plannedFeatures: [
      'Getis-Ord Gi* spatial autocorrelation statistical clustering',
      'Severity threshold classification (Alert Level 1 through 4)',
      'Historical recurrence tracking across seasonal heatwaves',
      'Automatic bounding-box extraction for urban intervention zones',
      'Thermal inertia analysis comparing daytime vs nighttime retention',
    ],
  },
  'human-activity': {
    title: 'Human Activity & Mobility Correlation',
    phase: 'Phase 3',
    icon: IconActivity,
    accentColor: '#38bdf8',
    summary: 'Cross-referencing vehicular congestion and pedestrian traffic with heat exposure.',
    plannedFeatures: [
      'Traffic congestion density indexing via mobility telemetry feeds',
      'Transit hub pedestrian crowd density time-series correlation',
      'Anthropogenic heat flux modeling from vehicular combustion engines',
      'Commute exposure index mapping during peak midday hours',
      'Public transit stop shading and thermal comfort evaluations',
    ],
  },
  environment: {
    title: 'Environmental & Canopy Analysis',
    phase: 'Phase 3',
    icon: IconLeaf,
    accentColor: '#10b981',
    summary: 'Ecological cooling buffers, NDVI satellite metrics, and surface albedo indicators.',
    plannedFeatures: [
      'Multi-spectral NDVI (Normalized Difference Vegetation Index) maps',
      'Tree canopy volume and urban forestry shade percentage metrics',
      'Impervious surface ratio (asphalt, concrete, roofing materials)',
      'Evapotranspiration cooling buffer estimation model',
      'Water body buffer zones and coastal microclimate moderating effects',
    ],
  },
  'risk-index': {
    title: 'Heat Exposure Risk Index (HERI)',
    phase: 'Phase 3',
    icon: IconShieldAlert,
    accentColor: '#f59e0b',
    summary: 'Multi-criteria spatial decision matrix assessing vulnerable urban populations.',
    plannedFeatures: [
      'Composite scoring formula: Hazard x Exposure x Vulnerability',
      'Demographic census integration (elderly, children, low-income tracts)',
      'Building age and indoor cooling access weighting factors',
      'Prioritized heat mitigation resource allocation matrix',
      'Exportable municipal risk summary reports and action sheets',
    ],
  },
  'data-explorer': {
    title: 'Data Explorer & Query Console',
    phase: 'Phase 2',
    icon: IconDatabase,
    accentColor: '#6366f1',
    summary: 'Full-featured query builder and tabular inspector for raw environmental readings.',
    plannedFeatures: [
      'Multi-variable filtering (temperature, humidity, traffic, zoning)',
      'Custom date-range aggregations (hourly, daily, seasonal averages)',
      'Export raw datasets in CSV, JSON, and GeoJSON formats',
      'Anomaly flagging and statistical outlier highlighting',
      'Custom multi-axis chart generator for ad-hoc research',
    ],
  },
  insights: {
    title: 'Automated Diagnostic Insights',
    phase: 'Phase 3',
    icon: IconLightbulb,
    accentColor: '#ec4899',
    summary: 'Rule-based and heuristic diagnostic summaries of urban climate phenomena.',
    plannedFeatures: [
      'Automated daily executive summary generation for city officials',
      'Correlation heatmaps between canopy loss and temperature spikes',
      'Early warning heatwave alert generation triggers',
      'Prescriptive cooling recommendations (cool roofs, tree planting priority)',
      'Comparative benchmarking against historical baseline years',
    ],
  },
  'data-import': {
    title: 'Data Ingestion & Pipeline Hub',
    phase: 'Phase 2',
    icon: IconUpload,
    accentColor: '#14b8a6',
    summary: 'Centralized portal for uploading sensor logs, CSV files, and configuring APIs.',
    plannedFeatures: [
      'CSV / Excel bulk dataset file parser and validator',
      'Satellite GeoTIFF / NetCDF raster file ingestion pipeline',
      'Automated schema matching and unit conversion tools',
      'Integration connectors for OpenWeatherMap and Copernicus APIs',
      'Ingestion job audit logs and data pipeline health monitor',
    ],
  },
};

const PlaceholderPage = ({ type }) => {
  const config = placeholderConfigs[type] || {
    title: 'Upcoming Platform Module',
    phase: 'Upcoming Phase',
    icon: IconDatabase,
    accentColor: '#f97316',
    summary: 'This module is scheduled for development in an upcoming phase.',
    plannedFeatures: ['Feature architecture in progress'],
  };

  const Icon = config.icon;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div className="card" style={{ padding: 'var(--space-3xl)', textAlign: 'center', marginBottom: 'var(--space-2xl)' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: 'var(--radius-xl)',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: config.accentColor,
            margin: '0 auto var(--space-lg)',
            boxShadow: `0 0 24px ${config.accentColor}33`,
          }}
        >
          <Icon size={32} />
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-sm)' }}>
          <StatusBadge label={config.phase} type="demo" />
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Under Construction</span>
        </div>

        <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: 'var(--space-xs)', color: 'var(--text-primary)' }}>
          {config.title}
        </h2>

        <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', maxWidth: '640px', margin: '0 auto var(--space-2xl)' }}>
          {config.summary}
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-md)' }}>
          <Link to="/dashboard" className="btn btn-primary btn-sm">
            &larr; Return to Dashboard
          </Link>
          <Link to="/" className="btn btn-secondary btn-sm">
            View Project Overview
          </Link>
        </div>
      </div>

      {/* Planned Roadmap Specifications */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Planned Implementation Scope ({config.phase})</h3>
            <p className="card-subtitle">Detailed engineering deliverables scheduled for the next iteration</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {config.plannedFeatures.map((feature, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'var(--space-md)',
                padding: 'var(--space-md)',
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ color: config.accentColor, marginTop: '2px', flexShrink: 0 }}>
                <IconCheckCircle size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                  {feature}
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Architecture blueprint confirmed &bull; Data models and algorithms to be connected in {config.phase}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlaceholderPage;
