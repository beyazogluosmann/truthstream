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

⚠️ KRİTİK KURAL: KAYNAK YOKSA = YÜKSEK İHTİMALLE YANLIŞ!

📊 PUAN ARALIKLARI:
95-100: Kesinlikle doğru, KANITLI (web kaynağı var)
85-94:  Muhtemelen doğru, mantıklı + kaynak var
75-84:  Olası doğru, mantıklı ama kaynak yok
65-74:  Belirsiz, kaynak yok + mantık zayıf
50-64:  Şüpheli, kaynak yok + çelişki var
0-49:   Kesinlikle yanlış, kaynak yok + mantıksız

🎯 KARAR AKIŞI (SIRASINA DİKKAT ET!):

1️⃣ KAYNAK VAR MI?
   ✅ VARSA → Minimum 85 puan (eğer mantıklıysa 95+)
   ❌ YOKSA → 2️⃣'ye geç

2️⃣ KAYNAK YOKSA → ÖZEL DURUMLAR:
   
   A) GÜNLÜK TÜRK HABERLERİ (Kaynak olmasa da mantıklı):
      🏟️ SPOR HABERİ → 75-80 puan
         - Takım: Fenerbahçe, Galatasaray, Beşiktaş
         - Konu: Transfer, ayrılık, yeni imza
         - Mantık: Türkiye'de her gün oluyor, normal
      
      💰 EKONOMİ HABERİ → 70-75 puan
         - Konu: Asgari ücret, TL, döviz, enflasyon
         - Mantık: Bakanlık rutin açıklaması olabilir
   
   B) ÖZEL DURUMLAR (Kaynak ZORUNLU):
      ⚠️ ÜNLÜ KİŞİ ÖLÜMÜ → 0-15 puan
         - Mantık: Bu haber MUTLAKA Twitter/medyada olurdu
         - Sonuç: Kaynak yok = kesinlikle yalan
      
      ⚠️ ŞOK İDDİALAR → 0-20 puan
         - Konu: Savaş, büyük olay, skandal
         - Mantık: Bu haber MUTLAKA tüm medyada olurdu
         - Sonuç: Kaynak yok = kesinlikle yalan
      
      ⚠️ SPESIFIK İDDİALAR → 10-25 puan
         - Örnek: "X kişisi Y takımından ayrıldı"
         - Mantık: Gerçek olsa Fanatik, NTV Spor'da olurdu
         - Sonuç: Kaynak yok = büyük ihtimalle yalan

🔍 PUAN AYARLAMA:

EKLE (+):
+ NewsAPI/RSS'de haber var → +25 puan (KESİN KANIT!)
+ Google Fact Check DOĞRU → +30 puan (KESİN KANIT!)
+ Mantık çok güçlü + günlük olay → +10 puan

ÇIKAR (-):
- Google Fact Check YANLIŞ → -80 puan (KESİN YALAN!)
- Kaynak yok + mantıksız → -50 puan
- Kaynak yok + ünlü ölümü/şok → -70 puan
- Clickbait üslubu → -15 puan

📝 REASONING ÖRNEKLERİ:

✅ KAYNAK VAR + DOĞRU:
"BBC News, Reuters ve CNN'de kayıt bulundu. Olayın gerçekleştiği kesin. Fact-check sitelerinde doğrulandı. %98 güvenilir."

✅ KAYNAK YOK + GÜNLÜK SPOR:
"Fenerbahçe'nin oyuncu ile yollarını ayırması Türk futbolunda rutin bir gelişme. Transfer dönemlerinde bu tür haberler Fanatik, Hürriyet Spor'da sık görülür. Web scraping'de spesifik kayıt olmasa da, normal bir takım değişikliği. %75 güvenilir çünkü mantıklı ama kaynak yok."

✅ KAYNAK YOK + EKONOMİ:
"Asgari ücret artışı Türkiye'de düzenli gündem konusu. Bakanlık yılda birkaç kez açıklama yapar. Söylenen rakam makul. Web'de spesifik kayıt yok ama bu tür haberler önce ekonomi medyasında yer alır. %70 güvenilir."

❌ KAYNAK YOK + SPESIFIK İDDİA:
"Arda Güler'in Real Madrid'den ayrıldığı iddiası. ANCAK: NewsAPI'de kayıt YOK, Google Fact Check'te kayıt YOK, RSS feed'lerde kayıt YOK. Bu boyutta bir transfer mutlaka TRT Spor, Fanatik, Marca, AS gibi kaynaklarda olurdu. Sosyal medyada da ses yok. Kaynak eksikliği ciddi şüphe yaratıyor. %15 güvenilir."

❌ KAYNAK YOK + ÜNLÜ ÖLÜMÜ:
"Ünlü kişinin ölüm iddiası. Tüm haber ajanslarında kayıt yok, Google Fact Check'te yok, sosyal medya hesapları aktif. Bu tür şok haberler gerçek olsa her yerde olurdu. Kesinlikle yanlış. %5 güvenilir."

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
