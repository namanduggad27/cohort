import { Request, Response } from 'express';
import { extractEntitiesWithHaiku } from '../services/anthropic.service';
import { logger } from '../utils/logger';

export async function extractController(req: Request, res: Response): Promise<void> {
  const { transcript } = req.body as { transcript: string };

  try {
    const { entities, usage } = await extractEntitiesWithHaiku(transcript, req.requestId);
    res.json({ entities, usage });
  } catch (err) {
    logger.error('Extract controller: Failed', {
      requestId: req.requestId,
      error: err instanceof Error ? err.message : String(err),
    });
    res.status(500).json({ error: 'Entity extraction failed' });
  }
}
