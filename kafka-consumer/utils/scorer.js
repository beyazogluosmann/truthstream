/**
 * TruthStream Skor Hesaplama Motoru - KANİT ODAKLI
 * 
 * YENİ Ağırlıklandırılmış skor sistemi:
 * - Fact Check: 50 puan (EN ÖNEMLİ!)
 * - News API: 30 puan
 * - LLM Analizi: 15 puan
 * - Kaynak Güvenilirliği: 5 puan
 * 
 * Toplam: 100 puan
 * 
 * PRENSİP: KANITLAR VARSA YÜKSEK, YOKSA DÜŞÜK!
 */

class TruthScorer {
  constructor() {
    this.weights = {
      factCheckFound: 50,      // Fact check EN ÖNEMLİ
      newsApiMatches: 30,      // Haber kaynakları ÖNEMLİ
      llmConfidence: 15,       // LLM yardımcı
      sourceCredibility: 5     // Kaynak bonus
    };
  }

  /**
   * Ana skor hesaplama - KANİT ODAKLI SİSTEM
   */
  calculateFinalScore(data) {
    let totalScore = 0;
    let breakdown = {};

    // 1. Fact Check Sonucu (0-50 puan) - ARTIK DAHA ÖNEMLİ
    const factCheckScore = this.evaluateFactCheck(data.factCheckResults);
    totalScore += factCheckScore;
    breakdown.factCheck = factCheckScore;

    // 2. News API Eşleşmeleri (0-30 puan)
    const newsScore = this.evaluateNewsMatches(data.newsApiResults);
    totalScore += newsScore;
    breakdown.newsApi = newsScore;

    // 3. LLM Güven Skoru (0-15 puan) - AZALTILDI
    const llmScore = this.evaluateLLMConfidence(data.llmAnalysis);
    totalScore += llmScore;
    breakdown.llm = llmScore;

    // 4. Kaynak Güvenilirliği (0-5 puan) - AZALTILDI
    const sourceScore = this.evaluateSourceCredibility(data.sourceUrl);
    totalScore += sourceScore;
    breakdown.source = sourceScore;

    // KRİTİK: KANITLAR YOKSA SKOR DÜŞÜK OLMALI!
    const credibleNewsCount = this.countCredibleNews(data.newsApiResults);
    const factCheckUnavailable = this.isFactCheckUnavailable(data.factCheckResults);
    const hasFactCheck = Array.isArray(data.factCheckResults) && data.factCheckResults.length > 0 && !factCheckUnavailable;
    const claimText = String(data.claimText || '');

    // KANIT YOK = DÜŞÜK SKOR
    if (!hasFactCheck && credibleNewsCount === 0) {
      // Hiç kanıt bulunamadı - maksimum 25 puan
      totalScore = Math.min(totalScore, 25);
      breakdown.noEvidencePenalty = true;
    } else if (!hasFactCheck && credibleNewsCount < 2) {
      // Sadece 1 haber var, fact check yok - maksimum 40 puan
      totalScore = Math.min(totalScore, 40);
      breakdown.weakEvidencePenalty = true;
    }

    // Yüksek riskli iddialar için daha da sıkı
    if (this.isHighRiskClaim(claimText)) {
      if (!hasFactCheck && credibleNewsCount < 3) {
        totalScore = Math.min(totalScore, 20);
        breakdown.highRiskPenalty = true;
      }
    }

    return {
      finalScore: Math.round(totalScore),
      breakdown,
      verdict: this.getVerdict(totalScore),
      confidence: this.getConfidenceLevel(breakdown),
      reasoning: this.generateReasoning(breakdown, data)
    };
  }

  /**
   * Google Fact Check sonucunu değerlendir - DAHA AGRESİF
   */
  evaluateFactCheck(factCheckResults) {
    if (this.isFactCheckUnavailable(factCheckResults)) {
      return 15; // Servis çalışmıyorsa nötr, ama düşük
    }
    if (!factCheckResults || factCheckResults.length === 0) {
      return 0; // BULUNAMADI = 0 PUAN! (Eskiden 10 puandı)
    }

    const ratings = factCheckResults.map(fc => {
      const rating = fc.claimReview?.[0]?.textualRating?.toLowerCase() || '';
      
      // Yüksek güvenilirlik - Doğru
      if (rating.includes('true') || rating.includes('doğru') || rating.includes('correct') || rating.includes('accurate')) {
        return 50; // ARTIK 50 PUAN
      }
      // Kısmen doğru
      if (rating.includes('mostly') || rating.includes('partially') || rating.includes('kısmen') || rating.includes('mixed')) {
        return 30;
      }
      // Belirsiz
      if (rating.includes('unproven') || rating.includes('unclear') || rating.includes('belirsiz') || rating.includes('unverified')) {
        return 15;
      }
      // Yanıltıcı
      if (rating.includes('misleading') || rating.includes('yanıltıcı') || rating.includes('exaggerated')) {
        return 8;
      }
      // Yanlış
      if (rating.includes('false') || rating.includes('yanlış') || rating.includes('wrong') || rating.includes('fake')) {
        return 2; // Yanlış olduğu kanıtlanmış = çok düşük
      }
      
      return 15; // Bilinmeyen durum
    });

    // En yüksek skoru al
    return Math.max(...ratings);
  }

  /**
   * News API eşleşmelerini değerlendir - DAHA AGRESİF
   */
  evaluateNewsMatches(newsResults) {
    if (!newsResults || newsResults.length === 0) {
      return 0; // Hiç kaynak yok = 0 PUAN!
    }

    const totalArticles = newsResults.length;
    const credibleSources = newsResults.filter(article => 
      this.isCredibleNewsSource(article.source?.name)
    ).length;

    // Güvenilir kaynak yoksa minimal puan
    if (credibleSources === 0) {
      return 2; // Kaynak var ama güvenilir değil
    }

    // Güvenilir kaynak sayısına göre agresif skorlama
    let score = 0;
    
    if (credibleSources >= 5) {
      score = 30; // 5+ güvenilir kaynak = TAM PUAN
    } else if (credibleSources >= 3) {
      score = 25; // 3-4 güvenilir kaynak = çok iyi
    } else if (credibleSources >= 2) {
      score = 18; // 2 güvenilir kaynak = iyi
    } else if (credibleSources === 1) {
      score = 10; // 1 güvenilir kaynak = orta
    }

    return Math.round(score);
  }

  /**
   * LLM analizini değerlendir - AZALTILDI (0-15 puan)
   */
  evaluateLLMConfidence(llmAnalysis) {
    if (!llmAnalysis) return 3;

    const { confidence, contradictions, supportingEvidence, sentiment } = llmAnalysis;

    let score = 3; // Base skor

    // Güven seviyesi
    if (confidence === 'high' || confidence === 'yüksek') {
      score += 8;
    } else if (confidence === 'medium' || confidence === 'orta') {
      score += 4;
    } else if (confidence === 'low' || confidence === 'düşük') {
      score += 0;
    }

    // Çelişkiler varsa düş
    if (contradictions && contradictions.length > 0) {
      score -= Math.min(contradictions.length * 2, 6);
    }

    // Destekleyici kanıtlar varsa artır
    if (supportingEvidence && supportingEvidence.length > 0) {
      score += Math.min(supportingEvidence.length, 6);
    }

    // Sentiment analizi
    if (sentiment === 'manipulative' || sentiment === 'sensational') {
      score -= 4;
    }

    return Math.max(0, Math.min(score, 15));
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

    // Fact check açıklaması
    if (this.isFactCheckUnavailable(data.factCheckResults)) {
      reasons.push('⚠️ Fact-check servisine geçici olarak ulaşılamadı');
    } else if (breakdown.factCheck >= 40) {
      reasons.push('✅ Fact-check kuruluşları iddiayı doğruladı');
    } else if (breakdown.factCheck >= 25) {
      reasons.push('📊 Fact-check kuruluşları kısmen doğru buldu');
    } else if (breakdown.factCheck <= 5) {
      reasons.push('❌ Fact-check kuruluşları iddiayı yalanladı');
    } else if (breakdown.factCheck === 0) {
      reasons.push('🔍 Fact-check kuruluşlarında sonuç bulunamadı');
    }

    // News API açıklaması
    const newsCount = data.newsApiResults?.length || 0;
    const credibleCount = this.countCredibleNews(data.newsApiResults);
    
    if (breakdown.newsApi >= 25) {
      reasons.push(`📰 ${credibleCount} güvenilir haber kaynağında doğrulandı`);
    } else if (breakdown.newsApi >= 15) {
      reasons.push(`📰 ${credibleCount} güvenilir haber kaynağında bulundu`);
    } else if (breakdown.newsApi === 0 && newsCount === 0) {
      reasons.push('❌ Haber kaynaklarında hiç bulunmadı');
    } else if (breakdown.newsApi <= 5 && credibleCount === 0) {
      reasons.push('⚠️ Güvenilir haber kaynaklarında bulunamadı');
    }

    // LLM açıklaması
    if (breakdown.llm >= 12) {
      reasons.push('🤖 AI analizi yüksek güven seviyesi gösterdi');
    } else if (breakdown.llm <= 4) {
      reasons.push('⚠️ AI analizi çelişkiler veya manipülasyon tespit etti');
    }

    // Kaynak açıklaması
    if (breakdown.source >= 4) {
      reasons.push('🔗 Kaynak yüksek güvenilirliğe sahip');
    } else if (breakdown.source <= 1) {
      reasons.push('⚠️ Kaynak güvenilirliği düşük veya bilinmiyor');
    }

    // Kanıt eksikliği uyarıları
    if (breakdown.noEvidencePenalty) {
      reasons.push('⛔ UYARI: Hiç dış kanıt bulunamadı!');
    } else if (breakdown.weakEvidencePenalty) {
      reasons.push('⚠️ UYARI: Kanıt yetersiz!');
    } else if (breakdown.highRiskPenalty) {
      reasons.push('🚨 UYARI: Yüksek riskli iddia, yetersiz kanıt!');
    }

    return reasons;
  }

  isFactCheckUnavailable(factCheckResults) {
    return Array.isArray(factCheckResults) && factCheckResults[0]?.__unavailable === true;
  }
}

module.exports = new TruthScorer();
