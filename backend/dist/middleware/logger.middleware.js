"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = requestLogger;
const uuid_1 = require("uuid");
const logger_1 = require("../utils/logger");
function requestLogger(req, res, next) {
    req.requestId = req.headers['x-request-id'] || (0, uuid_1.v4)();
    req.startTime = Date.now();
    // Attach requestId to response header for traceability
    res.setHeader('X-Request-ID', req.requestId);
    res.on('finish', () => {
        const latencyMs = Date.now() - req.startTime;
        logger_1.logger.info('HTTP Request', {
            requestId: req.requestId,
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            latencyMs,
            userAgent: req.headers['user-agent']?.substring(0, 100),
        });
    });
    next();
}
//# sourceMappingURL=logger.middleware.js.map