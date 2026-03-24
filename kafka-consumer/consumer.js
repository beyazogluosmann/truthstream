/**
 * TruthStream Kafka Consumer
 * Processes news claims and verifies them using AI
 */

const { Kafka } = require('kafkajs');
const { checkConnection, saveVerifiedClaim } = require('./elasticsearch');
const { verifyClaimWithMultiAI } = require('./multi-ai-verification');

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
  try {
    const previewText = claim.text.substring(0, 60);
    console.log(`\nProcessing claim: "${previewText}..."`);
    
    // Step 1: Multi-AI Verification
    const verifiedClaim = await verifyClaimWithMultiAI(claim);
    
    // Step 2: Save to Elasticsearch
    const saved = await saveVerifiedClaim(verifiedClaim);
    
    if (saved) {
      updateStats(verifiedClaim);
      logVerificationResult(verifiedClaim);
      
      // Print periodic statistics
      if (stats.processed % STATS_PRINT_INTERVAL === 0) {
        printStats();
      }
    } else {
      console.error('Failed to save claim to database');
      stats.errors++;
    }
    
  } catch (error) {
    console.error('ERROR processing claim:', error.message);
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
    console.log('\n======================================');
    console.log('  TruthStream Kafka Consumer Starting ');
    console.log('======================================\n');
    
    // Check Elasticsearch connection
    const esConnected = await checkConnection();
    if (!esConnected) {
      throw new Error('Cannot connect to Elasticsearch');
    }
    console.log('Elasticsearch: Connected\n');
    
    // Connect to Kafka
    await consumer.connect();
    console.log('Kafka: Connected');
    
    // Subscribe to topic
    await consumer.subscribe({
      topic: KAFKA_TOPIC,
      fromBeginning: false
    });
    console.log(`Subscribed to topic: ${KAFKA_TOPIC}`);
    console.log('\nListening for messages...\n');
    
    // Start consuming messages
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const claim = JSON.parse(message.value.toString());
          await processClaim(claim);
        } catch (error) {
          console.error('ERROR parsing message:', error.message);
          stats.errors++;
        }
      }
    });
    
  } catch (error) {
    console.error('\nFATAL ERROR:', error.message);
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