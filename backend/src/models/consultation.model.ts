// ─── Consultation ─────────────────────────────────────────────
export interface Consultation {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  durationSeconds: number;
  language: 'hi' | 'en' | 'hi-en';
  audioUrl?: string;
  transcript?: string;
  transcriptionConfidence?: number;
  extractedEntities?: ExtractedEntities;
  ragContext?: RAGContext;
  soapNote?: SOAPNote;
  patientSlip?: PatientSlip;
  costBreakdown?: ConsultationCost;
  status: 'recording' | 'processing' | 'review' | 'approved' | 'error';
  createdAt: string;
  updatedAt: string;
}

// ─── NER / Extraction ─────────────────────────────────────────
export interface ExtractedEntities {
  symptoms: string[];
  drugs: string[];
  vitals: {
    bp?: string;
    temp?: string;
    spo2?: string;
    weight?: string;
    pulse?: string;
    rr?: string;
  };
  complaints: string[];
  planHints: string[];
  allergies?: string[];
  duration?: string; // "2 days", "3 weeks"
}

// ─── RAG ─────────────────────────────────────────────────────
export interface RAGChunk {
  id: string;
  content: string;
  metadata: Record<string, string | number>;
  score: number;
  source: 'icmr_guidelines' | 'drug_interactions' | 'clinical_rules';
}

export interface RAGContext {
  icmrChunks: RAGChunk[];
  drugInteractionChunks: RAGChunk[];
  clinicalRuleChunks: RAGChunk[];
}

// ─── SOAP Note ────────────────────────────────────────────────
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
    medications: {
      name: string;
      dose: string;
      frequency: string;
      duration: string;
      instructions: string;
    }[];
    followUpDate: string;
    dangerSigns: string[];
    generalAdvice: string;
  };
  reviewedBy?: string;
  approvedAt?: string;
  aiAssisted: true;
}

export interface RedFlag {
  type: 'cardiac' | 'stroke' | 'respiratory' | 'sepsis' | 'pediatric' | 'other';
  severity: 'critical' | 'high' | 'moderate';
  description: string;
  triggeringText: string;
  icmrReference?: string;
  escalationMessage: string;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  action: 'escalate' | 'acknowledge' | 'pending';
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
  prompt: string; // "Allergy status not captured — confirm?"
}

// ─── Patient Slip ─────────────────────────────────────────────
export interface PatientSlip {
  consultationId: string;
  patientName: string;
  date: string;
  doctorName: string;
  medications: {
    name: string;
    dose: string;
    frequency: string;
    duration: string;
    instructions: string;
  }[];
  followUpDate: string;
  dangerSigns: string[];
  generalAdvice: string;
  language: 'en' | 'hi';
  content: {
    en: string;
    hi: string;
  };
}

// ─── Patient (Demo Data) ──────────────────────────────────────
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
  pastVisits: {
    date: string;
    diagnosis: string;
    medications: string[];
  }[];
  waitingSince: string;
  priority: 'normal' | 'urgent' | 'critical';
}

// ─── Cost ─────────────────────────────────────────────────────
export interface ConsultationCost {
  sarvam_inr: number;
  haiku_inr: number;
  sonnet_inr: number;
  embeddings_inr: number;
  total_inr: number;
  total_usd: number;
  within_ceiling: boolean;
}
