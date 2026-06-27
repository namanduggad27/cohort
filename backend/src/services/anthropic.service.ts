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

async function callLLM(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number
): Promise<{ text: string; usage: AnthropicUsage }> {
  if (process.env.ANTHROPIC_API_KEY) {
    const response = await getAnthropic().messages.create({
      model: maxTokens > 1024 ? 'claude-sonnet-4-5' : 'claude-haiku-4-5',
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });
    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    return {
      text,
      usage: { inputTokens: response.usage.input_tokens, outputTokens: response.usage.output_tokens },
    };
  }

  if (process.env.GROQ_API_KEY) {
    const { default: OpenAI } = await import('openai');
    const client = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
    });
    const response = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: maxTokens,
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt + '\nIMPORTANT: Return strictly valid JSON object.' },
        { role: 'user', content: userPrompt },
      ],
    });
    const text = response.choices[0]?.message?.content || '{}';
    return {
      text,
      usage: {
        inputTokens: response.usage?.prompt_tokens ?? 500,
        outputTokens: response.usage?.completion_tokens ?? 500,
      },
    };
  }

  if (process.env.GEMINI_API_KEY) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt + '\nIMPORTANT: Return strictly valid JSON object.' }] },
          contents: [{ parts: [{ text: userPrompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      }
    );
    const data = await res.json() as any;
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    return { text, usage: { inputTokens: 500, outputTokens: 500 } };
  }

  throw new Error('No LLM API key configured (ANTHROPIC_API_KEY, GROQ_API_KEY, or GEMINI_API_KEY)');
}

// ─── Call 1: Claude Haiku / Groq / Gemini — Entity Extraction ────────────────
export async function extractEntitiesWithHaiku(
  transcript: string,
  requestId: string
): Promise<{ entities: ExtractedEntities; usage: AnthropicUsage }> {
  logger.info('Entity extraction: Starting', { requestId });
  const startMs = Date.now();

  const userPrompt = buildExtractionUserPrompt(transcript);
  const { text: rawText, usage } = await callLLM(EXTRACTION_SYSTEM_PROMPT, userPrompt, 1024);

  const latencyMs = Date.now() - startMs;
  logger.info('Entity extraction: Complete', {
    requestId,
    latencyMs,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
  });

  let entities: ExtractedEntities;
  try {
    const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    entities = JSON.parse(cleaned);
  } catch {
    logger.warn('Entity extraction: JSON parse failed, using fallback', { requestId, rawText });
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

  return { entities, usage };
}

// ─── Call 2: Claude Sonnet / Groq / Gemini — SOAP Synthesis (CC-SC-R) ────────
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
  logger.info('SOAP synthesis: Starting', {
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

  const { text: rawText, usage } = await callLLM(CCSCR_SYSTEM_PROMPT, userPrompt, 4096);

  const latencyMs = Date.now() - startMs;
  logger.info('SOAP synthesis: Complete', {
    requestId: params.requestId,
    consultationId: params.consultationId,
    latencyMs,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
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
    logger.error('SOAP synthesis: JSON parse failed', {
      requestId: params.requestId,
      rawText: rawText.substring(0, 500),
    });
    throw new Error('Failed to parse SOAP note from model response');
  }

  return { soapNote, usage };
}
