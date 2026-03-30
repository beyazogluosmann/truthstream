/**
 * Scraper Orchestrator
 * Coordinates all web scrapers and combines results
 */

const { searchNewsAPI, formatNewsAPIResults } = require('./scrapers/newsapi-scraper');
const { searchFactCheck, formatFactCheckResults } = require('./scrapers/google-factcheck');
const { searchTurkishNews, formatTurkishNewsResults } = require('./scrapers/turkish-news-scraper');

/**
 * Run all scrapers in parallel
 * @param {string} claimText - Claim to verify
 * @returns {Promise<Object>} Combined scraper results
 */
async function runAllScrapers(claimText) {
  console.log('\n[Scraper] Starting web scraping...');
  const startTime = Date.now();

  try {
    // Run all scrapers in parallel
    const [newsAPIResults, factCheckResults, turkishNewsResults] = await Promise.allSettled([
      searchNewsAPI(claimText),
      searchFactCheck(claimText),
      searchTurkishNews(claimText)
    ]);

    // Extract results
    const newsAPI = newsAPIResults.status === 'fulfilled' ? newsAPIResults.value : { found: false };
    const factCheck = factCheckResults.status === 'fulfilled' ? factCheckResults.value : { found: false };
    const turkishNews = turkishNewsResults.status === 'fulfilled' ? turkishNewsResults.value : { found: false };

    const processingTime = Date.now() - startTime;
    console.log(`[Scraper] Completed in ${processingTime}ms`);

    // Combine results
    const combined = combineScraperResults(newsAPI, factCheck, turkishNews);
    
    // Generate context for AI
    const aiContext = generateAIContext(newsAPI, factCheck, turkishNews);

    return {
      newsAPI,
      factCheck,
      turkishNews,
      combined,
      aiContext,
      processingTime
    };

  } catch (error) {
    console.error('[Scraper] Error:', error);
    return {
      newsAPI: { found: false },
      factCheck: { found: false },
      turkishNews: { found: false },
      combined: { foundAnywhere: false, totalSources: 0 },
      aiContext: 'Web araması sırasında hata oluştu.',
      processingTime: Date.now() - startTime,
      error: error.message
    };
  }
}

/**
 * Combine all scraper results
 */
function combineScraperResults(newsAPI, factCheck, turkishNews) {
  const allSources = [
    ...(newsAPI.sources || []),
    ...(factCheck.claims || []).map(c => c.publisher).filter(Boolean),
    ...(turkishNews.sources || [])
  ];

  const uniqueSources = [...new Set(allSources)];
  const foundAnywhere = newsAPI.found || factCheck.found || turkishNews.found;

  const totalArticles = 
    (newsAPI.articles?.length || 0) + 
    (factCheck.claims?.length || 0) + 
    (turkishNews.articles?.length || 0);

  return {
    foundAnywhere,
    totalSources: uniqueSources.length,
    sources: uniqueSources,
    totalArticles,
    breakdown: {
      newsAPI: newsAPI.found,
      factCheck: factCheck.found,
      turkishNews: turkishNews.found
    }
  };
}

/**
 * Generate AI context from all scraper results
 */
function generateAIContext(newsAPI, factCheck, turkishNews) {
  let context = '=== WEB SCRAPING SONUÇLARI ===\n\n';

  // NewsAPI results
  context += '1. ULUSLARARASI HABER KAYNAKLARI (BBC, Reuters, CNN):\n';
  context += formatNewsAPIResults(newsAPI) + '\n';

  // Google Fact Check results
  context += '2. GOOGLE FACT CHECK VERİTABANI:\n';
  context += formatFactCheckResults(factCheck) + '\n';

  // Turkish news results
  context += '3. TÜRK HABER KAYNAKLARI (TRT, CNN Türk, Hürriyet, Sözcü):\n';
  context += formatTurkishNewsResults(turkishNews) + '\n';

  context += '=== SCRAPING TAMAMLANDI ===\n';
  context += 'Yukarıdaki kaynaklarda bulunan bilgileri değerlendirerek haberin doğruluğunu analiz et.\n';

  return context;
}

module.exports = { runAllScrapers };
