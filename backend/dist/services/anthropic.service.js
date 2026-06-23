"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractEntitiesWithHaiku = extractEntitiesWithHaiku;
exports.generateSOAPWithSonnet = generateSOAPWithSonnet;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const logger_1 = require("../utils/logger");
const extraction_prompt_1 = require("../prompts/extraction.prompt");
const ccscr_prompt_1 = require("../prompts/ccscr.prompt");
const client = new sdk_1.default({ apiKey: process.env.ANTHROPIC_API_KEY });
// ─── Call 1: Claude Haiku — Entity Extraction ────────────────
async function extractEntitiesWithHaiku(transcript, requestId) {
    logger_1.logger.info('Haiku extraction: Starting', { requestId });
    const startMs = Date.now();
    const response = await client.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 1024,
        system: extraction_prompt_1.EXTRACTION_SYSTEM_PROMPT,
        messages: [
            {
                role: 'user',
                content: (0, extraction_prompt_1.buildExtractionUserPrompt)(transcript),
            },
        ],
    });
    const latencyMs = Date.now() - startMs;
    const rawText = response.content[0].type === 'text' ? response.content[0].text : '';
    logger_1.logger.info('Haiku extraction: Complete', {
        requestId,
        latencyMs,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
    });
    let entities;
    try {
        // Strip any accidental markdown fences
        const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        entities = JSON.parse(cleaned);
    }
    catch {
        logger_1.logger.warn('Haiku extraction: JSON parse failed, using fallback', { requestId, rawText });
        entities = {
            symptoms: [],
            drugs: [],
            vitals: {},
            complaints: [],
            planHints: [],
            allergies: [],
            duration: null,
        };
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
async function generateSOAPWithSonnet(params) {
    logger_1.logger.info('Sonnet SOAP synthesis: Starting', {
        requestId: params.requestId,
        consultationId: params.consultationId,
    });
    const startMs = Date.now();
    const userPrompt = (0, ccscr_prompt_1.buildSynthesisUserPrompt)({
        consultationId: params.consultationId,
        transcript: params.transcript,
        durationSeconds: params.durationSeconds,
        language: params.language,
        transcriptionConfidence: params.transcriptionConfidence,
        extractedEntities: JSON.stringify(params.extractedEntities, null, 2),
        ragContext: params.ragContext,
    });
    const response = await client.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 4096,
        system: ccscr_prompt_1.CCSCR_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
    });
    const latencyMs = Date.now() - startMs;
    const rawText = response.content[0].type === 'text' ? response.content[0].text : '';
    logger_1.logger.info('Sonnet SOAP synthesis: Complete', {
        requestId: params.requestId,
        consultationId: params.consultationId,
        latencyMs,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        redFlagsDetected: 0, // Will be parsed below
    });
    let soapNote;
    try {
        const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        soapNote = JSON.parse(cleaned);
        logger_1.logger.info('SOAP synthesis: Red flags detected', {
            requestId: params.requestId,
            count: soapNote.flags?.redFlags?.length ?? 0,
            flags: soapNote.flags?.redFlags?.map((f) => f.type) ?? [],
        });
    }
    catch {
        logger_1.logger.error('Sonnet SOAP synthesis: JSON parse failed', {
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
//# sourceMappingURL=anthropic.service.js.map