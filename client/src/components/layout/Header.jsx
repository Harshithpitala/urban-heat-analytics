import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconMenu, IconSearch, IconBell } from '../common/Icons';

const Header = ({ title, description, onOpenMobileMenu }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/data-explorer?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <button
          className="btn-icon mobile-menu-btn"
          onClick={onOpenMobileMenu}
          aria-label="Open Sidebar Navigation"
        >
          <IconMenu size={20} />
        </button>

        <div className="header-title-box">
          <h1 className="header-title">{title}</h1>
          {description && <p className="header-desc">{description}</p>}
        </div>
      </div>

      <div className="header-right">
        {/* Global search input */}
        <div className="header-search">
          <IconSearch size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search districts, land use... (Press Enter)"
            aria-label="Search dashboard"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            title="Press Enter to search in Data Explorer"
          />
        </div>

        {/* Notification indicator */}
        <button
          className="btn-icon"
          title="System notifications (Demo Mode)"
          aria-label="Notifications"
        >
          <IconBell size={18} />
        </button>

        {/* User profile placeholder */}
        <div className="user-profile-badge" title="Demo Analyst Session">
          <div className="user-avatar">UH</div>
          <span className="user-name">Analyst Demo</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
