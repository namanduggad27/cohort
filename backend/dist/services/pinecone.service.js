"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPineconeIndex = getPineconeIndex;
exports.upsertVectors = upsertVectors;
exports.queryNamespace = queryNamespace;
exports.healthCheck = healthCheck;
const pinecone_1 = require("@pinecone-database/pinecone");
const logger_1 = require("../utils/logger");
let _client = null;
function getPineconeClient() {
    if (!_client) {
        _client = new pinecone_1.Pinecone({ apiKey: process.env.PINECONE_API_KEY });
    }
    return _client;
}
function getPineconeIndex() {
    const client = getPineconeClient();
    return client.index(process.env.PINECONE_INDEX_NAME || 'clinical-scribe');
}
/**
 * Upsert vectors into a namespace.
 * Used by ingestion scripts.
 */
async function upsertVectors(namespace, records) {
    const index = getPineconeIndex().namespace(namespace);
    // Batch in groups of 100 (Pinecone limit)
    for (let i = 0; i < records.length; i += 100) {
        await index.upsert(records.slice(i, i + 100));
        logger_1.logger.info(`Pinecone upsert: batch ${i / 100 + 1}`, {
            namespace,
            count: records.slice(i, i + 100).length,
        });
    }
}
/**
 * Query a namespace with an embedding vector.
 * Returns top-K matches above similarity threshold.
 */
async function queryNamespace(namespace, queryEmbedding, topK = 3, similarityThreshold = 0.75) {
    if (!process.env.PINECONE_API_KEY) {
        logger_1.logger.info('PINECONE_API_KEY not set, returning empty RAG context matches');
        return [];
    }
    const index = getPineconeIndex().namespace(namespace);
    const response = await index.query({
        vector: queryEmbedding,
        topK,
        includeMetadata: true,
        includeValues: false,
    });
    const results = (response.matches || [])
        .filter((m) => (m.score ?? 0) >= similarityThreshold)
        .map((m) => ({
        id: m.id,
        score: m.score ?? 0,
        metadata: m.metadata || {},
    }));
    logger_1.logger.info('Pinecone query', {
        namespace,
        topK,
        threshold: similarityThreshold,
        resultsReturned: results.length,
        topScore: results[0]?.score,
    });
    return results;
}
/**
 * Check if the Pinecone index is reachable.
 */
async function healthCheck() {
    if (!process.env.PINECONE_API_KEY)
        return true;
    try {
        const client = getPineconeClient();
        const indexes = await client.listIndexes();
        const indexName = process.env.PINECONE_INDEX_NAME || 'clinical-scribe';
        return !!(indexes.indexes?.some((i) => i.name === indexName));
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=pinecone.service.js.map