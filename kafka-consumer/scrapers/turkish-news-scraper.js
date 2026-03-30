/**
 * Turkish News Sources Scraper
 * Searches Turkish news sites: TRT, CNN Türk, Hürriyet, Sözcü
 */

const axios = require('axios');

const TURKISH_SOURCES = {
  trt: 'https://www.trthaber.com',
  cnnturk: 'https://www.cnnturk.com',
  hurriyet: 'https://www.hurriyet.com.tr',
  sozcu: 'https://www.sozcu.com.tr'
};

/**
 * Search Turkish news sources
 * @param {string} claimText - Claim to search
 * @returns {Promise<Object>} Search results
 */
async function searchTurkishNews(claimText) {
  console.log(`[TurkishNews] Searching Turkish sources: "${claimText.substring(0, 50)}..."`);
  
  const keywords = extractKeywords(claimText);
  const results = [];

  // Simple keyword matching simulation
  // In production, you'd use actual site APIs or RSS feeds
  try {
    // This is a placeholder - in real implementation you'd:
    // 1. Use RSS feeds from these sites
    // 2. Or use their search APIs if available
    // 3. Or use a web scraping service
    
    const mockResults = generateMockResults(keywords, claimText);
    
    if (mockResults.length > 0) {
      console.log(`[TurkishNews] Found ${mockResults.length} potential matches`);
      return {
        found: true,
        total: mockResults.length,
        sources: mockResults.map(r => r.source),
        articles: mockResults
      };
    }

    console.log('[TurkishNews] No matches found');
    return { found: false, articles: [], sources: [] };

  } catch (error) {
    console.error('[TurkishNews] Error:', error.message);
    return { found: false, articles: [], sources: [], error: error.message };
  }
}

/**
 * Extract Turkish keywords
 * @param {string} text - Claim text
 * @returns {Array} Keywords
 */
function extractKeywords(text) {
  const stopWords = ['bir', 'bu', 'şu', 'o', 've', 'veya', 'için', 'ile', 'oldu', 'olacak', 'edildi', 'dedi'];
  
  return text
    .toLowerCase()
    .replace(/[^\wğüşıöçĞÜŞİÖÇ\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.includes(word));
}

/**
 * Generate mock results based on keywords
 * In production, replace with actual API calls or RSS parsing
 */
function generateMockResults(keywords, claimText) {
  // This is a placeholder
  // Real implementation would fetch from actual sources
  
  const relevanceCheck = checkRelevance(claimText);
  
  if (!relevanceCheck.isRelevant) {
    return [];
  }

  return [
    {
      title: `İlgili haber: ${keywords.slice(0, 3).join(' ')}`,
      source: 'TRT Haber',
      url: '#',
      description: 'Türk haber kaynaklarında benzer içerik tespit edildi.',
      confidence: relevanceCheck.confidence
    }
  ];
}

/**
 * Check if claim is relevant to Turkish news
 */
function checkRelevance(claimText) {
  const turkishIndicators = [
    'türkiye', 'ankara', 'istanbul', 'cumhurbaşkanı', 'meclis', 'tbmm',
    'asgari', 'ücret', 'lira', 'tl', 'bedelli', 'askerlik', 'bakanlık'
  ];

  const text = claimText.toLowerCase();
  const matches = turkishIndicators.filter(indicator => text.includes(indicator));

  return {
    isRelevant: matches.length > 0,
    confidence: matches.length > 2 ? 'high' : matches.length > 0 ? 'medium' : 'low'
  };
}

/**
 * Format Turkish news results for AI
 * @param {Object} results - Search results
 * @returns {string} Formatted context
 */
function formatTurkishNewsResults(results) {
  if (!results.found) {
    return 'Türk haber kaynaklarında (TRT, CNN Türk, Hürriyet, Sözcü) bu iddia ile ilgili açık kayıt bulunamadı.';
  }

  let context = `Türk Haber Kaynakları: ${results.total} sonuç bulundu.\n`;
  context += `Kaynaklar: ${[...new Set(results.sources)].join(', ')}\n\n`;
  
  results.articles.forEach((article, i) => {
    context += `${i + 1}. ${article.source}: "${article.title}"\n`;
    if (article.description) {
      context += `   ${article.description}\n`;
    }
    context += '\n';
  });

  return context;
}

module.exports = { searchTurkishNews, formatTurkishNewsResults };
