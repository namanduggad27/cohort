"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.estimateCost = estimateCost;
const INR_PER_USD = 83.5;
const COST_CEILING_INR = 6.0; // ₹6 per consult ceiling
// Per-token prices (USD per 1 token)
const HAIKU_INPUT_USD_PER_TOKEN = 0.25 / 1_000_000;
const HAIKU_OUTPUT_USD_PER_TOKEN = 1.25 / 1_000_000;
const SONNET_INPUT_USD_PER_TOKEN = 3.0 / 1_000_000;
const SONNET_OUTPUT_USD_PER_TOKEN = 15.0 / 1_000_000;
const EMBEDDING_USD_PER_TOKEN = 0.02 / 1_000_000;
function estimateCost(sarvamAudioSeconds, haikuUsage, sonnetUsage, embeddingTokens) {
    const sarvam_inr = (sarvamAudioSeconds / 60) * 2.5; // ₹2.50 per minute
    const haiku_usd = haikuUsage.inputTokens * HAIKU_INPUT_USD_PER_TOKEN +
        haikuUsage.outputTokens * HAIKU_OUTPUT_USD_PER_TOKEN;
    const haiku_inr = haiku_usd * INR_PER_USD;
    const sonnet_usd = sonnetUsage.inputTokens * SONNET_INPUT_USD_PER_TOKEN +
        sonnetUsage.outputTokens * SONNET_OUTPUT_USD_PER_TOKEN;
    const sonnet_inr = sonnet_usd * INR_PER_USD;
    const embeddings_inr = embeddingTokens * EMBEDDING_USD_PER_TOKEN * INR_PER_USD;
    const total_inr = sarvam_inr + haiku_inr + sonnet_inr + embeddings_inr;
    const total_usd = total_inr / INR_PER_USD;
    return {
        sarvam_inr: Number(sarvam_inr.toFixed(4)),
        haiku_inr: Number(haiku_inr.toFixed(4)),
        sonnet_inr: Number(sonnet_inr.toFixed(4)),
        embeddings_inr: Number(embeddings_inr.toFixed(4)),
        total_inr: Number(total_inr.toFixed(4)),
        total_usd: Number(total_usd.toFixed(6)),
        within_ceiling: total_inr <= COST_CEILING_INR,
    };
}
//# sourceMappingURL=costEstimator.js.map