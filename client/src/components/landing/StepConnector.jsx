import React from 'react';
import {
  IconDatabase,
  IconCheckCircle,
  IconLayers,
  IconBarChart,
  IconFlame,
  IconShieldAlert,
} from '../common/Icons';

const steps = [
  {
    number: '01',
    title: 'Collect Data',
    desc: 'Ingest multi-source satellite surface readings, weather stations, and local demographic records.',
    icon: IconDatabase,
    color: '#38bdf8',
  },
  {
    number: '02',
    title: 'Clean Data',
    desc: 'Filter anomalous spikes, normalize units, impute temporal gaps, and validate sensor feeds.',
    icon: IconCheckCircle,
    color: '#34d399',
  },
  {
    number: '03',
    title: 'Integrate Data',
    desc: 'Harmonize environmental indicators with land use polygons and traffic density layers.',
    icon: IconLayers,
    color: '#818cf8',
  },
  {
    number: '04',
    title: 'Analyze Patterns',
    desc: 'Derive microclimate diurnal trends, calculate correlations, and compute thermal disparities.',
    icon: IconBarChart,
    color: '#f59e0b',
  },
  {
    number: '05',
    title: 'Detect Heat Hotspots',
    desc: 'Cluster areas exceeding threshold margins into classified micro-urban heat islands.',
    icon: IconFlame,
    color: '#f97316',
  },
  {
    number: '06',
    title: 'Assess Heat Exposure',
    desc: 'Generate heat vulnerability rankings cross-referenced with human population density.',
    icon: IconShieldAlert,
    color: '#ef4444',
  },
];

const StepConnector = () => {
  return (
    <div className="pipeline-steps">
      {steps.map((step, idx) => {
        const Icon = step.icon;
        return (
          <div
            key={step.number}
            className="card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              padding: 'var(--space-lg)',
              background: 'var(--bg-surface-card)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
              <span
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  color: step.color,
                  opacity: 0.85,
                }}
              >
                {step.number}
              </span>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255,255,255,0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: step.color,
                }}
              >
                <Icon size={20} />
              </div>
            </div>

            <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              {step.title}
            </h4>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              {step.desc}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default StepConnector;
