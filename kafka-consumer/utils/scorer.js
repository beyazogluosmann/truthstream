/**
 * TruthStream Skor Hesaplama Motoru - AI-FIRST! 🤖
 * 
 * YENİ AI-FIRST Ağırlıklandırılmış skor sistemi:
 * - LLM (Groq) Analizi: 60 puan (ASIL KARAR VERİCİ!)
 * - Fact Check: 20 puan (Destekleyici)
 * - News API: 15 puan (Destekleyici)
 * - Kaynak Güvenilirliği: 5 puan (Bonus)
 * 
 * Toplam: 100 puan
 * 
 * PRENSİP: AI KARAR VERİR, DİĞERLERİ DESTEKLER!
 */

class TruthScorer {
  constructor() {
    this.weights = {
      llmConfidence: 60,       // LLM ASIL KARAR VERİCİ
      factCheckFound: 20,      // Fact check destekleyici
      newsApiMatches: 15,      // Haber kaynakları destekleyici
      sourceCredibility: 5     // Kaynak bonus
    };
  }

  /**
   * Ana skor hesaplama - AI-FIRST SİSTEM! 🤖
   */
  calculateFinalScore(data) {
    let totalScore = 0;
    let breakdown = {};

    // 1. LLM Güven Skoru (0-60 puan) - ASIL KARAR VERİCİ! 🤖
    const llmScore = this.evaluateLLMConfidence(data.llmAnalysis);
    totalScore += llmScore;
    breakdown.llm = llmScore;

    // 2. Fact Check Sonucu (0-20 puan) - Destekleyici
    const factCheckScore = this.evaluateFactCheck(data.factCheckResults);
    totalScore += factCheckScore;
    breakdown.factCheck = factCheckScore;

    // 3. News API Eşleşmeleri (0-15 puan) - Destekleyici
    const newsScore = this.evaluateNewsMatches(data.newsApiResults);
    totalScore += newsScore;
    breakdown.newsApi = newsScore;

    // 4. Kaynak Güvenilirliği (0-5 puan) - Bonus
    const sourceScore = this.evaluateSourceCredibility(data.sourceUrl);
    totalScore += sourceScore;
    breakdown.source = sourceScore;

    // BONUS: Dış kaynaklar AI'yı desteklerse +10 puan
    const credibleNewsCount = this.countCredibleNews(data.newsApiResults);
    const factCheckUnavailable = this.isFactCheckUnavailable(data.factCheckResults);
    const hasFactCheck = Array.isArray(data.factCheckResults) && data.factCheckResults.length > 0 && !factCheckUnavailable;
    
    // AI yüksek güven + dış kanıt varsa = BONUS!
    if (llmScore >= 40 && (hasFactCheck || credibleNewsCount > 0)) {
      const bonus = Math.min(10, (hasFactCheck ? 5 : 0) + credibleNewsCount * 2);
      totalScore += bonus;
      breakdown.evidenceBonus = bonus;
    }

    // Skor limiti: max 100
    totalScore = Math.min(totalScore, 100);

    return {
      finalScore: Math.round(totalScore),
      breakdown,
      verdict: this.getVerdict(totalScore),
      confidence: this.getConfidenceLevel(breakdown),
      reasoning: this.generateReasoning(breakdown, data)
    };
  }

  /**
   * Google Fact Check sonucunu değerlendir - Destekleyici (0-20)
   */
  evaluateFactCheck(factCheckResults) {
    if (this.isFactCheckUnavailable(factCheckResults)) {
      return 10; // Servis çalışmıyorsa nötr
    }
    if (!factCheckResults || factCheckResults.length === 0) {
      return 5; // Bulunamadı ama AI'ya güveniyoruz
    }

    const ratings = factCheckResults.map(fc => {
      const rating = fc.claimReview?.[0]?.textualRating?.toLowerCase() || '';
      
      // Doğru
      if (rating.includes('true') || rating.includes('doğru') || rating.includes('correct') || rating.includes('accurate')) {
        return 20;
      }
      // Kısmen doğru
      if (rating.includes('mostly') || rating.includes('partially') || rating.includes('kısmen') || rating.includes('mixed')) {
        return 15;
      }
      // Belirsiz
      if (rating.includes('unproven') || rating.includes('unclear') || rating.includes('belirsiz') || rating.includes('unverified')) {
        return 10;
      }
      // Yanıltıcı
      if (rating.includes('misleading') || rating.includes('yanıltıcı') || rating.includes('exaggerated')) {
        return 5;
      }
      // Yanlış
      if (rating.includes('false') || rating.includes('yanlış') || rating.includes('wrong') || rating.includes('fake')) {
        return 0;
      }
      
      return 10;
    });

    return Math.max(...ratings);
  }

  /**
   * News API eşleşmelerini değerlendir - Destekleyici (0-15)
   */
  evaluateNewsMatches(newsResults) {
    if (!newsResults || newsResults.length === 0) {
      return 3; // Haber yok ama AI'ya güveniyoruz
    }

    const credibleSources = newsResults.filter(article => 
      this.isCredibleNewsSource(article.source?.name)
    ).length;

    if (credibleSources === 0) {
      return 5; // Kaynak var ama güvenilir değil
    }

    // Güvenilir kaynak sayısına göre
    if (credibleSources >= 5) return 15; // Tam puan
    if (credibleSources >= 3) return 13;
    if (credibleSources >= 2) return 10;
    if (credibleSources >= 1) return 8;

    return 5;
  }

  /**
   * LLM analizini değerlendir - ASIL KARAR VERİCİ! (0-60 puan) 🤖
   */
  evaluateLLMConfidence(llmAnalysis) {
    if (!llmAnalysis) return 20; // Base orta skor

    const { confidence, contradictions, supportingEvidence, sentiment, category } = llmAnalysis;

    let score = 20; // Base skor

    // GÜVEN SEVİYESİ (Ana faktör)
    if (confidence === 'high' || confidence === 'yüksek') {
      score = 50; // Yüksek güven = 50 puan base
    } else if (confidence === 'medium' || confidence === 'orta') {
      score = 30; // Orta güven = 30 puan base
    } else if (confidence === 'low' || confidence === 'düşük') {
      score = 15; // Düşük güven = 15 puan base
    }

    // Çelişkiler varsa cezalandır
    if (contradictions && contradictions.length > 0) {
      score -= Math.min(contradictions.length * 5, 15);
    }

    // Destekleyici kanıtlar varsa ödüllendir
    if (supportingEvidence && supportingEvidence.length > 0) {
      score += Math.min(supportingEvidence.length * 3, 15);
    }

    // Sentiment/Manipülasyon kontrolü
    if (sentiment === 'manipulative' || sentiment === 'sensational') {
      score -= 10;
    } else if (sentiment === 'neutral' || sentiment === 'informative') {
      score += 5;
    }

    return Math.max(0, Math.min(score, 60));
  }

  /**
   * Kaynak güvenilirliğini değerlendir - AZALTILDI (0-5 puan)
   */
  evaluateSourceCredibility(sourceUrl) {
    if (!sourceUrl) return 1;

    const url = sourceUrl.toLowerCase();
    
    // Yüksek güvenilirlik
    const highCredibility = [
      'bbc', 'reuters', 'ap.org', 'theguardian', 'nytimes', 'washingtonpost',
      'trthaber', 'aa.com.tr', 'dw.com', 'bbc.com/turkce', 'aljazeera',
      'npr.org', 'pbs.org', 'apnews.com'
    ];
    
    // Orta güvenilirlik
    const mediumCredibility = [
      'cnn', 'cnbc', 'forbes', 'bloomberg', 'time.com', 'economist',
      'hurriyet', 'milliyet', 'sabah', 'haberturk', 'ntv', 'cnnturk',
      'sozcu', 'cumhuriyet', 'yenicaggazetesi'
    ];

    // Düşük güvenilirlik
    const lowCredibility = [
      'sosyal', 'blog', 'forum', 'wordpress', 'blogspot', 'tumblr',
      'medium.com', 'facebook', 'twitter', 'instagram', 'tiktok',
      'youtube', 'reddit'
    ];

    if (highCredibility.some(domain => url.includes(domain))) {
      return 5; // AZALTILDI: eskiden 10
    }
    if (mediumCredibility.some(domain => url.includes(domain))) {
      return 3; // AZALTILDI: eskiden 7
    }
    if (lowCredibility.some(domain => url.includes(domain))) {
      return 1; // AZALTILDI: eskiden 3
    }

    return 2; // Bilinmeyen kaynak
  }

  countCredibleNews(newsResults) {
    if (!Array.isArray(newsResults)) return 0;
    return newsResults.filter(a => this.isCredibleNewsSource(a.source?.name)).length;
  }

  isHighRiskClaim(text) {
    const t = String(text || '').toLowerCase();
    if (!t) return false;
    const patterns = [
      /\böldü\b/,
      /\bvefat\b/,
      /\bşehit\b/,
      /\bdeprem\b/,
      /\btsunami\b/,
      /\bsavaş\b/,
      /\bsaldırı\b/,
      /\bbomba\b/,
      /\bsuikast\b/,
      /\bacil\b/,
      /\bson dakika\b/,
      /!!!!+/,
      /\bşok\b/
    ];
    return patterns.some(p => p.test(t));
  }

  /**
   * Güvenilir haber kaynağı kontrolü
   */
  isCredibleNewsSource(sourceName) {
    if (!sourceName) return false;
    
    const credibleSources = [
      'BBC', 'Reuters', 'Associated Press', 'The Guardian', 'New York Times',
      'TRT Haber', 'Anadolu Ajansı', 'DW', 'Al Jazeera', 'CNN',
      'NPR', 'PBS', 'Bloomberg', 'Financial Times', 'The Economist',
      'Washington Post', 'CNBC', 'Forbes', 'Hürriyet', 'Milliyet',
      'NTV', 'Habertürk', 'Sözcü', 'Cumhuriyet'
    ];

    return credibleSources.some(source => 
      sourceName.toLowerCase().includes(source.toLowerCase())
    );
  }

  /**
   * Skor bazlı karar ver - GÜNCELLENDİ
   */
  getVerdict(score) {
    if (score >= 75) {
      return { 
        tr: 'Doğrulanmış', 
        en: 'Verified',
        emoji: '✅',
        color: '#22c55e'
      };
    }
    if (score >= 55) {
      return { 
        tr: 'Büyük Oranda Doğru', 
        en: 'Mostly True',
        emoji: '✔️',
        color: '#84cc16'
      };
    }
    if (score >= 35) {
      return { 
        tr: 'Belirsiz', 
        en: 'Uncertain',
        emoji: '⚠️',
        color: '#eab308'
      };
    }
    if (score >= 15) {
      return { 
        tr: 'Şüpheli', 
        en: 'Doubtful',
        emoji: '❌',
        color: '#f97316'
      };
    }
    return { 
      tr: 'Doğrulanmamış', 
      en: 'Unverified',
      emoji: '🚫',
      color: '#ef4444'
    };
  }

  /**
   * Güven seviyesi hesapla
   */
  getConfidenceLevel(breakdown) {
    const scores = Object.values(breakdown);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    
    if (avgScore >= 25) return 'high';
    if (avgScore >= 15) return 'medium';
    return 'low';
  }

  /**
   * Skor için açıklama oluştur
   */
  generateReasoning(breakdown, data) {
    const reasons = [];

    // LLM (ASIL KARAR VERİCİ)
    if (breakdown.llm >= 45) {
      reasons.push('🤖 AI analizi yüksek güvenle DOĞRU buldu');
    } else if (breakdown.llm >= 30) {
      reasons.push('🤖 AI analizi orta güvenle değerlendirdi');
    } else if (breakdown.llm >= 15) {
      reasons.push('⚠️ AI analizi düşük güven gösterdi');
    } else {
      reasons.push('❌ AI analizi şüpheli veya manipülatif buldu');
    }

    // Bonus açıklaması
    if (breakdown.evidenceBonus) {
      reasons.push(`✨ Dış kaynaklar AI analizini destekledi (+${breakdown.evidenceBonus} bonus)`);
    }

    // Fact check
    if (breakdown.factCheck >= 15) {
      reasons.push('✅ Fact-check kuruluşları doğruluyor');
    } else if (breakdown.factCheck <= 5 && !this.isFactCheckUnavailable(data.factCheckResults)) {
      reasons.push('⚠️ Fact-check kuruluşları şüpheli buluyor');
    }

    // News API
    const credibleCount = this.countCredibleNews(data.newsApiResults);
    if (credibleCount >= 3) {
      reasons.push(`📰 ${credibleCount} güvenilir haber kaynağı destekliyor`);
    } else if (credibleCount === 0 && (data.newsApiResults?.length || 0) === 0) {
      reasons.push('📰 Haber kaynaklarında bulunamadı');
    }

    // Kaynak
    if (breakdown.source >= 4) {
      reasons.push('🔗 Kaynak yüksek güvenilirliğe sahip');
    }

    return reasons;
  }

  isFactCheckUnavailable(factCheckResults) {
    return Array.isArray(factCheckResults) && factCheckResults[0]?.__unavailable === true;
  }
}

module.exports = new TruthScorer();
