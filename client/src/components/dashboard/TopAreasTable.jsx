import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../common/StatusBadge';

const TopAreasTable = ({ areas = [], mode = 'risk' }) => {
  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th style={{ width: '50px' }}>Rank</th>
            <th>Urban District / Zone</th>
            <th>Land Use</th>
            <th>{mode === 'hotspot' ? 'Hotspot Score' : 'HERI Risk'}</th>
            <th>Avg Temp</th>
            <th>{mode === 'lower' ? 'Green Cover' : 'Population Density'}</th>
            <th>Classification</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {areas.map((row, idx) => {
            const rank = row.rank || idx + 1;
            const tempVal = typeof row.tempValue === 'number'
              ? row.tempValue
              : typeof row.temperature === 'number'
              ? row.temperature
              : parseFloat(row.temperature || 32);
            const tempDisplay = typeof row.temperature === 'string' ? row.temperature : `${tempVal}°C`;
            const areaName = row.name || row.area;
            const areaId = row.areaId || row._id;

            let scoreDisplay = '—';
            let badgeType = 'neutral';
            let badgeLabel = 'Monitored';

            if (mode === 'hotspot') {
              scoreDisplay = `${row.hotspotScore ?? '—'}/100`;
              badgeLabel = row.severity || 'Moderate';
              badgeType = row.severity === 'Extreme' || row.severity === 'Very High' ? 'extreme' : row.severity === 'High' ? 'high' : 'moderate';
            } else {
              scoreDisplay = `${row.heri ?? '—'}/100`;
              badgeLabel = row.riskLevel || (tempVal >= 38 ? 'Very High' : tempVal >= 35 ? 'High' : 'Moderate');
              badgeType = badgeLabel === 'Extreme' || badgeLabel === 'Very High' ? 'extreme' : badgeLabel === 'High' ? 'high' : badgeLabel === 'Moderate' ? 'moderate' : 'low';
            }

            return (
              <tr key={areaId || rank || idx}>
                <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>
                  #{rank}
                </td>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {areaId ? (
                    <Link to={`/areas/${areaId}`} style={{ color: '#38bdf8' }}>
                      {areaName}
                    </Link>
                  ) : (
                    areaName
                  )}
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {row.zone || 'Metropolitan Area'}
                  </div>
                </td>
                <td>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {row.landUse || 'Mixed'}
                  </span>
                </td>
                <td>
                  <span style={{ fontWeight: 700, color: mode === 'hotspot' ? '#f97316' : '#ef4444' }}>
                    {scoreDisplay}
                  </span>
                </td>
                <td>
                  <span style={{ color: tempVal >= 38 ? 'var(--heat-extreme)' : tempVal >= 35 ? 'var(--heat-high)' : 'var(--eco-emerald)', fontWeight: 600 }}>
                    {tempDisplay}
                  </span>
                </td>
                <td>
                  {mode === 'lower'
                    ? (typeof row.vegetation === 'number' ? `${row.vegetation}% canopy` : '38% canopy')
                    : (row.populationDensity ? (typeof row.populationDensity === 'number' ? `${row.populationDensity.toLocaleString()}/km²` : row.populationDensity) : '12,500 /km²')}
                </td>
                <td>
                  <StatusBadge label={badgeLabel} type={badgeType} />
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: '6px' }}>
                    <Link
                      to="/heat-map"
                      className="btn btn-outline btn-sm"
                      style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                      title="View on Geospatial Map"
                    >
                      Map
                    </Link>
                    {areaId && (
                      <Link
                        to={`/areas/${areaId}`}
                        className="btn btn-outline btn-sm"
                        style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                        title="Inspect District Telemetry"
                      >
                        Inspect
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TopAreasTable;
