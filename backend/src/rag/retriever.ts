import { generateEmbedding } from '../services/embedding.service';
import { queryNamespace, QueryResult } from '../services/pinecone.service';
import { logger } from '../utils/logger';
import type { RAGContext, RAGChunk } from '../models/consultation.model';

const TOP_K = 3;
const SIMILARITY_THRESHOLD = 0.75;

function toRAGChunk(
  result: QueryResult,
  source: RAGChunk['source']
): RAGChunk {
  return {
    id: result.id,
    content: String(result.metadata['content'] || ''),
    metadata: result.metadata as Record<string, string | number>,
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
export async function retrieveRAGContext(
  symptoms: string[],
  drugs: string[],
  requestId: string
): Promise<{ context: RAGContext; totalTokens: number }> {
  logger.info('RAG retrieval: Starting', { requestId, symptoms, drugs });

  const symptomQuery = symptoms.join(', ');
  const drugQuery = drugs.join(', ');
  const combinedQuery = [...symptoms, ...drugs].join(', ');

  // Generate embeddings for all 3 queries in parallel
  const [symptomEmb, drugEmb, combinedEmb] = await Promise.all([
    generateEmbedding(symptomQuery || 'general clinical guidelines', requestId),
    generateEmbedding(drugQuery || 'drug safety', requestId),
    generateEmbedding(combinedQuery || 'clinical red flags', requestId),
  ]);

  const totalTokens = symptomEmb.tokenCount + drugEmb.tokenCount + combinedEmb.tokenCount;

  // Query all 3 namespaces in parallel
  const [icmrResults, drugResults, ruleResults] = await Promise.all([
    symptoms.length > 0
      ? queryNamespace('icmr_guidelines', symptomEmb.embedding, TOP_K, SIMILARITY_THRESHOLD)
      : Promise.resolve([] as QueryResult[]),
    drugs.length > 0
      ? queryNamespace('drug_interactions', drugEmb.embedding, TOP_K, SIMILARITY_THRESHOLD)
      : Promise.resolve([] as QueryResult[]),
    queryNamespace('clinical_rules', combinedEmb.embedding, TOP_K, SIMILARITY_THRESHOLD),
  ]);

  const context: RAGContext = {
    icmrChunks: icmrResults.map((r) => toRAGChunk(r, 'icmr_guidelines')),
    drugInteractionChunks: drugResults.map((r) => toRAGChunk(r, 'drug_interactions')),
    clinicalRuleChunks: ruleResults.map((r) => toRAGChunk(r, 'clinical_rules')),
  };

  logger.info('RAG retrieval: Complete', {
    requestId,
    icmrChunks: context.icmrChunks.length,
    drugChunks: context.drugInteractionChunks.length,
    ruleChunks: context.clinicalRuleChunks.length,
    totalTokens,
  });

  return { context, totalTokens };
}
