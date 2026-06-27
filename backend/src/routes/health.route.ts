import { Router } from 'express';
import { healthCheck as pineconeHealthCheck } from '../services/pinecone.service';

export const healthRouter = Router();

healthRouter.get('/', async (_req, res) => {
  const pineconeOk = await pineconeHealthCheck().catch(() => false);

  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV,
    services: {
      pinecone: pineconeOk ? 'connected' : 'disconnected',
      sarvam: process.env.SARVAM_API_KEY ? 'configured' : process.env.GROQ_API_KEY ? 'configured (Groq Whisper)' : 'missing_key',
      anthropic: process.env.ANTHROPIC_API_KEY ? 'configured' : process.env.GROQ_API_KEY ? 'configured (Groq Llama)' : process.env.GEMINI_API_KEY ? 'configured (Gemini)' : 'missing_key',
      openai: process.env.OPENAI_API_KEY ? 'configured' : process.env.GROQ_API_KEY ? 'configured (Groq)' : 'missing_key',
    },
  };

  const allHealthy = pineconeOk;
  res.status(allHealthy ? 200 : 207).json(health);
});
