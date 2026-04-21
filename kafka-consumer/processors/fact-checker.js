/**
 * Google Fact Check API Entegrasyonu
 * 
 * Google Fact Check Tools API kullanarak:
 * - İddiaları doğrular
 * - Fact-check kuruluşlarının sonuçlarını getirir
 * - Textual rating analizi yapar
 */

require('dotenv').config();
const axios = require('axios');

class FactChecker {
  constructor() {
    this.apiKey = process.env.GOOGLE_FACT_CHECK_API_KEY;
    this.baseUrl = 'https://factchecktools.googleapis.com/v1alpha1/claims:search';
    this.maxResults = 5; // Maksimum sonuç sayısı
  }

  /**
   * İddiayı fact-check API'de ara
   */
  async checkClaim(claim, languageCode = 'tr') {
    if (!this.apiKey) {
      console.warn('⚠️ Google Fact Check API key bulunamadı');
      return [];
    }

    try {
      console.log(`🔍 Fact-check sorgusu: "${claim.substring(0, 50)}..."`);

      const response = await axios.get(this.baseUrl, {
        params: {
          key: this.apiKey,
          query: claim,
          languageCode: languageCode,
          pageSize: this.maxResults
        },
        timeout: 10000 // 10 saniye timeout
      });

      const claims = response.data.claims || [];
      
      if (claims.length === 0) {
        console.log('ℹ️ Fact-check sonucu bulunamadı');
        return [];
      }

      console.log(`✅ ${claims.length} fact-check sonucu bulundu`);
      
      return claims.map(claim => this.normalizeClaim(claim));
    } catch (error) {
      // If the service is temporarily unavailable, mark it explicitly so
      // the scoring system doesn't treat it as "no evidence found".
      const status = error.response?.status;
      if (status && status >= 500) {
        console.error(`❌ Fact Check API unavailable (HTTP ${status})`);
        return [{ __unavailable: true, status }];
      }
      if (error.response?.status === 429) {
        console.error('⚠️ Fact Check API rate limit aşıldı');
      } else if (error.code === 'ECONNABORTED') {
        console.error('⚠️ Fact Check API timeout');
      } else {
        console.error('❌ Fact Check API hatası:', error.message);
      }
      return [];
    }
  }

  /**
   * Birden fazla iddiayı kontrol et
   */
  async checkMultipleClaims(claims, languageCode = 'tr') {
    const results = [];

    for (const claim of claims) {
      const result = await this.checkClaim(claim, languageCode);
      results.push(...result);
      
      // Rate limit için kısa bekleme
      await this.sleep(500);
    }

    return this.deduplicateResults(results);
  }

  /**
   * Claim nesnesini normalize et
   */
  normalizeClaim(claim) {
    const claimReview = claim.claimReview?.[0];
    
    return {
      text: claim.text || '',
      claimant: claim.claimant || 'Bilinmiyor',
      claimDate: claim.claimDate || null,
      claimReview: claim.claimReview || [],
      publisher: {
        name: claimReview?.publisher?.name || 'Bilinmiyor',
        site: claimReview?.publisher?.site || null
      },
      rating: {
        textual: claimReview?.textualRating || 'Bilinmiyor',
        normalized: this.normalizeRating(claimReview?.textualRating)
      },
      url: claimReview?.url || null,
      title: claimReview?.title || '',
      reviewDate: claimReview?.reviewDate || null,
      languageCode: claimReview?.languageCode || 'tr'
    };
  }

  /**
   * Rating'i normalize et (0-100 arası)
   */
  normalizeRating(textualRating) {
    if (!textualRating) return 50; // Bilinmeyen

    const rating = textualRating.toLowerCase();

    // Tamamen doğru
    if (rating.includes('true') || rating.includes('doğru') || rating.includes('correct')) {
      return 95;
    }

    // Büyük oranda doğru
    if (rating.includes('mostly true') || rating.includes('büyük oranda doğru')) {
      return 75;
    }

    // Kısmen doğru / Karışık
    if (rating.includes('half true') || rating.includes('mixed') || rating.includes('kısmen')) {
      return 50;
    }

    // Büyük oranda yanlış
    if (rating.includes('mostly false') || rating.includes('büyük oranda yanlış')) {
      return 25;
    }

    // Tamamen yanlış
    if (rating.includes('false') || rating.includes('yanlış') || rating.includes('wrong') || rating.includes('fake')) {
      return 5;
    }

    // Yanıltıcı
    if (rating.includes('misleading') || rating.includes('yanıltıcı')) {
      return 30;
    }

    // İspatlanamaz
    if (rating.includes('unproven') || rating.includes('unverified') || rating.includes('belirsiz')) {
      return 50;
    }

    return 50; // Varsayılan
  }

  /**
   * En iyi fact-check sonucunu bul
   */
  getBestFactCheck(factCheckResults) {
    if (!factCheckResults || factCheckResults.length === 0) {
      return null;
    }

    // Güvenilirlik sıralaması
    const crediblePublishers = [
      'Snopes', 'FactCheck.org', 'PolitiFact', 'AFP Fact Check',
      'Reuters Fact Check', 'BBC Reality Check', 'Teyit.org',
      'Doğruluk Payı', 'Google Fact Check'
    ];

    // Önce güvenilir publisher'lardan ara
    for (const publisher of crediblePublishers) {
      const found = factCheckResults.find(fc => 
        fc.publisher.name.includes(publisher)
      );
      if (found) return found;
    }

    // Bulunamazsa rating'e göre en yüksek skoru al
    return factCheckResults.reduce((best, current) => {
      return current.rating.normalized > best.rating.normalized ? current : best;
    });
  }

  /**
   * Fact-check sonuçlarını özetle
   */
  summarizeResults(factCheckResults) {
    if (Array.isArray(factCheckResults) && factCheckResults[0]?.__unavailable) {
      return {
        found: false,
        count: 0,
        verdict: 'Servis geçici olarak kullanılamadı',
        confidence: 'low',
        sources: [],
        unavailable: true,
        status: factCheckResults[0]?.status
      };
    }
    if (!factCheckResults || factCheckResults.length === 0) {
      return {
        found: false,
        count: 0,
        verdict: 'Bilinmiyor',
        confidence: 'low',
        sources: []
      };
    }

    const bestResult = this.getBestFactCheck(factCheckResults);
    const avgRating = factCheckResults.reduce((sum, fc) => sum + fc.rating.normalized, 0) / factCheckResults.length;

    return {
      found: true,
      count: factCheckResults.length,
      verdict: bestResult.rating.textual,
      confidence: this.getConfidenceLevel(factCheckResults.length, avgRating),
      sources: factCheckResults.map(fc => ({
        publisher: fc.publisher.name,
        rating: fc.rating.textual,
        url: fc.url
      })),
      bestMatch: bestResult,
      averageScore: Math.round(avgRating)
    };
  }

  /**
   * Güven seviyesini belirle
   */
  getConfidenceLevel(resultCount, avgRating) {
    // 3+ kaynak ve net sonuç = yüksek güven
    if (resultCount >= 3 && (avgRating >= 80 || avgRating <= 20)) {
      return 'high';
    }
    // 2+ kaynak veya orta net sonuç = orta güven
    if (resultCount >= 2 || (avgRating >= 60 && avgRating <= 40)) {
      return 'medium';
    }
    // Az kaynak = düşük güven
    return 'low';
  }

  /**
   * Sonuçları deduplicate et (aynı claim'i birden fazla kez ekleme)
   */
  deduplicateResults(results) {
    const seen = new Set();
    return results.filter(result => {
      const key = `${result.text}-${result.publisher.name}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Yardımcı fonksiyon: Bekleme
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}


module.exports = new FactChecker();
