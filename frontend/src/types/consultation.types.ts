// ─── Consultation Types ────────────────────────────────────────

export interface Patient {
  id: string;
  name: string;
  age: number;
  sex: 'M' | 'F' | 'Other';
  vitals: {
    bp?: string;
    spo2?: string;
    temp?: string;
    weight?: string;
    pulse?: string;
  };
  allergies: string[];
  activeMedications: string[];
  pastVisits: { date: string; diagnosis: string; medications: string[] }[];
  waitingSince: string;
  priority: 'normal' | 'urgent' | 'critical';
}

export interface ExtractedEntities {
  symptoms: string[];
  drugs: string[];
  vitals: Record<string, string | null>;
  complaints: string[];
  planHints: string[];
  allergies: string[];
  duration: string | null;
}

export interface RedFlag {
  type: 'cardiac' | 'stroke' | 'respiratory' | 'sepsis' | 'pediatric' | 'other';
  severity: 'critical' | 'high' | 'moderate';
  description: string;
  triggeringText: string;
  icmrReference?: string;
  escalationMessage: string;
  action: 'escalate' | 'acknowledge' | 'pending';
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}

export interface DrugInteraction {
  drugA: string;
  drugB: string;
  severity: 'Critical' | 'Major' | 'Moderate' | 'Minor';
  mechanism: string;
  recommendation: string;
  source: string;
}

export interface MissingField {
  field: string;
  importance: 'required' | 'recommended';
  prompt: string;
}

export interface SOAPNote {
  consultationId: string;
  date: string;
  duration: string;
  language: string;
  transcriptionConfidence: number;
  subjective: {
    chiefComplaint: string;
    historyOfPresentIllness: string;
    pastMedicalHistory: string;
    medications: string;
    allergies: string;
    familyHistory: string;
    socialHistory: string;
  };
  objective: {
    vitals: string;
    physicalExamination: string;
    investigations: string;
  };
  assessment: {
    diagnosis: string;
    differentialDiagnosis: string;
    clinicalImpression: string;
  };
  plan: {
    medications: string;
    investigations: string;
    referrals: string;
    followUp: string;
    patientEducation: string;
  };
  flags: {
    redFlags: RedFlag[];
    drugInteractions: DrugInteraction[];
    missingInformation: MissingField[];
  };
  patientSlip?: {
    medications: { name: string; dose: string; frequency: string; duration: string; instructions: string }[];
    followUpDate: string;
    dangerSigns: string[];
    generalAdvice: string;
  };
  reviewedBy?: string;
  approvedAt?: string;
  footer?: string;
}

export interface Consultation {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  durationSeconds: number;
  language: 'hi' | 'en' | 'hi-en';
  transcript?: string;
  transcriptionConfidence?: number;
  extractedEntities?: ExtractedEntities;
  soapNote?: SOAPNote;
  costBreakdown?: {
    sarvam_inr: number;
    haiku_inr: number;
    sonnet_inr: number;
    embeddings_inr: number;
    total_inr: number;
    within_ceiling: boolean;
  };
  status: 'recording' | 'processing' | 'review' | 'approved' | 'error';
  createdAt: string;
  updatedAt: string;
}

export type RecordingState = 'idle' | 'recording' | 'paused' | 'processing' | 'done' | 'error';
export type SlipLanguage = 'en' | 'hi';
