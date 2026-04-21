/**
 * Turkish News Sources Scraper
 * Searches Turkish news sites via RSS feeds: TRT, Sözcü, Cumhuriyet, Habertürk
 */

const Parser = require('rss-parser');
const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  }
});

// Turkish news RSS feeds
const RSS_FEEDS = {
  'TRT Haber': 'https://www.trthaber.com/xml_mobile.rss',
  'Sözcü': 'https://www.sozcu.com.tr/feed/',
  'Cumhuriyet': 'https://www.cumhuriyet.com.tr/rss',
  'Habertürk': 'https://www.haberturk.com/rss'
};

/**
 * Search Turkish news sources via RSS
 * @param {string} claimText - Claim to search
 * @returns {Promise<Object>} Search results
 */
async function searchTurkishNews(claimText) {
  console.log('\n[TurkishNews] === RSS SCRAPER START ===');
  console.log(`[TurkishNews] 🔍 Searching Turkish RSS feeds: "${claimText.substring(0, 50)}..."`);
  
  const keywords = extractKeywords(claimText);
  console.log(`[TurkishNews] 🔑 Keywords: ${keywords.join(', ')}`);
  
  const results = [];

  try {
    // Search each RSS feed in parallel
    const feedPromises = Object.entries(RSS_FEEDS).map(async ([source, url]) => {
      try {
        console.log(`[TurkishNews] 📡 Fetching ${source}...`);
        const feed = await parser.parseURL(url);
        
        // Search in recent articles (last 50)
        const matches = feed.items.slice(0, 50).filter(item => {
          const title = item.title?.toLowerCase() || '';
          const desc = (item.contentSnippet || item.content || '').toLowerCase();
          const content = title + ' ' + desc;
          
          // Check if at least 2 keywords match
          const matchCount = keywords.filter(keyword => 
            content.includes(keyword.toLowerCase())
          ).length;
          
          return matchCount >= Math.min(2, keywords.length);
        });
        
        if (matches.length > 0) {
          console.log(`[TurkishNews] ✅ Found ${matches.length} matches in ${source}`);
          
          return matches.slice(0, 3).map(match => ({
            title: match.title,
            source: source,
            url: match.link,
            description: (match.contentSnippet || match.content || '').substring(0, 200),
            publishedAt: match.pubDate || match.isoDate,
            confidence: 'high'
          }));
        }
        
        return [];
      } catch (err) {
        console.log(`[TurkishNews] ⚠️  ${source} failed: ${err.message}`);
        return [];
      }
    });
    
    // Wait for all feeds to be processed
    const allResults = await Promise.all(feedPromises);
    const flatResults = allResults.flat();
    
    if (flatResults.length > 0) {
      const uniqueSources = [...new Set(flatResults.map(r => r.source))];
      console.log(`[TurkishNews] ✅ Total: ${flatResults.length} articles found`);
      console.log(`[TurkishNews] 📰 Sources: ${uniqueSources.join(', ')}`);
      console.log('[TurkishNews] === RSS SCRAPER END ===\n');
      
      return {
        found: true,
        total: flatResults.length,
        sources: uniqueSources,
        articles: flatResults.slice(0, 5) // Return top 5
      };
    }

    console.log('[TurkishNews] ⚠️  No matches in RSS feeds');
    console.log('[TurkishNews] === RSS SCRAPER END ===\n');
    return { found: false, articles: [], sources: [] };

  } catch (error) {
    console.error('[TurkishNews] ❌ ERROR:', error.message);
    console.log('[TurkishNews] === RSS SCRAPER END (FAILED) ===\n');
    return { found: false, articles: [], sources: [], error: error.message };
  }
}

/**
 * Extract Turkish keywords
 * @param {string} text - Claim text
 * @returns {Array} Keywords
 */
function extractKeywords(text) {
  const stopWords = ['bir', 'bu', 'şu', 'o', 've', 'veya', 'için', 'ile', 'oldu', 'olacak', 'edildi', 'dedi', 'gibi', 'daha', 'çok', 'tüm'];
  
  return text
    .toLowerCase()
    .replace(/[^\wğüşıöçĞÜŞİÖÇ\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.includes(word))
    .slice(0, 10); // Limit to 10 keywords
}

/**
 * Format Turkish news results for AI
 * @param {Object} results - Search results
 * @returns {string} Formatted context
 */
function formatTurkishNewsResults(results) {
  if (!results.found) {
    return 'Türk haber kaynaklarının RSS feed\'lerinde (TRT, Sözcü, Cumhuriyet, Habertürk) bu iddia ile ilgili güncel kayıt bulunamadı.';
  }

  let context = `Türk Haber Kaynakları (RSS): ${results.total} sonuç bulundu.\n`;
  context += `Kaynaklar: ${results.sources.join(', ')}\n\n`;
  
  results.articles.forEach((article, i) => {
    context += `${i + 1}. ${article.source}: "${article.title}"\n`;
    if (article.description) {
      context += `   ${article.description}\n`;
    }
    if (article.publishedAt) {
      context += `   Tarih: ${article.publishedAt}\n`;
    }
    context += `   Link: ${article.url}\n\n`;
  });

  return context;
}

module.exports = { searchTurkishNews, formatTurkishNewsResults };

// Test code - only runs if file is executed directly
if (require.main === module) {
  console.log(' Testing Turkish News Scraper...\n');
  
  const testClaims = [
    "Gaziantep'e füze düştü",
    "Asgari ücret artışı",
    "Fenerbahçe transfer haberi"
  ];
  
  async function runTests() {
    for (const claim of testClaims) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Testing: "${claim}"`);
      console.log('='.repeat(60));
      
      const results = await searchTurkishNews(claim);
      console.log('\n📊 RESULTS:');
      console.log(JSON.stringify(results, null, 2));
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  runTests().catch(error => console.error('Test failed:', error));
}
