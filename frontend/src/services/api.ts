import axios from 'axios';
import type { Consultation } from '../types/consultation.types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 120_000, // 2 minutes for full pipeline
});

// ─── Add request ID to every request ─────────────────────────
api.interceptors.request.use((config) => {
  config.headers['X-Request-ID'] = crypto.randomUUID();
  return config;
});

// ─── API Functions ────────────────────────────────────────────

export async function uploadConsultationAudio(
  audioBlob: Blob,
  patientId: string,
  doctorId: string,
  onUploadProgress?: (pct: number) => void
): Promise<{ consultation: Consultation; latencyMs: number }> {
  const form = new FormData();
  form.append('audio', audioBlob, 'consultation.webm');
  form.append('patientId', patientId);
  form.append('doctorId', doctorId);

  const response = await api.post('/api/consultation', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onUploadProgress && e.total) {
        onUploadProgress(Math.round((e.loaded / e.total) * 100));
      }
    },
  });
  return response.data;
}

export async function getConsultation(id: string): Promise<Consultation> {
  const response = await api.get(`/api/consultation/${id}`);
  return response.data.consultation;
}

export async function listConsultations(): Promise<Consultation[]> {
  const response = await api.get('/api/consultation');
  return response.data.consultations;
}

export async function approveConsultation(id: string, doctorId: string): Promise<Consultation> {
  const response = await api.post(`/api/consultation/${id}/approve`, { doctorId });
  return response.data.consultation;
}

export async function getPatientSlip(
  consultationId: string,
  language: 'en' | 'hi'
): Promise<{ content: string; contentEn: string; contentHi: string; slip: any }> {
  const response = await api.post('/api/patient-slip', { consultationId, language });
  return response.data;
}

export async function checkHealth(): Promise<{
  status: string;
  services: Record<string, string>;
}> {
  const response = await api.get('/api/health');
  return response.data;
}

export default api;
