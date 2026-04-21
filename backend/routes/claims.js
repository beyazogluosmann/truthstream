/**
 * API Routes for News Claims
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { sendClaimToKafka } = require('../kafka-producer');
const {
  getAllClaims,
  getClaimById,
  searchClaims,
  getClaimsByCategory,
  getClaimsByVerification,
  getStats
} = require('../elasticsearch');

// Rate limiting configuration
const requestCounts = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_MINUTE = 5; // Maximum 5 submissions per minute per IP

/**
 * Rate limiter middleware
 * Prevents spam by limiting requests per IP address
 */
function rateLimiter(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  
  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return next();
  }
  
  const userLimit = requestCounts.get(ip);
  
  if (now > userLimit.resetTime) {
    userLimit.count = 1;
    userLimit.resetTime = now + RATE_LIMIT_WINDOW;
    return next();
  }
  
  if (userLimit.count >= MAX_REQUESTS_PER_MINUTE) {
    return res.status(429).json({
      success: false,
      error: 'Çok fazla istek gönderdiniz. Lütfen 1 dakika bekleyin.',
      retryAfter: Math.ceil((userLimit.resetTime - now) / 1000)
    });
  }
  
  userLimit.count++;
  next();
}

// Cleanup old rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of requestCounts.entries()) {
    if (now > data.resetTime) {
      requestCounts.delete(ip);
    }
  }
}, 5 * 60 * 1000);

// GET /api/claims
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const sortBy = req.query.sortBy || 'timestamp';
    const order = req.query.order || 'desc';
    
    const from = (page - 1) * limit;
    const result = await getAllClaims(from, limit, sortBy, order);
    
    // Minimal response - only essential fields (yeni veri yapısı)
    const minimalClaims = result.claims.map(claim => ({
      id: claim.id,
      text: claim.text,
      category: claim.category,
      timestamp: claim.timestamp || claim.created_at,
      verified: claim.verified,
      credibility: claim.score || claim.credibility || 0, // YENİ: score -> credibility mapping
      score: claim.score || 0,
      verdict: claim.verdict,
      ai_reasoning: Array.isArray(claim.reasoning)
        ? claim.reasoning.join(' • ')
        : (claim.reasoning || claim.ai_reasoning || ''),
      red_flags: claim.red_flags || [],
      source: claim.source || claim.url,
      scores: claim.scores,
      score_breakdown: claim.score_breakdown,
      // YENİ alanlar
      fact_check: claim.fact_check,
      news_search: claim.news_search,
      confidence: claim.confidence
      // Hidden: verification_method, processed_at, user_submitted
    }));
    
    res.json({
      success: true,
      data: minimalClaims,
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

// POST /api/claims/submit - Submit new claim for verification
router.post('/submit', rateLimiter, async (req, res) => {
  try {
    const { text } = req.body;

    // Validation
    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Haber metni zorunludur'
      });
    }

    // Basic sanitization - remove HTML tags and dangerous characters
    const sanitizedText = text
      .replace(/[<>]/g, '') // Remove < and >
      .trim();

    if (sanitizedText.length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Haber metni en az 10 karakter olmalıdır'
      });
    }

    if (sanitizedText.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Haber metni en fazla 1000 karakter olabilir'
      });
    }

    // Spam detection
    const spamWords = ['test', 'asdasd', 'qwerty', '123456'];
    const lowerText = sanitizedText.toLowerCase();
    const containsSpam = spamWords.some(word => {
      const repeatedWord = word.repeat(3);
      return lowerText.includes(repeatedWord);
    });
    
    if (containsSpam) {
      return res.status(400).json({
        success: false,
        error: 'Geçersiz içerik tespit edildi'
      });
    }

    // Duplicate check
    const duplicateKey = `dup_${sanitizedText.substring(0, 50)}`;
    const lastSubmit = requestCounts.get(duplicateKey);
    
    if (lastSubmit && Date.now() - lastSubmit < 10000) {
      return res.status(400).json({
        success: false,
        error: 'Bu haber zaten gönderildi. Lütfen bekleyin.'
      });
    }
    
    requestCounts.set(duplicateKey, Date.now());

    // Create claim
    const claim = {
      id: uuidv4(),
      text: sanitizedText,
      category: 'General',
      timestamp: new Date().toISOString(),
      user_submitted: true
    };

    // Send to Kafka for verification
    await sendClaimToKafka(claim);

    res.json({
      success: true,
      message: 'Haber doğrulama için gönderildi. Sonuçları birkaç saniye içinde görebilirsiniz.',
      claim_id: claim.id
    });

  } catch (error) {
    console.error('Submit claim error:', error);
    res.status(500).json({
      success: false,
      error: 'Haber gönderilirken hata oluştu: ' + error.message
    });
  }
});

// DELETE /api/claims/:id - Delete a claim
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { deleteClaimById } = require('../elasticsearch');
    await deleteClaimById(id);
    
    res.json({
      success: true,
      message: 'Haber başarıyla silindi'
    });
  } catch (error) {
    console.error('Delete claim error:', error);
    res.status(500).json({
      success: false,
      error: 'Haber silinirken hata oluştu: ' + error.message
    });
  }
});

module.exports = router;