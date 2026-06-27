"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
// Lazy-initialized so the server starts even without ANTHROPIC_API_KEY (mock mode)
let _anthropic = null;
function getAnthropic() {
    if (!_anthropic) {
        if (!process.env.ANTHROPIC_API_KEY) {
            throw new Error('ANTHROPIC_API_KEY is not set — cannot call Claude without an API key.');
        }
        _anthropic = new sdk_1.default({ apiKey: process.env.ANTHROPIC_API_KEY });
    }
    return _anthropic;
}
async function callLLM(systemPrompt, userPrompt, maxTokens) {
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
        const { default: OpenAI } = await Promise.resolve().then(() => __importStar(require('openai')));
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
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: systemPrompt + '\nIMPORTANT: Return strictly valid JSON object.' }] },
                contents: [{ parts: [{ text: userPrompt }] }],
                generationConfig: { responseMimeType: 'application/json' },
            }),
        });
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        return { text, usage: { inputTokens: 500, outputTokens: 500 } };
    }
    throw new Error('No LLM API key configured (ANTHROPIC_API_KEY, GROQ_API_KEY, or GEMINI_API_KEY)');
}
// ─── Call 1: Claude Haiku / Groq / Gemini — Entity Extraction ────────────────
async function extractEntitiesWithHaiku(transcript, requestId) {
    logger_1.logger.info('Entity extraction: Starting', { requestId });
    const startMs = Date.now();
    const userPrompt = (0, extraction_prompt_1.buildExtractionUserPrompt)(transcript);
    const { text: rawText, usage } = await callLLM(extraction_prompt_1.EXTRACTION_SYSTEM_PROMPT, userPrompt, 1024);
    const latencyMs = Date.now() - startMs;
    logger_1.logger.info('Entity extraction: Complete', {
        requestId,
        latencyMs,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
    });
    let entities;
    try {
        const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        entities = JSON.parse(cleaned);
    }
    catch {
        logger_1.logger.warn('Entity extraction: JSON parse failed, using fallback', { requestId, rawText });
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
    return { entities, usage };
}
// ─── Call 2: Claude Sonnet / Groq / Gemini — SOAP Synthesis (CC-SC-R) ────────
async function generateSOAPWithSonnet(params) {
    logger_1.logger.info('SOAP synthesis: Starting', {
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
    const { text: rawText, usage } = await callLLM(ccscr_prompt_1.CCSCR_SYSTEM_PROMPT, userPrompt, 4096);
    const latencyMs = Date.now() - startMs;
    logger_1.logger.info('SOAP synthesis: Complete', {
        requestId: params.requestId,
        consultationId: params.consultationId,
        latencyMs,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
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
        logger_1.logger.error('SOAP synthesis: JSON parse failed', {
            requestId: params.requestId,
            rawText: rawText.substring(0, 500),
        });
        throw new Error('Failed to parse SOAP note from model response');
    }
    return { soapNote, usage };
}
//# sourceMappingURL=anthropic.service.js.map