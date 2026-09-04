import React from 'react';

const PageHeader = ({ title, description, actions = null }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-xl)', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
      <div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h2>
        {description && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>{description}</p>}
      </div>
      {actions && <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>{actions}</div>}
    </div>
  );
};

export default PageHeader;
