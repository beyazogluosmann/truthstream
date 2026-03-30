import React, { useState, useEffect } from 'react';
import { getAllClaims, deleteClaim } from '../services/api';

function Dashboard() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    unverified: 0
  });
  const [filter, setFilter] = useState('all'); // all, verified, unverified
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const response = await getAllClaims(1, 50);
      
      if (response.success && response.data) {
        // Sort by verified_at descending (newest first)
        const sortedClaims = response.data.sort((a, b) => {
          const dateA = new Date(a.verified_at || a.submitted_at);
          const dateB = new Date(b.verified_at || b.submitted_at);
          return dateB - dateA; // Newest first
        });
        
        setClaims(sortedClaims);
        
        // Calculate stats
        const total = response.data.length;
        const verified = response.data.filter(c => c.verified).length;
        const unverified = total - verified;
        
        setStats({ total, verified, unverified });
      }
    } catch (error) {
      console.error('Error fetching claims:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (claimId, claimText) => {
    const preview = claimText.substring(0, 50) + '...';
    if (!window.confirm(`Bu haberi silmek istediğinize emin misiniz?\n\n"${preview}"`)) {
      return;
    }
    
    try {
      const result = await deleteClaim(claimId);
      if (result.success) {
        // Remove from UI immediately
        setClaims(claims.filter(c => c.id !== claimId));
        
        // Update stats
        const claim = claims.find(c => c.id === claimId);
        setStats(prev => ({
          total: prev.total - 1,
          verified: claim?.verified ? prev.verified - 1 : prev.verified,
          unverified: claim?.verified ? prev.unverified : prev.unverified - 1
        }));
        
        // Show success message
        alert('✅ Haber başarıyla silindi');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('❌ Silme işlemi başarısız oldu: ' + error.message);
    }
  };

  const getCredibilityColor = (score) => {
    if (score >= 70) return 'text-green-400 bg-green-500/20 border-green-500/30';
    if (score >= 40) return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    return 'text-red-400 bg-red-500/20 border-red-500/30';
  };

  const getCredibilityLabel = (score) => {
    if (score >= 70) return 'Yüksek Güvenilirlik';
    if (score >= 40) return 'Orta Güvenilirlik';
    return 'Düşük Güvenilirlik';
  };

  const filteredClaims = claims.filter(claim => {
    // Filter by verification status
    if (filter === 'verified' && !claim.verified) return false;
    if (filter === 'unverified' && claim.verified) return false;
    
    // Filter by search term
    if (searchTerm && !claim.text.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // seconds
    
    if (diff < 60) return `${diff} saniye önce`;
    if (diff < 3600) return `${Math.floor(diff / 60)} dakika önce`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} saat önce`;
    return `${Math.floor(diff / 86400)} gün önce`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-pink-200 to-purple-200 mb-2">
            Doğrulama Sonuçları
          </h1>
          <p className="text-gray-400">AI tarafından analiz edilen haberler</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Claims */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-xl rounded-2xl group-hover:blur-2xl transition-all duration-300"></div>
            <div className="relative bg-slate-900/80 border border-purple-500/30 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Toplam Haber</p>
                  <p className="text-3xl font-bold text-white">{stats.total}</p>
                  <p className="text-xs text-gray-500 mt-1">Tüm kayıtlar</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Verified */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 blur-xl rounded-2xl group-hover:blur-2xl transition-all duration-300"></div>
            <div className="relative bg-slate-900/80 border border-green-500/30 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Doğrulanmış</p>
                  <p className="text-3xl font-bold text-green-400">{stats.verified}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.total > 0 ? Math.round((stats.verified / stats.total) * 100) : 0}%
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Unverified */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-orange-500/20 blur-xl rounded-2xl group-hover:blur-2xl transition-all duration-300"></div>
            <div className="relative bg-slate-900/80 border border-red-500/30 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Doğrulanmamış</p>
                  <p className="text-3xl font-bold text-red-400">{stats.unverified}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.total > 0 ? Math.round((stats.unverified / stats.total) * 100) : 0}%
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Haber ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 pl-12 bg-slate-900/50 border border-purple-500/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                filter === 'all'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                  : 'bg-slate-900/50 text-gray-400 border border-purple-500/30 hover:border-purple-500/50'
              }`}
            >
              Tümü
            </button>
            <button
              onClick={() => setFilter('verified')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                filter === 'verified'
                  ? 'bg-green-600 text-white shadow-lg shadow-green-500/50'
                  : 'bg-slate-900/50 text-gray-400 border border-green-500/30 hover:border-green-500/50'
              }`}
            >
              ✓ Doğru
            </button>
            <button
              onClick={() => setFilter('unverified')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                filter === 'unverified'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-500/50'
                  : 'bg-slate-900/50 text-gray-400 border border-red-500/30 hover:border-red-500/50'
              }`}
            >
              ✕ Yanlış
            </button>
          </div>
        </div>

        {/* Claims List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
          </div>
        ) : filteredClaims.length === 0 ? (
          <div className="text-center py-20">
            <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-gray-500 text-lg">Henüz haber yok</p>
            <p className="text-gray-600 text-sm mt-2">İlk haberi gönderin ve AI analizini görün!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredClaims.map((claim) => (
              <div key={claim.id} className="relative group">
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 blur-xl rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                
                <div className="relative bg-slate-900/80 border border-purple-500/30 rounded-2xl p-6 backdrop-blur-sm hover:border-purple-500/50 transition-all duration-300">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                    {/* Left: Credibility Score */}
                    <div className="flex-shrink-0">
                      <div className={`w-24 h-24 rounded-2xl border-2 ${getCredibilityColor(claim.credibility)} flex flex-col items-center justify-center`}>
                        <div className="text-3xl font-bold">{claim.credibility}</div>
                        <div className="text-xs opacity-75">/ 100</div>
                      </div>
                      <p className="text-xs text-center mt-2 text-gray-500">{getCredibilityLabel(claim.credibility)}</p>
                    </div>

                    {/* Middle: Content */}
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          {/* Verification Badge */}
                          {claim.verified ? (
                            <span className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 text-xs font-semibold flex items-center gap-1">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Doğrulanmış
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-xs font-semibold flex items-center gap-1">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                              Doğrulanmamış
                            </span>
                          )}

                          {/* Category */}
                          <span className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-300 text-xs font-semibold">
                            {claim.category}
                          </span>

                          {/* Time */}
                          <span className="text-xs text-gray-500">
                            {formatDate(claim.processed_at || claim.timestamp)}
                          </span>
                        </div>
                      </div>

                      {/* Claim Text */}
                      <p className="text-white text-lg mb-4 leading-relaxed">{claim.text}</p>

                      {/* AI Reasoning */}
                      {claim.ai_reasoning && (
                        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 mb-3">
                          <div className="flex items-start gap-2 mb-3">
                            <svg className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M13 7H7v6h6V7z" />
                              <path fillRule="evenodd" d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z" clipRule="evenodd" />
                            </svg>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-purple-300 mb-2">AI Analizi</p>
                              <p className="text-gray-300 text-sm leading-relaxed">{claim.ai_reasoning}</p>
                            </div>
                          </div>

                          {/* Detailed Scores - if available */}
                          {claim.scores && (
                            <div className="mt-4 pt-4 border-t border-slate-700/50">
                              <p className="text-xs font-semibold text-gray-400 mb-3">Detaylı Değerlendirme</p>
                              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                {/* Source Score */}
                                <div className="bg-slate-900/50 rounded-lg p-3">
                                  <div className="flex items-center gap-1 mb-1">
                                    <svg className="w-3 h-3 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                    </svg>
                                    <p className="text-xs text-gray-400">Kaynak</p>
                                  </div>
                                  <p className="text-lg font-bold text-blue-300">{claim.scores.source || 0}/20</p>
                                </div>

                                {/* Logic Score */}
                                <div className="bg-slate-900/50 rounded-lg p-3">
                                  <div className="flex items-center gap-1 mb-1">
                                    <svg className="w-3 h-3 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                                    </svg>
                                    <p className="text-xs text-gray-400">Mantık</p>
                                  </div>
                                  <p className="text-lg font-bold text-purple-300">{claim.scores.logic || 0}/20</p>
                                </div>

                                {/* Factuality Score */}
                                <div className="bg-slate-900/50 rounded-lg p-3">
                                  <div className="flex items-center gap-1 mb-1">
                                    <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <p className="text-xs text-gray-400">Gerçeklik</p>
                                  </div>
                                  <p className="text-lg font-bold text-green-300">{claim.scores.factuality || 0}/20</p>
                                </div>

                                {/* Language Score */}
                                <div className="bg-slate-900/50 rounded-lg p-3">
                                  <div className="flex items-center gap-1 mb-1">
                                    <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                    <p className="text-xs text-gray-400">Dil/Üslup</p>
                                  </div>
                                  <p className="text-lg font-bold text-yellow-300">{claim.scores.language || 0}/20</p>
                                </div>

                                {/* Verifiability Score */}
                                <div className="bg-slate-900/50 rounded-lg p-3">
                                  <div className="flex items-center gap-1 mb-1">
                                    <svg className="w-3 h-3 text-pink-400" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <p className="text-xs text-gray-400">Kanıt</p>
                                  </div>
                                  <p className="text-lg font-bold text-pink-300">{claim.scores.verifiability || 0}/20</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Red Flags */}
                      {claim.red_flags && claim.red_flags.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-semibold text-orange-400 mb-2">Şüpheli Noktalar:</p>
                          <div className="flex flex-wrap gap-2">
                            {claim.red_flags.map((flag, index) => (
                              <span key={index} className="px-3 py-1.5 bg-orange-500/20 border border-orange-500/30 rounded-lg text-orange-300 text-xs flex items-center gap-1.5">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
                                </svg>
                                {flag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Delete Button */}
                      <div className="flex justify-end mt-4 pt-4 border-t border-slate-700/50">
                        <button
                          onClick={() => handleDelete(claim.id, claim.text)}
                          className="group px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 rounded-lg text-red-400 hover:text-red-300 text-sm font-semibold transition-all duration-300 flex items-center gap-2"
                          title="Haberi Sil"
                        >
                          <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Sil
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
