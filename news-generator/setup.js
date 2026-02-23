const { initializeIndices, initializeCategories, client } = require('./elasticsearch');

async function setup() {
  console.log('Starting TruthStream setup...\n');

  try {
    // Check Elasticsearch connection
    console.log('Checking Elasticsearch connection...');
    await client.ping();
    console.log('Elasticsearch is running!\n');

    // Initialize indices
    console.log('Initializing Elasticsearch indices...');
    await initializeIndices();
    console.log('');

    // Wait a bit for indices to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Initialize categories
    console.log('Initializing categories...');
    await initializeCategories();
    console.log('');

    console.log('Setup completed successfully!');
    console.log('\nNext steps:');
    console.log('   1. Run: npm start (to start news generator)');
    console.log('   2. Check categories: curl http://localhost:9200/categories/_search?pretty\n');

    process.exit(0);
  } catch (error) {
    console.error('Setup failed:', error.message);
    console.error('\nMake sure Docker services are running:');
    console.error('   docker-compose up -d\n');
    process.exit(1);
  }
}

setup();