/**
 * TruthStream Skor Hesaplama Motoru
 * 
 * Ağırlıklandırılmış skor sistemi:
 * - Fact Check: 40 puan
 * - News API: 30 puan
 * - LLM Analizi: 20 puan
 * - Kaynak Güvenilirliği: 10 puan
 * 
 * Toplam: 100 puan
 */

class TruthScorer {
  constructor() {
    this.weights = {
      factCheckFound: 40,      // Fact check bulunması
      newsApiMatches: 30,      // Haber kaynaklarında eşleşme
      llmConfidence: 20,       // LLM güven skoru
      sourceCredibility: 10    // Kaynak güvenilirliği
    };
  }

  /**
   * Ana skor hesaplama
   */
  calculateFinalScore(data) {
    let totalScore = 0;
    let breakdown = {};

    // 1. Fact Check Sonucu (0-40 puan)
    const factCheckScore = this.evaluateFactCheck(data.factCheckResults);
    totalScore += factCheckScore;
    breakdown.factCheck = factCheckScore;

    // 2. News API Eşleşmeleri (0-30 puan)
    const newsScore = this.evaluateNewsMatches(data.newsApiResults);
    totalScore += newsScore;
    breakdown.newsApi = newsScore;

    // 3. LLM Güven Skoru (0-20 puan)
    const llmScore = this.evaluateLLMConfidence(data.llmAnalysis);
    totalScore += llmScore;
    breakdown.llm = llmScore;

    // 4. Kaynak Güvenilirliği (0-10 puan)
    const sourceScore = this.evaluateSourceCredibility(data.sourceUrl);
    totalScore += sourceScore;
    breakdown.source = sourceScore;

    return {
      finalScore: Math.round(totalScore),
      breakdown,
      verdict: this.getVerdict(totalScore),
      confidence: this.getConfidenceLevel(breakdown),
      reasoning: this.generateReasoning(breakdown, data)
    };
  }

  /**
   * Google Fact Check sonucunu değerlendir
   */
  evaluateFactCheck(factCheckResults) {
    if (!factCheckResults || factCheckResults.length === 0) {
      return 20; // Fact check bulunamadı, nötr
    }

    const ratings = factCheckResults.map(fc => {
      const rating = fc.claimReview?.[0]?.textualRating?.toLowerCase() || '';
      
      // Yüksek güvenilirlik - Doğru
      if (rating.includes('true') || rating.includes('doğru') || rating.includes('correct') || rating.includes('accurate')) {
        return 40;
      }
      // Kısmen doğru
      if (rating.includes('mostly') || rating.includes('partially') || rating.includes('kısmen') || rating.includes('mixed')) {
        return 25;
      }
      // Belirsiz
      if (rating.includes('unproven') || rating.includes('unclear') || rating.includes('belirsiz') || rating.includes('unverified')) {
        return 20;
      }
      // Yanıltıcı
      if (rating.includes('misleading') || rating.includes('yanıltıcı') || rating.includes('exaggerated')) {
        return 12;
      }
      // Yanlış
      if (rating.includes('false') || rating.includes('yanlış') || rating.includes('wrong') || rating.includes('fake')) {
        return 5;
      }
      
      return 20; // Bilinmeyen durum
    });

    // En yüksek skoru al (birden fazla fact check varsa en iyisi)
    return Math.max(...ratings);
  }

  /**
   * News API eşleşmelerini değerlendir
   */
  evaluateNewsMatches(newsResults) {
    if (!newsResults || newsResults.length === 0) {
      return 10; // Kaynak bulunamadı, düşük skor
    }

    const totalArticles = newsResults.length;
    const credibleSources = newsResults.filter(article => 
      this.isCredibleNewsSource(article.source?.name)
    ).length;

    // Güvenilir kaynak yüzdesi
    const credibilityRatio = credibleSources / totalArticles;
    
    // 0-30 arası skor
    let score = 10; // Base skor
    score += (credibilityRatio * 15); // Güvenilirlik bonusu (max 15)
    score += Math.min(totalArticles * 1, 5); // Kaynak sayısı bonusu (max 5)

    return Math.round(Math.min(score, 30));
  }

  /**
   * LLM analizini değerlendir
   */
  evaluateLLMConfidence(llmAnalysis) {
    if (!llmAnalysis) return 10;

    const { confidence, contradictions, supportingEvidence, sentiment } = llmAnalysis;

    let score = 10; // Base skor

    // Güven seviyesi
    if (confidence === 'high' || confidence === 'yüksek') {
      score += 10;
    } else if (confidence === 'medium' || confidence === 'orta') {
      score += 5;
    } else if (confidence === 'low' || confidence === 'düşük') {
      score += 0;
    }

    // Çelişkiler varsa düş
    if (contradictions && contradictions.length > 0) {
      score -= Math.min(contradictions.length * 2, 8);
    }

    // Destekleyici kanıtlar varsa artır
    if (supportingEvidence && supportingEvidence.length > 0) {
      score += Math.min(supportingEvidence.length * 2, 10);
    }

    // Sentiment analizi (opsiyonel)
    if (sentiment === 'manipulative' || sentiment === 'sensational') {
      score -= 5;
    }

    return Math.max(0, Math.min(score, 20));
  }

  /**
   * Kaynak güvenilirliğini değerlendir
   */
  evaluateSourceCredibility(sourceUrl) {
    if (!sourceUrl) return 5;

    const url = sourceUrl.toLowerCase();
    
    // Yüksek güvenilirlik - Uluslararası ve ulusal kurumsal medya
    const highCredibility = [
      'bbc', 'reuters', 'ap.org', 'theguardian', 'nytimes', 'washingtonpost',
      'trthaber', 'aa.com.tr', 'dw.com', 'bbc.com/turkce', 'aljazeera',
      'npr.org', 'pbs.org', 'apnews.com'
    ];
    
    // Orta güvenilirlik - Popüler haber siteleri
    const mediumCredibility = [
      'cnn', 'cnbc', 'forbes', 'bloomberg', 'time.com', 'economist',
      'hurriyet', 'milliyet', 'sabah', 'haberturk', 'ntv', 'cnnturk',
      'sozcu', 'cumhuriyet', 'yenicaggazetesi'
    ];

    // Düşük güvenilirlik - Kişisel bloglar ve sosyal medya
    const lowCredibility = [
      'sosyal', 'blog', 'forum', 'wordpress', 'blogspot', 'tumblr',
      'medium.com', 'facebook', 'twitter', 'instagram', 'tiktok',
      'youtube', 'reddit'
    ];

    if (highCredibility.some(domain => url.includes(domain))) {
      return 10;
    }
    if (mediumCredibility.some(domain => url.includes(domain))) {
      return 7;
    }
    if (lowCredibility.some(domain => url.includes(domain))) {
      return 3;
    }

    return 5; // Bilinmeyen kaynak
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
   * Skor bazlı karar ver
   */
  getVerdict(score) {
    if (score >= 80) {
      return { 
        tr: 'Yüksek Doğruluk', 
        en: 'Highly Accurate',
        emoji: '✅',
        color: '#22c55e'
      };
    }
    if (score >= 60) {
      return { 
        tr: 'Büyük Oranda Doğru', 
        en: 'Mostly True',
        emoji: '✔️',
        color: '#84cc16'
      };
    }
    if (score >= 40) {
      return { 
        tr: 'Belirsiz', 
        en: 'Uncertain',
        emoji: '⚠️',
        color: '#eab308'
      };
    }
    if (score >= 20) {
      return { 
        tr: 'Büyük Oranda Yanlış', 
        en: 'Mostly False',
        emoji: '❌',
        color: '#f97316'
      };
    }
    return { 
      tr: 'Yanlış', 
      en: 'False',
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

    // Fact check açıklaması
    if (breakdown.factCheck >= 35) {
      reasons.push('Fact-check kuruluşları iddiayı doğruladı');
    } else if (breakdown.factCheck <= 10) {
      reasons.push('Fact-check kuruluşları iddiayı yalanladı');
    } else if (breakdown.factCheck === 20) {
      reasons.push('Fact-check kuruluşlarında sonuç bulunamadı');
    }



    // News API açıklaması
    if (breakdown.newsApi >= 25) {
      reasons.push(`${data.newsApiResults?.length || 0} güvenilir haber kaynağı bulundu`);
    } else if (breakdown.newsApi <= 12) {
      reasons.push('Güvenilir haber kaynaklarında doğrulama bulunamadı');
    }

    // LLM açıklaması
    if (breakdown.llm >= 18) {
      reasons.push('AI analizi yüksek güven seviyesi gösterdi');
    } else if (breakdown.llm <= 8) {
      reasons.push('AI analizi çelişkiler tespit etti');
    }

    // Kaynak açıklaması
    if (breakdown.source >= 9) {
      reasons.push('Kaynak yüksek güvenilirliğe sahip');
    } else if (breakdown.source <= 4) {
      reasons.push('Kaynak güvenilirliği düşük');
    }

    return reasons;
  }
}

module.exports = new TruthScorer();
