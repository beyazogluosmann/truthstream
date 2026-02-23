import React, { useState, useEffect } from 'react';
import { getAllClaims, searchClaims, getClaimsByCategory, getStats } from '../services/api';
import SearchBar from './SearchBar';
import CategoryFilter from './CategoryFilter';
import ClaimCard from './ClaimCard';
import StatsPanel from './StatsPanel';
import '../styles/Dashboard.css'; 

const Dashboard = () => {
  const [claims, setClaims] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchClaims();
  }, [selectedCategory, searchQuery, page]);

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
    <div className="dashboard">
      <header className="dashboard-header">
        <h1 className="dashboard-title">TruthStream</h1>
        <p className="dashboard-subtitle">Real-time Fake News Detection System</p>
      </header>

      <div className="dashboard-content">
        <StatsPanel stats={stats} />

        <SearchBar onSearch={handleSearch} />

        <CategoryFilter
          selectedCategory={selectedCategory}
          onSelectCategory={handleCategorySelect}
        />

        <div className="claims-section">
          <div className="claims-header">
            <h2 className="claims-title">
              {searchQuery
                ? `Search Results for "${searchQuery}"`
                : selectedCategory === 'All'
                ? 'All News Claims'
                : `${selectedCategory} News`}
            </h2>
            <span className="claims-count">
              {claims.length} claims (Page {page} of {totalPages})
            </span>
          </div>

          {loading ? (
            <div className="loading">Loading claims...</div>
          ) : error ? (
            <div className="error">{error}</div>
          ) : claims.length === 0 ? (
            <div className="no-results">No claims found</div>
          ) : (
            <>
              <div className="claims-list">
                {claims.map((claim) => (
                  <ClaimCard key={claim.id} claim={claim} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    onClick={handlePrevPage}
                    disabled={page === 1}
                    className="pagination-btn"
                  >
                    Previous
                  </button>
                  <span className="pagination-info">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={handleNextPage}
                    disabled={page === totalPages}
                    className="pagination-btn"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;