"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.patientSlipRouter = void 0;
const express_1 = require("express");
const patientSlip_controller_1 = require("../controllers/patientSlip.controller");
const validate_middleware_1 = require("../middleware/validate.middleware");
const zod_1 = require("zod");
exports.patientSlipRouter = (0, express_1.Router)();
const slipSchema = zod_1.z.object({
    consultationId: zod_1.z.string().uuid(),
    language: zod_1.z.enum(['en', 'hi']).default('en'),
});
/**
 * POST /api/patient-slip
 * Body: { consultationId, language }
 * Returns: patient slip in requested language
 */
exports.patientSlipRouter.post('/', (0, validate_middleware_1.validateBody)(slipSchema), patientSlip_controller_1.patientSlipController);
//# sourceMappingURL=patientSlip.route.js.map