import { Router } from 'express';
import { soapController } from '../controllers/soap.controller';
import { validateBody } from '../middleware/validate.middleware';
import { z } from 'zod';

export const soapRouter = Router();

const soapSchema = z.object({
  consultationId: z.string().uuid(),
  transcript: z.string().min(10),
  durationSeconds: z.number().positive(),
  language: z.enum(['hi', 'en', 'hi-en']),
  transcriptionConfidence: z.number().min(0).max(1),
  extractedEntities: z.object({
    symptoms: z.array(z.string()),
    drugs: z.array(z.string()),
    vitals: z.record(z.string().nullable()).optional(),
    complaints: z.array(z.string()),
    planHints: z.array(z.string()).optional(),
    allergies: z.array(z.string()).optional(),
    duration: z.string().nullable().optional(),
  }),
  ragContext: z.string(),
});

/**
 * POST /api/generate-soap
 * Body: full synthesis input
 * Returns: SOAPNote
 */
soapRouter.post('/', validateBody(soapSchema), soapController);
