import { Request, Response } from 'express';
import { retrieveRAGContext } from '../rag/retriever';
import { buildRAGContextString } from '../rag/contextBuilder';
import { logger } from '../utils/logger';

export async function contextController(req: Request, res: Response): Promise<void> {
  const { symptoms, drugs } = req.body as { symptoms: string[]; drugs: string[] };

  try {
    const { context, totalTokens } = await retrieveRAGContext(symptoms, drugs, req.requestId);
    const contextString = buildRAGContextString(context);

    res.json({ context, contextString, embeddingTokens: totalTokens });
  } catch (err) {
    logger.error('Context controller: Failed', {
      requestId: req.requestId,
      error: err instanceof Error ? err.message : String(err),
    });
    res.status(500).json({ error: 'RAG retrieval failed' });
  }
}
