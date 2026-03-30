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
   - Eğer haber BBC, Reuters, CNN, AP, AFP'de bulunduysa → YÜKSEK PUAN (75-90)
   - Google Fact Check'te DOĞRU/TRUE diye işaretlenmişse → ÇOK YÜKSEK PUAN (85-95)
   - Google Fact Check'te kayıt var ama YANLIŞ/FALSE diye işaretlenmişse → ÇOK DÜŞÜK PUAN (5-15)
   - Google Fact Check'te bulundu ama rating belirsizse → DİKKATLİ DEĞERLENDIR (40-60)
   - Türk haber kaynaklarında bulunduysa → ORTA-YÜKSEK PUAN (65-80)
   - HİÇBİR KAYNAKTA YOKSA → DÜŞÜK PUAN (20-40) - ANCAK güncel olaylar için bu normaldir!

ÖNEMLİ: Google Fact Check'te bulunması = doğru demek DEĞİLDİR! Rating'e bak!

2. REASONING YAZMA KURALLARI - ÇOK ÖNEMLİ:
   
   YASAKLAR:
   ❌ "Bu haber ... iddia ediyor" ile başlama
   ❌ "Ancak web scraping sonuçlarında..." cümlesi kullanma
   ❌ "büyük uluslararası kaynaklarda (BBC, Reuters, CNN)" gibi genel cümleler
   ❌ "Google Fact Check veritabanında da..." şablon ifadeler
   ❌ "Bu durum haberin güvenilirliğini düşürüyor" gibi jenerik sonuçlar
   ❌ Her haberde aynı cümle yapısını kullanma!
   
   DOĞRU YAKLAŞIM:
   ✅ Haberin spesifik içeriğini analiz et
   ✅ Gerçek kaynak isimlerini yaz (örn: "BBC News ve Reuters'te yayınlandı")
   ✅ Rakamlar varsa spesifik olarak değerlendir
   ✅ Her claim için FARKLI bir analiz yaz
   ✅ Doğal ve akıcı cümleler kur

3. ÖRNEK REASONING'LER:

❌ KÖTÜ (Her haberde aynı):
"Bu haber Elon Musk'ın uzaya gittiğini iddia ediyor. Ancak web scraping sonuçlarında bu bilgi büyük uluslararası kaynaklarda bulunamadı."

✅ İYİ (Özel ve spesifik):
"Elon Musk'ın uzaya gittiği iddiası NewsAPI'de 3 farklı kaynakta bulundu: Space.com, The Verge ve TechCrunch. Bu teknoloji odaklı kaynaklar güvenilir olmakla birlikte ana haber ajansları (Reuters, AP) henüz doğrulamadı. İddia spesifik tarih içermiyor ancak SpaceX'in yakın zamandaki lansmanlarıyla uyumlu."

✅ İYİ (Başka bir örnek):
"417 bin TL bedelli askerlik ücreti iddiası kontrol edildi. TRT Haber ve Hürriyet'te benzer rakamlarla haberler mevcut. TBMM web sitesinde bu konuda taslak görüşme kayıtları var. Rakam 2026 ekonomik koşulları için makul, ancak henüz resmi onay aşamasında."

✅ İYİ (Yalan haber örneği):
"İddia edilen kişinin ölümü ile ilgili hiçbir resmi kaynak bulunamadı. NewsAPI'de son 24 saatteki taramada bu isimle ilgili hiçbir ölüm haberi yok. Google Fact Check'te de benzer iddialar daha önce 'yanlış' olarak işaretlenmiş. Bu tür şok haberlerin kaynak gösterilmeden yayılması tipik dezenformasyon örneğidir."

4. DEĞERLENDİRME KRİTERLERİ:

   KAYNAK (0-20):
   - Kaç kaynak bulundu? Hangileri?
   - Kaynaklar güvenilir mi?
   
   MANTIK (0-20):
   - Rakamlar makul mü?
   - Fiziksel olarak mümkün mü?
   
   GERÇEKÇILIK (0-20):
   - Güncel olaylarla uyumlu mu?
   - Benzer haberler var mı?
   
   DİL (0-20):
   - Clickbait mi, haber dili mi?
   - Abartılı ifadeler var mı?
   
   DOĞRULANABİLİRLİK (0-20):
   - Tarih, rakam, isim var mı?
   - Kaynak belirtilmiş mi?

JSON YANIT:
{
  "credibility": <0-100 arası puan>,
  "verified": <true/false (60+ = true)>,
  "reasoning": "<Her claim için ÖZEL ve FARKLI analiz - şablon kullanma!>",
  "source_found": "<Bulunan gerçek kaynak isimleri veya 'Kaynak bulunamadı'>",
  "red_flags": [<spesifik şüpheli noktalar>],
  "scores": {
    "source": <0-20>,
    "logic": <0-20>,
    "factuality": <0-20>,
    "language": <0-20>,
    "verifiability": <0-20>
  }
}

ÖNEMLİ: Her habere özel, yaratıcı ve farklı bir analiz yap! Şablon cümle kullanma!

SADECE JSON döndür.`;
}

module.exports = { verifyWithGroq };
