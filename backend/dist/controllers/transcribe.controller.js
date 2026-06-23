"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transcribeController = transcribeController;
const sarvam_service_1 = require("../services/sarvam.service");
const logger_1 = require("../utils/logger");
async function transcribeController(req, res) {
    if (!req.file) {
        res.status(400).json({ error: 'Audio file is required' });
        return;
    }
    try {
        let result;
        try {
            result = await (0, sarvam_service_1.transcribeWithSarvam)(req.file.buffer, req.file.mimetype, req.requestId);
        }
        catch {
            logger_1.logger.warn('Transcribe controller: Sarvam failed, trying Whisper', { requestId: req.requestId });
            result = await (0, sarvam_service_1.transcribeWithWhisper)(req.file.buffer, req.file.mimetype, req.requestId);
        }
        res.json({
            transcript: result.transcript,
            confidence: result.confidence,
            durationSeconds: result.durationSeconds,
            language: result.language_code,
            words: result.words,
        });
    }
    catch (err) {
        logger_1.logger.error('Transcribe controller: Failed', {
            requestId: req.requestId,
            error: err instanceof Error ? err.message : String(err),
        });
        res.status(500).json({ error: 'Transcription failed', details: err instanceof Error ? err.message : String(err) });
    }
}
//# sourceMappingURL=transcribe.controller.js.map