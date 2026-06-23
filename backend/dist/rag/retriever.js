"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.retrieveRAGContext = retrieveRAGContext;
const embedding_service_1 = require("../services/embedding.service");
const pinecone_service_1 = require("../services/pinecone.service");
const logger_1 = require("../utils/logger");
const TOP_K = 3;
const SIMILARITY_THRESHOLD = 0.75;
function toRAGChunk(result, source) {
    return {
        id: result.id,
        content: String(result.metadata['content'] || ''),
        metadata: result.metadata,
        score: result.score,
        source,
    };
}
/**
 * Retrieve relevant RAG context for a consultation.
 *
 * Runs 3 queries in parallel:
 * 1. Symptoms → ICMR guidelines
 * 2. Drugs    → Drug interaction DB
 * 3. Combined → Clinical red flag rules
 */
async function retrieveRAGContext(symptoms, drugs, requestId) {
    logger_1.logger.info('RAG retrieval: Starting', { requestId, symptoms, drugs });
    const symptomQuery = symptoms.join(', ');
    const drugQuery = drugs.join(', ');
    const combinedQuery = [...symptoms, ...drugs].join(', ');
    // Generate embeddings for all 3 queries in parallel
    const [symptomEmb, drugEmb, combinedEmb] = await Promise.all([
        (0, embedding_service_1.generateEmbedding)(symptomQuery || 'general clinical guidelines', requestId),
        (0, embedding_service_1.generateEmbedding)(drugQuery || 'drug safety', requestId),
        (0, embedding_service_1.generateEmbedding)(combinedQuery || 'clinical red flags', requestId),
    ]);
    const totalTokens = symptomEmb.tokenCount + drugEmb.tokenCount + combinedEmb.tokenCount;
    // Query all 3 namespaces in parallel
    const [icmrResults, drugResults, ruleResults] = await Promise.all([
        symptoms.length > 0
            ? (0, pinecone_service_1.queryNamespace)('icmr_guidelines', symptomEmb.embedding, TOP_K, SIMILARITY_THRESHOLD)
            : Promise.resolve([]),
        drugs.length > 0
            ? (0, pinecone_service_1.queryNamespace)('drug_interactions', drugEmb.embedding, TOP_K, SIMILARITY_THRESHOLD)
            : Promise.resolve([]),
        (0, pinecone_service_1.queryNamespace)('clinical_rules', combinedEmb.embedding, TOP_K, SIMILARITY_THRESHOLD),
    ]);
    const context = {
        icmrChunks: icmrResults.map((r) => toRAGChunk(r, 'icmr_guidelines')),
        drugInteractionChunks: drugResults.map((r) => toRAGChunk(r, 'drug_interactions')),
        clinicalRuleChunks: ruleResults.map((r) => toRAGChunk(r, 'clinical_rules')),
    };
    logger_1.logger.info('RAG retrieval: Complete', {
        requestId,
        icmrChunks: context.icmrChunks.length,
        drugChunks: context.drugInteractionChunks.length,
        ruleChunks: context.clinicalRuleChunks.length,
        totalTokens,
    });
    return { context, totalTokens };
}
//# sourceMappingURL=retriever.js.map