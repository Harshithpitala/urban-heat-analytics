import React from 'react';
import { filterOptions } from '../../data';

const FilterBar = ({
  filters,
  onFilterChange,
  onReset,
  areasList = [],
}) => {
  return (
    <div className="filter-bar" role="region" aria-label="Dashboard Data Filters">
      {/* City Filter */}
      <div className="filter-group">
        <label htmlFor="filter-city" className="filter-label">City Region</label>
        <select
          id="filter-city"
          className="filter-select"
          value={filters.city || 'all'}
          onChange={(e) => onFilterChange('city', e.target.value)}
        >
          <option value="all">All Cities (Metro Region)</option>
          <option value="Metro City">Metro City</option>
        </select>
      </div>

      {/* Zone Filter */}
      <div className="filter-group">
        <label htmlFor="filter-zone" className="filter-label">Zone</label>
        <select
          id="filter-zone"
          className="filter-select"
          value={filters.zone || 'all'}
          onChange={(e) => onFilterChange('zone', e.target.value)}
        >
          <option value="all">All Zones</option>
          <option value="Central Zone">Central Zone</option>
          <option value="East Zone">East Zone</option>
          <option value="North Zone">North Zone</option>
          <option value="South Zone">South Zone</option>
          <option value="West Zone">West Zone</option>
          <option value="Green Zone">Green Zone</option>
          <option value="Outer Zone">Outer Zone</option>
        </select>
      </div>

      {/* Area Filter */}
      <div className="filter-group">
        <label htmlFor="filter-area" className="filter-label">District / Area</label>
        <select
          id="filter-area"
          className="filter-select"
          value={filters.area || 'all'}
          onChange={(e) => onFilterChange('area', e.target.value)}
        >
          <option value="all">All Districts ({areasList.length || '11'})</option>
          {areasList.map((a) => (
            <option key={a.areaId || a.id || a._id} value={a.name || a.area}>
              {a.name || a.area}
            </option>
          ))}
        </select>
      </div>

      {/* Land Use Filter */}
      <div className="filter-group">
        <label htmlFor="filter-landuse" className="filter-label">Zoning Type</label>
        <select
          id="filter-landuse"
          className="filter-select"
          value={filters.landUse || 'all'}
          onChange={(e) => onFilterChange('landUse', e.target.value)}
        >
          <option value="all">All Land Uses</option>
          <option value="Commercial">Commercial</option>
          <option value="Industrial">Industrial</option>
          <option value="Residential">Residential</option>
          <option value="Green Space">Green Space</option>
          <option value="Transportation">Transportation</option>
          <option value="Institutional">Institutional</option>
          <option value="Mixed Use">Mixed Use</option>
        </select>
      </div>

      {/* Date Range Preset Filter */}
      <div className="filter-group">
        <label htmlFor="filter-date" className="filter-label">Time Window</label>
        <select
          id="filter-date"
          className="filter-select"
          value={filters.dateRange || 'all'}
          onChange={(e) => onFilterChange('dateRange', e.target.value)}
        >
          <option value="all">Entire Monitored Span</option>
          <option value="today">Latest Day</option>
          <option value="7d">Past 7 Days</option>
          <option value="30d">Past 30 Days</option>
        </select>
      </div>

      {/* Reset & Active Filter Indicator */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
        <button
          type="button"
          onClick={onReset}
          className="btn btn-outline btn-sm"
          style={{ height: '34px' }}
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
};

export default FilterBar;
