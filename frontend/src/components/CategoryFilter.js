import React from 'react';

const CATEGORIES = [
  'All',
  'Technology',
  'Health',
  'Politics',
  'Science',
  'Business',
  'Entertainment'
];

const CategoryFilter = ({ selectedCategory, onSelectCategory }) => {
  return (
    <div className="space-y-2">
      <h3 className="text-sm sm:text-base font-semibold text-gray-900">Categories</h3>
      <div className="flex flex-wrap gap-1.5">
        {CATEGORIES.map(category => (
          <button
            key={category}
            onClick={() => onSelectCategory(category)}
            className={`px-2.5 sm:px-3 py-1.5 rounded-md font-medium transition-colors text-xs sm:text-sm ${
              selectedCategory === category
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryFilter;