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
  console.log('\n[TurkishNews] === MOCK SCRAPER START ===');
  console.log(`[TurkishNews] 🔍 Searching Turkish sources: "${claimText.substring(0, 50)}..."`);
  
  const keywords = extractKeywords(claimText);
  console.log(`[TurkishNews] 🔑 Keywords: ${keywords.join(', ')}`);
  console.log('[TurkishNews] ℹ️  Note: This is a MOCK scraper (no real API)');
  const results = [];

  // Simple keyword matching simulation
  // In production, you'd use actual site APIs or RSS feeds
  try {
    // This is a placeholder - in real implementation you'd:
    // 1. Use RSS feeds from these sites
    // 2. Or use their search APIs if available
    // 3. Or use a web scraping service
    
    const mockResults = generateMockResults(keywords, claimText);
    console.log(`[TurkishNews] 🎭 Mock analysis complete`);
    
    if (mockResults.length > 0) {
      console.log(`[TurkishNews] ✅ Found ${mockResults.length} potential matches (MOCK)`);
      console.log(`[TurkishNews] 📰 Mock Sources: ${mockResults.map(r => r.source).join(', ')}`);
      console.log('[TurkishNews] === MOCK SCRAPER END ===\n');
      return {
        found: true,
        total: mockResults.length,
        sources: mockResults.map(r => r.source),
        articles: mockResults
      };
    }

    console.log('[TurkishNews] ⚠️  No matches found (not relevant to Turkish news)');
    console.log('[TurkishNews] === MOCK SCRAPER END ===\n');
    return { found: false, articles: [], sources: [] };

  } catch (error) {
    console.error('[TurkishNews] ❌ ERROR:', error.message);
    console.log('[TurkishNews] === MOCK SCRAPER END (FAILED) ===\n');
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
  const relevanceCheck = checkRelevance(claimText);
  
  if (!relevanceCheck.isRelevant) {
    return [];
  }

  // Spor haberleri için özel kontrol
  const sportTeams = ['fenerbahçe', 'galatasaray', 'beşiktaş', 'trabzonspor'];
  const isSportsNews = sportTeams.some(team => claimText.toLowerCase().includes(team));

  // Ekonomi haberleri için özel kontrol
  const economicKeywords = ['asgari ücret', 'lira', 'tl', 'bedelli', 'enflasyon', 'döviz'];
  const isEconomicNews = economicKeywords.some(keyword => claimText.toLowerCase().includes(keyword));

  const mockArticles = [];

  if (isSportsNews) {
    mockArticles.push({
      title: `Spor haberi: ${keywords.slice(0, 5).join(' ')}`,
      source: 'Hürriyet Spor',
      url: 'https://www.hurriyet.com.tr/spor',
      description: 'Türk spor basınında bu konuda haberler mevcut.',
      confidence: 'high',
      category: 'sports'
    });
    mockArticles.push({
      title: `İlgili transfer/takım haberi`,
      source: 'Fanatik',
      url: 'https://www.fanatik.com.tr',
      description: 'Spor medyasında benzer gelişmeler rapor edildi.',
      confidence: 'high',
      category: 'sports'
    });
  }

  if (isEconomicNews) {
    mockArticles.push({
      title: `Ekonomi haberi: ${keywords.slice(0, 5).join(' ')}`,
      source: 'Hürriyet Ekonomi',
      url: 'https://www.hurriyet.com.tr/ekonomi',
      description: 'Ekonomi basınında bu gelişme takip ediliyor.',
      confidence: 'high',
      category: 'economy'
    });
  }

  if (relevanceCheck.confidence === 'high' && mockArticles.length === 0) {
    mockArticles.push({
      title: `Güncel Türkiye haberi: ${keywords.slice(0, 5).join(' ')}`,
      source: 'TRT Haber',
      url: 'https://www.trthaber.com',
      description: `Türk haber kaynaklarında "${relevanceCheck.matchedIndicators.join(', ')}" ile ilgili içerik mevcut.`,
      confidence: relevanceCheck.confidence,
      category: 'general'
    });
  }

  return mockArticles;
}

/**
 * Check if claim is relevant to Turkish news
 */
function checkRelevance(claimText) {
  const turkishIndicators = [
    // Genel
    'türkiye', 'ankara', 'istanbul', 'cumhurbaşkanı', 'meclis', 'tbmm',
    // Ekonomi
    'asgari', 'ücret', 'lira', 'tl', 'bedelli', 'askerlik', 'bakanlık',
    // Spor takımları
    'fenerbahçe', 'galatasaray', 'beşiktaş', 'trabzonspor', 'başakşehir',
    // Şehirler
    'izmir', 'bursa', 'antalya', 'adana', 'konya'
  ];

  const text = claimText.toLowerCase();
  const matches = turkishIndicators.filter(indicator => text.includes(indicator));

  return {
    isRelevant: matches.length > 0,
    confidence: matches.length > 2 ? 'high' : matches.length > 0 ? 'medium' : 'low',
    matchedIndicators: matches
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
