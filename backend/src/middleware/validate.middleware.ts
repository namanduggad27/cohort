import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { logger } from '../utils/logger';

/**
 * Validates request body against a Zod schema.
 * Returns 400 with field-level errors on failure.
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errors = err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        logger.warn('Validation failed', {
          requestId: req.requestId,
          path: req.path,
          errors,
        });
        res.status(400).json({ error: 'Validation failed', details: errors });
        return;
      }
      next(err);
    }
  };
}

/**
 * Validates request query params against a Zod schema.
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query) as typeof req.query;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({
          error: 'Invalid query parameters',
          details: err.errors,
        });
        return;
      }
      next(err);
    }
  };
}
