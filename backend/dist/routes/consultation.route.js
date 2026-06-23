"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.consultationRouter = void 0;
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const consultation_controller_1 = require("../controllers/consultation.controller");
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 },
});
exports.consultationRouter = (0, express_1.Router)();
/**
 * POST /api/consultation
 * Full pipeline: audio → SOAP note
 * Body: multipart/form-data { audio: File, patientId: string, doctorId: string }
 */
exports.consultationRouter.post('/', upload.single('audio'), consultation_controller_1.createConsultationController);
/**
 * GET /api/consultation
 * List all consultations
 */
exports.consultationRouter.get('/', consultation_controller_1.listConsultationsController);
/**
 * GET /api/consultation/:id
 * Get a single consultation
 */
exports.consultationRouter.get('/:id', consultation_controller_1.getConsultationController);
/**
 * POST /api/consultation/:id/approve
 * Physician approval — marks consultation as reviewed
 */
exports.consultationRouter.post('/:id/approve', consultation_controller_1.approveConsultationController);
//# sourceMappingURL=consultation.route.js.map