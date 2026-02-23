/**
 * API Routes for News Claims
 */

const express = require('express');
const router = express.Router();
const {
  getAllClaims,
  getClaimById,
  searchClaims,
  getClaimsByCategory,
  getClaimsByVerification,
  getStats
} = require('../elasticsearch');

// GET /api/claims
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const sortBy = req.query.sortBy || 'timestamp';
    const order = req.query.order || 'desc';
    
    const from = (page - 1) * limit;
    const result = await getAllClaims(from, limit, sortBy, order);
    
    res.json({
      success: true,
      data: result.claims,
      pagination: {
        page: page,
        limit: limit,
        total: result.total,
        pages: Math.ceil(result.total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/claims/search
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const from = (page - 1) * limit;
    
    const result = await searchClaims(query, from, limit);
    
    res.json({
      success: true,
      data: result.claims,
      pagination: {
        page: page,
        limit: limit,
        total: result.total,
        pages: Math.ceil(result.total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/claims/category/:category
router.get('/category/:category', async (req, res) => {
  try {
    const category = req.params.category;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const from = (page - 1) * limit;
    
    const result = await getClaimsByCategory(category, from, limit);
    
    res.json({
      success: true,
      data: result.claims,
      pagination: {
        page: page,
        limit: limit,
        total: result.total,
        pages: Math.ceil(result.total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/claims/verified/:status
router.get('/verified/:status', async (req, res) => {
  try {
    const verified = req.params.status === 'true';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const from = (page - 1) * limit;
    
    const result = await getClaimsByVerification(verified, from, limit);
    
    res.json({
      success: true,
      data: result.claims,
      pagination: {
        page: page,
        limit: limit,
        total: result.total,
        pages: Math.ceil(result.total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/claims/stats
router.get('/stats', async (req, res) => {
  try {
    const stats = await getStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/claims/:id
router.get('/:id', async (req, res) => {
  try {
    const claim = await getClaimById(req.params.id);
    
    if (!claim) {
      return res.status(404).json({
        success: false,
        error: 'Claim not found'
      });
    }
    
    res.json({
      success: true,
      data: claim
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;