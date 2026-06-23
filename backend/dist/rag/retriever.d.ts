import type { RAGContext } from '../models/consultation.model';
/**
 * Retrieve relevant RAG context for a consultation.
 *
 * Runs 3 queries in parallel:
 * 1. Symptoms → ICMR guidelines
 * 2. Drugs    → Drug interaction DB
 * 3. Combined → Clinical red flag rules
 */
export declare function retrieveRAGContext(symptoms: string[], drugs: string[], requestId: string): Promise<{
    context: RAGContext;
    totalTokens: number;
}>;
//# sourceMappingURL=retriever.d.ts.map