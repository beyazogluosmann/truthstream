const {Client} = require('@elastic/elasticsearch');

const client = new Client({
    node: 'http://localhost:9200'
});

/**Elastichsearch control connect */

async function checkConnection() {
    try{
        const health = await client.cluster.health();
        console.log('Elasticsearch connected:', health.status);
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
        await client.index({
            index: 'news-claims',
            id: claim.id,
            document: {
                ...claim,
                processed_at: new Date().toISOString()
            }
        });

         console.log(`Claim saved to ES: ${claim.id} (${claim.category}) - Credibility: ${claim.credibility}%`);
         return true;
    } catch (error){ 
     console.error('Failed to save claim to ES :', error.message);
     return false;
    }   
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
            index: 'news-claims',
            from: from,
            size: size,
            sort: [
                {timestamp: {order : 'desc'}}
            ]
        })
        return result.hits.hits.map(hit => hit._source);
    } catch (error) {
        console.error('Failed to get claims:', error.message);
        return [];
    }
}

module.exports = {
    checkConnection,
    saveVerifiedClaim,
    getClaimById,
    getAllClaims
};
