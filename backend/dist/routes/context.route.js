"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contextRouter = void 0;
const express_1 = require("express");
const context_controller_1 = require("../controllers/context.controller");
const validate_middleware_1 = require("../middleware/validate.middleware");
const zod_1 = require("zod");
exports.contextRouter = (0, express_1.Router)();
const contextSchema = zod_1.z.object({
    symptoms: zod_1.z.array(zod_1.z.string()).default([]),
    drugs: zod_1.z.array(zod_1.z.string()).default([]),
});
/**
 * POST /api/retrieve-context
 * Body: { symptoms: string[], drugs: string[] }
 * Returns: { icmrChunks, drugInteractionChunks, clinicalRuleChunks }
 */
exports.contextRouter.post('/', (0, validate_middleware_1.validateBody)(contextSchema), context_controller_1.contextController);
//# sourceMappingURL=context.route.js.map