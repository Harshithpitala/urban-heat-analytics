import React from 'react';
import { IconInfo } from './Icons';

const EmptyState = ({
  title = 'No Data Available',
  description = 'There are no active records matching your filter selection.',
  action = null,
}) => {
  return (
    <div className="empty-state">
      <IconInfo size={36} color="var(--text-disabled)" />
      <div className="empty-title">{title}</div>
      <p style={{ maxWidth: '400px', margin: '0 auto var(--space-md)' }}>{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};

export default EmptyState;
