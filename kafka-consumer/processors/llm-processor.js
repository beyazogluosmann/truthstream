/**
 * LLM Processor - İddia Çıkarımı ve Analiz
 * 
 * URL veya metni analiz ederek:
 * - Ana iddiaları çıkarır
 * - Varlıkları tanımlar (kişi, kurum, yer)
 * - Kategori belirler
 * - Güven seviyesi hesaplar
 * - Çelişkileri tespit eder
 * - Destekleyici kanıtları analiz eder
 */

require('dotenv').config();
const Groq = require('groq-sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Anthropic = require('@anthropic-ai/sdk');

class LLMProcessor {
  constructor() {
    this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    this.gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    
    // Varsayılan provider
    this.defaultProvider = process.env.LLM_PROVIDER || 'groq';
  }

  /**
   * Ana analiz fonksiyonu
   */
  async analyzeContent(content, sourceUrl = null) {
    try {
      const prompt = this.buildAnalysisPrompt(content, sourceUrl);
      
      let response;
      switch (this.defaultProvider) {
        case 'groq':
          response = await this.analyzeWithGroq(prompt);
          break;
        case 'gemini':
          response = await this.analyzeWithGemini(prompt);
          break;
        case 'anthropic':
          response = await this.analyzeWithAnthropic(prompt);
          break;
        default:
          response = await this.analyzeWithGroq(prompt);
      }

      return this.parseAnalysisResponse(response);
    } catch (error) {
      console.error(' LLM analiz hatası:', error.message);
      return this.getFallbackAnalysis();
    }
  }

  /**
   * Groq ile analiz
   */
  async analyzeWithGroq(prompt) {
    const completion = await this.groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'Sen bir haber doğrulama uzmanısın. Verilen haberleri analiz edip JSON formatında detaylı analiz sonuçları üretiyorsun.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    });

    return completion.choices[0].message.content;
  }

  /**
   * Gemini ile analiz
   */
  async analyzeWithGemini(prompt) {
    const model = this.gemini.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }

  /**
   * Anthropic Claude ile analiz
   */
  async analyzeWithAnthropic(prompt) {
    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    return message.content[0].text;
  }

  /**
   * Analiz promptu oluştur
   */
  buildAnalysisPrompt(content, sourceUrl) {
    return `
Aşağıdaki haber/iddia metnini detaylı olarak analiz et ve JSON formatında sonuç üret.

**Kaynak URL:** ${sourceUrl || 'Belirtilmemiş'}

**Metin:**
${content}

**Görevin:**
1. Ana iddiaları çıkar (en fazla 3 tane)
2. Varlıkları tanımla (kişi, kurum, yer, tarih)
3. Kategoriyi belirle (politika, ekonomi, sağlık, teknoloji, vs.)
4. Güven seviyesini değerlendir (high/medium/low)
5. Olası çelişkileri tespit et
6. Destekleyici kanıt olup olmadığını analiz et
7. Sentiment analizi yap (neutral/sensational/manipulative)

**Çıktı formatı (JSON):**
{
  "mainClaims": ["İddia 1", "İddia 2"],
  "entities": {
    "people": ["İsim 1", "İsim 2"],
    "organizations": ["Kurum 1"],
    "locations": ["Yer 1"],
    "dates": ["Tarih 1"]
  },
  "category": "politika",
  "confidence": "high",
  "contradictions": ["Çelişki 1"],
  "supportingEvidence": ["Kanıt 1", "Kanıt 2"],
  "sentiment": "neutral",
  "keyPoints": ["Önemli nokta 1", "Önemli nokta 2"],
  "reasoning": "Bu iddia ... çünkü ..."
}

**Önemli:** Sadece JSON çıktısı ver, başka açıklama ekleme.
`;
  }

  /**
   * LLM yanıtını parse et
   */
  parseAnalysisResponse(response) {
    try {
      // JSON parse
      const parsed = typeof response === 'string' ? JSON.parse(response) : response;

      // Normalize et
      return {
        mainClaims: parsed.mainClaims || [],
        entities: {
          people: parsed.entities?.people || [],
          organizations: parsed.entities?.organizations || [],
          locations: parsed.entities?.locations || [],
          dates: parsed.entities?.dates || []
        },
        category: parsed.category || 'genel',
        confidence: this.normalizeConfidence(parsed.confidence),
        contradictions: parsed.contradictions || [],
        supportingEvidence: parsed.supportingEvidence || [],
        sentiment: parsed.sentiment || 'neutral',
        keyPoints: parsed.keyPoints || [],
        reasoning: parsed.reasoning || 'Analiz tamamlandı'
      };
    } catch (error) {
      console.error(' LLM yanıtı parse hatası:', error.message);
      return this.getFallbackAnalysis();
    }
  }

  /**
   * Güven seviyesini normalize et
   */
  normalizeConfidence(confidence) {
    if (!confidence) return 'low';
    
    const normalized = confidence.toLowerCase();
    
    if (normalized.includes('high') || normalized.includes('yüksek')) {
      return 'high';
    }
    if (normalized.includes('medium') || normalized.includes('orta')) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Fallback analiz (LLM başarısız olursa)
   */
  getFallbackAnalysis() {
    return {
      mainClaims: ['İddia analiz edilemedi'],
      entities: {
        people: [],
        organizations: [],
        locations: [],
        dates: []
      },
      category: 'genel',
      confidence: 'low',
      contradictions: [],
      supportingEvidence: [],
      sentiment: 'neutral',
      keyPoints: [],
      reasoning: 'LLM analizi başarısız oldu, manuel kontrol gerekli'
    };
  }

  /**
   * Kısa özet çıkar (100 karakterle sınırlı)
   */
  async generateSummary(content) {
    try {
      const prompt = `Aşağıdaki metni 100 karakterle sınırlı olarak özetle:\n\n${content}`;
      
      const completion = await this.groq.chat.completions.create({
        messages: [
          { role: 'system', content: 'Sen kısa ve öz özetler üreten bir asistandısın.' },
          { role: 'user', content: prompt }
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.3,
        max_tokens: 100
      });

      return completion.choices[0].message.content.substring(0, 100);
    } catch (error) {
      return content.substring(0, 100);
    }
  }
}

module.exports = new LLMProcessor();
