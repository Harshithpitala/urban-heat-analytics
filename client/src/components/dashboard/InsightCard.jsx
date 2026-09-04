import React from 'react';
import StatusBadge from '../common/StatusBadge';
import { IconFlame, IconLeaf, IconCar, IconLayers } from '../common/Icons';

const categoryIcons = {
  Temperature: { icon: IconFlame, color: '#f97316' },
  Environment: { icon: IconLeaf, color: '#10b981' },
  'Human Activity': { icon: IconCar, color: '#38bdf8' },
  'Land Use': { icon: IconLayers, color: '#a855f7' },
};

const InsightCard = ({ title, description, tag = 'Demo Insight', category = 'Temperature' }) => {
  const meta = categoryIcons[category] || { icon: IconFlame, color: '#f97316' };
  const Icon = meta.icon;

  return (
    <div className="insight-card">
      <div className="insight-icon" style={{ color: meta.color }}>
        <Icon size={20} />
      </div>
      <div className="insight-body">
        <div className="insight-header">
          <div className="insight-title">{title}</div>
          <StatusBadge label={tag} type="demo" />
        </div>
        <p className="insight-text">{description}</p>
      </div>
    </div>
  );
};

export default InsightCard;
