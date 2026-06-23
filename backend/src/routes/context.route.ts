import { Router } from 'express';
import { contextController } from '../controllers/context.controller';
import { validateBody } from '../middleware/validate.middleware';
import { z } from 'zod';

export const contextRouter = Router();

const contextSchema = z.object({
  symptoms: z.array(z.string()).default([]),
  drugs: z.array(z.string()).default([]),
});

/**
 * POST /api/retrieve-context
 * Body: { symptoms: string[], drugs: string[] }
 * Returns: { icmrChunks, drugInteractionChunks, clinicalRuleChunks }
 */
contextRouter.post('/', validateBody(contextSchema), contextController);
