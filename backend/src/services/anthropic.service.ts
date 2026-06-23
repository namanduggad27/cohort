import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../utils/logger';
import { EXTRACTION_SYSTEM_PROMPT, buildExtractionUserPrompt } from '../prompts/extraction.prompt';
import { CCSCR_SYSTEM_PROMPT, buildSynthesisUserPrompt } from '../prompts/ccscr.prompt';
import type { ExtractedEntities, SOAPNote } from '../models/consultation.model';

// Lazy-initialized so the server starts even without ANTHROPIC_API_KEY (mock mode)
let _anthropic: Anthropic | null = null;
function getAnthropic(): Anthropic {
  if (!_anthropic) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not set — cannot call Claude without an API key.');
    }
    _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _anthropic;
}

export interface AnthropicUsage {
  inputTokens: number;
  outputTokens: number;
}

// ─── Call 1: Claude Haiku — Entity Extraction ────────────────
export async function extractEntitiesWithHaiku(
  transcript: string,
  requestId: string
): Promise<{ entities: ExtractedEntities; usage: AnthropicUsage }> {
  logger.info('Haiku extraction: Starting', { requestId });
  const startMs = Date.now();

  const response = await getAnthropic().messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 1024,
    system: EXTRACTION_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: buildExtractionUserPrompt(transcript),
      },
    ],
  });

  const latencyMs = Date.now() - startMs;
  const rawText = response.content[0].type === 'text' ? response.content[0].text : '';

  logger.info('Haiku extraction: Complete', {
    requestId,
    latencyMs,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  });

  let entities: ExtractedEntities;
  try {
    // Strip any accidental markdown fences
    const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    entities = JSON.parse(cleaned);
  } catch {
    logger.warn('Haiku extraction: JSON parse failed, using fallback', { requestId, rawText });
    entities = {
      symptoms: [],
      drugs: [],
      vitals: {},
      complaints: [],
      planHints: [],
      allergies: [],
      duration: null,
    } as unknown as ExtractedEntities;
  }

  return {
    entities,
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    },
  };
}

// ─── Call 2: Claude Sonnet — SOAP Synthesis (CC-SC-R) ────────
export async function generateSOAPWithSonnet(params: {
  consultationId: string;
  transcript: string;
  durationSeconds: number;
  language: string;
  transcriptionConfidence: number;
  extractedEntities: ExtractedEntities;
  ragContext: string;
  requestId: string;
}): Promise<{ soapNote: SOAPNote; usage: AnthropicUsage }> {
  logger.info('Sonnet SOAP synthesis: Starting', {
    requestId: params.requestId,
    consultationId: params.consultationId,
  });
  const startMs = Date.now();

  const userPrompt = buildSynthesisUserPrompt({
    consultationId: params.consultationId,
    transcript: params.transcript,
    durationSeconds: params.durationSeconds,
    language: params.language,
    transcriptionConfidence: params.transcriptionConfidence,
    extractedEntities: JSON.stringify(params.extractedEntities, null, 2),
    ragContext: params.ragContext,
  });

  const response = await getAnthropic().messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 4096,
    system: CCSCR_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const latencyMs = Date.now() - startMs;
  const rawText = response.content[0].type === 'text' ? response.content[0].text : '';

  logger.info('Sonnet SOAP synthesis: Complete', {
    requestId: params.requestId,
    consultationId: params.consultationId,
    latencyMs,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    redFlagsDetected: 0, // Will be parsed below
  });

  let soapNote: SOAPNote;
  try {
    const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    soapNote = JSON.parse(cleaned);

    logger.info('SOAP synthesis: Red flags detected', {
      requestId: params.requestId,
      count: soapNote.flags?.redFlags?.length ?? 0,
      flags: soapNote.flags?.redFlags?.map((f) => f.type) ?? [],
    });
  } catch {
    logger.error('Sonnet SOAP synthesis: JSON parse failed', {
      requestId: params.requestId,
      rawText: rawText.substring(0, 500),
    });
    throw new Error('Failed to parse SOAP note from model response');
  }

  return {
    soapNote,
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    },
  };
}
