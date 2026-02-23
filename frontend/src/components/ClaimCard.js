import React from 'react';

const ClaimCard = ({ claim }) => {
  const getCredibilityColor = (score) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 65) return 'bg-blue-500';
    if (score >= 50) return 'bg-yellow-500';
    if (score >= 30) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getCredibilityTextColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 65) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    if (score >= 30) return 'text-orange-600';
    return 'text-red-600';
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
    <div className="card border-2 border-gray-200 hover:border-gray-900 hover:shadow-xl transition-all duration-200 p-4">
      <div className="flex justify-between items-start mb-2 gap-2">
        <span className="inline-block px-2 py-1 bg-gradient-to-r from-gray-900 to-gray-700 text-white rounded-md text-[10px] font-bold uppercase tracking-wide shadow-sm">
          {claim.category}
        </span>
        <span className="text-gray-500 text-[10px] font-semibold bg-gray-100 px-1.5 py-0.5 rounded shrink-0">{claim.source}</span>
      </div>

      <p className="text-gray-800 text-xs sm:text-sm leading-relaxed mb-3 font-medium">
        {claim.text}
      </p>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Credibility Score</span>
            <span className={`text-sm font-bold ${getCredibilityTextColor(claim.credibility)}`}>
              {getCredibilityLabel(claim.credibility)}
            </span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden shadow-inner">
            <div
              className={`h-full transition-all duration-500 ${getCredibilityColor(claim.credibility)} shadow-sm`}
              style={{ width: `${claim.credibility}%` }}
            />
          </div>
          <div className="text-right mt-1">
            <span className="text-xs font-bold text-gray-900">{claim.credibility}%</span>
          </div>
        </div>

        <div className="flex justify-between items-center pt-3 border-t-2 border-gray-100">
          <span className={claim.verified ? 'badge-verified font-bold' : 'badge-unverified font-bold'}>
            {claim.verified ? '✓ Verified' : '✗ Unverified'}
          </span>
          <span className="text-xs text-gray-500 font-medium">{formatDate(claim.timestamp)}</span>
        </div>
      </div>
    </div>
  );
};

export default ClaimCard;