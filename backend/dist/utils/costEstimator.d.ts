/**
 * Cost Estimator – per-consult cost breakdown
 *
 * Model pricing (approximate, USD → INR at ₹83.5):
 * - Claude Haiku  (input):  $0.25 / 1M tokens  → ₹0.021 / 1K tokens
 * - Claude Haiku  (output): $1.25 / 1M tokens  → ₹0.104 / 1K tokens
 * - Claude Sonnet (input):  $3.00 / 1M tokens  → ₹0.251 / 1K tokens
 * - Claude Sonnet (output): $15.00 / 1M tokens → ₹1.253 / 1K tokens
 * - text-embedding-3-small: $0.02 / 1M tokens  → ₹0.002 / 1K tokens
 * - Sarvam STT: ~₹2.50 per audio minute (estimate)
 */
export interface TokenUsage {
    inputTokens: number;
    outputTokens: number;
}
export interface CostBreakdown {
    sarvam_inr: number;
    haiku_inr: number;
    sonnet_inr: number;
    embeddings_inr: number;
    total_inr: number;
    total_usd: number;
    within_ceiling: boolean;
}
export declare function estimateCost(sarvamAudioSeconds: number, haikuUsage: TokenUsage, sonnetUsage: TokenUsage, embeddingTokens: number): CostBreakdown;
//# sourceMappingURL=costEstimator.d.ts.map