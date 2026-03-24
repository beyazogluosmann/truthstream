/**
 * Multi-AI Verification System
 * Orchestrates multiple AI providers and calculates consensus
 */

const { verifyWithGroq } = require('./providers/groq');
const { verifyWithGemini } = require('./providers/gemini');
const { searchNewsForClaim, formatNewsResultsForAI } = require('./news-search');

// Configuration
const ENABLED_PROVIDERS = ['groq', 'gemini'];
const PROVIDER_WEIGHTS = {
  groq: 0.5,          // 50% - Fastest and most reliable
  gemini: 0.5         // 50%
};
const MIN_SUCCESSFUL_PROVIDERS = 1; // Minimum providers that must succeed
const TIMEOUT_MS = 25000; // 25 seconds timeout per provider

/**
 * Verify claim with multiple AI providers in parallel
 * @param {Object} claim - Claim object with text, category, source
 * @returns {Promise<Object>} Verified claim with consensus analysis
 */
async function verifyClaimWithMultiAI(claim) {
  console.log(`\n🤖 Multi-AI Verification Started`);
  console.log(`   Providers: ${ENABLED_PROVIDERS.join(', ')}`);
  
  const startTime = Date.now();
  
  // Step 1: Search real news sources
  const newsResults = await searchNewsForClaim(claim.text);
  const newsContext = formatNewsResultsForAI(newsResults);
  
  // Step 2: Call all AI providers with news context
  const providerResults = await callAllProviders(claim.text, newsContext);
  
  // Filter successful results
  const successfulResults = providerResults.filter(r => r.success);
  const failedProviders = providerResults.filter(r => !r.success).map(r => r.provider);
  
  console.log(`   ✓ Successful: ${successfulResults.length}/${providerResults.length}`);
  if (failedProviders.length > 0) {
    console.log(`   ✗ Failed: ${failedProviders.join(', ')}`);
  }
  
  // Check if we have enough successful providers
  if (successfulResults.length < MIN_SUCCESSFUL_PROVIDERS) {
    throw new Error(`Insufficient providers responded (${successfulResults.length}/${MIN_SUCCESSFUL_PROVIDERS} minimum)`);
  }
  
  // Calculate consensus
  const consensus = calculateConsensus(successfulResults);
  
  const processingTime = Date.now() - startTime;
  console.log(`   ⏱️  Processing time: ${processingTime}ms`);
  console.log(`   📊 Consensus credibility: ${consensus.credibility}%`);
  
  // Build final verified claim
  return {
    id: claim.id || generateId(),
    text: claim.text,
    category: claim.category || 'general',
    source: claim.source || 'user',
    submitted_at: claim.submitted_at || new Date().toISOString(),
    verified_at: new Date().toISOString(),
    
    // News search results
    news_search: {
      found: newsResults.found,
      total_results: newsResults.total_results,
      sources: newsResults.sources.map(s => s.source),
      message: newsResults.message
    },
    
    // Consensus results
    credibility: consensus.credibility,
    verified: consensus.verified,
    confidence_score: consensus.confidence_score,
    
    // Multi-AI specific data
    ai_consensus: {
      total_providers: providerResults.length,
      successful_providers: successfulResults.length,
      failed_providers: failedProviders,
      processing_time_ms: processingTime,
      agreement_level: consensus.agreement_level,
      reasoning: consensus.reasoning,
      combined_red_flags: consensus.combined_red_flags
    },
    
    // Individual provider results
    provider_results: successfulResults.map(r => ({
      provider: r.provider,
      model: r.model,
      credibility: r.credibility,
      verified: r.verified,
      reasoning: r.reasoning,
      scores: r.scores
    })),
    
    // Legacy fields for backward compatibility
    ai_reasoning: consensus.reasoning,
    red_flags: consensus.combined_red_flags,
    source_found: consensus.source_found || 'Multiple sources analyzed'
  };
}

/**
 * Call all enabled AI providers in parallel
 * @param {string} claimText - Text to verify
 * @param {string} newsContext - News search results context
 * @returns {Promise<Array>} Array of provider results
 */
async function callAllProviders(claimText, newsContext) {
  const providerFunctions = {
    groq: verifyWithGroq,
    gemini: verifyWithGemini
  };
  
  const promises = ENABLED_PROVIDERS.map(async (providerName) => {
    try {
      const providerFn = providerFunctions[providerName];
      if (!providerFn) {
        throw new Error(`Provider ${providerName} not found`);
      }
      
      // Add timeout and pass news context
      const result = await Promise.race([
        providerFn(claimText, newsContext),
        timeoutPromise(TIMEOUT_MS, providerName)
      ]);
      
      return result;
    } catch (error) {
      console.error(`   ✗ ${providerName} failed:`, error.message);
      return {
        provider: providerName,
        success: false,
        error: error.message,
        credibility: 0,
        verified: false
      };
    }
  });
  
  return await Promise.all(promises);
}

/**
 * Calculate consensus from multiple AI results
 * @param {Array} results - Array of successful provider results
 * @returns {Object} Consensus analysis
 */
function calculateConsensus(results) {
  if (results.length === 0) {
    throw new Error('No results to calculate consensus');
  }
  
  // Calculate weighted average credibility
  let weightedCredibility = 0;
  let totalWeight = 0;
  
  results.forEach(result => {
    const weight = PROVIDER_WEIGHTS[result.provider] || 0.33;
    weightedCredibility += result.credibility * weight;
    totalWeight += weight;
  });
  
  const credibility = Math.round(weightedCredibility / totalWeight);
  const verified = credibility >= 60;
  
  // Calculate agreement level
  const credibilityScores = results.map(r => r.credibility);
  const maxDiff = Math.max(...credibilityScores) - Math.min(...credibilityScores);
  const agreement_level = maxDiff <= 15 ? 'high' : maxDiff <= 30 ? 'medium' : 'low';
  
  // Calculate confidence score (based on agreement and number of providers)
  const agreementScore = agreement_level === 'high' ? 100 : agreement_level === 'medium' ? 70 : 40;
  const providerScore = (results.length / ENABLED_PROVIDERS.length) * 100;
  const confidence_score = Math.round((agreementScore * 0.6) + (providerScore * 0.4));
  
  // Combine reasoning
  const reasoning = generateConsensusReasoning(results, agreement_level);
  
  // Combine red flags
  const combined_red_flags = combineRedFlags(results);
  
  return {
    credibility,
    verified,
    confidence_score,
    agreement_level,
    reasoning,
    combined_red_flags,
    individual_scores: credibilityScores
  };
}

/**
 * Generate combined reasoning from all providers
 * @param {Array} results - Provider results
 * @param {string} agreementLevel - Agreement level
 * @returns {string} Combined reasoning
 */
function generateConsensusReasoning(results, agreementLevel) {
  const scores = results.map(r => `${r.provider}: ${r.credibility}%`).join(', ');
  
  let consensusText = `${results.length} AI modeli analiz etti (${scores}). `;
  
  if (agreementLevel === 'high') {
    consensusText += 'Tüm modeller benzer sonuçlara ulaştı. ';
  } else if (agreementLevel === 'medium') {
    consensusText += 'Modeller arasında orta seviye uyum var. ';
  } else {
    consensusText += 'Modeller arasında görüş farklılıkları mevcut. ';
  }
  
  // Add most detailed reasoning
  const mostDetailedReasoning = results
    .filter(r => r.reasoning && r.reasoning.length > 50)
    .sort((a, b) => b.reasoning.length - a.reasoning.length)[0];
  
  if (mostDetailedReasoning) {
    consensusText += mostDetailedReasoning.reasoning;
  }
  
  return consensusText;
}

/**
 * Combine red flags from all providers
 * @param {Array} results - Provider results
 * @returns {Array} Unique red flags
 */
function combineRedFlags(results) {
  const allFlags = results
    .filter(r => r.red_flags && Array.isArray(r.red_flags))
    .flatMap(r => r.red_flags)
    .filter(flag => flag && flag.length > 0);
  
  // Remove duplicates
  return [...new Set(allFlags)];
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
