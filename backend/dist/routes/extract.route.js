"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractRouter = void 0;
const express_1 = require("express");
const extract_controller_1 = require("../controllers/extract.controller");
const validate_middleware_1 = require("../middleware/validate.middleware");
const zod_1 = require("zod");
exports.extractRouter = (0, express_1.Router)();
const extractSchema = zod_1.z.object({
    transcript: zod_1.z.string().min(10, 'Transcript too short'),
});
/**
 * POST /api/extract
 * Body: { transcript: string }
 * Returns: { symptoms, drugs, vitals, complaints, planHints, allergies, duration }
 */
exports.extractRouter.post('/', (0, validate_middleware_1.validateBody)(extractSchema), extract_controller_1.extractController);
//# sourceMappingURL=extract.route.js.map