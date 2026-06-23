import { Request, Response } from 'express';
import { transcribeWithSarvam, transcribeWithWhisper } from '../services/sarvam.service';
import { logger } from '../utils/logger';

export async function transcribeController(req: Request, res: Response): Promise<void> {
  if (!req.file) {
    res.status(400).json({ error: 'Audio file is required' });
    return;
  }

  try {
    let result;
    try {
      result = await transcribeWithSarvam(req.file.buffer, req.file.mimetype, req.requestId);
    } catch {
      logger.warn('Transcribe controller: Sarvam failed, trying Whisper', { requestId: req.requestId });
      result = await transcribeWithWhisper(req.file.buffer, req.file.mimetype, req.requestId);
    }

    res.json({
      transcript: result.transcript,
      confidence: result.confidence,
      durationSeconds: result.durationSeconds,
      language: result.language_code,
      words: result.words,
    });
  } catch (err) {
    logger.error('Transcribe controller: Failed', {
      requestId: req.requestId,
      error: err instanceof Error ? err.message : String(err),
    });
    res.status(500).json({ error: 'Transcription failed', details: err instanceof Error ? err.message : String(err) });
  }
}
