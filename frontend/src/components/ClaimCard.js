import React from 'react';
import '../styles/ClaimCard.css';

const ClaimCard = ({ claim }) => {
  const getCredibilityColor = (score) => {
    if (score >= 80) return '#28a745';
    if (score >= 65) return '#17a2b8';
    if (score >= 50) return '#ffc107';
    if (score >= 30) return '#fd7e14';
    return '#dc3545';
  };

  const getCredibilityLabel = (score) => {
    if (score >= 80) return 'Very High';
    if (score >= 65) return 'High';
    if (score >= 50) return 'Medium';
    if (score >= 30) return 'Low';
    return 'Very Low';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="claim-card">
      <div className="claim-header">
        <span className="claim-category">{claim.category}</span>
        <span className="claim-source">{claim.source}</span>
      </div>

      <p className="claim-text">{claim.text}</p>

      <div className="claim-footer">
        <div className="claim-credibility">
          <div className="credibility-bar-container">
            <div
              className="credibility-bar"
              style={{
                width: `${claim.credibility}%`,
                backgroundColor: getCredibilityColor(claim.credibility)
              }}
            />
          </div>
          <div className="credibility-info">
            <span className="credibility-score">{claim.credibility}%</span>
            <span
              className="credibility-label"
              style={{ color: getCredibilityColor(claim.credibility) }}
            >
              {getCredibilityLabel(claim.credibility)}
            </span>
          </div>
        </div>

        <div className="claim-meta">
          <span className={`verified-badge ${claim.verified ? 'verified' : 'unverified'}`}>
            {claim.verified ? 'Verified' : 'Unverified'}
          </span>
          <span className="claim-date">{formatDate(claim.timestamp)}</span>
        </div>
      </div>
    </div>
  );
};

export default ClaimCard;