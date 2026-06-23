import { Router } from 'express';
import { patientSlipController } from '../controllers/patientSlip.controller';
import { validateBody } from '../middleware/validate.middleware';
import { z } from 'zod';

export const patientSlipRouter = Router();

const slipSchema = z.object({
  consultationId: z.string().uuid(),
  language: z.enum(['en', 'hi']).default('en'),
});

/**
 * POST /api/patient-slip
 * Body: { consultationId, language }
 * Returns: patient slip in requested language
 */
patientSlipRouter.post('/', validateBody(slipSchema), patientSlipController);
