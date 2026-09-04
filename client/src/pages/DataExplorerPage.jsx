import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../components/common/StatusBadge';
import LoadingState from '../components/common/LoadingState';
import EmptyState from '../components/common/EmptyState';
import NoticeBanner from '../components/common/NoticeBanner';
import {
  IconSearch,
  IconDatabase,
  IconUpload,
} from '../components/common/Icons';
import { fetchEnvironmentalRecords } from '../services/api';

const LAND_USE_OPTIONS = [
  'All Land Uses',
  'Commercial',
  'Industrial',
  'Residential',
  'Green Space',
  'Transportation',
  'Institutional',
  'Mixed Use',
];

const CITY_OPTIONS = ['All Cities', 'Metro City'];

const DataExplorerPage = () => {
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filter & search states
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('All Cities');
  const [landUse, setLandUse] = useState('All Land Uses');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  const loadData = useCallback(async (pageToLoad = 1, isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    const params = {
      page: pageToLoad,
      limit: pagination.limit,
      sortBy,
      sortOrder,
    };

    if (search.trim()) params.search = search.trim();
    if (city !== 'All Cities') params.city = city;
    if (landUse !== 'All Land Uses') params.landUse = landUse;

    try {
      const res = await fetchEnvironmentalRecords(params);
      if (res.success) {
        setRecords(res.data);
        setPagination(res.pagination || { page: 1, limit: 15, total: res.data.length, pages: 1 });
      } else {
        setError(res.error || 'Failed to fetch environmental records');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, city, landUse, sortBy, sortOrder, pagination.limit]);

  useEffect(() => {
    loadData(1);
  }, [loadData]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      loadData(newPage);
    }
  };

  // Requirement 24: Export Current View to CSV
  const handleExportCurrentView = () => {
    if (records.length === 0) return;

    const headers = [
      'areaName',
      'city',
      'zone',
      'date',
      'temperature',
      'humidity',
      'rainfall',
      'traffic',
      'populationDensity',
      'buildingDensity',
      'vegetation',
      'landUse',
    ];

    const rows = records.map((r) => {
      const areaName = typeof r.area === 'object' ? r.area?.name : r.area;
      const zone = typeof r.area === 'object' ? r.area?.zone : '';
      return [
        `"${(areaName || '').replace(/"/g, '""')}"`,
        `"${(r.city || '').replace(/"/g, '""')}"`,
        `"${(zone || '').replace(/"/g, '""')}"`,
        `"${new Date(r.date).toISOString()}"`,
        r.temperature,
        r.humidity,
        r.rainfall,
        r.traffic,
        r.populationDensity || '',
        r.buildingDensity || '',
        r.vegetation || '',
        `"${(r.landUse || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `urban_heat_filtered_records_page_${pagination.page}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-fade-in">
      <NoticeBanner
        badgeText="MongoDB Data Explorer"
        message="Querying real environmental observation records stored in MongoDB with live server-side filtering."
      />

      {/* Query Bar with City, LandUse, Search, and Action Buttons */}
      <div className="filter-bar" style={{ marginBottom: 'var(--space-lg)' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '220px' }}>
          <div className="header-search" style={{ width: '100%', maxWidth: '300px' }}>
            <IconSearch size={16} color="var(--text-disabled)" />
            <input
              type="text"
              placeholder="Search area or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-secondary btn-sm">
            Search
          </button>
        </form>

        <div className="filter-group">
          <label className="filter-label">City Region</label>
          <select
            className="filter-select"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          >
            {CITY_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Land Use Zoning</label>
          <select
            className="filter-select"
            value={landUse}
            onChange={(e) => setLandUse(e.target.value)}
          >
            {LAND_USE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Sort By</label>
          <select
            className="filter-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="date">Observation Date</option>
            <option value="temperature">Temperature (°C)</option>
            <option value="humidity">Humidity (%)</option>
            <option value="traffic">Traffic Index</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Order</label>
          <select
            className="filter-select"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
          {/* Refresh Data Button */}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => loadData(pagination.page, true)}
            title="Reload records from database"
          >
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>

          {/* Export Current View Button */}
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={handleExportCurrentView}
            disabled={records.length === 0}
            title="Download currently filtered records as CSV"
          >
            Export Current View
          </button>

          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => {
              setSearch('');
              setCity('All Cities');
              setLandUse('All Land Uses');
              setSortBy('date');
              setSortOrder('desc');
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: 'var(--space-md) var(--space-xl)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div className="flex items-center gap-xs">
            <IconDatabase size={18} color="var(--heat-high)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Raw Telemetry Records</h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              ({pagination.total} observations in database)
            </span>
            <StatusBadge label="MongoDB Synced" type="low" />
          </div>

          <div className="flex items-center gap-sm">
            <Link to="/data-import" className="btn btn-outline btn-sm" style={{ padding: '3px 9px', fontSize: '0.78rem' }}>
              <IconUpload size={14} />
              Import CSV
            </Link>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Page {pagination.page} of {pagination.pages}
            </span>
          </div>
        </div>

        {loading ? (
          <LoadingState message="Querying database observation records..." />
        ) : error ? (
          <div style={{ padding: 'var(--space-2xl)', textAlign: 'center', color: 'var(--heat-extreme)' }}>
            <p>Error loading records: {error}</p>
            <button onClick={() => loadData(1)} className="btn btn-secondary btn-sm" style={{ marginTop: '12px' }}>
              Retry Query
            </button>
          </div>
        ) : records.length === 0 ? (
          <EmptyState
            title="No Observation Records Found"
            description="No records match your active search and filter constraints."
            action={
              <button
                onClick={() => {
                  setSearch('');
                  setCity('All Cities');
                  setLandUse('All Land Uses');
                }}
                className="btn btn-primary btn-sm"
              >
                Clear Filters
              </button>
            }
          />
        ) : (
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Area Name</th>
                  <th>City</th>
                  <th>Date & Time (UTC)</th>
                  <th>Temperature</th>
                  <th>Humidity</th>
                  <th>Rainfall</th>
                  <th>Traffic</th>
                  <th>Pop. Density</th>
                  <th>Building %</th>
                  <th>Vegetation</th>
                  <th>Land Use</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => {
                  const areaId = typeof r.area === 'object' ? r.area?._id : r.area;
                  const areaName = typeof r.area === 'object' ? r.area?.name : r.area;
                  const temp = Number(r.temperature);

                  return (
                    <tr key={r._id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {areaId ? (
                          <Link
                            to={`/areas/${areaId}`}
                            style={{ color: '#38bdf8', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            title="View Area details"
                          >
                            {areaName || 'Zone'}
                          </Link>
                        ) : (
                          areaName || 'Zone'
                        )}
                      </td>
                      <td style={{ fontSize: '0.84rem' }}>{r.city || 'Metro City'}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {new Date(r.date).toISOString().replace('T', ' ').substring(0, 16)}
                      </td>
                      <td>
                        <span
                          style={{
                            fontWeight: 700,
                            color: temp >= 38 ? 'var(--heat-extreme)' : temp >= 35 ? 'var(--heat-high)' : 'var(--eco-emerald)',
                          }}
                        >
                          {temp.toFixed(1)}°C
                        </span>
                      </td>
                      <td>{r.humidity}%</td>
                      <td>{r.rainfall > 0 ? `${r.rainfall} mm` : '-'}</td>
                      <td>
                        <span style={{ color: r.traffic >= 80 ? 'var(--heat-high)' : 'inherit' }}>
                          {r.traffic}/100
                        </span>
                      </td>
                      <td>{r.populationDensity ? `${r.populationDensity.toLocaleString()}/km²` : '-'}</td>
                      <td>{r.buildingDensity ? `${r.buildingDensity}%` : '-'}</td>
                      <td>
                        <span style={{ color: r.vegetation >= 50 ? 'var(--eco-emerald)' : 'inherit' }}>
                          {r.vegetation}%
                        </span>
                      </td>
                      <td>
                        <StatusBadge
                          label={r.landUse || 'Mixed'}
                          type={r.landUse === 'Green Space' ? 'low' : r.landUse === 'Industrial' ? 'extreme' : 'moderate'}
                        />
                      </td>
                      <td>
                        {areaId && (
                          <Link to={`/areas/${areaId}`} className="btn btn-outline btn-sm" style={{ padding: '3px 8px', fontSize: '0.75rem' }}>
                            Inspect
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'var(--space-md) var(--space-xl)',
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--bg-surface)',
          }}
        >
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Showing {records.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} records
          </div>

          <div className="flex gap-xs">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={pagination.page <= 1}
              onClick={() => handlePageChange(pagination.page - 1)}
            >
              &larr; Previous
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={pagination.page >= pagination.pages}
              onClick={() => handlePageChange(pagination.page + 1)}
            >
              Next &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataExplorerPage;
