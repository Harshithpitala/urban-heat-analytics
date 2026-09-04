import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import { fetchMapAreas } from '../../services/api';
import { IconMapPin } from '../common/Icons';

const RISK_COLORS = {
  Extreme: '#dc2626',
  'Very High': '#f97316',
  High: '#f59e0b',
  Moderate: '#38bdf8',
  Low: '#10b981',
  'Insufficient Data': '#64748b',
};

const MapPreview = ({ height = 300 }) => {
  const [areas, setAreas] = useState([]);
  const [centroid, setCentroid] = useState([28.582, 77.216]);

  useEffect(() => {
    let isMounted = true;
    fetchMapAreas().then((res) => {
      if (isMounted && res.success && res.data) {
        setAreas(res.data.areas || []);
        if (res.data.centroid) setCentroid(res.data.centroid);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div style={{ position: 'relative', height, width: '100%', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
      <MapContainer
        center={centroid}
        zoom={10}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {areas.map((a) => (
          <CircleMarker
            key={a.areaId}
            center={[a.latitude, a.longitude]}
            radius={a.riskLevel === 'Very High' || a.riskLevel === 'Extreme' ? 14 : 9}
            pathOptions={{
              color: RISK_COLORS[a.riskLevel] || '#38bdf8',
              fillColor: RISK_COLORS[a.riskLevel] || '#38bdf8',
              fillOpacity: 0.8,
              weight: 2,
            }}
          >
            <Tooltip direction="top" offset={[0, -6]}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                {a.name}: {a.temperature}°C (HERI: {a.heri ?? 'N/A'})
              </div>
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>

      {/* Floating CTA Overlay */}
      <div
        style={{
          position: 'absolute',
          bottom: '12px',
          right: '12px',
          zIndex: 1000,
        }}
      >
        <Link
          to="/heat-map"
          className="btn btn-primary btn-sm flex items-center gap-xs"
          style={{ boxShadow: '0 4px 14px rgba(0,0,0,0.5)', fontSize: '0.78rem' }}
        >
          <IconMapPin size={14} />
          Open Full Geospatial Map &rarr;
        </Link>
      </div>
    </div>
  );
};

export default MapPreview;
