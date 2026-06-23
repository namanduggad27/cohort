import { Request, Response } from 'express';
import {
  runFullPipeline,
  getConsultation,
  approveConsultation,
  listConsultations,
} from '../services/consultation.service';
import { logger } from '../utils/logger';

export async function createConsultationController(req: Request, res: Response): Promise<void> {
  if (!req.file) {
    res.status(400).json({ error: 'Audio file is required' });
    return;
  }

  const { patientId = 'demo-patient', doctorId = 'demo-doctor' } = req.body as {
    patientId?: string;
    doctorId?: string;
  };

  try {
    const { consultation, latencyMs } = await runFullPipeline(
      req.file.buffer,
      req.file.mimetype,
      patientId,
      doctorId,
      req.requestId
    );

    res.status(201).json({ consultation, latencyMs });
  } catch (err) {
    logger.error('Consultation controller: Pipeline failed', {
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

export function getConsultationController(req: Request, res: Response): void {
  const consultation = getConsultation(req.params.id);
  if (!consultation) {
    res.status(404).json({ error: 'Consultation not found' });
    return;
  }
  res.json({ consultation });
}

export function approveConsultationController(req: Request, res: Response): void {
  const { doctorId = 'demo-doctor' } = req.body as { doctorId?: string };
  const consultation = approveConsultation(req.params.id, doctorId);
  if (!consultation) {
    res.status(404).json({ error: 'Consultation not found' });
    return;
  }
  res.json({ consultation, message: 'Consultation approved and saved' });
}

export function listConsultationsController(_req: Request, res: Response): void {
  const consultations = listConsultations();
  res.json({ consultations, count: consultations.length });
}
