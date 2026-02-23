/**
 * Elasticsearch Client Module
 * Handles all Elasticsearch operations for the backend API
 */

const {Client} = require('@elastic/elasticsearch');

const client = new Client({
    node:'http://localhost:9200'
});

/**
 * Check Elasticsearch connection
 * @returns {Boolean} Connection status
 */

async function checkConnection(){
    try {
        const health = await client.cluster.health();
        console.log('Elasticsearch connected:', health.status);
        return true;
    } catch (error) {
        console.error('Elasticsearch connection failed:',error.message);
        return false;
    }
}

/**
 * Get all claims with pagination
 * @param {Number} from - Starting index
 * @param {Number} size - Number of results
 * @param {String} sortBy - Sort field (timestamp, credibility)
 * @param {String} order - Sort order (asc, desc)
 * @returns {Object} Claims and total count
 */

async function getAllClaims(from = 0 , size = 20, sortBy = 'timestamp', order='desc') {
    try {
        const result = await client.search({
            index: 'news-claims',
            from : from,
            size: size,
            sort: [
                { [sortBy]: {order: order}}
            ]
        });

        return{
            total: result.hits.total.value,
            claims: result.hits.hits.map(hit => hit._source)
        };
    } catch (error) {
        console.error('Error fetching claims:', error.message);
        return {total : 0 , claims: [] };
    }
}

/**
 * Get single claim by ID
 * @param {String} id - Claim ID
 * @returns {Object|null} Claim data or null
 */
async function getClaimById(id){
    try {
        const result = await client.get({
            index: 'news-claims',
            id: id
        });
        return result._source;
    } catch (error) {
        if(error.meta?.statusCode === 4000){
            return null
        }
        console.error('Error fetching claim:', error.message);
        throw error;
    }
}

/**
 * Search claims by text query
 * @param {String} query - Search query
 * @param {Number} from - Starting index
 * @param {Number} size - Number of results
 * @returns {Object} Search results and total count
 */
async function searchClaims(query, from = 0, size = 20){
    try {
        const result = await client.search({
            index: 'news-claims',
            from: from,
            size: size,
            query: {
                multi_match: {
                    query: query,
                    fields: ['text^3', 'category^2', 'source'],
                    fuzziness: 'AUTO'
                }
            },
            sort: [
                { _score: { order: 'desc'}},
                { timestamp: { order: 'desc'}}
            ]
        });

        return{
            total : result.hits.total.value,
            claims: result.hits.hits.map(hit => ({
                ...hit._source,
                score: hit._score
            }))
        };
    } catch (error) {
        console.error('Error searching claims:', error.message);
        return { total: 0 , claims: [] };
    }
}
/**
 * Get claims by category
 * @param {String} category - Category name
 * @param {Number} from - Starting index
 * @param {Number} size - Number of results
 * @returns {Object} Claims and total count
 */
async function getClaimsByCategory(category, from = 0, size = 20){
    try {
        const result = await client.search({
            index: 'news-claims',
            from : from,
            size: size,
            query: {
                match : {
                    category : category 
                }
            },
            sort: [
                {timestamp: {order: 'desc'}}
            ]
        });

        return {
            total : result.hits.total.value,
            claims: restult.hits.hits.map(hit => hit._source)
        }
    } catch (error) {
        console.error('Error fethcing claims by category:', error.message);
        return {total: 0 , claims: []};
        
    }
}

/**
 * Get verified/unverified claims
 * @param {Boolean} verified - Verification status
 * @param {Number} from - Starting index
 * @param {Number} size - Number of results
 * @returns {Object} Claims and total count
 */
async function getClaimsByVerification(verified, from = 0 , size = 20){
    try {
        const result = await client.search({
            index: 'news-claims',
            from : from,
            size: size,
            query: {
                term: {
                    verified: verified
                }
            },
            sort: [
                {timestamp: {order: 'desc'}}
            ]
        })

        return {
            total: result.hits.total.value,
            claims: result.hits.hits.map(hit => hit._source)
        }
    } catch (error) {
        console.error('Error fetching claims by verification:', error.message);
        return {total:0, claims : []};
        
    }
}

/**
 * Get system statistics
 * @returns {Object} Statistics data
 */
async function getStats(){
    try {
        const totalResult = await client.count({
            index: 'news-claims'
        });

           //Verified claims
        const verifiedResult = await client.count({
            index: 'news-claims',
            query: {
                term: {verified : true}
            }
        });

        // Unverified claims
        const unverifiedResult = await client.count({
            index: 'news-claims',
            query: {
                term: {verified : false}
            }
        });

        const avgCredibility = await client.search({
            index: 'news-claims',
            size : 0,
            aggs: {
                avg_credibility: {
                    avg: {
                        field: 'credibility'
                    }
                }
            }
        });

        const categoryDist = await client.search({
           index: 'news-claims',
           size: 0,
           aggs: {
            categories : {
                terms: {
                    field : 'category',
                    size : 10
                }
            }
           }
        });

        return {
      total: totalResult.count,
      verified: verifiedResult.count,
      unverified: unverifiedResult.count,
      verificationRate: ((verifiedResult.count / totalResult.count) * 100).toFixed(2),
      avgCredibility: avgCredibility.aggregations.avg_credibility.value?.toFixed(2) || 0,
      categoryDistribution: categoryDist.aggregations.categories.buckets.map(bucket => ({
        category: bucket.key,
        count: bucket.doc_count
      }))
    };

    } catch (error) {
         console.error('Error fetching stats:', error.message);
    return {
      total: 0,
      verified: 0,
      unverified: 0,
      verificationRate: 0,
      avgCredibility: 0,
      categoryDistribution: []
    }
}

}


module.exports = {
  checkConnection,
  getAllClaims,
  getClaimById,
  searchClaims,
  getClaimsByCategory,
  getClaimsByVerification,
  getStats
};



