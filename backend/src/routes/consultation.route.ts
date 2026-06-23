import { Router } from 'express';
import multer from 'multer';
import {
  createConsultationController,
  getConsultationController,
  approveConsultationController,
  listConsultationsController,
} from '../controllers/consultation.controller';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

export const consultationRouter = Router();

/**
 * POST /api/consultation
 * Full pipeline: audio → SOAP note
 * Body: multipart/form-data { audio: File, patientId: string, doctorId: string }
 */
consultationRouter.post('/', upload.single('audio'), createConsultationController);

/**
 * GET /api/consultation
 * List all consultations
 */
consultationRouter.get('/', listConsultationsController);

/**
 * GET /api/consultation/:id
 * Get a single consultation
 */
consultationRouter.get('/:id', getConsultationController);

/**
 * POST /api/consultation/:id/approve
 * Physician approval — marks consultation as reviewed
 */
consultationRouter.post('/:id/approve', approveConsultationController);
