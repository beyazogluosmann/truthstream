/**
 * Groq AI Provider (Llama 3.3 70B)
 * Fast and reliable fact-checking
 */

const Groq = require('groq-sdk');
require('dotenv').config();

const AI_MODEL = 'llama-3.3-70b-versatile';
const AI_TEMPERATURE = 0.3;
const MAX_TOKENS = 1024;

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

/**
 * Verify claim using Groq AI
 * @param {string} claimText - Text to verify
 * @param {string} newsContext - News search results context
 * @returns {Promise<Object>} Verification result
 */
async function verifyWithGroq(claimText, newsContext = '') {
  try {
    const prompt = generatePrompt(claimText, newsContext);
    
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "Sen profesyonel bir haber doğrulama uzmanısın. SADECE JSON formatında yanıt ver."
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

    let responseText = chatCompletion.choices[0]?.message?.content || '{}';
    responseText = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    
    const result = JSON.parse(responseText);
    
    return {
      provider: 'groq',
      model: AI_MODEL,
      success: true,
      credibility: result.credibility || 0,
      verified: result.verified || false,
      reasoning: result.reasoning || '',
      source_found: result.source_found || 'Unknown',
      red_flags: result.red_flags || [],
      scores: result.scores || {},
      raw_response: result
    };
    
  } catch (error) {
    console.error('Groq API Error:', error.message);
    return {
      provider: 'groq',
      model: AI_MODEL,
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

ÖNEMLİ UYARILAR:
- Bu bir GÜNCEL HABER olabilir, eski bilgilerinle çelişebilir
- Eğer haber güncel bir gelişme, resmi açıklama veya yasa değişikliğinden bahsediyorsa, bunu DİKKATE AL
- "Henüz teyit edilmemiş" veya "onay bekliyor" gibi durumları BELİRT
- Kesin yanlış demeden önce haberin GÜNCELLİK durumunu değerlendir

DEĞERLENDİRME KRİTERLERİ:

1. KAYNAK GÜVENİLİRLİĞİ (0-20 puan)
   - Haber aktüel bir gelişme mi yoksa komplo teorisi mi?
   - Güncel yasal değişiklik, resmi açıklama söz konusu mu?
   - Eğer güncel bir politika/yasa değişikliğiyse: "Bu güncel bir gelişme, henüz tamamlanmamış olabilir"
   - Eğer tamamen uydurma: "Hiçbir resmi kaynakta bu bilgi yok"

2. MANTIKSAL TUTARLILIK (0-20 puan)
   - İddia mantıklı mı? Çelişki var mı?
   - Makul bir gelişme olabilir mi?
   - Örnek: "Asgari ücret artışı makul, bedelli askerlik ücreti artışı da olağan"

3. GERÇEK DÜNYA UYUMU (0-20 puan)
   - BİLİNEN gerçeklerle uyumlu mu?
   - GÜNCEL GELİŞMELER varsa bunu belirt
   - "Bu rakam 2026 için açıklanmış olabilir ama henüz resmiyet kazanmamış"
   - Sayılar mantıklı aralıkta mı? (örn: 417 bin TL bedelli için mantıklı)

4. DİL VE ÜSLUP (0-20 puan)
   - Nötr mu? Abartılı mı?
   - Clickbait tarzı mı yoksa haber dili mi?

5. DOĞRULANABİLİRLİK (0-20 puan)
   - Spesifik bilgi var mı?
   - Henüz doğrulanamayan ama MUHTEMEL gelişmeler için: orta puan ver
   - Tamamen uydurma için: düşük puan

PUANLAMA YAKLAŞIMI:
- GÜNCEL HABERLER: Eğer makul bir gelişmeyse 50-70 arası (belirsiz ama olası)
- DOĞRULANMIŞ HABERLER: 70-100 arası
- YALAN/UYDURMA: 0-30 arası
- ŞÜPHELİ AMA OLABİLİR: 40-60 arası

JSON FORMATINDA YANIT VER:
{
  "credibility": <0-100 arası toplam puan>,
  "verified": <true veya false (60 üzeri true)>,
  "reasoning": "<DOĞAL DİLDE 4-5 cümle. 'Bu haber güncel bir gelişme olabilir' veya 'Henüz resmi onay yok' veya 'Tamamen yanlış' gibi NET ifadeler kullan. Sayıların mantıklılığını değerlendir.>",
  "source_found": "<'Güncel gelişme - henüz teyit edilmemiş' veya 'Resmi kaynaklarda onaylanmış' veya 'Hiçbir kaynakta bulunamadı'>",
  "red_flags": ["<spesifik şüpheli nokta>"],
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

module.exports = { verifyWithGroq };
