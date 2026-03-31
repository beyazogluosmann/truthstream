/**
 * NewsAPI Scraper
 * Searches BBC, CNN, Reuters, Guardian for claims
 */

const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const NEWS_API_KEY = process.env.NEWS_API_KEY;
const NEWS_API_URL = 'https://newsapi.org/v2/everything';

/**
 * Search NewsAPI for claim
 * @param {string} claimText - Claim to search
 * @returns {Promise<Object>} Search results
 */
async function searchNewsAPI(claimText) {
  console.log('\n[NewsAPI] === API TEST START ===');
  console.log('[NewsAPI] API Key:', NEWS_API_KEY ? `${NEWS_API_KEY.substring(0, 15)}...` : '❌ NOT FOUND');
  
  if (!NEWS_API_KEY) {
    console.log('[NewsAPI]  API key not configured, skipping');
    return { found: false, articles: [], sources: [] };
  }

  try {
    console.log(`[NewsAPI]  Searching for: "${claimText.substring(0, 50)}..."`);
    
    // Extract keywords from claim
    const keywords = extractKeywords(claimText);
    console.log(`[NewsAPI]  Keywords: "${keywords}"`);
    console.log(`[NewsAPI]  Sending request to: ${NEWS_API_URL}`);
    
    // Detect language - Turkish or English
    const isTurkish = /[ğüşıöçĞÜŞİÖÇ]/.test(claimText) || 
                      /\b(türkiye|ankara|istanbul|fenerbahçe|galatasaray|beşiktaş)\b/i.test(claimText);
    
    const language = isTurkish ? 'tr' : 'en';
    console.log(`[NewsAPI]  Detected language: ${language}`);
    console.log(`[NewsAPI]  Params: language=${language}, sortBy=relevancy, pageSize=10`);
    
    const response = await axios.get(NEWS_API_URL, {
      params: {
        q: keywords,
        language: language,
        sortBy: 'relevancy',
        pageSize: 10,
        apiKey: NEWS_API_KEY
      },
      timeout: 5000
    });

    console.log(`[NewsAPI]  Response Status: ${response.status}`);
    console.log(`[NewsAPI]  Total Results Available: ${response.data.totalResults || 0}`);

    const articles = response.data.articles || [];
    
    if (articles.length === 0) {
      console.log('[NewsAPI]   No articles found');
      return { found: false, articles: [], sources: [] };
    }

    const sources = [...new Set(articles.map(a => a.source.name))];
    console.log(`[NewsAPI]  SUCCESS! Found ${articles.length} articles`);
    console.log(`[NewsAPI]  Sources: ${sources.join(', ')}`);
    console.log('[NewsAPI] === API TEST END ===\n');

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
    console.error('[NewsAPI]  ERROR:', error.message);
    if (error.response) {
      console.error('[NewsAPI]  Status Code:', error.response.status);
      console.error('[NewsAPI]  Response:', JSON.stringify(error.response.data).substring(0, 200));
    }
    console.log('[NewsAPI] === API TEST END (FAILED) ===\n');
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
  const stopWords = ['bir', 'bu', 'şu', 'o', 've', 'veya', 'için', 'ile', 'oldu', 'olacak', 'edildi', 'dedi', 'gibi', 'kadar'];
  
  const words = text
    .toLowerCase()
    .replace(/[^\wğüşıöçĞÜŞİÖÇ\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.includes(word));
  
  // Take up to 10 words for better search
  return words.slice(0, 10).join(' ');
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

// Test code - only runs if file is executed directly
if (require.main === module) {
  console.log(' Testing NewsAPI Scraper...\n');
  
  const testClaim = "Fenerbahçe transfer haberi";
  
  searchNewsAPI(testClaim)
    .then(results => {
      console.log('\n TEST RESULTS:');
      console.log(JSON.stringify(results, null, 2));
    })
    .catch(error => {
      console.error('Test failed:', error);
    });
}


