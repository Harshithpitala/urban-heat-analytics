import React from 'react';

const HeroVisual = () => {
  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '520px', margin: '0 auto' }}>
      {/* Background ambient radial glow */}
      <div
        style={{
          position: 'absolute',
          inset: '-20px',
          background: 'radial-gradient(circle at 60% 40%, rgba(249, 115, 22, 0.22) 0%, rgba(239, 68, 68, 0.15) 40%, transparent 70%)',
          filter: 'blur(30px)',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      {/* Modern SVG Abstract Urban Heat Grid */}
      <svg
        viewBox="0 0 480 380"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          width: '100%',
          height: 'auto',
          position: 'relative',
          zIndex: 1,
          filter: 'drop-shadow(0 12px 30px rgba(0, 0, 0, 0.5))',
        }}
      >
        <defs>
          <linearGradient id="heatGradientA" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0.75" />
          </linearGradient>
          <linearGradient id="heatGradientB" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id="ecoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id="coolGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.5" />
          </linearGradient>
          <radialGradient id="hotspotGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.9" />
            <stop offset="70%" stopColor="#ea580c" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#ea580c" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Base Grid Blueprint Layer */}
        <rect x="20" y="20" width="440" height="340" rx="16" fill="#101c3d" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />

        {/* Street Lines Horizontal */}
        <line x1="20" y1="100" x2="460" y2="100" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="4 4" />
        <line x1="20" y1="180" x2="460" y2="180" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
        <line x1="20" y1="260" x2="460" y2="260" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="4 4" />

        {/* Street Lines Vertical */}
        <line x1="120" y1="20" x2="120" y2="360" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="4 4" />
        <line x1="240" y1="20" x2="240" y2="360" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
        <line x1="360" y1="20" x2="360" y2="360" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="4 4" />

        {/* City Sector Blocks */}
        {/* Sector 1: High Heat Central Core */}
        <rect x="135" y="115" width="90" height="50" rx="8" fill="url(#heatGradientA)" />
        <text x="180" y="145" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="700" fontFamily="sans-serif">
          39.4°C
        </text>

        {/* Sector 2: East Industrial Hotspot */}
        <rect x="255" y="115" width="90" height="50" rx="8" fill="url(#heatGradientA)" />
        <text x="300" y="145" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="700" fontFamily="sans-serif">
          38.6°C
        </text>

        {/* Sector 3: North Green Buffer */}
        <rect x="135" y="35" width="90" height="50" rx="8" fill="url(#ecoGradient)" />
        <text x="180" y="65" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="700" fontFamily="sans-serif">
          29.7°C
        </text>

        {/* Sector 4: Eco Park Reserve */}
        <rect x="255" y="35" width="90" height="50" rx="8" fill="url(#ecoGradient)" />
        <text x="300" y="65" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="700" fontFamily="sans-serif">
          27.4°C
        </text>

        {/* Sector 5: West Residential */}
        <rect x="35" y="115" width="70" height="50" rx="8" fill="url(#heatGradientB)" />
        <text x="70" y="145" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="600" fontFamily="sans-serif">
          33.8°C
        </text>

        {/* Sector 6: South Commercial Hub */}
        <rect x="135" y="195" width="90" height="50" rx="8" fill="url(#heatGradientB)" />
        <text x="180" y="225" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="600" fontFamily="sans-serif">
          36.5°C
        </text>

        {/* Sector 7: Riverfront Cool Zone */}
        <rect x="35" y="195" width="70" height="130" rx="8" fill="url(#coolGradient)" />
        <text x="70" y="265" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="600" fontFamily="sans-serif">
          26.8°C
        </text>

        {/* Sector 8: South-East Suburbs */}
        <rect x="255" y="195" width="90" height="50" rx="8" fill="url(#heatGradientB)" />
        <text x="300" y="225" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="600" fontFamily="sans-serif">
          34.2°C
        </text>

        {/* Sector 9: Outer Ring */}
        <rect x="375" y="115" width="70" height="130" rx="8" fill="url(#heatGradientB)" opacity="0.8" />
        <text x="410" y="185" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="600" fontFamily="sans-serif">
          35.0°C
        </text>

        {/* Thermal Contour Lines overlay */}
        <circle cx="240" cy="150" r="110" fill="url(#hotspotGlow)" style={{ mixBlendMode: 'screen', pointerEvents: 'none' }} />
        <ellipse cx="240" cy="150" rx="130" ry="80" stroke="#f97316" strokeWidth="1.5" strokeDasharray="6 6" fill="none" opacity="0.5" />
        <ellipse cx="240" cy="150" rx="70" ry="45" stroke="#ef4444" strokeWidth="2" fill="none" opacity="0.8" />

        {/* Pulsing Hotspot Sensor Nodes */}
        <circle cx="200" cy="140" r="6" fill="#ffffff" stroke="#ef4444" strokeWidth="2" />
        <circle cx="200" cy="140" r="14" stroke="#ef4444" strokeWidth="1.5" opacity="0.7">
          <animate attributeName="r" values="6;20;6" dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.8;0;0.8" dur="3s" repeatCount="indefinite" />
        </circle>

        <circle cx="280" cy="140" r="6" fill="#ffffff" stroke="#ef4444" strokeWidth="2" />
        <circle cx="280" cy="140" r="14" stroke="#ef4444" strokeWidth="1.5" opacity="0.7">
          <animate attributeName="r" values="6;22;6" dur="2.4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.8;0;0.8" dur="2.4s" repeatCount="indefinite" />
        </circle>

        {/* UI Overlay Badges inside visual */}
        <g transform="translate(130, 290)">
          <rect width="220" height="40" rx="8" fill="#070d1e" stroke="rgba(249,115,22,0.4)" strokeWidth="1" />
          <circle cx="20" cy="20" r="6" fill="#f97316" />
          <text x="36" y="24" fill="#f8fafc" fontSize="11" fontWeight="600" fontFamily="sans-serif">
            Thermal Anomaly Detected (+4.6°C)
          </text>
        </g>
      </svg>
    </div>
  );
};

export default HeroVisual;
