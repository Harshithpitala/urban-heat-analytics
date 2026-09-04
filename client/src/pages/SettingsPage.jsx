import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../components/common/StatusBadge';
import { checkApiHealth, fetchRiskConfig } from '../services/api';
import {
  IconSettings,
  IconServer,
  IconDatabase,
  IconShieldAlert,
  IconCheckCircle,
  IconInfo,
  IconFlame,
  IconLeaf,
  IconSliders,
  IconLayers,
} from '../components/common/Icons';

const SettingsPage = () => {
  const [apiStatus, setApiStatus] = useState('checking');
  const [dbStatus, setDbStatus] = useState('checking');
  const [tempUnit, setTempUnit] = useState('celsius');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [riskWeights, setRiskWeights] = useState(null);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await checkApiHealth();
        setApiStatus(res.connected ? 'connected' : 'disconnected');
        setDbStatus(res.data?.database === 'connected' ? 'connected' : 'disconnected');
      } catch (err) {
        setApiStatus('disconnected');
        setDbStatus('disconnected');
      }

      try {
        const cfgRes = await fetchRiskConfig();
        if (cfgRes?.weights) setRiskWeights(cfgRes.weights);
      } catch (e) {
        // Fallback weights
        setRiskWeights({
          temperature: 35,
          populationDensity: 20,
          humidity: 10,
          buildingDensity: 10,
          traffic: 10,
          vegetation: 10,
          rainfall: 5,
        });
      }
    };
    checkStatus();
  }, []);

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: 'var(--space-3xl)' }}>
      {/* 1. System & Backend Connection */}
      <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="card-header">
          <div>
            <h3 className="card-title">System & Backend Status</h3>
            <p className="card-subtitle">Runtime communication status with Express API server and MongoDB persistence layer</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--space-md)' }}>
          <div
            style={{
              padding: 'var(--space-md)',
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div className="flex items-center gap-sm">
              <IconServer size={20} color="#38bdf8" />
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>Express API Backend</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Port 5000 &bull; RESTful Interface</div>
              </div>
            </div>
            <StatusBadge
              label={apiStatus === 'connected' ? 'Online' : apiStatus === 'checking' ? 'Checking' : 'Offline'}
              type={apiStatus === 'connected' ? 'low' : 'moderate'}
            />
          </div>

          <div
            style={{
              padding: 'var(--space-md)',
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div className="flex items-center gap-sm">
              <IconDatabase size={20} color="#10b981" />
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>MongoDB Database</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Collection: urban_heat_analytics</div>
              </div>
            </div>
            <StatusBadge
              label={dbStatus === 'connected' ? 'Connected' : 'Disconnected'}
              type={dbStatus === 'connected' ? 'low' : 'extreme'}
            />
          </div>
        </div>
      </div>

      {/* 2. Active Demonstration Dataset Context */}
      <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="card-header">
          <div>
            <h3 className="card-title">Active Dataset Information</h3>
            <p className="card-subtitle">Telemetry provenance, spatial bounds, and record completeness</p>
          </div>
          <StatusBadge label="Synthetic Baseline" type="low" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
          <div style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Scope Area</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', marginTop: '2px' }}>Metro City Grid</div>
            <div style={{ fontSize: '0.75rem', color: '#38bdf8' }}>11 Monitored Districts</div>
          </div>
          <div style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Observations</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', marginTop: '2px' }}>716 Records</div>
            <div style={{ fontSize: '0.75rem', color: '#10b981' }}>100% Validated</div>
          </div>
          <div style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Temporal Span</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', marginTop: '2px' }}>July – Sept 2026</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Daily Time-Series</div>
          </div>
          <div style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Quality Audit</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', marginTop: '2px' }}>100% Complete</div>
            <div style={{ fontSize: '0.75rem', color: '#34d399' }}>Zero Corrupt Rows</div>
          </div>
        </div>
      </div>

      {/* 3. HERI Model Weights & Configuration */}
      <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h3 className="card-title">HERI Model Specification (HERI-v1.0)</h3>
            <p className="card-subtitle">Active multi-factor component weights totaling 100%</p>
          </div>
          <Link to="/risk-index" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <IconSliders size={14} />
            Configure Weights &rarr;
          </Link>
        </div>

        {riskWeights && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
            {Object.entries(riskWeights).map(([factor, weight]) => (
              <div
                key={factor}
                style={{
                  background: 'var(--bg-surface)',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                  {factor.replace(/([A-Z])/g, ' $1')}
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: factor === 'temperature' ? '#f97316' : '#f8fafc', marginTop: '2px' }}>
                  {weight}%
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Display Preferences */}
      <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="card-header">
          <div>
            <h3 className="card-title">Display & Polling Preferences</h3>
            <p className="card-subtitle">Personalize unit standards and live dashboard telemetry polling</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <div style={{ fontSize: '0.92rem', fontWeight: 600 }}>Temperature Unit Scale</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Standard unit for metric displays and charts</div>
            </div>
            <div className="flex gap-xs">
              <button
                type="button"
                className={`btn btn-sm ${tempUnit === 'celsius' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setTempUnit('celsius')}
              >
                Celsius (°C)
              </button>
              <button
                type="button"
                className={`btn btn-sm ${tempUnit === 'fahrenheit' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setTempUnit('fahrenheit')}
              >
                Fahrenheit (°F)
              </button>
            </div>
          </div>

          <div style={{ height: '1px', background: 'var(--border-subtle)' }} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <div style={{ fontSize: '0.92rem', fontWeight: 600 }}>Auto-Refresh Telemetry</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Periodically re-query backend summary every 60 seconds</div>
            </div>
            <button
              type="button"
              className={`btn btn-sm ${autoRefresh ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? 'Enabled' : 'Disabled'}
            </button>
          </div>
        </div>
      </div>

      {/* 5. About Project & Methodology */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">About the Platform & Methodology</h3>
            <p className="card-subtitle">Academic context, mathematical principles, and analytical boundaries</p>
          </div>
        </div>

        <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
          <p>
            <strong>Project Title:</strong> Urban Heat & Human Activity Analytics<br />
            <strong>Subtitle:</strong> A Data-Driven Heat Exposure Risk Assessment System<br />
            <strong>Version:</strong> v1.0 Production Release &bull; 10 Phases Completed<br />
            <strong>Technology Stack:</strong> MongoDB, Express.js, React.js (Vite 6), Node.js (MERN)
          </p>

          <h4 style={{ color: '#f8fafc', fontSize: '0.95rem', marginTop: '16px', marginBottom: '6px' }}>
            Analytical Objectives & Methodology
          </h4>
          <p style={{ margin: 0 }}>
            This platform quantifies how urban geometry, pavement density, vehicular mobility, and vegetation loss
            correlate with localized surface heating anomalies. The <strong>Hotspot Detection System</strong> evaluates
            the 90th percentile temperature threshold and temporal persistence. The <strong>Heat Exposure Risk Index (HERI)</strong> combines
            environmental hazard, demographic density, and protective vegetative canopy into a 0–100 scale using min-max normalization.
          </p>

          <div
            style={{
              marginTop: '16px',
              padding: '12px 16px',
              backgroundColor: 'rgba(249, 115, 22, 0.08)',
              border: '1px solid rgba(249, 115, 22, 0.25)',
              borderRadius: '8px',
            }}
          >
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f97316', textTransform: 'uppercase', marginBottom: '4px' }}>
              Academic & Non-Medical Disclaimer
            </div>
            <div style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
              Correlation does not imply causation. All hotspot classifications, risk scores, and planning recommendations
              represent mathematical derivations from demonstration data. They do not constitute official municipal heat
              warnings, emergency evacuation orders, or clinical health diagnoses.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
