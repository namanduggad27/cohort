import { Router } from 'express';
import { extractController } from '../controllers/extract.controller';
import { validateBody } from '../middleware/validate.middleware';
import { z } from 'zod';

export const extractRouter = Router();

const extractSchema = z.object({
  transcript: z.string().min(10, 'Transcript too short'),
});

/**
 * POST /api/extract
 * Body: { transcript: string }
 * Returns: { symptoms, drugs, vitals, complaints, planHints, allergies, duration }
 */
extractRouter.post('/', validateBody(extractSchema), extractController);
