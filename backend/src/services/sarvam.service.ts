import axios from 'axios';
import FormData from 'form-data';
import { logger } from '../utils/logger';

export interface SarvamTranscriptionResult {
  transcript: string;
  language_code: string;
  confidence: number;
  durationSeconds: number;
  words?: { word: string; start: number; end: number; confidence: number }[];
}

/**
 * Sarvam AI Speech-to-Text-Translate
 * Primary STT for Hindi-English code-switched (Hinglish) audio.
 * Falls back to OpenAI Whisper for pure English if configured.
 *
 * Docs: https://docs.sarvam.ai/api-reference-docs/speech-to-text-translate
 */
export async function transcribeWithSarvam(
  audioBuffer: Buffer,
  mimeType: string,
  requestId: string
): Promise<SarvamTranscriptionResult> {
  const apiKey = process.env.SARVAM_API_KEY;
  const apiUrl = process.env.SARVAM_API_URL || 'https://api.sarvam.ai/speech-to-text-translate';

  if (!apiKey) {
    throw new Error('SARVAM_API_KEY is not configured');
  }

  const form = new FormData();
  const filename = `audio.${mimeType === 'audio/webm' ? 'webm' : mimeType === 'audio/mp4' ? 'mp4' : 'wav'}`;
  form.append('file', audioBuffer, {
    filename,
    contentType: mimeType,
  });
  form.append('model', 'saarika:v2'); // Sarvam's latest Indic STT model
  form.append('language_code', 'hi-IN'); // Hindi-English code-switching
  form.append('with_timestamps', 'false');
  form.append('with_diarization', 'false');
  form.append('num_speakers', '2'); // Doctor + patient

  logger.info('Sarvam STT: Sending audio', {
    requestId,
    audioSizeBytes: audioBuffer.length,
    mimeType,
  });

  const startMs = Date.now();

  try {
    const response = await axios.post(apiUrl, form, {
      headers: {
        ...form.getHeaders(),
        'api-subscription-key': apiKey,
      },
      timeout: 60_000, // 60-second timeout for long audio
    });

    const latencyMs = Date.now() - startMs;
    const data = response.data;

    // Sarvam response structure
    const transcript: string = data.transcript || data.text || '';
    const confidence: number = data.confidence ?? 0.85;
    const languageCode: string = data.language_code || 'hi-IN';
    const durationSeconds: number = data.duration_in_seconds ?? audioBuffer.length / 16000;

    logger.info('Sarvam STT: Transcription complete', {
      requestId,
      latencyMs,
      transcriptLength: transcript.length,
      confidence,
      languageCode,
      durationSeconds,
    });

    return {
      transcript,
      language_code: languageCode,
      confidence,
      durationSeconds,
      words: data.words,
    };
  } catch (err: unknown) {
    const latencyMs = Date.now() - startMs;
    logger.error('Sarvam STT: Request failed', {
      requestId,
      latencyMs,
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}

/**
 * Whisper fallback for pure-English consults
 * Uses OpenAI Whisper API when Sarvam is unavailable or for English-only audio.
 */
export async function transcribeWithWhisper(
  audioBuffer: Buffer,
  mimeType: string,
  requestId: string
): Promise<SarvamTranscriptionResult> {
  // Dynamic import to avoid loading OpenAI SDK if not needed
  const { default: OpenAI } = await import('openai');
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const filename = `audio.${mimeType === 'audio/webm' ? 'webm' : 'mp4'}`;
  const file = new File([audioBuffer], filename, { type: mimeType });

  logger.info('Whisper fallback STT: Sending audio', { requestId });

  const response = await client.audio.transcriptions.create({
    file,
    model: 'whisper-1',
    language: 'hi', // Hint for Hindi/Hinglish
    response_format: 'verbose_json',
  });

  return {
    transcript: response.text,
    language_code: response.language || 'hi',
    confidence: 0.8, // Whisper doesn't return confidence scores
    durationSeconds: response.duration ?? 0,
  };
}
