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
  console.log('\n[FactCheck] === API TEST START ===');
  console.log('[FactCheck] API Key:', FACT_CHECK_API_KEY ? `${FACT_CHECK_API_KEY.substring(0, 20)}...` : '❌ NOT FOUND');
  
  if (!FACT_CHECK_API_KEY) {
    console.log('[FactCheck] ❌ API key not configured, skipping');
    return { found: false, claims: [] };
  }

  try {
    console.log(`[FactCheck] 🔍 Searching Google Fact Check: "${claimText.substring(0, 50)}..."`);
    console.log(`[FactCheck] 📡 API URL: ${FACT_CHECK_URL}`);
    console.log(`[FactCheck] 🌐 Language: tr`);
    
    const response = await axios.get(FACT_CHECK_URL, {
      params: {
        query: claimText,
        languageCode: 'tr',
        key: FACT_CHECK_API_KEY
      },
      timeout: 5000
    });

    console.log(`[FactCheck] ✅ Response Status: ${response.status}`);
    
    const claims = response.data.claims || [];
    console.log(`[FactCheck] 📊 Total Claims Found: ${claims.length}`);
    
    if (claims.length === 0) {
      console.log('[FactCheck] ⚠️  No fact-checks found');
      console.log('[FactCheck] === API TEST END ===\n');
      return { found: false, claims: [] };
    }

    console.log(`[FactCheck] ✅ SUCCESS! Found ${claims.length} fact-check(s)`);
    if (claims.length > 0 && claims[0].claimReview) {
      console.log(`[FactCheck] 📰 First Publisher: ${claims[0].claimReview[0]?.publisher?.name || 'N/A'}`);
    }
    console.log('[FactCheck] === API TEST END ===\n');

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
    console.error('[FactCheck] ❌ ERROR:', error.message);
    if (error.response) {
      console.error('[FactCheck] ❌ Status Code:', error.response.status);
      console.error('[FactCheck] ❌ Response:', JSON.stringify(error.response.data).substring(0, 200));
    }
    console.log('[FactCheck] === API TEST END (FAILED) ===\n');
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
