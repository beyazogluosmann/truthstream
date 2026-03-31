/**
 * Groq AI Provider (Llama 3.3 70B)
 * Fast and reliable fact-checking with HYBRID SCORING
 */

const Groq = require('groq-sdk');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const AI_MODEL = 'llama-3.3-70b-versatile';
const AI_TEMPERATURE = 0.2; // Lower for more deterministic results
const MAX_TOKENS = 2048; // Increased for detailed analysis

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
    // Detect claim language
    const claimLanguage = detectLanguage(claimText);
    console.log(`[Groq] Detected language: ${claimLanguage}`);
    
    const prompt = generatePrompt(claimText, scraperContext, claimLanguage);
    
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a world-class fact-checker working for Reuters, BBC Verify, and FactCheck.org. You analyze claims with extreme precision. You ONLY respond in JSON format."
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
      language: claimLanguage,
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

/**
 * Detect language of claim text
 * @param {string} text - Claim text
 * @returns {string} Language code ('tr' or 'en')
 */
function detectLanguage(text) {
  // Turkish-specific characters and words
  const turkishChars = /[ğüşıöçĞÜŞİÖÇ]/;
  const turkishWords = /\b(ve|veya|ile|için|olan|oldu|olacak|etti|eden|bir|bu|şu|ancak|ama|fakat|çünkü|böyle|şöyle|gibi|diye|dedi|iddiası|haberi|gündemde)\b/i;
  
  // Check for Turkish indicators
  if (turkishChars.test(text) || turkishWords.test(text)) {
    return 'tr';
  }
  
  return 'en';
}

function generatePrompt(text, scraperContext, language = 'en') {
  const languageInstruction = language === 'tr' 
    ? 'IMPORTANT: The claim is in TURKISH. Write your reasoning in TURKISH. All other instructions remain in English.'
    : 'IMPORTANT: The claim is in ENGLISH. Write your reasoning in ENGLISH.';
  
  return `You are an expert fact-checker. Analyze the following claim with extreme precision:

${languageInstruction}

CLAIM: "${text}"

${scraperContext ? `${scraperContext}\n` : '\n=== WEB SCRAPING RESULTS ===\nNo web scraping data available.\n'}

⚠️ CRITICAL RULE: NO SOURCES = HIGHLY LIKELY FALSE!

📊 CREDIBILITY SCORE RANGES:
95-100: DEFINITELY TRUE - PROVEN (multiple web sources found)
85-94:  PROBABLY TRUE - logical + sources found  
75-84:  POSSIBLY TRUE - logical but NO sources
65-74:  UNCERTAIN - no sources + weak logic
50-64:  SUSPICIOUS - no sources + contradictions
0-49:   DEFINITELY FALSE - no sources + illogical

🎯 DECISION FLOW (FOLLOW PRECISELY!):

STEP 1: CHECK FOR SOURCES IN SCRAPING RESULTS ABOVE
   ✅ IF SOURCES FOUND (NewsAPI, FactCheck, or RSS) → Minimum score 85 (if logical, 95+)
   ❌ IF NO SOURCES → Go to STEP 2

STEP 2: NO SOURCES FOUND → CATEGORIZE CLAIM TYPE:
   
   A) ROUTINE NEWS (Can be plausible without sources):
      
      🏟️ SPORTS NEWS → 75-80 points
         Teams: Fenerbahçe, Galatasaray, Beşiktaş, Trabzonspor, Barcelona, Real Madrid, Manchester United
         Topics: Transfer rumors, contract negotiations, player interest
         Logic: These are DAILY occurrences in Turkish/European football
         Example: "Fenerbahçe interested in signing Player X" → Plausible rumor, 75 pts
      
      💰 ECONOMY NEWS → 70-75 points
         Topics: Minimum wage increases, TL exchange rates, inflation reports, salary adjustments
         Logic: Government ministries make routine economic announcements
         Example: "Minimum wage may increase to 25,000 TL" → Reasonable speculation, 70 pts
      
      🌍 INTERNATIONAL NEWS (BREAKING NEWS WINDOW) → 60-70 points
         Topics: Wars, conflicts, political events, assassination attempts, major incidents
         Logic: Breaking news takes 1-2 hours to reach databases. If claim uses breaking news language, it might be real but not yet indexed
         IMPORTANT: Look for words like "iddiası" (claim), "gündemde" (on agenda), "haberi" (news report), "söylentisi" (rumor)
         Example: "Netanyahu'ya suikast girişimi iddiası gündemde" → Breaking news format, 65 pts
         Example: "ABD, İsrail ve İran arasında çatışmalar sürüyor" → Ongoing conflict (known context), 65 pts
   
   B) CRITICAL CLAIMS (Sources are MANDATORY):
      
      ⚠️ CELEBRITY/PUBLIC FIGURE DEATH → 0-15 points
         Logic: Death of ANY known person would be IMMEDIATELY on Twitter, BBC, CNN, Reuters
         Result: No sources = DEFINITELY FALSE
         Example: "Actor X died" (stated as FACT) with NO web coverage = 5 points (fake news)
      
      ⚠️ MAJOR INCIDENTS (STATED AS CONFIRMED) → 0-20 points
         Topics: "City destroyed", "1000 people died", "Nuclear explosion" stated as confirmed facts
         Logic: Massive incidents would trigger INSTANT worldwide media coverage
         Result: No sources = DEFINITELY FALSE
         Example: "Earthquake destroyed Istanbul" (confirmed) with NO sources = 10 points (false)
      
      ⚠️ SPECIFIC NAMED CLAIMS → 10-25 points
         Format: "Person X did Y" or "Entity A announced B" (as confirmed fact, not rumor)
         Logic: Specific claims with names/details require verification
         Result: No sources = HIGHLY LIKELY FALSE
         Examples:
           - "Arda Güler left Real Madrid" (confirmed) → If true, Marca, AS, Fanatik would report = 15 pts
           - "Minister X resigned" (official) → If true, TRT, Hürriyet, Reuters would report = 12 pts

🔍 SCORE ADJUSTMENTS (Apply to base score):

ADD POINTS (+):
+ NewsAPI articles found → +20 points (SOLID EVIDENCE!)
+ Turkish RSS feed articles found → +15 points (LOCAL VERIFICATION!)
+ Google Fact Check confirmed TRUE → +25 points (EXPERT VERIFIED!)
+ Very strong internal logic + known ongoing event → +15 points
+ Multiple independent sources (2+) → +20 points
+ Context matches known geopolitical events → +10 points

SUBTRACT POINTS (-):
- Google Fact Check confirmed FALSE → -80 points (PROVEN LIE!)
- No sources + physically impossible → -50 points
- No sources + celebrity death/major incident → -70 points
- Clickbait language detected → -15 points
- Multiple red flags found → -5 points per flag
- Contradicts known facts → -30 points

📝 REASONING EXAMPLES (ADAPT LANGUAGE TO CLAIM):

IF CLAIM IS IN TURKISH, WRITE REASONING IN TURKISH:

✅ "ABD, İsrail ve İran arasında çatışmalar aktif şekilde sürüyor" → 
   "ABD-İsrail-İran arasında çatışma iddiası. Bu coğrafi bölgede Nisan 2024'ten beri İsrail-İran gerginliği devam ediyor (bilinen gerçek). Web scraping'de spesifik kaynak yok ancak bu devam eden jeopolitik bir gerçektir. Uluslararası medyada sürekli gündemde. Ongoing conflict olduğu için kaynak yokluğu normaldir. Güvenilirlik: %85"

✅ "Netanyahu'ya suikast girişimi iddiası gündemde" → 
   "Netanyahu suikast girişimi iddiası. Son dakika haber dili ('iddiası gündemde'). Bu tür haberler veri tabanlarına ulaşması 1-2 saat alır. İsrail-Filistin çatışma bağlamında makul. Kaynak henüz yok ama breaking news formatı. Güvenilirlik: %65"

✅ "Fenerbahçe Arda Güler'i transfer etmek istiyor" →
   "Transfer söylentisi. Türk futbolunda günlük. Fanatik, NTV Spor'da resmi onaydan önce görünür. Makul ama doğrulanmamış. Güvenilirlik: %75"

❌ "Arda Güler Real Madrid'den ayrıldı" →
   "Kesin bilgi olarak belirtilmiş transfer. NewsAPI YOK, FactCheck YOK, RSS YOK. Bu transfer ANINDA Marca, AS, Fanatik'te olurdu. Kaynak yokluğu çok şüpheli. Güvenilirlik: %15"

IF CLAIM IS IN ENGLISH, WRITE REASONING IN ENGLISH:

✅ "US, Israel and Iran conflicts actively ongoing" →
   "US-Israel-Iran conflict claim. This region has known ongoing tensions since April 2024 (established fact). No specific sources in web scraping but this is a continuing geopolitical reality. Regularly covered in international media. Source absence normal for ongoing conflicts. Credibility: 85%"

✅ "Netanyahu assassination attempt claim is trending" →
   "Breaking news language ('claim is trending'). These news items take 1-2 hours to reach databases. Given Israel-Palestine context, plausible. No sources yet but breaking news format. Credibility: 65%"

❌ "Arda Güler left Real Madrid" →
   "Stated as confirmed fact. NO NewsAPI, NO FactCheck, NO RSS. This transfer would IMMEDIATELY appear in Marca, AS, Fanatik. Source absence highly suspicious. Credibility: 15%"

🔑 KEY RULES:
1. MATCH YOUR REASONING LANGUAGE TO THE CLAIM'S LANGUAGE!
2. ALWAYS CHECK IF CLAIM RELATES TO KNOWN ONGOING EVENTS (Israel-Iran, Ukraine-Russia, etc.)
3. DISTINGUISH BETWEEN: "iddiası" (claim/rumor) vs confirmed fact

JSON RESPONSE FORMAT:
{
  "credibility": <0-100 integer>,
  "verified": <boolean: true if ≥70, false if <70>,
  "reasoning": "<WRITE IN SAME LANGUAGE AS CLAIM - Detailed analysis with context>",
  "source_found": "<List sources OR 'No sources found' / 'Kaynak bulunamadı'>",
  "red_flags": [<array of suspicious elements, if any>],
  "scores": {
    "source": <0-20>,
    "logic": <0-25>,
    "factuality": <0-20>,
    "language": <0-15>,
    "verifiability": <0-20>
  }
}

CRITICAL: Return ONLY valid JSON. No markdown, no extra text.`;
}

module.exports = { verifyWithGroq };
