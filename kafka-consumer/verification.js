const TRUSTED_SOURCES = [
  'Reuters', 'AP News', 'BBC', 'The Guardian', 
  'New York Times', 'Washington Post', 'Bloomberg'
];

const SUSPICIOUS_SOURCES = [
  'FakeNewsDaily', 'ClickbaitNews', 'ViralStories',
  'TruthSeeker', 'UnverifiedNews'
];

const CATEGORY_RELIABILITY = {
  'Technology': 0.75,
  'Science': 0.80,
  'Health': 0.65,
  'Politics': 0.55,
  'Business': 0.70,
  'Entertainment': 0.60
};

const SUSPICIOUS_KEYWORDS = [
  'shocking', 'unbelievable', 'miracle', 'secret', 
  'they don\'t want you to know', 'breaking', 'exclusive',
  'you won\'t believe', 'doctors hate', 'instant cure'
];

function verifyClaim(claim) {
  let credibilityScore = 50;
  
  if (TRUSTED_SOURCES.includes(claim.source)) {
    credibilityScore += 30;
  } else if (SUSPICIOUS_SOURCES.includes(claim.source)) {
    credibilityScore -= 20;
  }
  
  const categoryFactor = CATEGORY_RELIABILITY[claim.category] || 0.60;
  credibilityScore += Math.round((categoryFactor - 0.60) * 50);
  
  const lowerText = claim.text.toLowerCase();
  const suspiciousCount = SUSPICIOUS_KEYWORDS.filter(
    keyword => lowerText.includes(keyword)
  ).length;
  credibilityScore -= suspiciousCount * 5;
  
  const textLength = claim.text.length;
  if (textLength < 30) {
    credibilityScore -= 10;
  } else if (textLength > 500) {
    credibilityScore -= 5;
  }
  
  const upperCaseRatio = (claim.text.match(/[A-Z]/g) || []).length / claim.text.length;
  if (upperCaseRatio > 0.3) {
    credibilityScore -= 15;
  }
  
  credibilityScore = Math.max(0, Math.min(100, credibilityScore));
  
  const verified = credibilityScore >= 60;
  
  return {
    ...claim,
    verified: verified,
    credibility: credibilityScore,
    verification_details: {
      source_trusted: TRUSTED_SOURCES.includes(claim.source),
      source_suspicious: SUSPICIOUS_SOURCES.includes(claim.source),
      suspicious_keywords_count: suspiciousCount,
      category_reliability: categoryFactor,
      text_length: textLength
    }
  };
}

function getCredibilityRating(score) {
  if (score >= 80) return 'Very High';
  if (score >= 65) return 'High';
  if (score >= 50) return 'Medium';
  if (score >= 30) return 'Low';
  return 'Very Low';
}

module.exports = {
  verifyClaim,
  getCredibilityRating
};