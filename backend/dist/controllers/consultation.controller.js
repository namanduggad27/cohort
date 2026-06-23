"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createConsultationController = createConsultationController;
exports.getConsultationController = getConsultationController;
exports.approveConsultationController = approveConsultationController;
exports.listConsultationsController = listConsultationsController;
const consultation_service_1 = require("../services/consultation.service");
const logger_1 = require("../utils/logger");
async function createConsultationController(req, res) {
    if (!req.file) {
        res.status(400).json({ error: 'Audio file is required' });
        return;
    }
    const { patientId = 'demo-patient', doctorId = 'demo-doctor' } = req.body;
    try {
        const { consultation, latencyMs } = await (0, consultation_service_1.runFullPipeline)(req.file.buffer, req.file.mimetype, patientId, doctorId, req.requestId);
        res.status(201).json({ consultation, latencyMs });
    }
    catch (err) {
        logger_1.logger.error('Consultation controller: Pipeline failed', {
            requestId: req.requestId,
            error: err instanceof Error ? err.message : String(err),
            stack: err instanceof Error ? err.stack : undefined,
        });
        res.status(500).json({
            error: 'Consultation processing failed',
            details: err instanceof Error ? err.message : String(err),
        });
    }
}
function getConsultationController(req, res) {
    const consultation = (0, consultation_service_1.getConsultation)(req.params.id);
    if (!consultation) {
        res.status(404).json({ error: 'Consultation not found' });
        return;
    }
    res.json({ consultation });
}
function approveConsultationController(req, res) {
    const { doctorId = 'demo-doctor' } = req.body;
    const consultation = (0, consultation_service_1.approveConsultation)(req.params.id, doctorId);
    if (!consultation) {
        res.status(404).json({ error: 'Consultation not found' });
        return;
    }
    res.json({ consultation, message: 'Consultation approved and saved' });
}
function listConsultationsController(_req, res) {
    const consultations = (0, consultation_service_1.listConsultations)();
    res.json({ consultations, count: consultations.length });
}
//# sourceMappingURL=consultation.controller.js.map