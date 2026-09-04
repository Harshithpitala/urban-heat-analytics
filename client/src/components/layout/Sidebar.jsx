import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  IconFlame,
  IconBarChart,
  IconMapPin,
  IconActivity,
  IconLeaf,
  IconShieldAlert,
  IconDatabase,
  IconLightbulb,
  IconUpload,
  IconSettings,
  IconX,
} from '../common/Icons';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: IconBarChart },
  { path: '/heat-map', label: 'Heat Map', icon: IconMapPin },
  { path: '/hotspots', label: 'Hotspots', icon: IconFlame },
  { path: '/human-activity', label: 'Human Activity', icon: IconActivity },
  { path: '/environment', label: 'Environment', icon: IconLeaf },
  { path: '/risk-index', label: 'Risk Index', icon: IconShieldAlert },
  { path: '/data-explorer', label: 'Data Explorer', icon: IconDatabase },
  { path: '/insights', label: 'Insights', icon: IconLightbulb },
  { path: '/data-import', label: 'Data Import', icon: IconUpload },
  { path: '/settings', label: 'Settings', icon: IconSettings },
];

const Sidebar = ({ isOpen, onClose }) => {
  return (
    <>
      <aside className={`app-sidebar ${isOpen ? 'open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-brand">
          <Link to="/" className="flex items-center gap-sm">
            <div className="brand-icon-box">
              <IconFlame size={22} color="#ffffff" />
            </div>
            <div className="brand-text-block">
              <div className="brand-name">Urban Heat</div>
              <div className="brand-sub">Analytics System</div>
            </div>
          </Link>
          {isOpen && (
            <button
              onClick={onClose}
              className="btn-icon mobile-menu-btn"
              style={{ marginLeft: 'auto' }}
              aria-label="Close Sidebar"
            >
              <IconX size={18} />
            </button>
          )}
        </div>

        {/* Navigation List */}
        <nav className="sidebar-nav" aria-label="Main Navigation">
          <div className="nav-section-label">Core Platform</div>
          {navItems.slice(0, 6).map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <span className="nav-icon">
                  <Icon size={18} />
                </span>
                <span>{item.label}</span>
              </NavLink>
            );
          })}

          <div className="nav-section-label" style={{ marginTop: '12px' }}>
            Data & Management
          </div>
          {navItems.slice(6).map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <span className="nav-icon">
                  <Icon size={18} />
                </span>
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <Link to="/" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            &larr; Landing Page
          </Link>
          <span className="sidebar-phase-tag">v1.0 Final</span>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
