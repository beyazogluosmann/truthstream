/**
 * Google Gemini AI Provider
 * Free tier with generous limits
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ 
  model: 'gemini-1.5-flash',
  generationConfig: {
    temperature: 0.3,
    maxOutputTokens: 1024,
  }
});

/**
 * Verify claim using Google Gemini
 * @param {string} claimText - Text to verify
 * @param {string} newsContext - News search results context
 * @returns {Promise<Object>} Verification result
 */
async function verifyWithGemini(claimText, newsContext = '') {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const prompt = generatePrompt(claimText, newsContext);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse JSON response
    let cleanedText = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(cleanedText);
    
    return {
      provider: 'gemini',
      model: 'gemini-1.5-flash',
      success: true,
      credibility: parsed.credibility || 0,
      verified: parsed.verified || false,
      reasoning: parsed.reasoning || '',
      source_found: parsed.source_found || 'Unknown',
      red_flags: parsed.red_flags || [],
      scores: parsed.scores || {},
      raw_response: parsed
    };
    
  } catch (error) {
    console.error('Gemini API Error:', error.message);
    return {
      provider: 'gemini',
      model: 'gemini-1.5-flash',
      success: false,
      error: error.message,
      credibility: 0,
      verified: false
    };
  }
}

function generatePrompt(text, newsContext = '') {
  return `Sen profesyonel bir haber doğrulama uzmanısın. Aşağıdaki haberi DİKKATLE analiz et:

HABER: "${text}"

${newsContext}

ÖNEMLI: Bu GÜNCEL bir gelişme olabilir!
- Eğer makul bir haber/yasa/politika değişikliğiyse, "henüz teyit edilmemiş ama olası" de
- Kesin yanlış demeden önce haberin GÜNCELLİK ve MANTIKLILIK durumunu değerlendir
- Sayılar makul aralıktaysa orta-yüksek puan ver

PUANLAMA:
- GÜNCEL & MAKUL: 50-70 (belirsiz ama olası)
- DOĞRULANMIŞ: 70-100
- TAMAMEN YALAN: 0-30
- ŞÜPHELİ: 40-60

DEĞERLENDİRME (0-20 puan her biri):
1. Kaynak güvenilirliği
2. Mantıksal tutarlılık (makul bir gelişme mi?)
3. Gerçek dünya uyumu (güncel olabilir mi?)
4. Dil ve üslup
5. Doğrulanabilirlik

Reasoning'de:
- "Bu güncel bir gelişme olabilir" veya "Henüz onay bekliyor" veya "Tamamen yanlış" NET söyle
- 4-5 cümle detaylı açıkla

JSON formatında yanıt ver:
{
  "credibility": <0-100>,
  "verified": <true/false (60+ true)>,
  "reasoning": "<4-5 cümle açıklama>",
  "source_found": "<'Güncel gelişme' veya 'Resmi kaynak' veya 'Kaynak yok'>",
  "red_flags": ["<şüpheli nokta>"],
  "scores": {
    "source": <0-20>,
    "logic": <0-20>,
    "factuality": <0-20>,
    "language": <0-20>,
    "verifiability": <0-20>
  }
}

SADECE JSON döndür.`;
}

module.exports = { verifyWithGemini };
