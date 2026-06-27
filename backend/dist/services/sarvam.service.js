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
exports.transcribeWithSarvam = transcribeWithSarvam;
exports.transcribeWithWhisper = transcribeWithWhisper;
const axios_1 = __importDefault(require("axios"));
const form_data_1 = __importDefault(require("form-data"));
const logger_1 = require("../utils/logger");
/**
 * Sarvam AI Speech-to-Text-Translate
 * Primary STT for Hindi-English code-switched (Hinglish) audio.
 * Falls back to OpenAI Whisper for pure English if configured.
 *
 * Docs: https://docs.sarvam.ai/api-reference-docs/speech-to-text-translate
 */
async function transcribeWithGroq(audioBuffer, mimeType, requestId) {
    const { default: OpenAI, toFile } = await Promise.resolve().then(() => __importStar(require('openai')));
    const client = new OpenAI({
        apiKey: process.env.GROQ_API_KEY,
        baseURL: 'https://api.groq.com/openai/v1',
    });
    const ext = mimeType.includes('webm') ? 'webm' : mimeType.includes('mp4') ? 'mp4' : 'wav';
    const filename = `audio.${ext}`;
    const file = await toFile(audioBuffer, filename, { type: mimeType });
    logger_1.logger.info('Groq STT: Sending audio to whisper-large-v3', { requestId });
    const startMs = Date.now();
    const response = await client.audio.transcriptions.create({
        file,
        model: 'whisper-large-v3',
        prompt: 'The audio is a Hindi-English code-switched doctor-patient medical consultation. Output the transcript strictly in Romanized Hinglish (Roman script, e.g. Namaste Doctor sahab, mujhe chest mein dard hai).',
        response_format: 'verbose_json',
    });
    const latencyMs = Date.now() - startMs;
    logger_1.logger.info('Groq STT: Complete', { requestId, latencyMs });
    return {
        transcript: response.text || '',
        language_code: response.language || 'en',
        confidence: 0.95,
        durationSeconds: response.duration ?? audioBuffer.length / 16000,
    };
}
async function transcribeWithSarvam(audioBuffer, mimeType, requestId) {
    const apiKey = process.env.SARVAM_API_KEY;
    if (!apiKey && process.env.GROQ_API_KEY) {
        logger_1.logger.info('SARVAM_API_KEY not found, using Groq Whisper instead', { requestId });
        return transcribeWithGroq(audioBuffer, mimeType, requestId);
    }
    const apiUrl = process.env.SARVAM_API_URL || 'https://api.sarvam.ai/speech-to-text-translate';
    if (!apiKey) {
        throw new Error('SARVAM_API_KEY or GROQ_API_KEY is not configured');
    }
    const form = new form_data_1.default();
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
    logger_1.logger.info('Sarvam STT: Sending audio', {
        requestId,
        audioSizeBytes: audioBuffer.length,
        mimeType,
    });
    const startMs = Date.now();
    try {
        const response = await axios_1.default.post(apiUrl, form, {
            headers: {
                ...form.getHeaders(),
                'api-subscription-key': apiKey,
            },
            timeout: 60_000, // 60-second timeout for long audio
        });
        const latencyMs = Date.now() - startMs;
        const data = response.data;
        // Sarvam response structure
        const transcript = data.transcript || data.text || '';
        const confidence = data.confidence ?? 0.85;
        const languageCode = data.language_code || 'hi-IN';
        const durationSeconds = data.duration_in_seconds ?? audioBuffer.length / 16000;
        logger_1.logger.info('Sarvam STT: Transcription complete', {
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
    }
    catch (err) {
        const latencyMs = Date.now() - startMs;
        logger_1.logger.error('Sarvam STT: Request failed', {
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
async function transcribeWithWhisper(audioBuffer, mimeType, requestId) {
    if (!process.env.OPENAI_API_KEY && process.env.GROQ_API_KEY) {
        return transcribeWithGroq(audioBuffer, mimeType, requestId);
    }
    // Dynamic import to avoid loading OpenAI SDK if not needed
    const { default: OpenAI } = await Promise.resolve().then(() => __importStar(require('openai')));
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const filename = `audio.${mimeType === 'audio/webm' ? 'webm' : 'mp4'}`;
    const file = new File([audioBuffer], filename, { type: mimeType });
    logger_1.logger.info('Whisper fallback STT: Sending audio', { requestId });
    const response = await client.audio.transcriptions.create({
        file,
        model: 'whisper-1',
        prompt: 'The audio is a Hindi-English code-switched doctor-patient medical consultation. Output the transcript strictly in Romanized Hinglish (Roman script, e.g. Namaste Doctor sahab, mujhe chest mein dard hai).',
        response_format: 'verbose_json',
    });
    return {
        transcript: response.text,
        language_code: response.language || 'hi',
        confidence: 0.8, // Whisper doesn't return confidence scores
        durationSeconds: response.duration ?? 0,
    };
}
//# sourceMappingURL=sarvam.service.js.map