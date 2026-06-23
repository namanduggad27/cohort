import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      startTime: number;
    }
  }
}

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  req.requestId = req.headers['x-request-id'] as string || uuidv4();
  req.startTime = Date.now();

  // Attach requestId to response header for traceability
  res.setHeader('X-Request-ID', req.requestId);

  res.on('finish', () => {
    const latencyMs = Date.now() - req.startTime;
    logger.info('HTTP Request', {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      latencyMs,
      userAgent: req.headers['user-agent']?.substring(0, 100),
    });
  });

  next();
}
