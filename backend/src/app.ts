import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { requestLogger } from './middleware/logger.middleware';
import { healthRouter } from './routes/health.route';
import { transcribeRouter } from './routes/transcribe.route';
import { extractRouter } from './routes/extract.route';
import { contextRouter } from './routes/context.route';
import { soapRouter } from './routes/soap.route';
import { consultationRouter } from './routes/consultation.route';
import { patientSlipRouter } from './routes/patientSlip.route';
import { logger } from './utils/logger';

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Security & Parsing ──────────────────────────────────────
app.use(express.json({ limit: process.env.REQUEST_SIZE_LIMIT || '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ─── CORS ─────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked: ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  })
);

// ─── Rate Limiting ────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: Number(process.env.API_RATE_LIMIT) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// ─── Request Logger ───────────────────────────────────────────
app.use(requestLogger);

// ─── Routes ───────────────────────────────────────────────────
app.use('/api/health', healthRouter);
app.use('/api/transcribe', transcribeRouter);
app.use('/api/extract', extractRouter);
app.use('/api/retrieve-context', contextRouter);
app.use('/api/generate-soap', soapRouter);
app.use('/api/consultation', consultationRouter);
app.use('/api/patient-slip', patientSlipRouter);

// ─── 404 ─────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.path });
});

// ─── Global Error Handler ─────────────────────────────────────
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    logger.error('Unhandled error', {
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });
    res.status(500).json({
      error: 'Internal server error',
      message:
        process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    });
  }
);

// ─── Start ───────────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info(`Clinical Scribe Backend running on port ${PORT}`, {
    environment: process.env.NODE_ENV,
    port: PORT,
  });
});

export default app;
