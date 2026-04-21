/**
 * News API Entegrasyonu
 * 
 * İddiayla ilgili haberleri arar ve:
 * - Güvenilir haber kaynaklarından sonuçlar getirir
 * - Kaynak güvenilirliğini değerlendirir
 * - İlgili makaleleri döndürür
 */

require('dotenv').config();
const axios = require('axios');

class NewsSearcher {
  constructor() {
    this.apiKey = process.env.NEWS_API_KEY;
    this.baseUrl = 'https://newsapi.org/v2';
    this.maxResults = 10;
  }

  /**
   * Ana arama fonksiyonu
   */
  async searchNews(query, options = {}) {
    if (!this.apiKey) {
      console.warn(' News API key bulunamadı');
      return [];
    }

    try {
      const searchQuery = this.buildSearchQuery(query, options);
      console.log(` News API sorgusu: "${searchQuery.substring(0, 50)}..."`);

      const response = await axios.get(`${this.baseUrl}/everything`, {
        params: {
          apiKey: this.apiKey,
          q: searchQuery,
          language: options.language || 'tr',
          sortBy: options.sortBy || 'relevancy',
          pageSize: this.maxResults,
          from: options.from || this.getLastWeekDate(),
          to: options.to || this.getTodayDate()
        },
        timeout: 10000
      });

      const articles = response.data.articles || [];
      
      if (articles.length === 0) {
        console.log('ℹ News API sonucu bulunamadı');
        return [];
      }

      console.log(` ${articles.length} haber bulundu`);
      
      return articles.map(article => this.normalizeArticle(article));
    } catch (error) {
      if (error.response?.status === 429) {
        console.error(' News API rate limit aşıldı');
      } else if (error.response?.status === 426) {
        console.error(' News API upgrade gerekli');
      } else if (error.code === 'ECONNABORTED') {
        console.error(' News API timeout');
      } else {
        console.error(' News API hatası:', error.message);
      }
      return [];
    }
  }

  /**
   * Türkçe haber kaynakları için özel arama
   */
  async searchTurkishNews(query, options = {}) {
    // Türkiye'deki güvenilir kaynaklar
    const turkishSources = [
      'trthaber.com',
      'aa.com.tr',
      'bbc.com',
      'dw.com',
      'aljazeera.com'
    ].join(',');

    return await this.searchNews(query, {
      ...options,
      language: 'tr',
      domains: turkishSources
    });
  }

  /**
   * Top headlines'dan ara
   */
  async searchTopHeadlines(query, options = {}) {
    if (!this.apiKey) {
      console.warn(' News API key bulunamadı');
      return [];
    }

    try {
      const response = await axios.get(`${this.baseUrl}/top-headlines`, {
        params: {
          apiKey: this.apiKey,
          q: query,
          country: options.country || 'tr',
          category: options.category || null,
          pageSize: this.maxResults
        },
        timeout: 10000
      });

      const articles = response.data.articles || [];
      return articles.map(article => this.normalizeArticle(article));
    } catch (error) {
      console.error(' Top Headlines API hatası:', error.message);
      return [];
    }
  }

  /**
   * Arama sorgusunu optimize et
   */
  buildSearchQuery(query, options = {}) {
    let searchQuery = query;

    // Gereksiz kelimeleri temizle
    searchQuery = searchQuery.replace(/\b(iddia|söylendi|dedi|açıkladı)\b/gi, '');
    
    // Fazla boşlukları temizle
    searchQuery = searchQuery.replace(/\s+/g, ' ').trim();

    // Tırnak içine al (exact match için)
    if (options.exactMatch) {
      searchQuery = `"${searchQuery}"`;
    }

    // Exclude keywords
    if (options.exclude) {
      const excludeTerms = Array.isArray(options.exclude) ? options.exclude : [options.exclude];
      excludeTerms.forEach(term => {
        searchQuery += ` -${term}`;
      });
    }

    return searchQuery;
  }

  /**
   * Article nesnesini normalize et
   */
  normalizeArticle(article) {
    return {
      source: {
        id: article.source?.id || null,
        name: article.source?.name || 'Bilinmiyor',
        credibility: this.evaluateSourceCredibility(article.source?.name)
      },
      author: article.author || 'Bilinmiyor',
      title: article.title || '',
      description: article.description || '',
      url: article.url || '',
      urlToImage: article.urlToImage || null,
      publishedAt: article.publishedAt || null,
      content: article.content || '',
      relevanceScore: this.calculateRelevance(article)
    };
  }

  /**
   * Kaynak güvenilirliğini değerlendir
   */
  evaluateSourceCredibility(sourceName) {
    if (!sourceName) return 'low';

    const name = sourceName.toLowerCase();

    // Çok yüksek güvenilirlik
    const veryHighCredibility = [
      'reuters', 'associated press', 'bbc', 'the guardian',
      'anadolu ajansı', 'trt haber', 'dw', 'al jazeera'
    ];

    // Yüksek güvenilirlik
    const highCredibility = [
      'cnn', 'nyt', 'washington post', 'bloomberg', 'financial times',
      'hürriyet', 'milliyet', 'ntv', 'habertürk', 'sözcü'
    ];

    // Orta güvenilirlik
    const mediumCredibility = [
      'cnbc', 'forbes', 'time', 'newsweek',
      'sabah', 'posta', 'star', 'yeniçağ'
    ];

    if (veryHighCredibility.some(s => name.includes(s))) {
      return 'very-high';
    }
    if (highCredibility.some(s => name.includes(s))) {
      return 'high';
    }
    if (mediumCredibility.some(s => name.includes(s))) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * İlgililik skoru hesapla
   */
  calculateRelevance(article) {
    let score = 50; // Base skor

    // Kaynak güvenilirliği
    const credibility = this.evaluateSourceCredibility(article.source?.name);
    if (credibility === 'very-high') score += 20;
    else if (credibility === 'high') score += 15;
    else if (credibility === 'medium') score += 10;

    // Yayın tarihi (yeni haberler daha değerli)
    if (article.publishedAt) {
      const daysSincePublish = this.getDaysSince(article.publishedAt);
      if (daysSincePublish <= 1) score += 15;
      else if (daysSincePublish <= 7) score += 10;
      else if (daysSincePublish <= 30) score += 5;
    }

    // İçerik uzunluğu
    if (article.description?.length > 100) score += 5;
    if (article.content?.length > 200) score += 5;

    // Görsel var mı
    if (article.urlToImage) score += 5;

    return Math.min(score, 100);
  }

  /**
   * Sonuçları güvenilirliğe göre sırala
   */
  sortByCredibility(articles) {
    const credibilityOrder = {
      'very-high': 4,
      'high': 3,
      'medium': 2,
      'low': 1
    };

    return articles.sort((a, b) => {
      const scoreA = credibilityOrder[a.source.credibility] || 0;
      const scoreB = credibilityOrder[b.source.credibility] || 0;
      return scoreB - scoreA;
    });
  }

  /**
   * Sonuçları özetle
   */
  summarizeResults(articles) {
    if (!articles || articles.length === 0) {
      return {
        found: false,
        count: 0,
        credibleSources: 0,
        sources: []
      };
    }

    const credibleArticles = articles.filter(a => 
      a.source.credibility === 'very-high' || a.source.credibility === 'high'
    );

    const uniqueSources = [...new Set(articles.map(a => a.source.name))];

    return {
      found: true,
      count: articles.length,
      credibleSources: credibleArticles.length,
      credibilityRatio: (credibleArticles.length / articles.length * 100).toFixed(1),
      sources: uniqueSources,
      topArticles: this.sortByCredibility(articles).slice(0, 3),
      avgRelevanceScore: (articles.reduce((sum, a) => sum + a.relevanceScore, 0) / articles.length).toFixed(1)
    };
  }

  /**
   * Yardımcı fonksiyonlar
   */
  getLastWeekDate() {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  }

  getTodayDate() {
    return new Date().toISOString().split('T')[0];
  }

  getDaysSince(dateString) {
    const publishDate = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today - publishDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

module.exports = new NewsSearcher();
