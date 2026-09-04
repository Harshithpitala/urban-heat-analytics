import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import AppLayout from './components/layout/AppLayout';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import SettingsPage from './pages/SettingsPage';
import DataExplorerPage from './pages/DataExplorerPage';
import AreaDetailsPage from './pages/AreaDetailsPage';
import DataImportPage from './pages/DataImportPage';
import EnvironmentPage from './pages/EnvironmentPage';
import HumanActivityPage from './pages/HumanActivityPage';
import HotspotsPage from './pages/HotspotsPage';
import RiskIndexPage from './pages/RiskIndexPage';
import HeatMapPage from './pages/HeatMapPage';
import InsightsPage from './pages/InsightsPage';

function App() {
  return (
    <Routes>
      {/* Route 1: Landing Page */}
      <Route path="/" element={<LandingPage />} />

      {/* Dashboard Shell with Sidebar & Header */}
      <Route element={<AppLayout />}>
        {/* Route 2: Main Dashboard */}
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Route 3: Geospatial Heat Map (Phase 7 Functional) */}
        <Route path="/heat-map" element={<HeatMapPage />} />

        {/* Route 4: Heat Hotspots (Phase 5 Functional) */}
        <Route path="/hotspots" element={<HotspotsPage />} />

        {/* Route 5: Human Activity Analysis (Phase 4 Functional) */}
        <Route path="/human-activity" element={<HumanActivityPage />} />

        {/* Route 6: Environmental Analysis (Phase 4 Functional) */}
        <Route path="/environment" element={<EnvironmentPage />} />

        {/* Route 7: Heat Exposure Risk Index (Phase 6 Functional) */}
        <Route path="/risk-index" element={<RiskIndexPage />} />

        {/* Route 8: Data Explorer (Database-backed) */}
        <Route path="/data-explorer" element={<DataExplorerPage />} />

        {/* Route 8b: Area Details (Database-backed) */}
        <Route path="/areas/:id" element={<AreaDetailsPage />} />

        {/* Route 9: Insights (Phase 9 Functional) */}
        <Route path="/insights" element={<InsightsPage />} />


        {/* Route 10: Data Import & Quality System */}
        <Route path="/data-import" element={<DataImportPage />} />

        {/* Route 11: Settings */}
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Catch-all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
