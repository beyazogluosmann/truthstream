const express = require('express');
const cors = require('cors');
const { checkConnection } = require('./elasticsearch');
const claimsRoutes = require('./routes/claims');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/claims', claimsRoutes);

app.get('/api/health', async (req, res) => {
  const esConnected = await checkConnection();
  
  res.json({
    status: 'running',
    elasticsearch: esConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'TruthStream API - Gerçek Haber Doğrulama Sistemi',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      submitClaim: 'POST /api/claims/submit',
      claims: '/api/claims',
      search: '/api/claims/search?q=',
      category: '/api/claims/category/:category',
      verified: '/api/claims/verified/:status',
      stats: '/api/claims/stats',
      claimById: '/api/claims/:id'
    }
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

async function startServer() {
  try {
    console.log('\n🚀 TruthStream Backend API Starting...\n');
    
    const esConnected = await checkConnection();
    if (esConnected) {
      console.log('✓ Elasticsearch: Connected');
    } else {
      console.log('✗ Elasticsearch: Not Connected');
      console.log('⚠️  WARNING: Some features may not work\n');
    }
    
    app.listen(PORT, () => {
      console.log(`\n📡 Server: http://localhost:${PORT}`);
      console.log(`📋 API Documentation: http://localhost:${PORT}`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`\n📌 Main Endpoints:`);
      console.log(`   POST /api/claims/submit - Submit claim for verification`);
      console.log(`   GET  /api/claims - Get all claims`);
      console.log(`   GET  /api/claims/stats - Get statistics`);
      console.log(`\n✅ Backend ready! Press Ctrl+C to stop\n`);
    });
    
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();