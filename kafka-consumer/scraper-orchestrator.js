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
  let context = '\n=== WEB SCRAPING RESULTS ===\n\n';

  // NewsAPI Results
  if (newsAPI.found && newsAPI.articles?.length > 0) {
    context += `📰 NewsAPI Results:\n`;
    context += `Found ${newsAPI.total} articles from: ${newsAPI.sources.join(', ')}\n\n`;
    newsAPI.articles.slice(0, 3).forEach((article, idx) => {
      context += `${idx + 1}. "${article.title}"\n`;
      context += `   Source: ${article.source}\n`;
      context += `   Published: ${article.publishedAt}\n`;
      context += `   URL: ${article.url}\n\n`;
    });
  } else {
    context += `📰 NewsAPI Results: No articles found\n\n`;
  }

  // Google Fact Check Results
  if (factCheck.found && factCheck.claims?.length > 0) {
    context += `✅ Google Fact Check Results:\n`;
    context += `Found ${factCheck.total} fact-checks\n\n`;
    factCheck.claims.slice(0, 3).forEach((claim, idx) => {
      context += `${idx + 1}. Claim: "${claim.text}"\n`;
      context += `   Rating: ${claim.rating}\n`;
      context += `   Publisher: ${claim.publisher}\n`;
      context += `   URL: ${claim.url}\n\n`;
    });
  } else {
    context += `✅ Google Fact Check Results: No fact-checks found\n\n`;
  }

  // Turkish News RSS Results
  if (turkishNews.found && turkishNews.articles?.length > 0) {
    context += `🇹🇷 Turkish News RSS Results:\n`;
    context += `Found ${turkishNews.total} articles from: ${turkishNews.sources.join(', ')}\n\n`;
    turkishNews.articles.slice(0, 3).forEach((article, idx) => {
      context += `${idx + 1}. "${article.title}"\n`;
      context += `   Source: ${article.source}\n`;
      context += `   URL: ${article.url}\n\n`;
    });
  } else {
    context += `🇹🇷 Turkish News RSS Results: No articles found\n\n`;
  }

  context += `=== END OF SCRAPING RESULTS ===\n`;

  // ⚠️ DEBUG: Log context to verify it's being generated
  console.log('\n[Scraper] Generated Context for AI:');
  console.log(context.substring(0, 500) + '...');

  return context;
}

module.exports = { runAllScrapers };
