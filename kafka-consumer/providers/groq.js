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

PUANLAMA SİSTEMİ (ÇOK ÖNEMLİ):

📊 PUAN ARALIKLARI:
90-100: Kesinlikle doğru, kayıtlı haber
80-89:  Muhtemelen doğru, mantıklı gelişme  
70-79:  Olası doğru, normal haber kategorisi ← SPOR/EKONOMİ BURAYA!
60-69:  Belirsiz, daha fazla araştırma gerekli
50-59:  Şüpheli, kaynak eksikliği var
0-49:   Yanlış veya dezenformasyon

🎯 TÜRK HABERLERİ İÇİN BAŞLANGIÇ PUANLARI:

1. SPOR HABERLERİ → BAŞLANGIÇ: 75 PUAN
   - Fenerbahçe, Galatasaray, Beşiktaş, Trabzonspor
   - Transfer, ayrılık, yeni imza haberleri
   - Bu Türkiye'de GÜNLÜKtür, çok normal!

2. EKONOMİ HABERLERİ → BAŞLANGIÇ: 70 PUAN
   - Asgari ücret, TL, döviz, enflasyon
   - TBMM kararları, bakanlık açıklamaları

3. POLİTİK HABERLER → BAŞLANGIÇ: 65 PUAN
   - Seçim, atama, toplantı

4. ULUSLARARASI → BAŞLANGIÇ: 60 PUAN
   - Savaş, çatışma (İran-İsrail, vb.)

5. ÜNLÜ/ŞOK HABERİ → BAŞLANGIÇ: 20 PUAN
   - Ölüm, skandal (kaynak gerekir!)

🔍 PUAN AYARLAMA:

EKLE (+):
+ Web'de kaynak bulundu → +10 puan
+ Google Fact Check DOĞRU → +15 puan
+ Mantık çok güçlü → +10 puan

ÇIKAR (-):
- Google Fact Check YANLIŞ → -40 puan
- Fiziksel imkansız → -50 puan
- Clickbait üslubu → -10 puan

📝 REASONING ÖRNEKLERİ:

SPOR:
"Fenerbahçe'nin oyuncu ile yollarını ayırması Türk futbolunda rutin bir gelişme. Transfer dönemlerinde bu tür haberler Fanatik, Hürriyet Spor, NTV Spor'da sık görülür. Web scraping'de spesifik kayıt olmasa da, bu normal bir takım değişikliği. Mantıksal olarak tutarlı ve olası."

EKONOMİ:
"Asgari ücret artışı Türkiye'de düzenli gündem konusu. TBMM ve Çalışma Bakanlığı yılda birkaç kez bu konuyu ele alır. Söylenen rakam 2026 koşulları için makul. Henüz resmi açıklama olmasa da, bu tür haberler önce ekonomi medyasında yer alır."

YALAN:
"Ünlü kişinin ölüm iddiası. Tüm haber ajanslarında kayıt yok, sosyal medya hesapları aktif. Bu tür şok haberler genellikle viral dezenformasyon. Kesinlikle yanlış."

JSON YANIT:
{
  "credibility": <0-100 - YUKARIDAKI KURALLARA GÖRE>,
  "verified": <true (70+), false (<70)>,
  "reasoning": "<Kategori + mantık + scraping + sonuç>",
  "source_found": "<Bulunan kaynaklar veya Kaynak bulunamadı>",
  "red_flags": [<şüpheli noktalar varsa>],
  "scores": {
    "source": <0-20>,
    "logic": <0-25>,
    "factuality": <0-20>,
    "language": <0-15>,
    "verifiability": <0-20>
  }
}

SADECE JSON döndür.`;
}

module.exports = { verifyWithGroq };
