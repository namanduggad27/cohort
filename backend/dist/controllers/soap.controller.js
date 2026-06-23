"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.soapController = soapController;
const anthropic_service_1 = require("../services/anthropic.service");
const logger_1 = require("../utils/logger");
async function soapController(req, res) {
    try {
        const { consultationId, transcript, durationSeconds, language, transcriptionConfidence, extractedEntities, ragContext, } = req.body;
        const { soapNote, usage } = await (0, anthropic_service_1.generateSOAPWithSonnet)({
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
    }
    catch (err) {
        logger_1.logger.error('SOAP controller: Failed', {
            requestId: req.requestId,
            error: err instanceof Error ? err.message : String(err),
        });
        res.status(500).json({ error: 'SOAP generation failed' });
    }
}
//# sourceMappingURL=soap.controller.js.map