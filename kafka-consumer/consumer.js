const { Kafka } = require('kafkajs');
const { checkConnection, saveVerifiedClaim } = require('./elasticsearch');
const { verifyClaim, getCredibilityRating } = require('./verification');

const kafka = new Kafka({
  clientId: 'truthstream-consumer',
  brokers: ['localhost:9092']
});

const consumer = kafka.consumer({
  groupId: 'news-verification-group'
});

let stats = {
  processed: 0,
  verified: 0,
  unverified: 0,
  errors: 0,
  startTime: new Date()
};

async function processClaim(claim) {
  try {
    const verifiedClaim = verifyClaim(claim);
    const saved = await saveVerifiedClaim(verifiedClaim);
    
    if (saved) {
      stats.processed++;
      if (verifiedClaim.verified) {
        stats.verified++;
      } else {
        stats.unverified++;
      }
    } else {
      stats.errors++;
    }
    
    if (stats.processed % 10 === 0) {
      printStats();
    }
  } catch (error) {
    console.error('ERROR processing claim:', error.message);
    stats.errors++;
  }
}

function printStats() {
  const runtime = Math.floor((new Date() - stats.startTime) / 1000);
  const rate = runtime > 0 ? (stats.processed / runtime).toFixed(2) : 0;
  
  console.log('\n=================================');
  console.log('CONSUMER STATISTICS');
  console.log('=================================');
  console.log(`Total Processed: ${stats.processed}`);
  console.log(`Verified: ${stats.verified} (${((stats.verified / stats.processed) * 100).toFixed(1)}%)`);
  console.log(`Unverified: ${stats.unverified} (${((stats.unverified / stats.processed) * 100).toFixed(1)}%)`);
  console.log(`Errors: ${stats.errors}`);
  console.log(`Runtime: ${runtime}s`);
  console.log(`Rate: ${rate} claims/sec`);
  console.log('=================================\n');
}

async function startConsumer() {
  try {
    console.log('TruthStream Kafka Consumer Starting...\n');
    
    const esConnected = await checkConnection();
    if (!esConnected) {
      console.error('ERROR: Cannot connect to Elasticsearch. Exiting...');
      process.exit(1);
    }
    
    await consumer.connect();
    console.log('Connected to Kafka');
    
    await consumer.subscribe({
      topic: 'news-claims',
      fromBeginning: false
    });
    console.log('Subscribed to topic: news-claims');
    console.log('Listening for messages...\n');
    
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
    console.error('FATAL ERROR:', error.message);
    process.exit(1);
  }
}

async function shutdown() {
  console.log('\n\nShutting down consumer...');
  printStats();
  
  try {
    await consumer.disconnect();
    console.log('Consumer disconnected');
    process.exit(0);
  } catch (error) {
    console.error('ERROR during shutdown:', error.message);
    process.exit(1);
  }
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

startConsumer();