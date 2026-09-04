import React from 'react';

const StatusBadge = ({ label, type = 'moderate', className = '' }) => {
  const typeClasses = {
    low: 'badge-low',
    moderate: 'badge-moderate',
    high: 'badge-high',
    extreme: 'badge-extreme',
    danger: 'badge-extreme',
    warning: 'badge-moderate',
    success: 'badge-low',
    demo: 'badge-demo',
  };

  const selectedClass = typeClasses[type.toLowerCase()] || 'badge-moderate';

  return (
    <span className={`badge ${selectedClass} ${className}`}>
      {label}
    </span>
  );
};

export default StatusBadge;
