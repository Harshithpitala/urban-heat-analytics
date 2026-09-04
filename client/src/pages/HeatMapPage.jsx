import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Tooltip,
  Popup,
  useMap,
} from 'react-leaflet';
import NoticeBanner from '../components/common/NoticeBanner';
import LoadingState from '../components/common/LoadingState';
import StatusBadge from '../components/common/StatusBadge';
import {
  IconMapPin,
  IconFlame,
  IconShieldAlert,
  IconUsers,
  IconLeaf,
  IconCar,
  IconBuilding,
  IconSearch,
  IconRefreshCw,
  IconInfo,
  IconLayers,
  IconCheck,
} from '../components/common/Icons';
import { fetchMapAreas, fetchMapSummary } from '../services/api';

// Tile Layer configurations
const TILE_LAYERS = {
  dark: {
    name: 'Dark Canvas (CartoDB)',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  street: {
    name: 'Street Map (OpenStreetMap)',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
};

// Semantic Color Palettes
const RISK_COLORS = {
  Extreme: '#dc2626',
  'Very High': '#f97316',
  High: '#f59e0b',
  Moderate: '#38bdf8',
  Low: '#10b981',
  'Insufficient Data': '#64748b',
};

const LAND_USE_COLORS = {
  Commercial: '#f59e0b',
  Industrial: '#ef4444',
  Residential: '#38bdf8',
  'Green Space': '#10b981',
  Transportation: '#a855f7',
  Institutional: '#6366f1',
  'Mixed Use': '#ec4899',
  Other: '#94a3b8',
};

// Helper to determine marker color & radius based on active layer
const getMarkerVisuals = (area, layer) => {
  let color = '#38bdf8';
  let radius = 12;

  switch (layer) {
    case 'temperature': {
      const t = area.temperature;
      if (t >= 38) color = '#dc2626';
      else if (t >= 35) color = '#f97316';
      else if (t >= 32) color = '#f59e0b';
      else if (t >= 28) color = '#38bdf8';
      else color = '#10b981';
      radius = Math.max(9, Math.min(22, (t - 20) * 0.8));
      break;
    }
    case 'hotspot': {
      const score = area.hotspotScore ?? 0;
      if (score >= 80) color = '#dc2626';
      else if (score >= 60) color = '#f97316';
      else if (score >= 40) color = '#f59e0b';
      else if (score >= 20) color = '#38bdf8';
      else color = '#10b981';
      radius = Math.max(9, Math.min(22, 8 + (score / 100) * 12));
      break;
    }
    case 'population': {
      const pop = area.populationDensity || 0;
      if (pop >= 14000) color = '#ef4444';
      else if (pop >= 10000) color = '#f97316';
      else if (pop >= 6000) color = '#f59e0b';
      else color = '#38bdf8';
      radius = Math.max(9, Math.min(22, 8 + (pop / 18000) * 14));
      break;
    }
    case 'vegetation': {
      const veg = area.vegetation || 0;
      if (veg >= 60) color = '#10b981';
      else if (veg >= 40) color = '#34d399';
      else if (veg >= 20) color = '#f59e0b';
      else color = '#ef4444';
      radius = Math.max(9, Math.min(20, 8 + (veg / 100) * 12));
      break;
    }
    case 'traffic': {
      const tr = area.traffic || 0;
      if (tr >= 75) color = '#ef4444';
      else if (tr >= 50) color = '#f59e0b';
      else color = '#10b981';
      radius = Math.max(9, Math.min(20, 8 + (tr / 100) * 12));
      break;
    }
    case 'building': {
      const b = area.buildingDensity || 0;
      if (b >= 75) color = '#dc2626';
      else if (b >= 50) color = '#f97316';
      else if (b >= 25) color = '#38bdf8';
      else color = '#10b981';
      radius = Math.max(9, Math.min(20, 8 + (b / 100) * 12));
      break;
    }
    case 'landUse': {
      color = LAND_USE_COLORS[area.landUse] || '#94a3b8';
      radius = 13;
      break;
    }
    case 'heri':
    default: {
      color = RISK_COLORS[area.riskLevel] || '#64748b';
      const heri = area.heri ?? 0;
      radius = Math.max(10, Math.min(22, 8 + (heri / 100) * 13));
      break;
    }
  }

  return { color, radius };
};

// Subcomponent to smoothly pan/zoom map on area selection or bounds change
const MapViewController = ({ selectedArea, bounds, center }) => {
  const map = useMap();

  useEffect(() => {
    if (selectedArea && selectedArea.latitude && selectedArea.longitude) {
      map.flyTo([selectedArea.latitude, selectedArea.longitude], 13, {
        animate: true,
        duration: 1.2,
      });
    } else if (bounds && bounds.length === 2 && bounds[0][0] !== Infinity) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    } else if (center) {
      map.setView(center, 11);
    }
  }, [selectedArea, bounds, center, map]);

  return null;
};

const HeatMapPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Active Map Layer state
  const [activeLayer, setActiveLayer] = useState(searchParams.get('layer') || 'heri');
  const [activeMode, setActiveMode] = useState(searchParams.get('mode') || 'all');
  const [activeTile, setActiveTile] = useState('dark');

  // Query Filters state
  const [filters, setFilters] = useState({
    city: 'All Cities',
    zone: 'All Zones',
    landUse: 'All Land Uses',
    riskLevel: 'All Levels',
    search: '',
  });

  // Data states
  const [loading, setLoading] = useState(true);
  const [mapData, setMapData] = useState({ areas: [], totalAreas: 0, unavailableCount: 0 });
  const [summary, setSummary] = useState(null);
  const [selectedArea, setSelectedArea] = useState(null);
  const [showTable, setShowTable] = useState(false);
  const [showMethodology, setShowMethodology] = useState(false);

  // Load map data & summary
  const loadMapData = useCallback(async () => {
    setLoading(true);

    const queryParams = {};
    if (filters.city !== 'All Cities') queryParams.city = filters.city;
    if (filters.zone !== 'All Zones') queryParams.zone = filters.zone;
    if (filters.landUse !== 'All Land Uses') queryParams.landUse = filters.landUse;
    if (filters.riskLevel !== 'All Levels') queryParams.riskLevel = filters.riskLevel;
    if (activeMode === 'high_heat_high_pop') queryParams.mode = 'high_heat_high_pop';

    try {
      const [areasRes, sumRes] = await Promise.all([
        fetchMapAreas(queryParams),
        fetchMapSummary(queryParams),
      ]);

      if (areasRes.success && areasRes.data) {
        setMapData(areasRes.data);

        // Check if areaId param was passed via URL deep link
        const targetAreaId = searchParams.get('areaId');
        if (targetAreaId) {
          const match = areasRes.data.areas.find((a) => a.areaId.toString() === targetAreaId);
          if (match) setSelectedArea(match);
        } else if (areasRes.data.areas.length > 0 && !selectedArea) {
          setSelectedArea(areasRes.data.areas[0]);
        }
      }

      if (sumRes.success && sumRes.data) {
        setSummary(sumRes.data);
      }
    } catch (err) {
      console.error('Failed to load map data:', err);
    } finally {
      setLoading(false);
    }
  }, [filters.city, filters.zone, filters.landUse, filters.riskLevel, activeMode, searchParams]);

  useEffect(() => {
    loadMapData();
  }, [loadMapData]);

  // Sync state back to URL query parameters
  const updateUrlParams = (key, val) => {
    const next = new URLSearchParams(searchParams);
    if (val) next.set(key, val);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  };

  const handleLayerChange = (layer) => {
    setActiveLayer(layer);
    updateUrlParams('layer', layer);
  };

  const handleAreaSelect = (area) => {
    setSelectedArea(area);
    updateUrlParams('areaId', area.areaId);
  };

  // Filtered displayed areas based on in-memory search
  const displayedAreas = useMemo(() => {
    if (!filters.search.trim()) return mapData.areas;
    const term = filters.search.toLowerCase();
    return mapData.areas.filter(
      (a) =>
        a.name.toLowerCase().includes(term) ||
        a.zone.toLowerCase().includes(term) ||
        a.landUse.toLowerCase().includes(term)
    );
  }, [mapData.areas, filters.search]);

  // CSV Export handler
  const handleExportCSV = () => {
    if (displayedAreas.length === 0) return;

    const headers = [
      'Area Name',
      'City',
      'Zone',
      'Land Use',
      'Latitude',
      'Longitude',
      'Temperature (°C)',
      'Humidity (%)',
      'Traffic Index',
      'Population Density (/km²)',
      'Building Density (%)',
      'Vegetation (%)',
      'Hotspot Score (0-100)',
      'Hotspot Severity',
      'HERI Score (0-100)',
      'Risk Level',
      'High Heat + High Pop',
    ];

    const rows = displayedAreas.map((a) => [
      `"${a.name.replace(/"/g, '""')}"`,
      `"${a.city.replace(/"/g, '""')}"`,
      `"${a.zone.replace(/"/g, '""')}"`,
      `"${a.landUse.replace(/"/g, '""')}"`,
      a.latitude,
      a.longitude,
      a.temperature,
      a.humidity,
      a.traffic,
      a.populationDensity,
      a.buildingDensity,
      a.vegetation,
      a.hotspotScore ?? 'N/A',
      `"${a.hotspotSeverity}"`,
      a.heri ?? 'N/A',
      `"${a.riskLevel}"`,
      a.isHighHeatHighPop ? 'Yes' : 'No',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'urban_heat_geospatial_intelligence_data.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-fade-in">
      {/* Notice Banner with Academic Rigor & Geospatial Centroid Disclaimer */}
      <NoticeBanner
        badgeText="Geospatial Intelligence (Phase 7)"
        message="Map markers reflect observation centroids for evaluated municipal districts in the synthetic demo dataset. They illustrate relative spatial patterns rather than continuous interpolated temperature surfaces."
      />

      {/* Spatial Summary KPI Bar */}
      <div className="kpi-grid" style={{ marginBottom: 'var(--space-lg)' }}>
        <div className="card" style={{ padding: '12px 16px' }}>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Mapped Sectors
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {mapData.totalAreas}{' '}
            <span style={{ fontSize: '0.75rem', color: '#10b981' }}>
              ({mapData.unavailableCount} excluded)
            </span>
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            Active within current filters
          </div>
        </div>

        <div className="card" style={{ padding: '12px 16px' }}>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Avg Temperature
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--heat-high)' }}>
            {summary?.averageTemperature ?? 0}°C
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            Municipal observation mean
          </div>
        </div>

        <div className="card" style={{ padding: '12px 16px' }}>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Average HERI
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--heat-high)' }}>
            {summary?.averageHeri ?? 0}{' '}
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>/100</span>
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            Composite multi-criteria score
          </div>
        </div>

        <div className="card" style={{ padding: '12px 16px' }}>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Elevated Risk Sectors
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f97316' }}>
            {(summary?.extremeRiskCount || 0) + (summary?.veryHighRiskCount || 0)}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            Extreme ({summary?.extremeRiskCount || 0}) &bull; Very High ({summary?.veryHighRiskCount || 0})
          </div>
        </div>

        <div className="card" style={{ padding: '12px 16px' }}>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            High Heat + High Pop
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#dc2626' }}>
            {summary?.highHeatHighPopCount || 0}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            &ge;34°C & &ge;9,000 residents/km²
          </div>
        </div>
      </div>

      {/* Map Control & Filter Toolbar */}
      <div
        className="card"
        style={{
          marginBottom: 'var(--space-md)',
          padding: 'var(--space-md) var(--space-lg)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-md)',
          background: 'var(--bg-surface)',
        }}
      >
        {/* Layer Selector Chips */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginRight: '6px' }}>
            ACTIVE LAYER:
          </span>
          {[
            { id: 'heri', label: 'Heat Risk (HERI)', icon: IconShieldAlert },
            { id: 'temperature', label: 'Temperature', icon: IconFlame },
            { id: 'hotspot', label: 'Hotspot Score', icon: IconFlame },
            { id: 'population', label: 'Population', icon: IconUsers },
            { id: 'vegetation', label: 'Vegetation', icon: IconLeaf },
            { id: 'traffic', label: 'Traffic', icon: IconCar },
            { id: 'building', label: 'Building %', icon: IconBuilding },
            { id: 'landUse', label: 'Land Use', icon: IconLayers },
          ].map((layer) => {
            const isActive = activeLayer === layer.id;
            return (
              <button
                key={layer.id}
                type="button"
                className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-outline'}`}
                style={{
                  padding: '4px 10px',
                  fontSize: '0.78rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                onClick={() => handleLayerChange(layer.id)}
              >
                {isActive && <IconCheck size={12} />}
                {layer.label}
              </button>
            );
          })}
        </div>

        {/* Special Analysis Mode Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className={`btn btn-sm ${activeMode === 'high_heat_high_pop' ? 'btn-danger' : 'btn-secondary'}`}
            style={{
              padding: '4px 10px',
              fontSize: '0.78rem',
              backgroundColor: activeMode === 'high_heat_high_pop' ? '#dc2626' : undefined,
              borderColor: activeMode === 'high_heat_high_pop' ? '#dc2626' : undefined,
            }}
            onClick={() => {
              const nextMode = activeMode === 'high_heat_high_pop' ? 'all' : 'high_heat_high_pop';
              setActiveMode(nextMode);
              updateUrlParams('mode', nextMode === 'all' ? '' : nextMode);
            }}
          >
            🔥 High Heat + Dense Population Mode
          </button>

          {/* Basemap Switcher */}
          <select
            className="filter-select"
            style={{ fontSize: '0.78rem', padding: '4px 8px' }}
            value={activeTile}
            onChange={(e) => setActiveTile(e.target.value)}
          >
            <option value="dark">Canvas: Dark Matter</option>
            <option value="street">Canvas: OpenStreetMap</option>
          </select>

          {/* CSV Export */}
          <button
            type="button"
            className="btn btn-outline btn-sm"
            style={{ fontSize: '0.78rem', padding: '4px 10px' }}
            onClick={handleExportCSV}
          >
            Export Map (CSV)
          </button>
        </div>
      </div>

      {/* Filter & Search Sub-bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 'var(--space-md)',
          alignItems: 'center',
          marginBottom: 'var(--space-lg)',
        }}
      >
        <div className="header-search" style={{ maxWidth: '260px' }}>
          <IconSearch size={16} color="var(--text-disabled)" />
          <input
            type="text"
            placeholder="Search district by name..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>

        <select
          className="filter-select"
          style={{ fontSize: '0.8rem' }}
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

        <select
          className="filter-select"
          style={{ fontSize: '0.8rem' }}
          value={filters.riskLevel}
          onChange={(e) => setFilters({ ...filters, riskLevel: e.target.value })}
        >
          <option value="All Levels">All Risk Tiers</option>
          <option value="Extreme">Extreme</option>
          <option value="Very High">Very High</option>
          <option value="High">High</option>
          <option value="Moderate">Moderate</option>
          <option value="Low">Low</option>
        </select>

        <button
          type="button"
          className="btn btn-outline btn-sm"
          style={{ fontSize: '0.78rem', padding: '4px 8px' }}
          onClick={() => {
            setFilters({
              city: 'All Cities',
              zone: 'All Zones',
              landUse: 'All Land Uses',
              riskLevel: 'All Levels',
              search: '',
            });
            setActiveMode('all');
            updateUrlParams('mode', '');
          }}
        >
          Reset Filters
        </button>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.78rem' }}
            onClick={() => setShowTable(!showTable)}
          >
            {showTable ? 'Hide Data Table' : 'Show Map Data Table (Accessible)'}
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.78rem' }}
            onClick={() => setShowMethodology(!showMethodology)}
          >
            <IconInfo size={14} /> How to Read This Map
          </button>
        </div>
      </div>

      {/* Methodology Accordion (Collapsible) */}
      {showMethodology && (
        <div
          className="card animate-fade-in"
          style={{
            marginBottom: 'var(--space-lg)',
            background: 'rgba(56, 189, 248, 0.04)',
            border: '1px solid rgba(56, 189, 248, 0.2)',
          }}
        >
          <div className="card-header" style={{ marginBottom: '8px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Geospatial Intelligence Methodology & Map Reading Guide
            </h4>
          </div>
          <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <p style={{ marginBottom: '6px' }}>
              &bull; <strong>Point Observations:</strong> Each circular marker represents an urban district or grid centroid derived from stored telemetry. Point markers represent available area-level observations rather than continuous interpolated temperature surfaces.
            </p>
            <p style={{ marginBottom: '6px' }}>
              &bull; <strong>Active Layer Scaling:</strong> When switching layers, circle sizes and color semantics adapt to the selected metric (e.g. HERI risk tiers vs. raw thermal readings).
            </p>
            <p style={{ marginBottom: '6px' }}>
              &bull; <strong>High Heat + High Population Mode:</strong> Identifies sectors where elevated temperatures (&ge; 34°C) intersect with dense human settlement (&ge; 9,000 residents/km²).
            </p>
            <p>
              &bull; <strong>Data Source:</strong> {summary?.dataSource?.type || 'Synthetic Demo Dataset'} containing {summary?.dataSource?.totalRecords?.toLocaleString() || 800}+ records spanning {summary?.dataSource?.dateRange || '2026'}.
            </p>
          </div>
        </div>
      )}

      {/* Main Map Viewport & Side Detail Panel */}
      {loading && mapData.areas.length === 0 ? (
        <LoadingState message="Initializing Leaflet map and projecting spatial coordinates..." />
      ) : mapData.areas.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-3xl)' }}>
          <IconMapPin size={40} color="var(--heat-high)" />
          <h3 style={{ margin: '12px 0 6px', color: 'var(--text-primary)' }}>
            No Geographic Data Available
          </h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-lg)' }}>
            No records matched the active filter criteria or coordinates are missing.
          </p>
          <Link to="/data-import" className="btn btn-primary btn-sm">
            Go to Data Import
          </Link>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: selectedArea ? '1fr 360px' : '1fr',
            gap: 'var(--space-lg)',
            marginBottom: 'var(--space-xl)',
            alignItems: 'start',
          }}
        >
          {/* Map Container */}
          <div
            className="card"
            style={{
              padding: 0,
              overflow: 'hidden',
              height: '620px',
              position: 'relative',
              border: '1px solid var(--border-glow)',
            }}
          >
            <MapContainer
              center={mapData.centroid || [28.582, 77.216]}
              zoom={11}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution={TILE_LAYERS[activeTile].attribution}
                url={TILE_LAYERS[activeTile].url}
              />

              <MapViewController
                selectedArea={selectedArea}
                bounds={mapData.bounds}
                center={mapData.centroid}
              />

              {displayedAreas.map((area) => {
                const { color, radius } = getMarkerVisuals(area, activeLayer);
                const isSelected = selectedArea?.areaId === area.areaId;

                return (
                  <CircleMarker
                    key={area.areaId}
                    center={[area.latitude, area.longitude]}
                    radius={isSelected ? radius + 4 : radius}
                    pathOptions={{
                      color: isSelected ? '#ffffff' : color,
                      weight: isSelected ? 3 : 1.5,
                      fillColor: color,
                      fillOpacity: isSelected ? 0.9 : 0.75,
                    }}
                    eventHandlers={{
                      click: () => handleAreaSelect(area),
                    }}
                  >
                    {/* Hover Tooltip */}
                    <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
                      <div style={{ fontSize: '0.82rem', padding: '2px 4px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{area.name}</div>
                        <div style={{ color: '#475569', fontSize: '0.74rem' }}>
                          {area.zone} &bull; {area.landUse}
                        </div>
                        <div style={{ marginTop: '4px', borderTop: '1px solid #e2e8f0', paddingTop: '3px' }}>
                          <div><strong>Temp:</strong> {area.temperature}°C</div>
                          <div><strong>HERI:</strong> {area.heri ?? 'N/A'}/100 ({area.riskLevel})</div>
                          <div><strong>Hotspot:</strong> {area.hotspotScore ?? 'N/A'}/100</div>
                          <div><strong>Pop Density:</strong> {area.populationDensity?.toLocaleString()}/km²</div>
                        </div>
                      </div>
                    </Tooltip>
                  </CircleMarker>
                );
              })}
            </MapContainer>

            {/* Dynamic Map Legend Overlay */}
            <div
              style={{
                position: 'absolute',
                bottom: '16px',
                left: '16px',
                zIndex: 1000,
                background: 'rgba(10, 15, 29, 0.9)',
                backdropFilter: 'blur(8px)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
                maxWidth: '260px',
                fontSize: '0.75rem',
                color: 'var(--text-primary)',
              }}
            >
              <div style={{ fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px', color: 'var(--text-muted)' }}>
                Legend: {activeLayer.toUpperCase()}
              </div>

              {activeLayer === 'heri' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                  {Object.entries(RISK_COLORS).map(([label, col]) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: col }} />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              )}

              {activeLayer === 'temperature' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#dc2626' }} />
                    <span>&ge; 38°C (Extreme Heat)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f97316' }} />
                    <span>35 - 37.9°C (High Heat)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
                    <span>32 - 34.9°C (Moderate)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
                    <span>&lt; 32°C (Temperate)</span>
                  </div>
                </div>
              )}

              {activeLayer === 'hotspot' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#dc2626' }} />
                    <span>81 - 100 (Extreme Hotspot)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f97316' }} />
                    <span>61 - 80 (Very High)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
                    <span>0 - 40 (Stable Cooler)</span>
                  </div>
                </div>
              )}

              {activeLayer === 'population' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
                    <span>&ge; 14,000 /km² (Dense)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
                    <span>6,000 - 13,999 /km²</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#38bdf8' }} />
                    <span>&lt; 6,000 /km² (Sparse)</span>
                  </div>
                </div>
              )}

              {activeLayer === 'vegetation' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
                    <span>&ge; 60% (Lush Canopy)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
                    <span>20% - 59% (Moderate)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
                    <span>&lt; 20% (Barren / Impervious)</span>
                  </div>
                </div>
              )}

              {activeLayer === 'landUse' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                  {Object.entries(LAND_USE_COLORS).map(([label, col]) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: col }} />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Selected Area Detail Side Panel */}
          {selectedArea && (
            <div
              className="card animate-fade-in"
              style={{
                height: '620px',
                overflowY: 'auto',
                border: '1px solid var(--border-glow)',
                background: 'var(--bg-surface)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                    Selected District
                  </span>
                  <StatusBadge
                    label={selectedArea.riskLevel}
                    type={
                      selectedArea.riskLevel === 'Extreme'
                        ? 'extreme'
                        : selectedArea.riskLevel === 'Very High' || selectedArea.riskLevel === 'High'
                        ? 'high'
                        : 'low'
                    }
                  />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0 2px' }}>
                  {selectedArea.name}
                </h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {selectedArea.zone} &bull; {selectedArea.landUse} &bull; {selectedArea.city}
                </div>
              </div>

              {/* Hero Index Numbers */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 'var(--space-sm)',
                  marginBottom: 'var(--space-md)',
                }}
              >
                <div style={{ background: 'var(--bg-elevated)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    HERI Risk Index
                  </div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color: RISK_COLORS[selectedArea.riskLevel] || 'var(--text-primary)' }}>
                    {selectedArea.heri !== null ? `${selectedArea.heri}` : 'N/A'}{' '}
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/100</span>
                  </div>
                </div>

                <div style={{ background: 'var(--bg-elevated)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    Ambient Temp
                  </div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--heat-high)' }}>
                    {selectedArea.temperature}°C
                  </div>
                </div>
              </div>

              {/* Environmental & Built Traits Grid */}
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 'var(--space-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '3px' }}>
                  <span>Hotspot Score:</span>
                  <strong>{selectedArea.hotspotScore !== null ? `${selectedArea.hotspotScore}/100` : 'N/A'} ({selectedArea.hotspotType})</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '3px' }}>
                  <span>Population Density:</span>
                  <strong>{selectedArea.populationDensity?.toLocaleString()} /km²</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '3px' }}>
                  <span>Building Density:</span>
                  <strong>{selectedArea.buildingDensity}%</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '3px' }}>
                  <span>Vegetation Canopy:</span>
                  <strong style={{ color: 'var(--eco-emerald)' }}>{selectedArea.vegetation}%</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '3px' }}>
                  <span>Traffic Level:</span>
                  <strong>{selectedArea.traffic} / 100</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '3px' }}>
                  <span>Relative Humidity:</span>
                  <strong>{selectedArea.humidity}%</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Coordinates:</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.76rem' }}>
                    {selectedArea.latitude.toFixed(4)}, {selectedArea.longitude.toFixed(4)}
                  </span>
                </div>
              </div>

              {selectedArea.isHighHeatHighPop && (
                <div
                  style={{
                    padding: '8px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#f87171',
                    fontSize: '0.78rem',
                    marginBottom: 'var(--space-md)',
                  }}
                >
                  ⚠️ <strong>Priority Attention:</strong> High temperature combined with dense population exposure.
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Link
                  to={`/areas/${selectedArea.areaId}`}
                  className="btn btn-primary btn-sm"
                  style={{ textAlign: 'center', width: '100%' }}
                >
                  View Full Area Profile &rarr;
                </Link>
                <Link
                  to={`/risk-index`}
                  className="btn btn-outline btn-sm"
                  style={{ textAlign: 'center', width: '100%' }}
                >
                  Inspect Risk Index Model &rarr;
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Accessible Map Data Table (Collapsible) */}
      {showTable && (
        <div className="card animate-fade-in" style={{ padding: 0, overflow: 'hidden', marginBottom: 'var(--space-2xl)' }}>
          <div
            style={{
              padding: 'var(--space-md) var(--space-xl)',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div className="flex items-center gap-xs">
              <IconMapPin size={18} color="var(--heat-high)" />
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>
                Accessible Geographic Data Table
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                ({displayedAreas.length} districts mapped)
              </span>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Screen reader & tabular inspector
            </span>
          </div>

          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>District Name</th>
                  <th>Land Use</th>
                  <th>Latitude</th>
                  <th>Longitude</th>
                  <th>Avg Temp</th>
                  <th>Hotspot Score</th>
                  <th>HERI</th>
                  <th>Risk Tier</th>
                  <th>Pop Density</th>
                  <th>Vegetation</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedAreas.map((a) => (
                  <tr
                    key={a.areaId}
                    style={{
                      backgroundColor: selectedArea?.areaId === a.areaId ? 'rgba(249, 115, 22, 0.08)' : 'transparent',
                      cursor: 'pointer',
                    }}
                    onClick={() => handleAreaSelect(a)}
                  >
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{a.name}</td>
                    <td style={{ fontSize: '0.82rem' }}>{a.landUse}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{a.latitude.toFixed(4)}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{a.longitude.toFixed(4)}</td>
                    <td style={{ fontWeight: 600 }}>{a.temperature}°C</td>
                    <td>{a.hotspotScore ?? 'N/A'}/100</td>
                    <td style={{ fontWeight: 700, color: RISK_COLORS[a.riskLevel] || 'inherit' }}>
                      {a.heri ?? 'N/A'}
                    </td>
                    <td>
                      <StatusBadge
                        label={a.riskLevel}
                        type={
                          a.riskLevel === 'Extreme'
                            ? 'extreme'
                            : a.riskLevel === 'Very High' || a.riskLevel === 'High'
                            ? 'high'
                            : 'low'
                        }
                      />
                    </td>
                    <td style={{ fontSize: '0.82rem' }}>{a.populationDensity?.toLocaleString()} /km²</td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--eco-emerald)' }}>{a.vegetation}%</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        style={{ padding: '3px 8px', fontSize: '0.74rem' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAreaSelect(a);
                        }}
                      >
                        Center Map
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default HeatMapPage;
