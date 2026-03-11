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
  return `Sen profesyonel bir haber doğrulama uzmanısın. Aşağıdaki haber iddiasını analiz et:

HABER: "${text}"

GÖREV: Bu haberi 5 kritere göre değerlendir ve DOĞAL, AÇIKLAYICI bir dille sonuç ver.

DEĞERLENDİRME KRİTERLERİ:

1. KAYNAK GÜVENİLİRLİĞİ (0-20 puan)
   - **ÖNEMLİ**: Haberin nereden geldiğini araştır ve belirt
   - Haberde kaynak var mı? Kaynak güvenilir mi?
   - Örnek: "Bu haber resmi kaynaklarda (Reuters, BBC, vs.) yer almıyor"
   - Örnek: "Bu iddia ilk olarak şu sitede yayınlandı: X"
   - Hangi medya kuruluşlarında bulundu/bulunmadı belirt

2. MANTIKSAL TUTARLILIK (0-20 puan)
   - İddia mantıklı mı? Çelişki var mı?
   - Örnek: "Bu iddia fiziksel olarak imkansız çünkü..."

3. GERÇEK DÜNYA UYUMU (0-20 puan)
   - Bilinen gerçeklerle uyumlu mu?
   - **ÖNEMLİ**: Eğer haber bir kişinin ölümü/yaşamı hakkındaysa, o kişinin son aktivitelerini, paylaşımlarını, görüldüğü yerleri belirt
   - Örnek: "Elon Musk dün Twitter'da paylaşım yaptı ve Tesla toplantısına katıldı"
   - Örnek: "Bu kişi 2 gün önce canlı yayında görüldü"

4. DİL VE ÜSLUP (0-20 puan)
   - Nötr mu? Clickbait mi? Duygusal manipülasyon var mı?
   - Örnek: "Başlık abartılı ve tıklama odaklı"

5. DOĞRULANABİLİRLİK (0-20 puan)
   - Somut kanıt var mı? Tarih, yer, sayılar spesifik mi?
   - Haberi doğrulamak için hangi kaynaklara bakıldı
   - Örnek: "Haberde somut tarih veya yer bilgisi yok"
   - Örnek: "BBC, Reuters gibi kaynaklarda bu habere rastlanmadı"

YANIT FORMATINDA DOĞAL DİL KULLAN:
- "Bu haber yanlış/doğru çünkü..." gibi başla
- **KAYNAK ARAŞTIRMASI YAP**: Haberin nereden geldiğini, hangi sitelerde bulunduğunu belirt
- Gerçek kanıtlar göster: "X kişisi dün şu etkinlikte görüldü", "Y olayı 3 gün önce oldu"
- Güncel bilgiler ver: "Son paylaşımlar", "resmi açıklamalar", "doğrulanmış bilgiler"
- Hangi kaynaklarda araştırıldığını açıkla: "BBC, Reuters, CNN gibi kaynaklarda bu habere rastlanmadı"
- Arkadaşına anlatır gibi yaz, robotik olma

JSON FORMATINDA YANIT VER:
{
  "credibility": <0-100 arası toplam puan>,
  "verified": <true veya false>,
  "reasoning": "<DOĞAL DİLDE 4-5 cümle. Haberin NEREDEN geldiğini, hangi kaynaklarda bulunduğunu/bulunmadığını belirt. Gerçek kanıtlar ve örnekler ver. Kişiler hakkındaysa son aktivitelerini açıkla.>",
  "source_found": "<Haberin bulunduğu kaynak veya 'Resmi kaynaklarda bulunamadı' veya 'Kullanıcı tarafından gönderildi'>",
  "red_flags": ["<spesifik şüpheli nokta 1>", "<spesifik şüpheli nokta 2>"],
  "scores": {
    "source": <0-20>,
    "logic": <0-20>,
    "factuality": <0-20>,
    "language": <0-20>,
    "verifiability": <0-20>
  }
}

KURALLAR:
- Credibility ${CREDIBILITY_THRESHOLD} ve üzeriyse verified: true, altındaysa false
- Reasoning kısmında KAYNAK ARAŞTIRMASI yap ve belirt
- "Resmi kaynaklarda bu haber yok" veya "Bu haber şu sitede ilk kez yayınlandı" gibi ifadeler kullan
- Kuru "mantıksal tutarlılık yok" deme, NEDENİNİ açıkla
- Eğer kişiler hakkındaysa, o kişinin SON AKTİVİTELERİNİ araştır ve belirt
- Hangi kaynaklarda araştırma yaptığını belirt (BBC, Reuters, CNN, vs.)
- Sadece JSON döndür`;
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
      source: aiResult.source_found || claim.source || 'Unknown',
      scores: aiResult.scores || {},
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
