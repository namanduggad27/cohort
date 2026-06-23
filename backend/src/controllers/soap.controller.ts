import { Request, Response } from 'express';
import { generateSOAPWithSonnet } from '../services/anthropic.service';
import { logger } from '../utils/logger';
import type { ExtractedEntities } from '../models/consultation.model';

export async function soapController(req: Request, res: Response): Promise<void> {
  try {
    const {
      consultationId,
      transcript,
      durationSeconds,
      language,
      transcriptionConfidence,
      extractedEntities,
      ragContext,
    } = req.body as {
      consultationId: string;
      transcript: string;
      durationSeconds: number;
      language: 'hi' | 'en' | 'hi-en';
      transcriptionConfidence: number;
      extractedEntities: ExtractedEntities;
      ragContext: string;
    };

    const { soapNote, usage } = await generateSOAPWithSonnet({
      consultationId,
      transcript,
      durationSeconds,
      language,
      transcriptionConfidence,
      extractedEntities,
      ragContext,
      requestId: req.requestId,
    });

    res.json({ soapNote, usage });
  } catch (err) {
    logger.error('SOAP controller: Failed', {
      requestId: req.requestId,
      error: err instanceof Error ? err.message : String(err),
    });
    res.status(500).json({ error: 'SOAP generation failed' });
  }
}
