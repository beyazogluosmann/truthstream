/**
 * AI-Powered News Verification Module
 * Uses Groq (Llama 3.3 70B) for fact-checking and credibility scoring
 */

const Groq = require('groq-sdk');
require('dotenv').config();

// Constants
const AI_MODEL = 'llama-3.3-70b-versatile';
const AI_TEMPERATURE = 0.3; // Lower for consistent results
const MAX_TOKENS = 1024;
const CREDIBILITY_THRESHOLD = 60;

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

/**
 * Generates AI prompt for news verification
 * @param {string} text - News claim text
 * @returns {string} Formatted prompt
 */
function generateVerificationPrompt(text) {
  return `Sen bir haber doğrulama uzmanısın. Aşağıdaki haber iddiasını analiz et:

HABER: "${text}"

Lütfen şu kriterlere göre değerlendir:
1. İddianın mantıksal tutarlılığı
2. Olağandışı veya abartılı ifadeler
3. Gerçek dünya bilgisi ile uyumu
4. Dezenformasyon belirtileri
5. Kaynak ve kanıt bulunabilirliği

Değerlendirmeni SADECE şu JSON formatında ver (başka bir şey yazma):
{
  "credibility": <0-100 arası sayı>,
  "verified": <true veya false>,
  "reasoning": "<2-3 cümlelik Türkçe açıklama>",
  "red_flags": ["<şüpheli nokta 1>", "<şüpheli nokta 2>"]
}

KURALLAR:
- credibility ${CREDIBILITY_THRESHOLD} ve üzeriyse verified: true
- credibility ${CREDIBILITY_THRESHOLD}'ın altındaysa verified: false    
- Sadece JSON döndür, açıklama yapma`;
}

/**
 * Calls Groq AI API for verification
 * @param {string} prompt - Verification prompt
 * @returns {Promise<Object>} AI response
 */
async function callGroqAPI(prompt) {
  const chatCompletion = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: "Sen profesyonel bir haber doğrulama uzmanısın. Sadece JSON formatında yanıt veriyorsun."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    model: AI_MODEL,
    temperature: AI_TEMPERATURE,
    max_tokens: MAX_TOKENS
  });

  return chatCompletion.choices[0]?.message?.content || '{}';
}

/**
 * Validates AI response structure
 * @param {Object} aiResult - Parsed AI response
 * @returns {boolean} Is valid
 */
function isValidAIResponse(aiResult) {
  return (
    aiResult.credibility !== undefined &&
    aiResult.credibility >= 0 &&
    aiResult.credibility <= 100 &&
    typeof aiResult.verified === 'boolean'
  );
}

/**
 * Verifies a news claim using AI
 * @param {Object} claim - Claim object with text, category, source
 * @returns {Promise<Object>} Verified claim with AI analysis
 */
async function verifyClaimWithAI(claim) {
  try {
    const previewText = claim.text.substring(0, 60);
    console.log(`AI analyzing: "${previewText}..."`);

    // Generate prompt
    const prompt = generateVerificationPrompt(claim.text);

    // Call AI
    const responseText = await callGroqAPI(prompt);
    const aiResult = JSON.parse(responseText);

    // Validate response
    if (!isValidAIResponse(aiResult)) {
      throw new Error('AI response has invalid format or missing fields');
    }

    // Build verified claim
    const verifiedClaim = {
      ...claim,
      verified: aiResult.verified,
      credibility: Math.round(aiResult.credibility),
      ai_reasoning: aiResult.reasoning || 'No explanation provided',
      red_flags: aiResult.red_flags || [],
      verification_method: `AI (Groq - ${AI_MODEL})`,
      processed_at: new Date().toISOString()
    };

    // Log result
    const status = aiResult.verified ? 'Verified' : 'Unverified';
    console.log(`AI Result: ${status} (${aiResult.credibility}%)`);

    return verifiedClaim;

  } catch (error) {
    console.error('AI verification error:', error.message);
    
    // Fallback to rule-based verification
    console.log('Falling back to rule-based verification');
    const { verifyClaim } = require('./verification');
    return verifyClaim(claim);
  }
}

module.exports = { verifyClaimWithAI };
