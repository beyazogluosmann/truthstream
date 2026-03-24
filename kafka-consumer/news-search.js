/**
 * News Search Service
 * Searches real news sources via NewsAPI to verify claims
 */

const axios = require('axios');
require('dotenv').config();

const NEWS_API_KEY = process.env.NEWS_API;
const NEWS_API_URL = 'https://newsapi.org/v2/everything';

/**
 * Search for claim in real news sources
 * @param {string} claimText - Claim to search for
 * @returns {Promise<Object>} Search results with sources
 */
async function searchNewsForClaim(claimText) {
  if (!NEWS_API_KEY) {
    console.warn('⚠️  NEWS_API key not configured, skipping news search');
    return {
      found: false,
      sources: [],
      total_results: 0,
      message: 'News API not configured'
    };
  }

  try {
    // Extract keywords from claim (first 100 chars, remove special chars)
    const keywords = claimText
      .substring(0, 100)
      .replace(/[^\wşğüöçİŞĞÜÖÇ\s]/g, ' ')
      .trim();

    console.log(`   🔍 Searching NewsAPI for: "${keywords.substring(0, 50)}..."`);

    const response = await axios.get(NEWS_API_URL, {
      params: {
        q: keywords,
        language: 'tr', // Turkish news
        sortBy: 'publishedAt',
        pageSize: 5,
        apiKey: NEWS_API_KEY
      },
      timeout: 5000
    });

    const articles = response.data.articles || [];
    const totalResults = response.data.totalResults || 0;

    if (totalResults > 0) {
      const sources = articles.map(article => ({
        title: article.title,
        source: article.source.name,
        url: article.url,
        published_at: article.publishedAt,
        description: article.description
      }));

      console.log(`   ✓ Found ${totalResults} related articles`);
      console.log(`   📰 Sources: ${sources.map(s => s.source).join(', ')}`);

      return {
        found: true,
        sources: sources,
        total_results: totalResults,
        message: `Found in ${sources.length} news sources`
      };
    } else {
      console.log(`   ✗ No articles found in NewsAPI`);
      return {
        found: false,
        sources: [],
        total_results: 0,
        message: 'No articles found in major news sources'
      };
    }

  } catch (error) {
    console.error('   ✗ NewsAPI Error:', error.message);
    return {
      found: false,
      sources: [],
      total_results: 0,
      error: error.message,
      message: 'Error searching news sources'
    };
  }
}

/**
 * Format news search results for AI prompt
 * @param {Object} newsResults - Results from searchNewsForClaim
 * @returns {string} Formatted text for AI
 */
function formatNewsResultsForAI(newsResults) {
  if (!newsResults.found || newsResults.sources.length === 0) {
    return `
HABER KAYNAK ARAŞTIRMASI:
- Bu haber NewsAPI'de (BBC, CNN, Reuters, Guardian vb.) BULUNAMADI
- Büyük haber ajanslarında bu konuda yayın yok
- Bu, haberin doğrulanmamış veya çok güncel olduğu anlamına gelebilir
`;
  }

  const sourceList = newsResults.sources
    .slice(0, 3)
    .map(s => `  • ${s.source}: "${s.title.substring(0, 80)}..."`)
    .join('\n');

  return `
HABER KAYNAK ARAŞTIRMASI:
- Bu konuda ${newsResults.total_results} haber bulundu
- Bulunduğu kaynaklar:
${sourceList}
- Bu haber GERÇEK kaynaklarda mevcut, doğrulanmış olabilir
`;
}

module.exports = {
  searchNewsForClaim,
  formatNewsResultsForAI
};
