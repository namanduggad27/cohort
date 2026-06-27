"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateEmbeddings = generateEmbeddings;
exports.generateEmbedding = generateEmbedding;
const openai_1 = __importDefault(require("openai"));
const logger_1 = require("../utils/logger");
// Lazy-initialized so the server starts even without OPENAI_API_KEY (mock mode)
let _openai = null;
function getOpenAI() {
    if (!_openai) {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY is not set — cannot generate embeddings without an API key.');
        }
        _openai = new openai_1.default({ apiKey: process.env.OPENAI_API_KEY });
    }
    return _openai;
}
const EMBEDDING_MODEL = 'text-embedding-3-small';
/**
 * Generate embeddings for a list of texts.
 * Returns an array of float arrays, one per input string.
 */
async function generateEmbeddings(texts, requestId) {
    if (texts.length === 0)
        return { embeddings: [], tokenCount: 0 };
    if (!process.env.OPENAI_API_KEY) {
        logger_1.logger.info('OPENAI_API_KEY not set, using mock 1536-d zero embeddings', { requestId });
        return {
            embeddings: texts.map(() => new Array(1536).fill(0)),
            tokenCount: 0,
        };
    }
    logger_1.logger.info('Embedding: Generating', {
        requestId,
        count: texts.length,
        model: EMBEDDING_MODEL,
    });
    const response = await getOpenAI().embeddings.create({
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