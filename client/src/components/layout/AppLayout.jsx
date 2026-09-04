import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

import ErrorBoundary from '../common/ErrorBoundary';

// Route header metadata mapping
const routeMeta = {
  '/dashboard': {
    title: 'Urban Heat Overview',
    description: 'A high-level view of environmental conditions, urban activity and heat patterns.',
  },
  '/heat-map': {
    title: 'Geospatial Heat Map',
    description: 'Spatial distribution of surface and ambient temperatures across urban grid sectors.',
  },
  '/hotspots': {
    title: 'Heat Hotspot Detection',
    description: 'Algorithmic identification of high thermal concentration clusters and microclimates.',
  },
  '/human-activity': {
    title: 'Human Activity Analysis',
    description: 'Traffic density, vehicular emissions, and pedestrian exposure patterns.',
  },
  '/environment': {
    title: 'Environmental Indicators',
    description: 'Vegetation coverage (NDVI), humidity, albedo, and canopy shading correlations.',
  },
  '/risk-index': {
    title: 'Heat Exposure Risk Index',
    description: 'Multi-parameter composite risk assessment combining thermal and demographic factors.',
  },
  '/data-explorer': {
    title: 'Data Explorer',
    description: 'Interactive query builder, tabular filters, and raw sensor observation inspector.',
  },
  '/insights': {
    title: 'Automated Insights',
    description: 'Algorithmic findings, anomaly flags, and mitigation priority recommendations.',
  },
  '/data-import': {
    title: 'Data Ingestion & Import',
    description: 'Upload CSV sensor records, satellite rasters, and weather API sync logs.',
  },
  '/settings': {
    title: 'Platform Settings',
    description: 'System thresholds, alert configurations, database connections, and parameters.',
  },
};

const AppLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const currentMeta = routeMeta[location.pathname] || {
    title: 'Urban Heat Analytics',
    description: 'Environmental intelligence platform',
  };

  return (
    <div className="app-container">
      {/* Mobile sidebar overlay */}
      <div
        className={`sidebar-overlay ${mobileOpen ? 'active' : ''}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      {/* Main Sidebar */}
      <Sidebar isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* Main Content Viewport */}
      <div className="app-main">
        <Header
          title={currentMeta.title}
          description={currentMeta.description}
          onOpenMobileMenu={() => setMobileOpen(true)}
        />

        <main className="app-content">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
