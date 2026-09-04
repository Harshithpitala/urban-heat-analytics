import React from 'react';
import { Link } from 'react-router-dom';
import HeroVisual from '../components/landing/HeroVisual';
import StepConnector from '../components/landing/StepConnector';
import {
  IconThermometer,
  IconDroplets,
  IconCloudRain,
  IconCar,
  IconUsers,
  IconBuilding,
  IconLeaf,
  IconLayers,
  IconFlame,
  IconShieldAlert,
  IconBarChart,
  IconMapPin,
  IconActivity,
  IconArrowRight,
  IconServer,
  IconDatabase,
  IconCpu,
} from '../components/common/Icons';

// Section 1: What We Analyze (8 Parameters)
const analyzeParameters = [
  {
    title: 'Temperature',
    desc: 'Surface and ambient thermal readings measuring heat entrapment and diurnal variations.',
    icon: IconThermometer,
    color: '#ef4444',
  },
  {
    title: 'Humidity',
    desc: 'Relative moisture levels that directly amplify human physiological heat index stress.',
    icon: IconDroplets,
    color: '#38bdf8',
  },
  {
    title: 'Rainfall',
    desc: 'Precipitation frequency and soil moisture cooling buffers across seasonal intervals.',
    icon: IconCloudRain,
    color: '#06b6d4',
  },
  {
    title: 'Traffic',
    desc: 'Vehicular transit density and concentrated anthropogenic combustion exhaust emissions.',
    icon: IconCar,
    color: '#f97316',
  },
  {
    title: 'Population',
    desc: 'Census tract population density identifying communities with vulnerable demographic exposure.',
    icon: IconUsers,
    color: '#a855f7',
  },
  {
    title: 'Building Density',
    desc: 'Urban canopy volume and structural morphology trapping shortwave solar radiation.',
    icon: IconBuilding,
    color: '#f59e0b',
  },
  {
    title: 'Vegetation',
    desc: 'Normalized Difference Vegetation Index (NDVI) measuring nature-based evapotranspiration cooling.',
    icon: IconLeaf,
    color: '#10b981',
  },
  {
    title: 'Land Use',
    desc: 'Zoning classifications assessing albedo and heat retention of commercial, industrial, and residential zones.',
    icon: IconLayers,
    color: '#6366f1',
  },
];

// Section 3: Key Capabilities (6 Capabilities)
const keyCapabilities = [
  {
    title: 'Urban Heat Monitoring',
    desc: 'Continuous spatial monitoring of diurnal temperatures across micro-neighborhoods to detect thermal extremes.',
    icon: IconThermometer,
    color: '#ef4444',
  },
  {
    title: 'Heat Hotspot Detection',
    desc: 'Cluster detection algorithms pinpointing localized surface anomalies exceeding regional baselines.',
    icon: IconFlame,
    color: '#f97316',
  },
  {
    title: 'Environmental Analysis',
    desc: 'Correlating urban greenery deficits, impermeable asphalt surfaces, and microclimate variations.',
    icon: IconLeaf,
    color: '#10b981',
  },
  {
    title: 'Human Activity Analysis',
    desc: 'Integrating vehicular traffic patterns and pedestrian movements with thermal stress concentration.',
    icon: IconActivity,
    color: '#38bdf8',
  },
  {
    title: 'Risk Assessment',
    desc: 'Composite risk scoring combining environmental heat vulnerability with population demographics.',
    icon: IconShieldAlert,
    color: '#f59e0b',
  },
  {
    title: 'Interactive Visualization',
    desc: 'Multi-dimensional charts, comparative tables, and interactive maps designed for municipal urban planners.',
    icon: IconBarChart,
    color: '#a855f7',
  },
];

// Section 4: Tech Stack
const techStack = [
  { name: 'React.js', role: 'Frontend Framework', icon: IconCpu, color: '#06b6d4' },
  { name: 'Node.js', role: 'Backend Runtime', icon: IconServer, color: '#10b981' },
  { name: 'Express.js', role: 'REST API Engine', icon: IconServer, color: '#cbd5e1' },
  { name: 'MongoDB', role: 'Document Database', icon: IconDatabase, color: '#34d399' },
  { name: 'Data Analytics', role: 'Statistical & Risk Modeling', icon: IconBarChart, color: '#f97316' },
];

const LandingPage = () => {
  return (
    <div style={{ backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)' }}>
      {/* Landing Top Navigation Bar */}
      <header className="landing-navbar">
        <div className="flex items-center gap-sm">
          <div className="brand-icon-box">
            <IconFlame size={22} color="#ffffff" />
          </div>
          <div>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', fontWeight: 700 }}>
              Urban Heat
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--heat-high)', fontWeight: 600, marginLeft: '6px', textTransform: 'uppercase' }}>
              Analytics
            </span>
          </div>
        </div>

        <nav className="landing-nav-links">
          <a href="#what-we-analyze">What We Analyze</a>
          <a href="#how-it-works">How It Works</a>
          <a href="#capabilities">Capabilities</a>
          <a href="#technology">Technology</a>
        </nav>

        <div>
          <Link to="/dashboard" className="btn btn-primary btn-sm">
            Launch Platform &rarr;
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="hero-text-content">
          <div className="hero-tag">
            <IconShieldAlert size={14} />
            Environmental Intelligence Platform
          </div>

          <h1 className="hero-title">
            Urban Heat & Human Activity Analytics
          </h1>

          <p className="hero-subtitle">
            Understand where cities are heating up, why it happens, and which areas face greater heat exposure.
          </p>

          <div className="hero-actions">
            <Link to="/dashboard" className="btn btn-primary">
              Explore Dashboard
              <IconArrowRight size={18} />
            </Link>
            <a href="#how-it-works" className="btn btn-outline">
              Learn How It Works
            </a>
          </div>

          <div style={{ marginTop: 'var(--space-2xl)', display: 'flex', alignItems: 'center', gap: 'var(--space-lg)' }}>
            <div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>100% Verified</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Deterministic Analytics Engine</div>
            </div>
            <div style={{ width: '1px', height: '30px', background: 'var(--border-subtle)' }} />
            <div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--heat-high)' }}>MERN</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Full-Stack Architecture</div>
            </div>
          </div>
        </div>

        <div className="hero-visual-wrapper">
          <HeroVisual />
        </div>
      </section>

      {/* Section 1: What We Analyze */}
      <section id="what-we-analyze" className="landing-section">
        <div className="section-header">
          <div className="section-pretitle">Parameters & Dimensions</div>
          <h2 className="section-title">What We Analyze</h2>
          <p className="section-desc">
            A multi-layered inquiry measuring environmental heat drivers, urban morphology, and anthropogenic activity.
          </p>
        </div>

        <div className="grid-8cards">
          {analyzeParameters.map((param) => {
            const Icon = param.icon;
            return (
              <div key={param.title} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: param.color,
                  }}
                >
                  <Icon size={22} />
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {param.title}
                </h3>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  {param.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 2: How It Works */}
      <section id="how-it-works" className="landing-section" style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)' }}>
        <div className="section-header">
          <div className="section-pretitle">Methodology & Pipeline</div>
          <h2 className="section-title">How It Works</h2>
          <p className="section-desc">
            A systematic six-step analytical workflow from raw data ingestion to granular human exposure risk assessments.
          </p>
        </div>

        <StepConnector />
      </section>

      {/* Section 3: Key Capabilities */}
      <section id="capabilities" className="landing-section">
        <div className="section-header">
          <div className="section-pretitle">Intelligence Engine</div>
          <h2 className="section-title">Key Capabilities</h2>
          <p className="section-desc">
            Engineered to empower municipal authorities, urban planners, and environmental researchers with actionable insights.
          </p>
        </div>

        <div className="grid-6cards">
          {keyCapabilities.map((cap) => {
            const Icon = cap.icon;
            return (
              <div key={cap.title} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: cap.color,
                  }}
                >
                  <Icon size={22} />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {cap.title}
                </h3>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {cap.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 4: Technology */}
      <section id="technology" className="landing-section" style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)' }}>
        <div className="section-header">
          <div className="section-pretitle">Architecture & Foundation</div>
          <h2 className="section-title">Technology Stack</h2>
          <p className="section-desc">
            Built on robust, scalable, modern web and data analytics technologies.
          </p>
        </div>

        <div className="tech-grid">
          {techStack.map((tech) => {
            const Icon = tech.icon;
            return (
              <div
                key={tech.name}
                className="card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-md)',
                  minWidth: '220px',
                  padding: 'var(--space-lg)',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.04)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: tech.color,
                  }}
                >
                  <Icon size={22} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                    {tech.name}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    {tech.role}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 5: Call To Action */}
      <section className="landing-section">
        <div className="landing-cta-banner">
          <h2 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: 'var(--space-md)', color: '#ffffff' }}>
            Explore Urban Heat Analytics
          </h2>
          <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', maxWidth: '580px', margin: '0 auto var(--space-2xl)' }}>
            Dive into the interactive Analytics Command Center, explore geospatial heat distributions, analyze factor risk contributions, and evaluate targeted municipal planning recommendations.
          </p>
          <Link to="/dashboard" className="btn btn-primary" style={{ padding: '14px 28px', fontSize: '1rem' }}>
            Open Analytics Dashboard
            <IconArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <p>
          <strong>Urban Heat & Human Activity Analytics</strong> — A Data-Driven Heat Exposure Risk Assessment System.
        </p>
        <p style={{ marginTop: '8px', fontSize: '0.78rem', color: 'var(--text-disabled)' }}>
          Production Analytics Platform &bull; Built with React, Node.js, Express & MongoDB &bull; Synthetic Demo Dataset
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;
