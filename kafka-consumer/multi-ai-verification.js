/**
 * AI Verification System with Web Scraping
 * Single AI (Groq) with comprehensive web scraping
 */

const { verifyWithGroq } = require('./providers/groq');
const { runAllScrapers } = require('./scraper-orchestrator');

const TIMEOUT_MS = 25000; // 25 seconds timeout

/**
 * Verify claim with web scraping + AI analysis
 * @param {Object} claim - Claim object with text, category, source
 * @returns {Promise<Object>} Verified claim with analysis
 */
async function verifyClaimWithMultiAI(claim) {
  console.log(`\n[AI-Verification] Starting verification...`);
  console.log(`   Claim: "${claim.text.substring(0, 60)}..."`);
  
  const startTime = Date.now();
  
  try {
    // Step 1: Run web scrapers
    const scraperResults = await runAllScrapers(claim.text);
    
    // Step 2: Call Groq AI with scraper context
    console.log(`[AI-Verification] Analyzing with Groq AI (Llama 3.3 70B)...`);
    
    const aiResult = await Promise.race([
      verifyWithGroq(claim.text, scraperResults.aiContext),
      timeoutPromise(TIMEOUT_MS, 'groq')
    ]);
    
    if (!aiResult.success) {
      throw new Error('AI verification failed');
    }
    
    const processingTime = Date.now() - startTime;
    
    // Log results
    console.log(`   [TIME] Total processing: ${processingTime}ms`);
    console.log(`   [SCORE] Credibility: ${aiResult.credibility}%`);
    console.log(`   [STATUS] ${aiResult.verified ? '✅ VERIFIED' : '❌ UNVERIFIED'}`);
    
    // Build final verified claim
    return {
      id: claim.id || generateId(),
      text: claim.text,
      category: claim.category || 'general',
      source: claim.source || 'user',
      submitted_at: claim.submitted_at || new Date().toISOString(),
      verified_at: new Date().toISOString(),
      
      // AI results
      credibility: aiResult.credibility,
      verified: aiResult.verified,
      ai_reasoning: aiResult.reasoning,
      source_found: aiResult.source_found,
      red_flags: aiResult.red_flags || [],
      
      // Web scraping results
      web_sources: {
        found: scraperResults.combined.foundAnywhere,
        total_sources: scraperResults.combined.totalSources,
        sources: scraperResults.combined.sources,
        breakdown: scraperResults.combined.breakdown,
        scraping_time_ms: scraperResults.processingTime
      },
      
      // Metadata
      processing_time_ms: processingTime,
      ai_model: aiResult.model,
      ai_provider: 'groq',
      scores: aiResult.scores || {}
    };
    
  } catch (error) {
    console.error('[AI-Verification] ❌ ERROR:', error.message);
    throw error;
  }
}

/**
 * Create a timeout promise
 * @param {number} ms - Milliseconds
 * @param {string} providerName - Provider name
 * @returns {Promise}
 */
function timeoutPromise(ms, providerName) {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`${providerName} timeout after ${ms}ms`)), ms)
  );
}

/**
 * Generate unique ID for claim
 * @returns {string} Unique ID
 */
function generateId() {
  return `claim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

module.exports = { verifyClaimWithMultiAI };
