"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractController = extractController;
const anthropic_service_1 = require("../services/anthropic.service");
const logger_1 = require("../utils/logger");
async function extractController(req, res) {
    const { transcript } = req.body;
    try {
        const { entities, usage } = await (0, anthropic_service_1.extractEntitiesWithHaiku)(transcript, req.requestId);
        res.json({ entities, usage });
    }
    catch (err) {
        logger_1.logger.error('Extract controller: Failed', {
            requestId: req.requestId,
            error: err instanceof Error ? err.message : String(err),
        });
        res.status(500).json({ error: 'Entity extraction failed' });
    }
}
//# sourceMappingURL=extract.controller.js.map