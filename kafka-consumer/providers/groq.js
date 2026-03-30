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
 * Verify claim using Groq AI with web scraper context
 * @param {string} claimText - Text to verify
 * @param {string} scraperContext - Context from web scrapers
 * @returns {Promise<Object>} Verification result
 */
async function verifyWithGroq(claimText, scraperContext = '') {
  try {
    const prompt = generatePrompt(claimText, scraperContext);
    
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

function generatePrompt(text, scraperContext) {
  return `Sen profesyonel bir haber doğrulama uzmanısın. Aşağıdaki haberi analiz et:

HABER: "${text}"

${scraperContext ? `\n${scraperContext}\n` : ''}

ÇOK ÖNEMLİ KURALLAR:

1. WEB SCRAPING SONUÇLARINI KULLAN:
   - Eğer haber BBC, Reuters, CNN'de bulunduysa → YÜKSEK PUAN (75-90)
   - Google Fact Check'te doğrulandıysa → ÇOK YÜKSEK PUAN (85-95)
   - Türk haber kaynaklarında bulunduysa → ORTA-YÜKSEK PUAN (70-85)
   - HİÇBİR KAYNAKTA YOKSA → DÜŞÜK PUAN (10-30)

2. KAYNAK DEĞERLENDİRME:
   - Resmi kaynaklarda (TBMM, Resmi Gazete) → 85-100
   - Büyük haber ajanslarında (BBC, Reuters, AFP) → 75-90
   - Ulusal haber kanallarında (TRT, CNN Türk) → 70-85
   - Sadece sosyal medyada → 10-30

3. RAKAM MANTIK KONTROLÜ:
   - Spesifik rakam var ve makul mu değerlendir
   - Türkiye ekonomisi ve güncel politikalarla uyumlu mu?
   - Abartılı veya mantıksız değerler şüphelidir

4. REASONING YAPISI - ÇOK ÖNEMLİ:
   a) İlk cümle: Haberin özeti
   b) İkinci cümle: HANGİ KAYNAKLARDA BULUNDU (scraping sonuçlarını kullan!)
   c) Üçüncü cümle: KAYNAKLARIN GÜVENİLİRLİĞİ
   d) Dördüncü cümle: RAKAM ANALİZİ (varsa)
   e) Son cümle: KESİN SONUÇ (olabilir kullanma!)

ÖRNEK REASONING:
"Bu haber bedelli askerlik ücretinin 417 bin TL'ye çıktığını iddia ediyor. Web scraping sonucunda bu haber BBC, Reuters ve TRT Haber'de bulundu. Büyük uluslararası ve ulusal kaynakların bu haberi vermesi güvenilirliği artırıyor. 417 bin TL rakamı, 2026 ekonomik koşulları ve önceki bedelli askerlik ücretleri göz önüne alındığında makul bir rakamdır. Bu güncel bir politika değişikliği ve doğru bir haber."

DEĞERLENDİRME:

1. KAYNAK GÜVENİLİRLİĞİ (0-20):
   - Hangi kaynaklarda bulundu? (scraping sonuçlarını kullan)
   - Kaynaklar güvenilir mi?

2. MANTIKSAL TUTARLILIK (0-20):
   - Rakam makul aralıkta mı?
   - Türkiye için mantıklı mı?

3. GERÇEK DÜNYA UYUMU (0-20):
   - Benzer gelişmeler oldu mu?
   - Güncel politikalara uygun mu?

4. DİL VE ÜSLUP (0-20):
   - Haber dili mi, clickbait mi?

5. DOĞRULANABİLİRLİK (0-20):
   - Spesifik bilgi var mı?
   - Tarih, rakam, kurum adı var mı?

JSON YANIT:
{
  "credibility": <0-100 arası puan - SCRAPING SONUÇLARINA GÖRE>,
  "verified": <true (60+), false (<60)>,
  "reasoning": "<Yukarıdaki yapıya göre detaylı açıklama - SCRAPING SONUÇLARINI KULLAN>",
  "source_found": "<Hangi kaynaklarda bulundu - scraping sonuçlarından al>",
  "red_flags": [<şüpheli noktalar, varsa>],
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
