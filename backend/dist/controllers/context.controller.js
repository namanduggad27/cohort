"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contextController = contextController;
const retriever_1 = require("../rag/retriever");
const contextBuilder_1 = require("../rag/contextBuilder");
const logger_1 = require("../utils/logger");
async function contextController(req, res) {
    const { symptoms, drugs } = req.body;
    try {
        const { context, totalTokens } = await (0, retriever_1.retrieveRAGContext)(symptoms, drugs, req.requestId);
        const contextString = (0, contextBuilder_1.buildRAGContextString)(context);
        res.json({ context, contextString, embeddingTokens: totalTokens });
    }
    catch (err) {
        logger_1.logger.error('Context controller: Failed', {
            requestId: req.requestId,
            error: err instanceof Error ? err.message : String(err),
        });
        res.status(500).json({ error: 'RAG retrieval failed' });
    }
}
//# sourceMappingURL=context.controller.js.map