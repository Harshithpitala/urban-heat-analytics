import React from 'react';
import { IconInfo } from './Icons';

const NoticeBanner = ({ message, badgeText = 'Demo Dataset', tagText = 'Synthetic Dataset' }) => {
  return (
    <div className="notice-banner" role="alert">
      <div className="notice-content">
        <IconInfo size={20} color="#f97316" />
        <span>
          <strong>[{badgeText}]</strong> {message || 'This platform currently operates with synthetic demonstration records. Real-world municipal feeds can be ingested via the Data Import portal.'}
        </span>
      </div>
      <span className="badge badge-demo">{tagText}</span>
    </div>
  );
};

export default NoticeBanner;
