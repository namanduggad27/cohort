"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateEmbeddings = generateEmbeddings;
exports.generateEmbedding = generateEmbedding;
const openai_1 = __importDefault(require("openai"));
const logger_1 = require("../utils/logger");
const openai = new openai_1.default({ apiKey: process.env.OPENAI_API_KEY });
const EMBEDDING_MODEL = 'text-embedding-3-small';
/**
 * Generate embeddings for a list of texts.
 * Returns an array of float arrays, one per input string.
 */
async function generateEmbeddings(texts, requestId) {
    if (texts.length === 0)
        return { embeddings: [], tokenCount: 0 };
    logger_1.logger.info('Embedding: Generating', {
        requestId,
        count: texts.length,
        model: EMBEDDING_MODEL,
    });
    const response = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: texts,
        encoding_format: 'float',
    });
    const embeddings = response.data
        .sort((a, b) => a.index - b.index)
        .map((d) => d.embedding);
    const tokenCount = response.usage.total_tokens;
    logger_1.logger.info('Embedding: Complete', { requestId, tokenCount });
    return { embeddings, tokenCount };
}
/**
 * Generate a single embedding for one text string.
 */
async function generateEmbedding(text, requestId) {
    const { embeddings, tokenCount } = await generateEmbeddings([text], requestId);
    return { embedding: embeddings[0], tokenCount };
}
//# sourceMappingURL=embedding.service.js.map