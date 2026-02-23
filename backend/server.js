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
    message: 'TruthStream API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
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
    console.log('TruthStream Backend API Starting...\n');
    
    const esConnected = await checkConnection();
    if (!esConnected) {
      console.error('WARNING: Elasticsearch not connected');
    }
    
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`API Documentation: http://localhost:${PORT}`);
      console.log(`Health Check: http://localhost:${PORT}/api/health\n`);
    });
    
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();