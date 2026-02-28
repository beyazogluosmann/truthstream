/**
 * Kafka Producer Module
 * Handles sending user-submitted claims to Kafka
 */

const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'backend-api',
  brokers: ['localhost:9092']
});

const producer = kafka.producer();

let isConnected = false;

/**
 * Connect to Kafka producer
 */
async function connectProducer() {
  if (!isConnected) {
    await producer.connect();
    isConnected = true;
    console.log('✓ Kafka Producer connected');
  }
}

/**
 * Send claim to Kafka topic
 * @param {Object} claim - Claim object to send
 * @returns {Boolean} Success status
 */
async function sendClaimToKafka(claim) {
  try {
    await connectProducer();
    
    await producer.send({
      topic: 'news-claims',
      messages: [
        {
          key: claim.id,
          value: JSON.stringify(claim)
        }
      ]
    });

    console.log(`✓ Claim sent to Kafka: [${claim.category}] ${claim.text.substring(0, 50)}...`);
    return true;
  } catch (error) {
    console.error('✗ Kafka send error:', error.message);
    throw error;
  }
}

/**
 * Disconnect Kafka producer
 */
async function disconnectProducer() {
  if (isConnected) {
    await producer.disconnect();
    isConnected = false;
    console.log('✓ Kafka Producer disconnected');
  }
}

// Graceful shutdown
process.on('SIGINT', disconnectProducer);
process.on('SIGTERM', disconnectProducer);

module.exports = {
  sendClaimToKafka,
  disconnectProducer
};
