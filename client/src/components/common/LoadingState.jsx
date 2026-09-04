import React from 'react';

const LoadingState = ({ message = 'Loading environmental metrics...' }) => {
  return (
    <div className="loading-box" role="status" aria-live="polite">
      <div className="spinner"></div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{message}</p>
    </div>
  );
};

export default LoadingState;
