import { Router } from 'express';
import multer from 'multer';
import { transcribeController } from '../controllers/transcribe.controller';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['audio/webm', 'audio/mp4', 'audio/wav', 'audio/mpeg', 'audio/ogg'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported audio format: ${file.mimetype}`));
    }
  },
});

export const transcribeRouter = Router();

/**
 * POST /api/transcribe
 * Body: multipart/form-data { audio: File }
 * Returns: { transcript, confidence, durationSeconds, language }
 */
transcribeRouter.post('/', upload.single('audio'), transcribeController);
