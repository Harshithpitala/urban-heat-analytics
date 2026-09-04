import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  fetchInsights,
  fetchInsightsSummary,
  refreshInsights,
  fetchRecommendations,
  fetchRecommendationsSummary,
} from '../services/api';

import {
  IconLightbulb,
  IconRefreshCw,
  IconPrinter,
  IconDownload,
  IconSearch,
  IconX,
  IconMapPin,
  IconShieldAlert,
  IconLeaf,
  IconCar,
  IconUsers,
  IconBuilding,
  IconThermometer,
  IconFlame,
  IconInfo,
  IconCheckCircle,
  IconArrowRight,
  IconLayers,
  IconDatabase,
} from '../components/common/Icons';

import LoadingState from '../components/common/LoadingState';
import NoticeBanner from '../components/common/NoticeBanner';

const InsightsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'recommendations' ? 'recommendations' : 'insights';

  // Active View Tab: 'insights' | 'recommendations'
  const [activeTab, setActiveTab] = useState(initialTab);

  // State for insights
  const [insights, setInsights] = useState([]);
  const [insightsSummary, setInsightsSummary] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(true);

  // State for recommendations
  const [recommendations, setRecommendations] = useState([]);
  const [recommendationsSummary, setRecommendationsSummary] = useState(null);
  const [recommendationsLoading, setRecommendationsLoading] = useState(true);

  // Refreshing state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState('');

  // Selected item for modal
  const [activeModalItem, setActiveModalItem] = useState(null);

  // Filter states
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Load all insights
  const loadInsightsData = useCallback(async () => {
    setInsightsLoading(true);
    try {
      const [listRes, summaryRes] = await Promise.all([
        fetchInsights(),
        fetchInsightsSummary(),
      ]);
      if (listRes.success) setInsights(listRes.data || []);
      if (summaryRes.success) setInsightsSummary(summaryRes.data || null);
    } catch (err) {
      console.error('Error loading insights:', err);
    } finally {
      setInsightsLoading(false);
    }
  }, []);

  // Load all recommendations
  const loadRecommendationsData = useCallback(async () => {
    setRecommendationsLoading(true);
    try {
      const [listRes, summaryRes] = await Promise.all([
        fetchRecommendations(),
        fetchRecommendationsSummary(),
      ]);
      if (listRes.success) setRecommendations(listRes.data || []);
      if (summaryRes.success) setRecommendationsSummary(summaryRes.data || null);
    } catch (err) {
      console.error('Error loading recommendations:', err);
    } finally {
      setRecommendationsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInsightsData();
    loadRecommendationsData();
  }, [loadInsightsData, loadRecommendationsData]);

  // Handle manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRefreshMessage('');
    try {
      await refreshInsights();
      await Promise.all([loadInsightsData(), loadRecommendationsData()]);
      setRefreshMessage('Analysis cache successfully recalculated!');
      setTimeout(() => setRefreshMessage(''), 4000);
    } catch (err) {
      console.error('Refresh error:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Switch tab
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
    setCategoryFilter('all');
    setPriorityFilter('all');
    setSearchQuery('');
  };

  // Filtered Insights
  const filteredInsights = useMemo(() => {
    return insights.filter((item) => {
      const matchCat = categoryFilter === 'all' || item.category.toLowerCase() === categoryFilter.toLowerCase();
      const matchPrio = priorityFilter === 'all' || item.severity.toLowerCase() === priorityFilter.toLowerCase();
      const matchSearch =
        !searchQuery.trim() ||
        (item.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.summary || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.areaName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.category || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchPrio && matchSearch;
    });
  }, [insights, categoryFilter, priorityFilter, searchQuery]);

  // Filtered Recommendations
  const filteredRecommendations = useMemo(() => {
    return recommendations.filter((item) => {
      const matchCat = categoryFilter === 'all' || item.category.toLowerCase() === categoryFilter.toLowerCase();
      const matchPrio = priorityFilter === 'all' || item.priority.toLowerCase() === priorityFilter.toLowerCase();
      const matchSearch =
        !searchQuery.trim() ||
        (item.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.action || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.reason || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.areaName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.category || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchPrio && matchSearch;
    });
  }, [recommendations, categoryFilter, priorityFilter, searchQuery]);

  // Priority color styling helper
  const getPriorityBadgeStyle = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'critical':
        return { backgroundColor: 'rgba(239, 68, 68, 0.18)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.4)' };
      case 'high':
        return { backgroundColor: 'rgba(249, 115, 22, 0.18)', color: '#fb923c', border: '1px solid rgba(249, 115, 22, 0.4)' };
      case 'medium':
        return { backgroundColor: 'rgba(234, 179, 8, 0.18)', color: '#facc15', border: '1px solid rgba(234, 179, 8, 0.4)' };
      default:
        return { backgroundColor: 'rgba(59, 130, 246, 0.18)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.4)' };
    }
  };

  // Category badge color helper
  const getCategoryBadgeStyle = (category) => {
    switch (category?.toLowerCase()) {
      case 'heat':
      case 'temperature':
        return { backgroundColor: 'rgba(244, 63, 94, 0.15)', color: '#fb7185' };
      case 'environment':
      case 'vegetation':
        return { backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399' };
      case 'traffic':
      case 'human activity':
        return { backgroundColor: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' };
      case 'risk':
      case 'population exposure':
        return { backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#f87171' };
      case 'urban density':
        return { backgroundColor: 'rgba(234, 179, 8, 0.15)', color: '#fbbf24' };
      default:
        return { backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' };
    }
  };

  // CSV Export
  const exportToCsv = () => {
    if (activeTab === 'insights') {
      const headers = ['ID', 'Category', 'Priority', 'Title', 'Area', 'Key Metric', 'Data Support', 'Summary', 'Why It Matters'];
      const rows = filteredInsights.map((i) => [
        `"${i.id}"`,
        `"${i.category}"`,
        `"${i.severity}"`,
        `"${(i.title || '').replace(/"/g, '""')}"`,
        `"${i.areaName || 'Multi-Area'}"`,
        `"${i.metric || ''}"`,
        `"${i.confidence || ''}"`,
        `"${(i.summary || '').replace(/"/g, '""')}"`,
        `"${(i.whyItMatters || '').replace(/"/g, '""')}"`,
      ]);
      const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      downloadBlob(csvContent, 'urban_heat_insights.csv');
    } else {
      const headers = ['ID', 'Category', 'Priority', 'Title', 'Area', 'Time Horizon', 'Recommended Action', 'Reason', 'Confidence'];
      const rows = filteredRecommendations.map((r) => [
        `"${r.id}"`,
        `"${r.category}"`,
        `"${r.priority}"`,
        `"${(r.title || '').replace(/"/g, '""')}"`,
        `"${r.areaName || 'City-Wide'}"`,
        `"${r.timeHorizon || ''}"`,
        `"${(r.action || '').replace(/"/g, '""')}"`,
        `"${(r.reason || '').replace(/"/g, '""')}"`,
        `"${r.confidence || ''}"`,
      ]);
      const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      downloadBlob(csvContent, 'urban_heat_recommendations.csv');
    }
  };

  const downloadBlob = (content, filename) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isLoading = activeTab === 'insights' ? insightsLoading : recommendationsLoading;

  return (
    <div className="insights-page" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'rgba(249, 115, 22, 0.15)', color: '#f97316' }}>
              <IconLightbulb size={24} />
            </span>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#f8fafc', margin: 0 }}>
                Data-Driven Insights & Planning Recommendations
              </h1>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
                Deterministic Rule-Based Urban Heat & Exposure Intelligence Engine
              </p>
            </div>
          </div>
        </div>

        {/* Global Toolbar Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="btn-secondary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              color: '#f8fafc',
              cursor: isRefreshing ? 'wait' : 'pointer',
              fontSize: '0.85rem',
            }}
          >
            <IconRefreshCw size={16} className={isRefreshing ? 'spin-icon' : ''} />
            {isRefreshing ? 'Recalculating...' : 'Refresh Engine'}
          </button>

          <button
            onClick={exportToCsv}
            className="btn-secondary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              color: '#f8fafc',
              cursor: 'pointer',
              fontSize: '0.85rem',
            }}
          >
            <IconDownload size={16} />
            Export CSV
          </button>

          <button
            onClick={() => window.print()}
            className="btn-secondary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              color: '#f8fafc',
              cursor: 'pointer',
              fontSize: '0.85rem',
            }}
          >
            <IconPrinter size={16} />
            Print Report
          </button>
        </div>
      </div>

      {refreshMessage && (
        <div style={{ marginBottom: '16px' }}>
          <NoticeBanner type="success" message={refreshMessage} />
        </div>
      )}

      {/* Governance & Analytical Integrity Callout */}
      <div
        style={{
          backgroundColor: 'rgba(30, 41, 59, 0.5)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '8px',
          padding: '12px 18px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <IconInfo size={20} color="#38bdf8" />
        <span style={{ fontSize: '0.84rem', color: '#cbd5e1', lineHeight: '1.4' }}>
          <strong>Analytical Integrity Notice:</strong> All insights and recommendations are produced deterministically
          by rule-based algorithms evaluating measured database records. No LLM or generative AI is used to fabricate
          claims. Recommendations are strictly planning considerations for municipal evaluation, not clinical or
          emergency directives.
        </span>
      </div>

      {/* KPI Stats Overview Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            backgroundColor: 'var(--color-bg-card, #1e293b)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '10px',
            padding: '16px 20px',
          }}
        >
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total Insights Synthesized
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#f8fafc', marginTop: '6px' }}>
            {insightsSummary?.totalInsights ?? insights.length}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#38bdf8', marginTop: '4px' }}>
            5 Core Analytical Categories
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--color-bg-card, #1e293b)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '10px',
            padding: '16px 20px',
          }}
        >
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Planning Recommendations
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#34d399', marginTop: '6px' }}>
            {recommendationsSummary?.totalRecommendations ?? recommendations.length}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#a7f3d0', marginTop: '4px' }}>
            {recommendationsSummary?.byPriority?.Critical ?? 0} Critical Priority Targets
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--color-bg-card, #1e293b)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '10px',
            padding: '16px 20px',
          }}
        >
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Critical Severity Findings
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#f87171', marginTop: '6px' }}>
            {insightsSummary?.byPriority?.Critical ?? 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#fca5a5', marginTop: '4px' }}>
            Requires Priority Municipal Attention
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--color-bg-card, #1e293b)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '10px',
            padding: '16px 20px',
          }}
        >
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Data Support Level
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#60a5fa', marginTop: '6px' }}>
            100%
          </div>
          <div style={{ fontSize: '0.78rem', color: '#93c5fd', marginTop: '4px' }}>
            Verified Against Monitored Records
          </div>
        </div>
      </div>

      {/* Main Tab Switcher */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
          marginBottom: '20px',
          gap: '8px',
        }}
      >
        <button
          onClick={() => handleTabChange('insights')}
          style={{
            padding: '12px 24px',
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'insights' ? '3px solid #f97316' : '3px solid transparent',
            color: activeTab === 'insights' ? '#f97316' : '#94a3b8',
            fontSize: '1rem',
            fontWeight: activeTab === 'insights' ? '600' : '400',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <IconLightbulb size={18} />
          Key Analytical Insights ({insights.length})
        </button>

        <button
          onClick={() => handleTabChange('recommendations')}
          style={{
            padding: '12px 24px',
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'recommendations' ? '3px solid #10b981' : '3px solid transparent',
            color: activeTab === 'recommendations' ? '#10b981' : '#94a3b8',
            fontSize: '1rem',
            fontWeight: activeTab === 'recommendations' ? '600' : '400',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <IconLeaf size={18} />
          Action Recommendations ({recommendations.length})
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div
        style={{
          backgroundColor: 'var(--color-bg-card, #1e293b)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          {/* Category Filter */}
          <div>
            <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                backgroundColor: '#0f172a',
                color: '#f8fafc',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              <option value="all">All Categories</option>
              {activeTab === 'insights' ? (
                <>
                  <option value="Heat">Heat Dynamics</option>
                  <option value="Environment">Environmental Factors</option>
                  <option value="Human Activity">Human Activity & Density</option>
                  <option value="Risk">Risk Index (HERI)</option>
                  <option value="Data Quality">Data Coverage & Quality</option>
                </>
              ) : (
                <>
                  <option value="Vegetation">Vegetation & Canopy</option>
                  <option value="Urban Density">Urban Density & Albedo</option>
                  <option value="Traffic">Traffic & Transit Buffers</option>
                  <option value="Population Exposure">Population Exposure</option>
                  <option value="Land Use">Land Use & Zoning</option>
                </>
              )}
            </select>
          </div>

          {/* Priority / Severity Filter */}
          <div>
            <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
              Priority / Severity
            </label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              style={{
                backgroundColor: '#0f172a',
                color: '#f8fafc',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              <option value="all">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Reset button */}
          {(categoryFilter !== 'all' || priorityFilter !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setCategoryFilter('all');
                setPriorityFilter('all');
                setSearchQuery('');
              }}
              style={{
                alignSelf: 'flex-end',
                backgroundColor: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#94a3b8',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Free text search input */}
        <div style={{ position: 'relative', width: '280px' }}>
          <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}>
            <IconSearch size={16} />
          </span>
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '6px',
              padding: '8px 12px 8px 36px',
              fontSize: '0.85rem',
              color: '#f8fafc',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
              }}
            >
              <IconX size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div style={{ padding: '60px 0' }}>
          <LoadingState message={`Analyzing database records for ${activeTab}...`} />
        </div>
      ) : null}

      {/* Empty state */}
      {!isLoading && (activeTab === 'insights' ? filteredInsights.length === 0 : filteredRecommendations.length === 0) ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            backgroundColor: 'var(--color-bg-card, #1e293b)',
            borderRadius: '8px',
            border: '1px dashed rgba(255, 255, 255, 0.15)',
          }}
        >
          <IconInfo size={32} color="#64748b" />
          <h3 style={{ color: '#cbd5e1', marginTop: '12px', fontSize: '1.1rem' }}>No results match the selected filters</h3>
          <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '6px 0 16px 0' }}>
            Try broadening your category, priority, or search query.
          </p>
          <button
            onClick={() => {
              setCategoryFilter('all');
              setPriorityFilter('all');
              setSearchQuery('');
            }}
            className="btn-secondary"
            style={{ padding: '8px 16px', borderRadius: '6px' }}
          >
            Clear All Filters
          </button>
        </div>
      ) : null}

      {/* ========================================================================= */}
      {/* TAB 1: INSIGHTS CARDS LIST                                                */}
      {/* ========================================================================= */}
      {!isLoading && activeTab === 'insights' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '20px' }}>
          {filteredInsights.map((insight) => (
            <div
              key={insight.id}
              style={{
                backgroundColor: 'var(--color-bg-card, #1e293b)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.15s ease, border-color 0.15s ease',
              }}
            >
              <div>
                {/* Header badges */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '0.72rem',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        ...getCategoryBadgeStyle(insight.category),
                      }}
                    >
                      {insight.category}
                    </span>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.72rem',
                        fontWeight: '600',
                        ...getPriorityBadgeStyle(insight.severity),
                      }}
                    >
                      {insight.severity} Priority
                    </span>
                  </div>

                  {/* Confidence / Data Support Badge */}
                  <span
                    style={{
                      fontSize: '0.7rem',
                      color: insight.confidence === 'Strong Data Support' ? '#34d399' : '#fbbf24',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <IconCheckCircle size={12} />
                    {insight.confidence || 'Strong Data Support'}
                  </span>
                </div>

                {/* Title */}
                <h3 style={{ color: '#f8fafc', fontSize: '1.05rem', fontWeight: '600', margin: '0 0 8px 0', lineHeight: '1.3' }}>
                  {insight.title}
                </h3>

                {/* Metric highlight chip */}
                {insight.metric && (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      color: '#cbd5e1',
                      marginBottom: '12px',
                    }}
                  >
                    <span style={{ color: '#94a3b8' }}>{insight.metricLabel || 'Observed Value'}:</span>
                    <strong style={{ color: '#f97316' }}>{insight.metric}</strong>
                  </div>
                )}

                {/* Summary narrative */}
                <p style={{ color: '#94a3b8', fontSize: '0.86rem', lineHeight: '1.5', margin: '0 0 14px 0' }}>
                  {insight.summary}
                </p>

                {/* Why it matters callout */}
                {insight.whyItMatters && (
                  <div
                    style={{
                      backgroundColor: 'rgba(15, 23, 42, 0.6)',
                      borderRadius: '6px',
                      padding: '10px 12px',
                      marginBottom: '14px',
                      borderLeft: '3px solid #38bdf8',
                    }}
                  >
                    <div style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: '600', textTransform: 'uppercase', marginBottom: '2px' }}>
                      Analytical Significance
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: '1.4' }}>
                      {insight.whyItMatters}
                    </div>
                  </div>
                )}

                {/* Supporting evidence preview */}
                {insight.evidence && typeof insight.evidence === 'object' && (
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Data Evidence
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {Object.entries(insight.evidence).slice(0, 3).map(([k, v]) => (
                        <span
                          key={k}
                          style={{
                            fontSize: '0.73rem',
                            backgroundColor: 'rgba(255, 255, 255, 0.04)',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            color: '#cbd5e1',
                          }}
                        >
                          <strong>{k}:</strong> {String(v)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action buttons footer */}
              <div
                style={{
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  paddingTop: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.8rem',
                }}
              >
                {/* Area link if available */}
                {insight.areaId ? (
                  <Link
                    to={`/areas/${insight.areaId}`}
                    style={{ color: '#38bdf8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <IconMapPin size={14} />
                    {insight.areaName}
                  </Link>
                ) : (
                  <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <IconDatabase size={14} />
                    System-Wide Analysis
                  </span>
                )}

                <div style={{ display: 'flex', gap: '10px' }}>
                  {/* Map link */}
                  <Link
                    to={`/heat-map?layer=${insight.targetLayer || 'temperature'}${insight.areaName ? `&area=${encodeURIComponent(insight.areaName)}` : ''}`}
                    style={{
                      color: '#f97316',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontWeight: '500',
                    }}
                  >
                    <IconLayers size={14} />
                    Map Layer
                  </Link>

                  {/* Details Modal Trigger */}
                  <button
                    onClick={() => setActiveModalItem({ type: 'insight', data: insight })}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#cbd5e1',
                      cursor: 'pointer',
                      padding: 0,
                      textDecoration: 'underline',
                      fontSize: '0.8rem',
                    }}
                  >
                    Inspect
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: RECOMMENDATIONS CARDS LIST                                         */}
      {/* ========================================================================= */}
      {!isLoading && activeTab === 'recommendations' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '20px' }}>
          {filteredRecommendations.map((rec) => (
            <div
              key={rec.id}
              style={{
                backgroundColor: 'var(--color-bg-card, #1e293b)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                {/* Header badges */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '0.72rem',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        ...getCategoryBadgeStyle(rec.category),
                      }}
                    >
                      {rec.category}
                    </span>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.72rem',
                        fontWeight: '600',
                        ...getPriorityBadgeStyle(rec.priority),
                      }}
                    >
                      {rec.priority} Action
                    </span>
                  </div>

                  {/* Time horizon pill */}
                  <span
                    style={{
                      fontSize: '0.7rem',
                      color: '#cbd5e1',
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                    }}
                  >
                    {rec.timeHorizon || 'Medium-Term'}
                  </span>
                </div>

                {/* Title */}
                <h3 style={{ color: '#f8fafc', fontSize: '1.05rem', fontWeight: '600', margin: '0 0 10px 0', lineHeight: '1.3' }}>
                  {rec.title}
                </h3>

                {/* Action narrative */}
                <div
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    borderRadius: '6px',
                    padding: '10px 12px',
                    marginBottom: '12px',
                  }}
                >
                  <div style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: '600', textTransform: 'uppercase', marginBottom: '3px' }}>
                    Planning Consideration
                  </div>
                  <div style={{ fontSize: '0.84rem', color: '#e2e8f0', lineHeight: '1.45' }}>
                    {rec.action}
                  </div>
                </div>

                {/* Analytical Reason */}
                <p style={{ color: '#94a3b8', fontSize: '0.84rem', lineHeight: '1.45', margin: '0 0 12px 0' }}>
                  <strong style={{ color: '#cbd5e1' }}>Trigger Reason:</strong> {rec.reason}
                </p>

                {/* Supporting metrics */}
                {rec.supportingMetrics && (
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Supporting Analytical Metrics
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {Object.entries(rec.supportingMetrics).map(([k, v]) => (
                        <span
                          key={k}
                          style={{
                            fontSize: '0.72rem',
                            backgroundColor: 'rgba(255, 255, 255, 0.04)',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            color: '#cbd5e1',
                          }}
                        >
                          <span style={{ color: '#94a3b8' }}>{k}:</span> <strong>{String(v)}</strong>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action buttons footer */}
              <div
                style={{
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  paddingTop: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.8rem',
                }}
              >
                {/* Area link if available */}
                {rec.areaId ? (
                  <Link
                    to={`/areas/${rec.areaId}`}
                    style={{ color: '#38bdf8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <IconMapPin size={14} />
                    {rec.areaName}
                  </Link>
                ) : (
                  <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <IconDatabase size={14} />
                    {rec.areaName || 'City-Wide Strategy'}
                  </span>
                )}

                <div style={{ display: 'flex', gap: '10px' }}>
                  {/* Map link */}
                  <Link
                    to={`/heat-map?layer=${rec.targetLayer || 'temperature'}${rec.areaName && rec.areaName !== 'City-Wide Portfolio' ? `&area=${encodeURIComponent(rec.areaName)}` : ''}`}
                    style={{
                      color: '#10b981',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontWeight: '500',
                    }}
                  >
                    <IconLayers size={14} />
                    View on Map
                  </Link>

                  {/* Details Modal Trigger */}
                  <button
                    onClick={() => setActiveModalItem({ type: 'recommendation', data: rec })}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#cbd5e1',
                      cursor: 'pointer',
                      padding: 0,
                      textDecoration: 'underline',
                      fontSize: '0.8rem',
                    }}
                  >
                    Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* AUDIT / DETAIL MODAL                                                      */}
      {/* ========================================================================= */}
      {activeModalItem && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => setActiveModalItem(null)}
        >
          <div
            style={{
              backgroundColor: '#1e293b',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '12px',
              maxWidth: '640px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '28px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setActiveModalItem(null)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
              }}
            >
              <IconX size={20} />
            </button>

            {/* Modal Title */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
              <span
                style={{
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '0.72rem',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  ...getCategoryBadgeStyle(activeModalItem.data.category),
                }}
              >
                {activeModalItem.data.category}
              </span>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '0.72rem',
                  fontWeight: '600',
                  ...getPriorityBadgeStyle(activeModalItem.data.severity || activeModalItem.data.priority),
                }}
              >
                {activeModalItem.data.severity || activeModalItem.data.priority}
              </span>
            </div>

            <h2 style={{ color: '#f8fafc', fontSize: '1.25rem', fontWeight: '700', margin: '0 0 16px 0' }}>
              {activeModalItem.data.title}
            </h2>

            {/* Detailed Explanation */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: '#38bdf8', fontSize: '0.85rem', textTransform: 'uppercase', margin: '0 0 6px 0' }}>
                Technical Explanation & Analysis
              </h4>
              <p style={{ color: '#cbd5e1', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>
                {activeModalItem.data.detailedExplanation || activeModalItem.data.action || activeModalItem.data.summary}
              </p>
            </div>

            {/* Potential Benefits (if recommendation) */}
            {activeModalItem.data.potentialBenefits && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ color: '#34d399', fontSize: '0.85rem', textTransform: 'uppercase', margin: '0 0 8px 0' }}>
                  Anticipated Urban Benefits
                </h4>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#cbd5e1', fontSize: '0.86rem', lineHeight: '1.5' }}>
                  {activeModalItem.data.potentialBenefits.map((b, idx) => (
                    <li key={idx} style={{ marginBottom: '4px' }}>{b}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Implementation Considerations (if recommendation) */}
            {activeModalItem.data.implementationConsiderations && (
              <div style={{ marginBottom: '20px', backgroundColor: 'rgba(15, 23, 42, 0.6)', padding: '12px', borderRadius: '6px' }}>
                <h4 style={{ color: '#facc15', fontSize: '0.82rem', textTransform: 'uppercase', margin: '0 0 4px 0' }}>
                  Implementation Considerations
                </h4>
                <p style={{ color: '#cbd5e1', fontSize: '0.84rem', lineHeight: '1.5', margin: 0 }}>
                  {activeModalItem.data.implementationConsiderations}
                </p>
              </div>
            )}

            {/* Data Provenance & Methodology */}
            <div
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                padding: '14px',
                marginBottom: '20px',
              }}
            >
              <h4 style={{ color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', margin: '0 0 8px 0' }}>
                Data Support & Methodology Provenance
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.8rem' }}>
                <div>
                  <span style={{ color: '#64748b' }}>Support Level: </span>
                  <strong style={{ color: '#34d399' }}>{activeModalItem.data.confidence || 'Strong Data Support'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Source Engine: </span>
                  <strong style={{ color: '#f8fafc' }}>{activeModalItem.data.sourceAnalytics || 'Phase 9 Analytics Core'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Area Target: </span>
                  <strong style={{ color: '#f8fafc' }}>{activeModalItem.data.areaName || 'Municipal Wide'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Audit Timestamp: </span>
                  <strong style={{ color: '#f8fafc' }}>
                    {new Date(activeModalItem.data.generatedAt || activeModalItem.data.createdAt || Date.now()).toLocaleString()}
                  </strong>
                </div>
              </div>
            </div>

            {/* Close modal action */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setActiveModalItem(null)}
                className="btn-secondary"
                style={{
                  padding: '8px 18px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#f8fafc',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InsightsPage;
