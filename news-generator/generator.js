const { Kafka } = require('kafkajs');
const { v4: uuidv4 } = require('uuid');
const { getCategories } = require('./elasticsearch');
const { templates, generateClaim } = require('./templates');

const kafka = new Kafka({
  clientId: 'news-generator',
  brokers: ['localhost:9092']
});

const producer = kafka.producer();

async function generateNews() {
  try {
    const categories = await getCategories();
    
    if (categories.length === 0) {
      console.log('No categories found. Please run: npm run setup');
      return null;
    }
    
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    const categoryName = randomCategory.name;
    const categorySources = randomCategory.sources;
    
    const randomSource = categorySources[Math.floor(Math.random() * categorySources.length)];
    
    const categoryTemplates = templates[categoryName];
    if (!categoryTemplates || categoryTemplates.length === 0) {
      console.log(`No templates found for category: ${categoryName}`);
      return null;
    }
    
    const randomTemplate = categoryTemplates[Math.floor(Math.random() * categoryTemplates.length)];
    const claimText = generateClaim(categoryName, randomTemplate);
    
    const claim = {
      id: uuidv4(),
      text: claimText,
      category: categoryName,
      source: randomSource,
      timestamp: new Date().toISOString()
    };
    
    return claim;
  } catch (error) {
    console.error('Error generating news:', error.message);
    return null;
  }
}

async function sendToKafka(claim) {
  try {
    await producer.send({
      topic: 'news-claims',
      messages: [
        {
          key: claim.id,
          value: JSON.stringify(claim)
        }
      ]
    });
    
    console.log(`Published: [${claim.category}] ${claim.text.substring(0, 60)}...`);
  } catch (error) {
    console.error('Error sending to Kafka:', error.message);
  }
}

async function startGenerator() {
  try {
    console.log('TruthStream News Generator Starting...\n');
    
    await producer.connect();
    console.log('Connected to Kafka');
    
    const categories = await getCategories();
    console.log(`Loaded ${categories.length} categories\n`);
    console.log('Generator started - publishing every 5 seconds');
    console.log('Press Ctrl+C to stop\n');
    
    setInterval(async () => {
      const claim = await generateNews();
      if (claim) {
        await sendToKafka(claim);
      }
    }, 5000);
    
  } catch (error) {
    console.error('Failed to start generator:', error.message);
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  console.log('\nShutting down generator...');
  await producer.disconnect();
  process.exit(0);
});

startGenerator();