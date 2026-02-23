import React, { useState } from 'react';

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
    <div className="w-full">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search news claims..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-sm"
        />
        <button 
          type="submit" 
          className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-md transition-colors text-sm whitespace-nowrap"
        >
          Search
        </button>
        {query && (
          <button 
            type="button" 
            onClick={handleClear} 
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-md transition-colors text-sm whitespace-nowrap"
          >
            Clear
          </button>
        )}
      </form>
    </div>
  );
};

export default SearchBar;