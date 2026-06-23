/**
 * Generate embeddings for a list of texts.
 * Returns an array of float arrays, one per input string.
 */
export declare function generateEmbeddings(texts: string[], requestId?: string): Promise<{
    embeddings: number[][];
    tokenCount: number;
}>;
/**
 * Generate a single embedding for one text string.
 */
export declare function generateEmbedding(text: string, requestId?: string): Promise<{
    embedding: number[];
    tokenCount: number;
}>;
//# sourceMappingURL=embedding.service.d.ts.map