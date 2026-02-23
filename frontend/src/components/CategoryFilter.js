import React from 'react';
import '../styles/CategoryFilter.css';

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
    <div className="category-filter">
      <h3 className="category-title">Categories</h3>
      <div className="category-buttons">
        {CATEGORIES.map(category => (
          <button
            key={category}
            onClick={() => onSelectCategory(category)}
            className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryFilter;