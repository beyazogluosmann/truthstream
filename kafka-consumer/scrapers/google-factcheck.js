/**
 * Google Fact Check API Scraper
 * Searches Google's Fact Check database
 */

const axios = require('axios');
require('dotenv').config();

const FACT_CHECK_API_KEY = process.env.GOOGLE_FACTCHECK_API_KEY;
const FACT_CHECK_URL = 'https://factchecktools.googleapis.com/v1alpha1/claims:search';

/**
 * Search Google Fact Check API
 * @param {string} claimText - Claim to verify
 * @returns {Promise<Object>} Fact check results
 */
async function searchFactCheck(claimText) {
  if (!FACT_CHECK_API_KEY) {
    console.log('[FactCheck] API key not configured, skipping');
    return { found: false, claims: [] };
  }

  try {
    console.log(`[FactCheck] Searching Google Fact Check: "${claimText.substring(0, 50)}..."`);
    
    const response = await axios.get(FACT_CHECK_URL, {
      params: {
        query: claimText,
        languageCode: 'tr',
        key: FACT_CHECK_API_KEY
      },
      timeout: 5000
    });

    const claims = response.data.claims || [];
    
    if (claims.length === 0) {
      console.log('[FactCheck] No fact-checks found');
      return { found: false, claims: [] };
    }

    console.log(`[FactCheck] Found ${claims.length} fact-check(s)`);

    return {
      found: true,
      total: claims.length,
      claims: claims.map(c => ({
        text: c.text,
        claimant: c.claimant,
        claimDate: c.claimDate,
        rating: c.claimReview?.[0]?.textualRating,
        publisher: c.claimReview?.[0]?.publisher?.name,
        url: c.claimReview?.[0]?.url,
        reviewDate: c.claimReview?.[0]?.reviewDate
      }))
    };

  } catch (error) {
    console.error('[FactCheck] Error:', error.message);
    return { found: false, claims: [], error: error.message };
  }
}

/**
 * Format fact check results for AI
 * @param {Object} results - Fact check results
 * @returns {string} Formatted context
 */
function formatFactCheckResults(results) {
  if (!results.found) {
    return 'Google Fact Check veritabanında bu iddia ile ilgili kayıt bulunamadı.';
  }

  let context = `Google Fact Check Sonuçları: ${results.total} kontrol bulundu.\n\n`;
  
  results.claims.slice(0, 3).forEach((claim, i) => {
    context += `${i + 1}. İddia: "${claim.text}"\n`;
    if (claim.claimant) context += `   Kim söyledi: ${claim.claimant}\n`;
    if (claim.rating) context += `   Değerlendirme: ${claim.rating}\n`;
    if (claim.publisher) context += `   Kaynak: ${claim.publisher}\n`;
    if (claim.reviewDate) {
      context += `   Tarih: ${new Date(claim.reviewDate).toLocaleDateString('tr-TR')}\n`;
    }
    context += '\n';
  });

  return context;
}

module.exports = { searchFactCheck, formatFactCheckResults };
