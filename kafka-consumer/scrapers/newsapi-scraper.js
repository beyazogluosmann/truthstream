/**
 * NewsAPI Scraper
 * Searches BBC, CNN, Reuters, Guardian for claims
 */

const axios = require('axios');
require('dotenv').config();

const NEWS_API_KEY = process.env.NEWS_API_KEY;
const NEWS_API_URL = 'https://newsapi.org/v2/everything';

/**
 * Search NewsAPI for claim
 * @param {string} claimText - Claim to search
 * @returns {Promise<Object>} Search results
 */
async function searchNewsAPI(claimText) {
  if (!NEWS_API_KEY) {
    console.log('[NewsAPI] API key not configured, skipping');
    return { found: false, articles: [], sources: [] };
  }

  try {
    console.log(`[NewsAPI] Searching for: "${claimText.substring(0, 50)}..."`);
    
    // Extract keywords from claim
    const keywords = extractKeywords(claimText);
    
    const response = await axios.get(NEWS_API_URL, {
      params: {
        q: keywords,
        language: 'en',
        sortBy: 'relevancy',
        pageSize: 5,
        apiKey: NEWS_API_KEY
      },
      timeout: 5000
    });

    const articles = response.data.articles || [];
    
    if (articles.length === 0) {
      console.log('[NewsAPI] No articles found');
      return { found: false, articles: [], sources: [] };
    }

    const sources = [...new Set(articles.map(a => a.source.name))];
    console.log(`[NewsAPI] Found ${articles.length} articles from: ${sources.join(', ')}`);

    return {
      found: true,
      total: articles.length,
      sources: sources,
      articles: articles.map(a => ({
        title: a.title,
        source: a.source.name,
        url: a.url,
        publishedAt: a.publishedAt,
        description: a.description
      }))
    };

  } catch (error) {
    console.error('[NewsAPI] Error:', error.message);
    return { found: false, articles: [], sources: [], error: error.message };
  }
}

/**
 * Extract keywords from claim text
 * @param {string} text - Claim text
 * @returns {string} Keywords
 */
function extractKeywords(text) {
  // Remove common Turkish words and extract key terms
  const stopWords = ['bir', 'bu', 'şu', 'o', 've', 'veya', 'için', 'ile', 'oldu', 'olacak', 'edildi'];
  
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.includes(word));
  
  return words.slice(0, 5).join(' ');
}

/**
 * Format results for AI context
 * @param {Object} results - NewsAPI results
 * @returns {string} Formatted context
 */
function formatNewsAPIResults(results) {
  if (!results.found) {
    return 'NewsAPI araması sonuç bulamadı. Bu haber büyük uluslararası kaynaklarda yer almamış olabilir.';
  }

  let context = `NewsAPI Sonuçları: ${results.total} haber bulundu.\n`;
  context += `Kaynaklar: ${results.sources.join(', ')}\n\n`;
  
  results.articles.slice(0, 3).forEach((article, i) => {
    context += `${i + 1}. ${article.source}: "${article.title}"\n`;
    if (article.description) {
      context += `   ${article.description.substring(0, 150)}...\n`;
    }
    context += `   Tarih: ${new Date(article.publishedAt).toLocaleDateString('tr-TR')}\n\n`;
  });

  return context;
}

module.exports = { searchNewsAPI, formatNewsAPIResults };
