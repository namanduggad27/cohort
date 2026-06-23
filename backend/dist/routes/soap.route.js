"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.soapRouter = void 0;
const express_1 = require("express");
const soap_controller_1 = require("../controllers/soap.controller");
const validate_middleware_1 = require("../middleware/validate.middleware");
const zod_1 = require("zod");
exports.soapRouter = (0, express_1.Router)();
const soapSchema = zod_1.z.object({
    consultationId: zod_1.z.string().uuid(),
    transcript: zod_1.z.string().min(10),
    durationSeconds: zod_1.z.number().positive(),
    language: zod_1.z.enum(['hi', 'en', 'hi-en']),
    transcriptionConfidence: zod_1.z.number().min(0).max(1),
    extractedEntities: zod_1.z.object({
        symptoms: zod_1.z.array(zod_1.z.string()),
        drugs: zod_1.z.array(zod_1.z.string()),
        vitals: zod_1.z.record(zod_1.z.string().nullable()).optional(),
        complaints: zod_1.z.array(zod_1.z.string()),
        planHints: zod_1.z.array(zod_1.z.string()).optional(),
        allergies: zod_1.z.array(zod_1.z.string()).optional(),
        duration: zod_1.z.string().nullable().optional(),
    }),
    ragContext: zod_1.z.string(),
});
/**
 * POST /api/generate-soap
 * Body: full synthesis input
 * Returns: SOAPNote
 */
exports.soapRouter.post('/', (0, validate_middleware_1.validateBody)(soapSchema), soap_controller_1.soapController);
//# sourceMappingURL=soap.route.js.map