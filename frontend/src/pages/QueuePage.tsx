import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Clock, 
  ArrowRight, 
  Activity, 
  Thermometer, 
  Heart, 
  ShieldAlert 
} from 'lucide-react';
import type { Patient } from '../types/consultation.types';

// Mock Patient Data for Indian Primary Care Demo
export const MOCK_PATIENTS: Patient[] = [
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
    priority: 'critical' // High fever and tachycardia
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
    age: 2, // 2 years old
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
    priority: 'critical' // Pediatric high fever
  }
];

export function QueuePage() {
  const navigate = useNavigate();
  const [patients] = useState<Patient[]>(MOCK_PATIENTS);

  const getPriorityBadgeClass = (priority: Patient['priority']) => {
    switch (priority) {
      case 'critical': return 'badge-critical';
      case 'urgent': return 'badge-warning';
      default: return 'badge-success';
    }
  };

  const criticalPatients = patients.filter(p => p.priority === 'critical');
  const nextPatient = patients[0];

  return (
    <div className="app-container">
      {/* Header Stat Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.03em' }}>Doctor's Consultation Queue</h1>
          <p style={{ color: 'var(--text-muted)' }}>Indian Primary Care Safety-First Triage Panel</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div className="card" style={{ padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Users size={20} className="logo-icon" />
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>IN QUEUE</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{patients.length} Patients</div>
            </div>
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => navigate(`/patient/${nextPatient.id}`)}
            style={{ padding: '0.75rem 1.5rem' }}
          >
            Call Next Patient <ArrowRight size={18} />
          </button>
        </div>
      </div>

      {/* Critical Alert Banner */}
      {criticalPatients.length > 0 && (
        <div 
          className="card" 
          style={{ 
            backgroundColor: 'var(--critical-bg)', 
            borderColor: 'var(--critical-border)', 
            color: 'var(--critical-text)', 
            marginBottom: '2rem',
            padding: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}
        >
          <ShieldAlert size={28} style={{ flexShrink: 0 }} />
          <div style={{ flexGrow: 1 }}>
            <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1.05rem', color: 'var(--critical-text)' }}>
              Critical Safety Action Required
            </h3>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--critical-text)', opacity: 0.9 }}>
              There are {criticalPatients.length} patient(s) waiting with critical triage markers ({criticalPatients.map(p => `${p.name} - Temp: ${p.vitals.temp}`).join(', ')}). Consider calling them immediately.
            </p>
          </div>
          <button 
            className="btn btn-danger" 
            style={{ whiteSpace: 'nowrap', fontSize: '0.85rem', padding: '0.5rem 1rem' }}
            onClick={() => navigate(`/patient/${criticalPatients[0].id}`)}
          >
            Review {criticalPatients[0].name}
          </button>
        </div>
      )}

      {/* Queue List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock size={18} /> Patients Waiting
        </h2>
        
        {patients.map((patient) => (
          <div 
            key={patient.id} 
            className="card card-interactive" 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: '80px 1.5fr 2fr 1fr 100px', 
              alignItems: 'center', 
              gap: '1rem',
              padding: '1.25rem' 
            }}
          >
            {/* Time / Position */}
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <div style={{ fontWeight: 600 }}>{patient.waitingSince}</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Waiting</div>
            </div>

            {/* Patient Name / Details */}
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-main)' }}>{patient.name}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {patient.age} Yrs • {patient.sex === 'M' ? 'Male' : patient.sex === 'F' ? 'Female' : 'Other'}
              </div>
            </div>

            {/* Vitals Snapshot */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {patient.vitals.bp && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', background: 'var(--bg-app)', padding: '0.25rem 0.5rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
                  <Heart size={14} style={{ color: '#ec4899' }} />
                  <span>BP: <strong>{patient.vitals.bp}</strong></span>
                </div>
              )}
              {patient.vitals.temp && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', background: 'var(--bg-app)', padding: '0.25rem 0.5rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
                  <Thermometer size={14} style={{ color: '#ef4444' }} />
                  <span>Temp: <strong>{patient.vitals.temp}</strong></span>
                </div>
              )}
              {patient.vitals.pulse && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', background: 'var(--bg-app)', padding: '0.25rem 0.5rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
                  <Activity size={14} style={{ color: '#10b981' }} />
                  <span>HR: <strong>{patient.vitals.pulse}</strong></span>
                </div>
              )}
            </div>

            {/* Priority Status */}
            <div>
              <span className={`badge ${getPriorityBadgeClass(patient.priority)}`}>
                {patient.priority}
              </span>
            </div>

            {/* Action */}
            <div style={{ justifySelf: 'end' }}>
              <button 
                className="btn btn-secondary" 
                style={{ borderRadius: '8px', padding: '0.5rem' }}
                onClick={() => navigate(`/patient/${patient.id}`)}
              >
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
