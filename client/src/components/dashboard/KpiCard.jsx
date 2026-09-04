import React from 'react';
import StatusBadge from '../common/StatusBadge';

const KpiCard = ({
  icon: Icon,
  value,
  unit = '',
  label,
  supporting,
  badge = null,
  accentColor = '#f97316',
}) => {
  return (
    <div className="kpi-card">
      <div className="kpi-top">
        <div className="kpi-icon-wrap" style={{ color: accentColor }}>
          {Icon && <Icon size={20} />}
        </div>
        {badge && <StatusBadge label={badge} type="demo" />}
      </div>

      <div>
        <div className="kpi-value-row">
          <span className="kpi-value">{value}</span>
          {unit && <span className="kpi-unit">{unit}</span>}
        </div>
        <div className="kpi-label">{label}</div>
      </div>

      <div className="kpi-footer">
        <span>{supporting}</span>
      </div>
    </div>
  );
};

export default KpiCard;
