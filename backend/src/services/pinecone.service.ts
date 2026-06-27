import { Pinecone } from '@pinecone-database/pinecone';
import { logger } from '../utils/logger';

let _client: Pinecone | null = null;

function getPineconeClient(): Pinecone {
  if (!_client) {
    _client = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
  }
  return _client;
}

export function getPineconeIndex() {
  const client = getPineconeClient();
  return client.index(process.env.PINECONE_INDEX_NAME || 'clinical-scribe');
}

export type PineconeNamespace = 'icmr_guidelines' | 'drug_interactions' | 'clinical_rules';

export interface PineconeRecord {
  id: string;
  values: number[];
  metadata: Record<string, string | number | boolean>;
}

export interface QueryResult {
  id: string;
  score: number;
  metadata: Record<string, string | number | boolean>;
}

/**
 * Upsert vectors into a namespace.
 * Used by ingestion scripts.
 */
export async function upsertVectors(
  namespace: PineconeNamespace,
  records: PineconeRecord[]
): Promise<void> {
  const index = getPineconeIndex().namespace(namespace);
  // Batch in groups of 100 (Pinecone limit)
  for (let i = 0; i < records.length; i += 100) {
    await index.upsert(records.slice(i, i + 100));
    logger.info(`Pinecone upsert: batch ${i / 100 + 1}`, {
      namespace,
      count: records.slice(i, i + 100).length,
    });
  }
}

/**
 * Query a namespace with an embedding vector.
 * Returns top-K matches above similarity threshold.
 */
export async function queryNamespace(
  namespace: PineconeNamespace,
  queryEmbedding: number[],
  topK = 3,
  similarityThreshold = 0.75
): Promise<QueryResult[]> {
  if (!process.env.PINECONE_API_KEY) {
    logger.info('PINECONE_API_KEY not set, returning empty RAG context matches');
    return [];
  }

  const index = getPineconeIndex().namespace(namespace);

  const response = await index.query({
    vector: queryEmbedding,
    topK,
    includeMetadata: true,
    includeValues: false,
  });

  const results: QueryResult[] = (response.matches || [])
    .filter((m) => (m.score ?? 0) >= similarityThreshold)
    .map((m) => ({
      id: m.id,
      score: m.score ?? 0,
      metadata: (m.metadata as Record<string, string | number | boolean>) || {},
    }));

  logger.info('Pinecone query', {
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
export async function healthCheck(): Promise<boolean> {
  if (!process.env.PINECONE_API_KEY) return true;
  try {
    const client = getPineconeClient();
    const indexes = await client.listIndexes();
    const indexName = process.env.PINECONE_INDEX_NAME || 'clinical-scribe';
    return !!(indexes.indexes?.some((i) => i.name === indexName));
  } catch {
    return false;
  }
}
