import React from 'react';

const ChartCard = ({ title, subtitle, badge = null, action = null, children, height = 300 }) => {
  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="flex items-center gap-xs">
            <h3 className="card-title">{title}</h3>
            {badge && <div>{badge}</div>}
          </div>
          {subtitle && <p className="card-subtitle">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>

      <div style={{ width: '100%', height: `${height}px`, minHeight: `${height}px` }}>
        {children}
      </div>
    </div>
  );
};

export default ChartCard;
