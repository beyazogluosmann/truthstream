# Multi-AI Verification System - Implementation Guide

## 🎯 Overview

TruthStream now uses **3 AI models simultaneously** to verify news claims:
- **Groq (Llama 3.3 70B)** - 40% weight
- **Hugging Face (Mistral 7B)** - 30% weight  
- **Google Gemini Pro** - 30% weight

## 📁 New File Structure

```
kafka-consumer/
├── providers/
│   ├── groq.js              # Groq/Llama provider
│   ├── huggingface.js       # Hugging Face provider
│   └── gemini.js            # Google Gemini provider
├── multi-ai-verification.js # Main orchestrator
├── consumer.js              # Kafka consumer (updated)
├── ai-verification.js       # Legacy (kept for reference)
└── .env.example             # Environment template
```

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd kafka-consumer
npm install
```

New packages installed:
- `@google/generative-ai` - Google Gemini SDK
- `axios` - HTTP client for Hugging Face API

### 2. Configure API Keys

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Add your free API keys:
```env
GROQ_API_KEY=gsk_xxxxxxxxxxxxx
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxx
GEMINI_API_KEY=AIzaSyxxxxxxxxxx
```

**Get Free API Keys:**
- 🟢 Groq: https://console.groq.com/keys (Fast, generous limits)
- 🟠 Hugging Face: https://huggingface.co/settings/tokens (Free inference API)
- 🔵 Google Gemini: https://makersuite.google.com/app/apikey (1500 requests/day free)

### 3. Run the Consumer
```bash
npm start
```

## 🧠 How It Works

### 1. Parallel Verification
When a claim arrives, all 3 AI models analyze it **simultaneously**:

```javascript
// Each provider returns:
{
  provider: 'groq',
  credibility: 75,
  verified: true,
  reasoning: '...',
  scores: { source: 15, logic: 18, ... }
}
```

### 2. Consensus Algorithm

The system calculates a **weighted average**:
```
Final Score = (Groq × 0.4) + (HuggingFace × 0.3) + (Gemini × 0.3)
```

### 3. Agreement Analysis

Measures how much the models agree:
- **High agreement**: All scores within 15 points
- **Medium agreement**: Scores within 30 points  
- **Low agreement**: Scores differ by >30 points

### 4. Confidence Score

Combines agreement level with provider success rate:
```
Confidence = (Agreement Score × 0.6) + (Success Rate × 0.4)
```

## 📊 Output Format

Each verified claim now includes:

```json
{
  "text": "News claim text...",
  "credibility": 73,
  "verified": true,
  "confidence_score": 85,
  
  "ai_consensus": {
    "total_providers": 3,
    "successful_providers": 3,
    "failed_providers": [],
    "processing_time_ms": 2341,
    "agreement_level": "high",
    "reasoning": "3 AI modeli analiz etti (groq: 75%, huggingface: 70%, gemini: 74%). Tüm modeller benzer sonuçlara ulaştı. ...",
    "combined_red_flags": ["Kaynak belirsiz", "Tarih bilgisi yok"]
  },
  
  "provider_results": [
    {
      "provider": "groq",
      "model": "llama-3.3-70b-versatile",
      "credibility": 75,
      "verified": true,
      "reasoning": "Bu haber yanlış çünkü...",
      "scores": {
        "source": 15,
        "logic": 18,
        "factuality": 14,
        "language": 16,
        "verifiability": 12
      }
    },
    // ... other providers
  ]
}
```

## ⚙️ Configuration

### Enable/Disable Providers

Edit `multi-ai-verification.js`:

```javascript
// Enable only specific providers
const ENABLED_PROVIDERS = ['groq', 'gemini']; // Disable Hugging Face

// Adjust weights (must sum to 1.0)
const PROVIDER_WEIGHTS = {
  groq: 0.6,
  gemini: 0.4
};
```

### Timeout Settings

```javascript
const TIMEOUT_MS = 25000; // 25 seconds per provider
```

### Minimum Providers

```javascript
const MIN_SUCCESSFUL_PROVIDERS = 1; // At least 1 must succeed
```

## 🔧 Adding New AI Providers

### 1. Create Provider Module

Create `providers/your-ai.js`:

```javascript
async function verifyWithYourAI(claimText) {
  try {
    // Call your AI API
    const response = await yourAI.analyze(claimText);
    
    return {
      provider: 'your-ai',
      model: 'your-model-name',
      success: true,
      credibility: response.score,
      verified: response.isTrue,
      reasoning: response.explanation,
      scores: { /* breakdown */ }
    };
  } catch (error) {
    return {
      provider: 'your-ai',
      success: false,
      error: error.message
    };
  }
}

module.exports = { verifyWithYourAI };
```

### 2. Register Provider

In `multi-ai-verification.js`:

```javascript
const { verifyWithYourAI } = require('./providers/your-ai');

const ENABLED_PROVIDERS = ['groq', 'huggingface', 'gemini', 'your-ai'];
const PROVIDER_WEIGHTS = {
  groq: 0.3,
  huggingface: 0.25,
  gemini: 0.25,
  'your-ai': 0.2
};

const providerFunctions = {
  groq: verifyWithGroq,
  huggingface: verifyWithHuggingFace,
  gemini: verifyWithGemini,
  'your-ai': verifyWithYourAI
};
```

## 📈 Performance Tips

### 1. Provider Priorities
Place fastest provider first (Groq is very fast):
```javascript
const ENABLED_PROVIDERS = ['groq', 'gemini', 'huggingface'];
```

### 2. Fallback Strategy
System continues even if some providers fail:
- Minimum 1 provider must succeed
- Failed providers don't affect final score
- Consensus calculated from successful providers only

### 3. Rate Limits
Free tier limits (as of March 2026):
- **Groq**: 14,400 requests/day (~10 req/min)
- **Hugging Face**: 1000 requests/day
- **Gemini**: 1500 requests/day

**Tip**: Stagger requests or use caching for production.

## 🐛 Troubleshooting

### Provider Keeps Failing

1. Check API key in `.env`
2. Verify internet connection
3. Check rate limits
4. Review error logs:
```bash
npm start 2>&1 | tee consumer.log
```

### Low Agreement Between Models

This is normal! Different models have different perspectives. 
- High disagreement = claim is ambiguous
- Check `confidence_score` - low score means uncertain

### Slow Performance

- Reduce `TIMEOUT_MS` (risk: more failures)
- Disable slower providers
- Use only 2 providers instead of 3

## 🎨 Frontend Integration

The multi-AI data is already saved to Elasticsearch. Update your frontend to display:

1. **Individual provider scores**
2. **Agreement level indicator**
3. **Confidence score badge**
4. **Provider breakdown chart**

Example query:
```javascript
// Get claim with multi-AI data
const claim = await fetch('/api/claims/123');

console.log(claim.ai_consensus.agreement_level); // "high"
console.log(claim.provider_results); // Array of 3 results
```

## 📝 Testing

### Test Single Provider
```javascript
const { verifyWithGroq } = require('./providers/groq');

const result = await verifyWithGroq('Elon Musk öldü');
console.log(result);
```

### Test Consensus
```javascript
const { verifyClaimWithMultiAI } = require('./multi-ai-verification');

const claim = {
  text: 'Test claim',
  category: 'technology'
};

const result = await verifyClaimWithMultiAI(claim);
console.log('Consensus:', result.credibility);
console.log('Agreement:', result.ai_consensus.agreement_level);
```

## 🎯 Next Steps

### Phase 1 (Current) ✅
- ✅ 3 AI providers integrated
- ✅ Consensus algorithm
- ✅ Weighted scoring
- ✅ Fallback handling

### Phase 2 (Future)
- [ ] Add Ollama for local inference
- [ ] Add Claude via Anthropic API
- [ ] Implement caching layer
- [ ] Add A/B testing for weights

### Phase 3 (Advanced)
- [ ] Dynamic weight adjustment based on accuracy
- [ ] Historical agreement tracking
- [ ] Provider performance dashboard
- [ ] Auto-disable failing providers

## 💡 Tips for Production

1. **Use Environment-Based Config**
   ```javascript
   const ENABLED_PROVIDERS = process.env.AI_PROVIDERS?.split(',') || ['groq'];
   ```

2. **Implement Caching**
   ```javascript
   const cache = new Map();
   if (cache.has(claimText)) return cache.get(claimText);
   ```

3. **Monitor Provider Health**
   ```javascript
   const stats = {
     groq: { success: 0, failures: 0 },
     // ...
   };
   ```

4. **Add Request Queuing**
   Use Bull or similar for rate limit management.

## 🤝 Contributing

To contribute new AI providers:
1. Fork the repo
2. Create provider module in `providers/`
3. Add tests
4. Update this documentation
5. Submit PR with performance benchmarks

---

**Questions?** Open an issue on GitHub!
