"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBody = validateBody;
exports.validateQuery = validateQuery;
const zod_1 = require("zod");
const logger_1 = require("../utils/logger");
/**
 * Validates request body against a Zod schema.
 * Returns 400 with field-level errors on failure.
 */
function validateBody(schema) {
    return (req, res, next) => {
        try {
            req.body = schema.parse(req.body);
            next();
        }
        catch (err) {
            if (err instanceof zod_1.ZodError) {
                const errors = err.errors.map((e) => ({
                    field: e.path.join('.'),
                    message: e.message,
                }));
                logger_1.logger.warn('Validation failed', {
                    requestId: req.requestId,
                    path: req.path,
                    errors,
                });
                res.status(400).json({ error: 'Validation failed', details: errors });
                return;
            }
            next(err);
        }
    };
}
/**
 * Validates request query params against a Zod schema.
 */
function validateQuery(schema) {
    return (req, res, next) => {
        try {
            req.query = schema.parse(req.query);
            next();
        }
        catch (err) {
            if (err instanceof zod_1.ZodError) {
                res.status(400).json({
                    error: 'Invalid query parameters',
                    details: err.errors,
                });
                return;
            }
            next(err);
        }
    };
}
//# sourceMappingURL=validate.middleware.js.map