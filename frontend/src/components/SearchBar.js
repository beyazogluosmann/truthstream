import React, { useState } from 'react';
import '../styles/SearchBar.css';

const SearchBar = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
    }
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <div className="search-bar">
      <form onSubmit={handleSubmit} className="search-form">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search news claims..."
          className="search-input"
        />
        <button type="submit" className="search-btn">
          Search
        </button>
        {query && (
          <button type="button" onClick={handleClear} className="clear-btn">
            Clear
          </button>
        )}
      </form>
    </div>
  );
};

export default SearchBar;