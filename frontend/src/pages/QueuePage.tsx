import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Clock, 
  ArrowRight, 
  Activity, 
  Thermometer, 
  Heart, 
  ShieldAlert,
  Plus,
  X,
  UserPlus
} from 'lucide-react';
import type { Patient } from '../types/consultation.types';
import { INITIAL_PATIENTS, getPatientQueue, addPatientToQueue } from '../services/patientStore';

export const MOCK_PATIENTS: Patient[] = INITIAL_PATIENTS;

export function QueuePage() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  // New patient form state
  const [name, setName] = useState('');
  const [age, setAge] = useState('35');
  const [sex, setSex] = useState<'M' | 'F' | 'Other'>('M');
  const [priority, setPriority] = useState<'normal' | 'urgent' | 'critical'>('normal');
  const [bp, setBp] = useState('120/80');
  const [temp, setTemp] = useState('98.6°F');
  const [pulse, setPulse] = useState('74 bpm');
  const [spo2, setSpo2] = useState('98%');
  const [weight, setWeight] = useState('65 kg');
  const [symptomSummary, setSymptomSummary] = useState('');

  useEffect(() => {
    setPatients(getPatientQueue());
  }, []);

  const handleAddPatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addPatientToQueue({
      name: name.trim(),
      age: parseInt(age) || 30,
      sex,
      priority,
      vitals: { bp, temp, pulse, spo2, weight },
      allergies: [],
      activeMedications: [],
      pastVisits: symptomSummary ? [{ date: new Date().toISOString().slice(0, 10), diagnosis: symptomSummary, medications: [] }] : []
    });

    setPatients(getPatientQueue());
    setShowAddModal(false);
    // Reset form
    setName('');
    setSymptomSummary('');
  };

  const getPriorityBadgeClass = (prio: Patient['priority']) => {
    switch (prio) {
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.03em' }}>Doctor's Consultation Queue</h1>
          <p style={{ color: 'var(--text-muted)' }}>Indian Primary Care Safety-First Triage Panel</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="card" style={{ padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Users size={20} className="logo-icon" />
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>IN QUEUE</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{patients.length} Patients</div>
            </div>
          </div>

          <button 
            className="btn btn-secondary"
            onClick={() => setShowAddModal(true)}
            style={{ padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}
          >
            <UserPlus size={18} /> Add Patient
          </button>

          {nextPatient && (
            <button 
              className="btn btn-primary"
              onClick={() => navigate(`/patient/${nextPatient.id}`)}
              style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              Call Next <ArrowRight size={18} />
            </button>
          )}
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
                {patient.pastVisits?.[0]?.diagnosis && (
                  <span style={{ display: 'block', color: 'var(--primary)', fontWeight: 600, fontSize: '0.8rem', marginTop: '0.2rem' }}>
                    Reason: {patient.pastVisits[0].diagnosis}
                  </span>
                )}
              </div>
            </div>

            {/* Vitals Snapshot */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
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

      {/* Add Patient Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '550px', maxHeight: '90vh', overflowY: 'auto', position: 'relative', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--primary)' }}>
            <button 
              onClick={() => setShowAddModal(false)}
              style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={22} />
            </button>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserPlus size={24} /> Register New Patient
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Add a walk-in patient directly into the clinic consultation queue.
            </p>

            <form onSubmit={handleAddPatient} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>PATIENT FULL NAME *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Rajesh Verma"
                  value={name} onChange={e => setName(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-app)', color: 'var(--text-main)', marginTop: '0.25rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>AGE</label>
                  <input 
                    type="number" 
                    value={age} onChange={e => setAge(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-app)', color: 'var(--text-main)', marginTop: '0.25rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>GENDER</label>
                  <select 
                    value={sex} onChange={e => setSex(e.target.value as any)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-app)', color: 'var(--text-main)', marginTop: '0.25rem' }}
                  >
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>TRIAGE PRIORITY</label>
                  <select 
                    value={priority} onChange={e => setPriority(e.target.value as any)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-app)', color: 'var(--text-main)', marginTop: '0.25rem', fontWeight: 700 }}
                  >
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgent</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>REASON FOR VISIT / CHIEF COMPLAINT</label>
                <input 
                  type="text" 
                  placeholder="e.g. High fever, chest congestion, weakness"
                  value={symptomSummary} onChange={e => setSymptomSummary(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-app)', color: 'var(--text-main)', marginTop: '0.25rem' }}
                />
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>INITIAL VITALS SNAPSHOT</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem' }}>BP</span>
                    <input type="text" value={bp} onChange={e => setBp(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-app)', color: 'var(--text-main)' }} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem' }}>Temp</span>
                    <input type="text" value={temp} onChange={e => setTemp(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-app)', color: 'var(--text-main)' }} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem' }}>Pulse</span>
                    <input type="text" value={pulse} onChange={e => setPulse(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-app)', color: 'var(--text-main)' }} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem' }}>SpO2</span>
                    <input type="text" value={spo2} onChange={e => setSpo2(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-app)', color: 'var(--text-main)' }} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem' }}>Weight</span>
                    <input type="text" value={weight} onChange={e => setWeight(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-app)', color: 'var(--text-main)' }} />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Plus size={18} /> Register Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
