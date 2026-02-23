const { Client } = require('@elastic/elasticsearch');

// Elasticsearch client
const client = new Client({
  node: 'http://localhost:9200'
});

// Index names
const CATEGORIES_INDEX = 'categories';
const NEWS_CLAIMS_INDEX = 'news-claims';

// Initialize Elasticsearch indices
async function initializeIndices() {
  try {
    // Create categories index if not exists
    const categoriesExists = await client.indices.exists({ index: CATEGORIES_INDEX });
    if (!categoriesExists) {
      await client.indices.create({
        index: CATEGORIES_INDEX,
        body: {
          mappings: {
            properties: {
              name: { type: 'keyword' },
              sources: { type: 'keyword' },
              created_at: { type: 'date' }
            }
          }
        }
      });
      console.log('Categories index created');
    }

    // Create news-claims index if not exists
    const claimsExists = await client.indices.exists({ index: NEWS_CLAIMS_INDEX });
    if (!claimsExists) {
      await client.indices.create({
        index: NEWS_CLAIMS_INDEX,
        body: {
          mappings: {
            properties: {
              id: { type: 'keyword' },
              text: { type: 'text' },
              category: { type: 'keyword' },
              source: { type: 'keyword' },
              verified: { type: 'boolean' },
              credibility: { type: 'integer' },
              timestamp: { type: 'date' },
              processed_at: { type: 'date' }
            }
          }
        }
      });
      console.log('News claims index created');
    }
  } catch (error) {
    console.error('Error initializing indices:', error.message);
  }
}

// Add a category to Elasticsearch
async function addCategory(name, sources) {
  try {
    await client.index({
      index: CATEGORIES_INDEX,
      body: {
        name,
        sources,
        created_at: new Date()
      }
    });
    console.log(`Category added: ${name}`);
  } catch (error) {
    console.error(`Error adding category ${name}:`, error.message);
  }
}

// Get all categories from Elasticsearch
async function getCategories() {
  try {
    const result = await client.search({
      index: CATEGORIES_INDEX,
      body: {
        query: { match_all: {} },
        size: 100
      }
    });
    
    return result.hits.hits.map(hit => hit._source);
  } catch (error) {
    console.error('Error getting categories:', error.message);
    return [];
  }
}

// Initialize default categories (first time setup)
async function initializeCategories() {
  const categories = [
    {
      name: 'Technology',
      sources: ['TechCrunch', 'The Verge', 'Wired', 'Twitter', 'Reddit']
    },
    {
      name: 'Health',
      sources: ['WHO', 'CDC', 'WebMD', 'Facebook', 'Twitter']
    },
    {
      name: 'Politics',
      sources: ['CNN', 'BBC', 'Reuters', 'Twitter', 'Facebook']
    },
    {
      name: 'Science',
      sources: ['Nature', 'Scientific American', 'NASA', 'Twitter', 'Reddit']
    },
    {
      name: 'Business',
      sources: ['Bloomberg', 'Forbes', 'CNBC', 'LinkedIn', 'Twitter']
    },
    {
      name: 'Entertainment',
      sources: ['Variety', 'Hollywood Reporter', 'TMZ', 'Instagram', 'Twitter']
    }
  ];

  for (const category of categories) {
    await addCategory(category.name, category.sources);
  }
  
  console.log('All categories initialized!');
}

module.exports = {
  client,
  initializeIndices,
  addCategory,
  getCategories,
  initializeCategories
};