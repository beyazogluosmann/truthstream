/**
 * TruthStream Kafka Consumer
 * Processes news claims and verifies them using AI
 * 
 * Pipeline:
 * 1. LLM Analysis (İddia çıkarımı)
 * 2. Google Fact Check API
 * 3. News API Search
 * 4. Score Calculation (0-100)
 * 5. Save to Elasticsearch
 */

require('dotenv').config();
const { Kafka } = require('kafkajs');
const { checkConnection, saveVerifiedClaim } = require('./elasticsearch');
const llmProcessor = require('./processors/llm-processor');
const factChecker = require('./processors/fact-checker');
const newsSearcher = require('./processors/news-searcher');
const scorer = require('./utils/scorer');

// Constants
const KAFKA_CLIENT_ID = 'truthstream-consumer';
const KAFKA_BROKERS = ['localhost:9092'];
const KAFKA_GROUP_ID = 'news-verification-group';
const KAFKA_TOPIC = 'news-claims';
const STATS_PRINT_INTERVAL = 10; // Print stats every N claims

// Initialize Kafka
const kafka = new Kafka({
  clientId: KAFKA_CLIENT_ID,
  brokers: KAFKA_BROKERS
});

const consumer = kafka.consumer({
  groupId: KAFKA_GROUP_ID
});

// Statistics tracker
const stats = {
  processed: 0,
  verified: 0,
  unverified: 0,
  errors: 0,
  startTime: new Date()
};

/**
 * Logs verification result to console
 * @param {Object} verifiedClaim - Verified claim object
 */
function logVerificationResult(verifiedClaim) {
  const status = verifiedClaim.verified ? 'VERIFIED' : 'UNVERIFIED';
  console.log(`${status} - Credibility: ${verifiedClaim.credibility}%`);
  console.log(`AI Reasoning: ${verifiedClaim.ai_reasoning}`);
  
  if (verifiedClaim.red_flags && verifiedClaim.red_flags.length > 0) {
    console.log(`Red Flags: ${verifiedClaim.red_flags.join(', ')}`);
  }
  console.log('');
}

/**
 * Updates statistics based on verification result
 * @param {Object} verifiedClaim - Verified claim object
 */
function updateStats(verifiedClaim) {
  stats.processed++;
  
  if (verifiedClaim.verified) {
    stats.verified++;
  } else {
    stats.unverified++;
  }
}


/**
 * Processes a single claim through AI verification and storage
 * @param {Object} claim - Raw claim object from Kafka
 */
async function processClaim(claim) {
  const startTime = Date.now();
  
  try {
    console.log(`\n${'='.repeat(70)}`);
    console.log(` NEW CLAIM: "${claim.text.substring(0, 55)}..."`);
    console.log(` Source: ${claim.url || 'N/A'}`);
    console.log(`${'='.repeat(70)}`);
    
    // Step 1: LLM Analysis (İddia çıkarımı)
    console.log('\n Step 1/4: LLM Analysis...');
    const llmAnalysis = await llmProcessor.analyzeContent(claim.text, claim.url);
    console.log(`    Iddiar: ${llmAnalysis.mainClaims.length} adet`);
    console.log(`    Kategori: ${llmAnalysis.category}`);
    console.log(`    Güven: ${llmAnalysis.confidence}`);
    
    // Step 2: Google Fact Check
    console.log('\n Step 2/4: Google Fact Check...');
    const mainClaim = llmAnalysis.mainClaims[0] || claim.text;
    const factCheckResults = await factChecker.checkClaim(mainClaim);
    const factCheckSummary = factChecker.summarizeResults(factCheckResults);
    console.log(`    Sonuç: ${factCheckSummary.count} fact-check bulundu`);
    if (factCheckSummary.found) {
      console.log(`    Karar: ${factCheckSummary.verdict}`);
    }
    
    // Step 3: News API Search
    console.log('\n Step 3/4: News API Search...');
    const newsResults = await newsSearcher.searchNews(mainClaim);
    const newsSummary = newsSearcher.summarizeResults(newsResults);
    console.log(`    Sonuç: ${newsSummary.count} haber bulundu`);
    console.log(`    Güvenilir kaynak: ${newsSummary.credibleSources} adet`);
    
    // Step 4: Score Calculation
    console.log('\n🎯 Step 4/4: Score Calculation...');
    const scoreResult = scorer.calculateFinalScore({
      factCheckResults: factCheckResults,
      newsApiResults: newsResults,
      llmAnalysis: llmAnalysis,
      sourceUrl: claim.url,
      claimText: claim.text
    });
    
    console.log(`    Final Score: ${scoreResult.finalScore}/100`);
    console.log(`    Verdict: ${scoreResult.verdict.tr} ${scoreResult.verdict.emoji}`);
    console.log(`    Confidence: ${scoreResult.confidence}`);
    
    // Prepare verified claim object
    const processingTime = Date.now() - startTime;
    const verifiedClaim = {
      // Original claim data
      text: claim.text,
      url: claim.url,
      source: claim.source,
      timestamp: claim.timestamp || new Date().toISOString(),
      
      // LLM Analysis
      main_claims: llmAnalysis.mainClaims,
      entities: llmAnalysis.entities,
      category: llmAnalysis.category,
      key_points: llmAnalysis.keyPoints,
      
      // Fact Check Results
      fact_check: {
        found: factCheckSummary.found,
        count: factCheckSummary.count,
        verdict: factCheckSummary.verdict,
        confidence: factCheckSummary.confidence,
        sources: factCheckSummary.sources,
        best_match: factCheckSummary.bestMatch
      },
      
      // News API Results
      news_search: {
        found: newsSummary.found,
        count: newsSummary.count,
        credible_sources: newsSummary.credibleSources,
        credibility_ratio: newsSummary.credibilityRatio,
        top_articles: newsSummary.topArticles
      },
      
      // Final Score
      score: scoreResult.finalScore,
      score_breakdown: scoreResult.breakdown,
      verdict: scoreResult.verdict,
      confidence: scoreResult.confidence,
      reasoning: scoreResult.reasoning,
      
      // Meta
      verified: scoreResult.finalScore >= 60, // 60+ = verified
      processing_time_ms: processingTime,
      processor_version: '2.0',
      created_at: new Date().toISOString()
    };
    
    // Step 5: Save to Elasticsearch
    console.log('\n Saving to Elasticsearch...');
    const saved = await saveVerifiedClaim(verifiedClaim);
    
    if (saved) {
      console.log(' Successfully saved to database');
      updateStats(verifiedClaim);
      
      // Log summary
      console.log(`\n${'='.repeat(70)}`);
      console.log(` VERIFICATION SUMMARY:`);
      console.log(`   Status: ${verifiedClaim.verified ? ' VERIFIED' : ' UNVERIFIED'}`);
      console.log(`   Score: ${verifiedClaim.score}/100 ${scoreResult.verdict.emoji}`);
      console.log(`   Verdict: ${scoreResult.verdict.tr}`);
      console.log(`   Breakdown:`);
      console.log(`      - Fact Check: ${scoreResult.breakdown.factCheck}/40`);
      console.log(`      - News API: ${scoreResult.breakdown.newsApi}/30`);
      console.log(`      - LLM: ${scoreResult.breakdown.llm}/20`);
      console.log(`      - Source: ${scoreResult.breakdown.source}/10`);
      console.log(`   Processing Time: ${processingTime}ms`);
      console.log(`${'='.repeat(70)}\n`);
      
      // Print periodic statistics
      if (stats.processed % STATS_PRINT_INTERVAL === 0) {
        printStats();
      }
    } else {
      console.error('Failed to save claim to database');
      stats.errors++;
    }
    
  } catch (error) {
    console.error(' ERROR processing claim:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    stats.errors++;
  }
}

/**
 * Calculates and prints consumer statistics
 */
function printStats() {
  const runtime = Math.floor((new Date() - stats.startTime) / 1000);
  const rate = runtime > 0 ? (stats.processed / runtime).toFixed(2) : 0;
  const verifiedPct = stats.processed > 0 
    ? ((stats.verified / stats.processed) * 100).toFixed(1) 
    : 0;
  const unverifiedPct = stats.processed > 0 
    ? ((stats.unverified / stats.processed) * 100).toFixed(1) 
    : 0;
  
  console.log('\n======================================');
  console.log('       CONSUMER STATISTICS            ');
  console.log('======================================');
  console.log(`Total Processed: ${stats.processed}`);
  console.log(`Verified: ${stats.verified} (${verifiedPct}%)`);
  console.log(`Unverified: ${stats.unverified} (${unverifiedPct}%)`);
  console.log(`Errors: ${stats.errors}`);
  console.log(`Runtime: ${runtime}s`);
  console.log(`Rate: ${rate} claims/sec`);
  console.log('======================================\n');
}

/**
 * Starts the Kafka consumer and begins processing messages
 */
async function startConsumer() {
  try {
    console.log('\n' + '='.repeat(70));
    console.log(' TruthStream AI Fact-Checking System Starting...');
    console.log('='.repeat(70) + '\n');
    
    // Check Elasticsearch connection
    console.log('🔌 Connecting to Elasticsearch...');
    const esConnected = await checkConnection();
    if (!esConnected) {
      throw new Error('Cannot connect to Elasticsearch');
    }
    console.log(' Elasticsearch: Connected\n');
    
    // Connect to Kafka
    console.log('🔌 Connecting to Kafka...');
    await consumer.connect();
    console.log(' Kafka: Connected\n');
    
    // Subscribe to topic
    console.log(`Subscribing to topic: ${KAFKA_TOPIC}...`);
    await consumer.subscribe({
      topic: KAFKA_TOPIC,
      fromBeginning: false
    });
    console.log('Subscribed successfully\n');
    
    console.log('='.repeat(70));
    console.log(' System Ready! Waiting for claims...');
    console.log('   - Pipeline: LLM → Fact Check → News API → Scoring');
    console.log('   - LLM: Groq (Llama 3.3 70B) / Gemini / Anthropic');
    console.log('   - Fact Check: Google Fact Check API');
    console.log('   - News: NewsAPI.org');
    console.log('   - Storage: Elasticsearch');
    console.log('='.repeat(70) + '\n');
    
    // Start consuming messages
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const claim = JSON.parse(message.value.toString());
          await processClaim(claim);
        } catch (error) {
          console.error(' ERROR parsing message:', error.message);
          stats.errors++;
        }
      }
    });
    
  } catch (error) {
    console.error('\n FATAL ERROR:', error.message);
    console.error('Consumer cannot start. Exiting...\n');
    process.exit(1);
  }
}

/**
 * Gracefully shuts down the consumer
 */
async function shutdown() {
  console.log('\n\nShutting down consumer...');
  printStats();
  
  try {
    await consumer.disconnect();
    console.log('Consumer disconnected');
    console.log('Goodbye!\n');
    process.exit(0);
  } catch (error) {
    console.error('ERROR during shutdown:', error.message);
    process.exit(1);
  }
}

// Handle shutdown signals
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start consumer
startConsumer();