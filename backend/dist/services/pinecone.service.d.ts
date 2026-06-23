export declare function getPineconeIndex(): import("@pinecone-database/pinecone").Index<import("@pinecone-database/pinecone").RecordMetadata>;
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
export declare function upsertVectors(namespace: PineconeNamespace, records: PineconeRecord[]): Promise<void>;
/**
 * Query a namespace with an embedding vector.
 * Returns top-K matches above similarity threshold.
 */
export declare function queryNamespace(namespace: PineconeNamespace, queryEmbedding: number[], topK?: number, similarityThreshold?: number): Promise<QueryResult[]>;
/**
 * Check if the Pinecone index is reachable.
 */
export declare function healthCheck(): Promise<boolean>;
//# sourceMappingURL=pinecone.service.d.ts.map