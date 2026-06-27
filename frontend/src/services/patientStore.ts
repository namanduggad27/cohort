import type { Patient } from '../types/consultation.types';

export const INITIAL_PATIENTS: Patient[] = [
  {
    id: 'pat-001',
    name: 'Rajiv Sharma',
    age: 48,
    sex: 'M',
    vitals: {
      bp: '162/98',
      temp: '98.4°F',
      pulse: '88 bpm',
      spo2: '97%',
      weight: '76 kg'
    },
    allergies: ['Penicillin'],
    activeMedications: ['Amlodipine 5mg OD'],
    pastVisits: [
      {
        date: '2026-04-12',
        diagnosis: 'Essential Hypertension',
        medications: ['Amlodipine 5mg OD']
      }
    ],
    waitingSince: '10:45 AM',
    priority: 'urgent'
  },
  {
    id: 'pat-002',
    name: 'Sunita Devi',
    age: 34,
    sex: 'F',
    vitals: {
      bp: '110/70',
      temp: '102.2°F',
      pulse: '104 bpm',
      spo2: '95%',
      weight: '54 kg'
    },
    allergies: [],
    activeMedications: [],
    pastVisits: [],
    waitingSince: '10:55 AM',
    priority: 'critical'
  },
  {
    id: 'pat-003',
    name: 'Amit Patel',
    age: 65,
    sex: 'M',
    vitals: {
      bp: '132/82',
      temp: '98.6°F',
      pulse: '72 bpm',
      spo2: '98%',
      weight: '68 kg'
    },
    allergies: ['Sulfa drugs'],
    activeMedications: ['Metformin 500mg BD', 'Atorvastatin 10mg HS'],
    pastVisits: [
      {
        date: '2026-03-01',
        diagnosis: 'Type 2 Diabetes Mellitus',
        medications: ['Metformin 500mg BD']
      }
    ],
    waitingSince: '11:05 AM',
    priority: 'normal'
  },
  {
    id: 'pat-004',
    name: 'Baby Aarav',
    age: 2,
    sex: 'M',
    vitals: {
      bp: '90/60',
      temp: '103.5°F',
      pulse: '128 bpm',
      spo2: '94%',
      weight: '12 kg'
    },
    allergies: [],
    activeMedications: ['Paracetamol Syrup as needed'],
    pastVisits: [
      {
        date: '2026-05-20',
        diagnosis: 'Acute Otitis Media',
        medications: ['Amoxicillin Syrup']
      }
    ],
    waitingSince: '11:15 AM',
    priority: 'critical'
  }
];

const STORAGE_KEY = 'clinical_scribe_patient_queue_v1';

export function getPatientQueue(): Patient[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load patient queue from localStorage', e);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PATIENTS));
  return INITIAL_PATIENTS;
}

export function addPatientToQueue(patient: Omit<Patient, 'id' | 'waitingSince'>): Patient {
  const current = getPatientQueue();
  const randomIdNum = Math.floor(100 + Math.random() * 900);
  const newPatient: Patient = {
    ...patient,
    id: `pat-${randomIdNum}`,
    waitingSince: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };
  const updated = [newPatient, ...current]; // add to top of queue
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return newPatient;
}

export function getPatientById(id: string): Patient | undefined {
  const queue = getPatientQueue();
  return queue.find(p => p.id === id);
}
