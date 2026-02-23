import React, { useState, useEffect } from 'react';
import { getAllClaims, searchClaims, getClaimsByCategory, getStats } from '../services/api';
import SearchBar from './SearchBar';
import CategoryFilter from './CategoryFilter';
import ClaimCard from './ClaimCard';
import StatsPanel from './StatsPanel';

const Dashboard = () => {
  const [claims, setClaims] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchStats = async () => {
    try {
      const response = await getStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchClaims = async () => {
    setLoading(true);
    setError(null);

    try {
      let response;

      if (searchQuery) {
        response = await searchClaims(searchQuery, page);
      } else if (selectedCategory !== 'All') {
        response = await getClaimsByCategory(selectedCategory, page);
      } else {
        response = await getAllClaims(page);
      }

      if (response.success) {
        setClaims(response.data);
        setTotalPages(response.pagination.pages);
      }
    } catch (err) {
      setError('Failed to fetch claims. Please try again.');
      console.error('Error fetching claims:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchClaims();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, searchQuery, page]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    setPage(1);
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setSearchQuery('');
    setPage(1);
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  return (
    <div className="space-y-6">
      <StatsPanel stats={stats} />

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <SearchBar onSearch={handleSearch} />
        </div>
      </div>

      <CategoryFilter
        selectedCategory={selectedCategory}
        onSelectCategory={handleCategorySelect}
      />

      <div className="space-y-3">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2.5 sm:p-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <h2 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 flex items-center gap-1.5">
              <span className="text-base sm:text-lg">📰</span>
              <span className="line-clamp-1">{searchQuery
                ? `Search Results for "${searchQuery}"`
                : selectedCategory === 'All'
                ? 'All News Claims'
                : `${selectedCategory} News`}</span>
            </h2>
            <div className="flex items-center gap-1.5 bg-gray-100 px-2.5 py-1 rounded-full shrink-0">
              <span className="text-xs font-semibold text-gray-700">{claims.length} claims</span>
              <span className="text-gray-400 hidden sm:inline">•</span>
              <span className="text-xs text-gray-600">Page {page}/{totalPages}</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">Loading claims...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 font-medium">{error}</p>
          </div>
        ) : claims.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No claims found</p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {claims.map((claim) => (
                <ClaimCard key={claim.id} claim={claim} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 sm:gap-3 pt-6">
                <button
                  onClick={handlePrevPage}
                  disabled={page === 1}
                  className="px-3 sm:px-5 py-2 sm:py-2.5 bg-white border-2 border-gray-300 hover:border-gray-900 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition font-semibold text-gray-700 text-sm sm:text-base"
                >
                  <span className="hidden sm:inline">← Previous</span>
                  <span className="sm:hidden">←</span>
                </button>
                <span className="px-3 sm:px-5 py-2 sm:py-2.5 bg-gray-900 text-white rounded-lg font-semibold text-sm sm:text-base">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={page === totalPages}
                  className="px-3 sm:px-5 py-2 sm:py-2.5 bg-white border-2 border-gray-300 hover:border-gray-900 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition font-semibold text-gray-700 text-sm sm:text-base"
                >
                  <span className="hidden sm:inline">Next →</span>
                  <span className="sm:hidden">→</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;