const {Client} = require('@elastic/elasticsearch');

const client = new Client({
    node: 'http://localhost:9200'
});

const INDEX_NAME = 'news-claims';

/**
 * Create index with proper mapping for new scoring system
 */
async function createIndexMapping() {
    try {
        const exists = await client.indices.exists({ index: INDEX_NAME });
        
        if (!exists) {
            await client.indices.create({
                index: INDEX_NAME,
                body: {
                    mappings: {
                        properties: {
                            // Original claim data
                            text: { type: 'text' },
                            url: { type: 'keyword' },
                            source: { type: 'keyword' },
                            timestamp: { type: 'date' },
                            
                            // LLM Analysis
                            main_claims: { type: 'text' },
                            entities: {
                                properties: {
                                    people: { type: 'keyword' },
                                    organizations: { type: 'keyword' },
                                    locations: { type: 'keyword' },
                                    dates: { type: 'keyword' }
                                }
                            },
                            category: { type: 'keyword' },
                            key_points: { type: 'text' },
                            
                            // Fact Check
                            fact_check: {
                                properties: {
                                    found: { type: 'boolean' },
                                    count: { type: 'integer' },
                                    verdict: { type: 'text' },
                                    confidence: { type: 'keyword' },
                                    sources: { type: 'object' }
                                }
                            },
                            
                            // News Search
                            news_search: {
                                properties: {
                                    found: { type: 'boolean' },
                                    count: { type: 'integer' },
                                    credible_sources: { type: 'integer' },
                                    credibility_ratio: { type: 'float' }
                                }
                            },
                            
                            // Scoring
                            score: { type: 'integer' },
                            score_breakdown: {
                                properties: {
                                    factCheck: { type: 'integer' },
                                    newsApi: { type: 'integer' },
                                    llm: { type: 'integer' },
                                    source: { type: 'integer' }
                                }
                            },
                            verdict: {
                                properties: {
                                    tr: { type: 'text' },
                                    en: { type: 'text' },
                                    emoji: { type: 'keyword' },
                                    color: { type: 'keyword' }
                                }
                            },
                            confidence: { type: 'keyword' },
                            reasoning: { type: 'text' },
                            
                            // Meta
                            verified: { type: 'boolean' },
                            processing_time_ms: { type: 'integer' },
                            processor_version: { type: 'keyword' },
                            created_at: { type: 'date' },
                            processed_at: { type: 'date' }
                        }
                    }
                }
            });
            console.log(`✅ Index '${INDEX_NAME}' created with mapping`);
        }
    } catch (error) {
        console.error('Failed to create index mapping:', error.message);
    }
}

/**Elastichsearch control connect */

async function checkConnection() {
    try{
        const health = await client.cluster.health();
        await createIndexMapping(); // Ensure index exists with proper mapping
        return true;
    }catch (error) {
        console.error('Elasticsearch connection failed :', error.message);
        return false;
    }
}

/**
 * Verified news claim'i Elasticsearch'e kaydeder
 * @param {Object} claim - Doğrulanmış haber claim'i
 */

async function saveVerifiedClaim(claim) {
    try{
        // Generate unique ID based on text hash or use existing ID
        const claimId = claim.id || generateClaimId(claim.text);
        
        await client.index({
            index: INDEX_NAME,
            id: claimId,
            document: {
                ...claim,
                processed_at: new Date().toISOString()
            }
        });
         return true;
    } catch (error){ 
     console.error('Failed to save claim to ES :', error.message);
     return false;
    }   
}

/**
 * Generate a unique ID for claim
 */
function generateClaimId(text) {
    const crypto = require('crypto');
    return crypto.createHash('md5').update(text).digest('hex');
}

/**
* Retrieves a specific claim by its ID
* @param {string} id - Claim ID
*/
async function getClaimById(id) {
    try {
        const result = await client.get({
            index: 'news-claims',
            id: id
        });
        return result._source;
    } catch (error) {
        if(error.meta?.statusCode === 404)
            return null;
    }
    throw error;
}

/**
 * Retrieves all claims (with pagination)
 * @param {number} from - Starting index
 * @param {number} size - Number of items to retrieve
 */
async function getAllClaims(from = 0, size = 10) {
    try {
        const result = await client.search({
            index: INDEX_NAME,
            from: from,
            size: size,
            sort: [
                {created_at: {order : 'desc'}}
            ]
        })
        return result.hits.hits.map(hit => ({
            id: hit._id,
            ...hit._source
        }));
    } catch (error) {
        console.error('Failed to get claims:', error.message);
        return [];
    }
}

/**
 * Search claims by score range
 */
async function getClaimsByScoreRange(minScore = 0, maxScore = 100, size = 10) {
    try {
        const result = await client.search({
            index: INDEX_NAME,
            size: size,
            body: {
                query: {
                    range: {
                        score: {
                            gte: minScore,
                            lte: maxScore
                        }
                    }
                },
                sort: [
                    { score: { order: 'desc' } }
                ]
            }
        });
        return result.hits.hits.map(hit => ({
            id: hit._id,
            ...hit._source
        }));
    } catch (error) {
        console.error('Failed to search claims by score:', error.message);
        return [];
    }
}

module.exports = {
    checkConnection,
    saveVerifiedClaim,
    getClaimById,
    getAllClaims,
    getClaimsByScoreRange
};
