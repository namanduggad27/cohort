import OpenAI from 'openai';
import { logger } from '../utils/logger';

// Lazy-initialized so the server starts even without OPENAI_API_KEY (mock mode)
let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set — cannot generate embeddings without an API key.');
    }
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

const EMBEDDING_MODEL = 'text-embedding-3-small';

/**
 * Generate embeddings for a list of texts.
 * Returns an array of float arrays, one per input string.
 */
export async function generateEmbeddings(
  texts: string[],
  requestId?: string
): Promise<{ embeddings: number[][]; tokenCount: number }> {
  if (texts.length === 0) return { embeddings: [], tokenCount: 0 };

  logger.info('Embedding: Generating', {
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

  logger.info('Embedding: Complete', { requestId, tokenCount });

  return { embeddings, tokenCount };
}

/**
 * Generate a single embedding for one text string.
 */
export async function generateEmbedding(
  text: string,
  requestId?: string
): Promise<{ embedding: number[]; tokenCount: number }> {
  const { embeddings, tokenCount } = await generateEmbeddings([text], requestId);
  return { embedding: embeddings[0], tokenCount };
}
