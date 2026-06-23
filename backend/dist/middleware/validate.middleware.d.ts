import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
/**
 * Validates request body against a Zod schema.
 * Returns 400 with field-level errors on failure.
 */
export declare function validateBody<T>(schema: ZodSchema<T>): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Validates request query params against a Zod schema.
 */
export declare function validateQuery<T>(schema: ZodSchema<T>): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=validate.middleware.d.ts.map