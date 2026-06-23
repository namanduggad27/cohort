import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Play, 
  Calendar, 
  AlertTriangle, 
  Activity, 
  User, 
  FileText, 
  Pill 
} from 'lucide-react';
import { MOCK_PATIENTS } from './QueuePage';

export function PatientContextPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const patient = MOCK_PATIENTS.find(p => p.id === id);

  if (!patient) {
    return (
      <div className="app-container" style={{ textAlign: 'center', marginTop: '4rem' }}>
        <h2 style={{ color: 'var(--critical-text)' }}>Patient Not Found</h2>
        <p>The patient ID you are looking for does not exist.</p>
        <button className="btn btn-secondary" onClick={() => navigate('/')} style={{ marginTop: '1rem' }}>
          <ArrowLeft size={16} /> Back to Queue
        </button>
      </div>
    );
  }

  const handleStartConsult = () => {
    // Navigate to the recording screen for this patient
    navigate(`/consult/${patient.id}/record`);
  };

  return (
    <div className="app-container">
      {/* Back Button and Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button 
          className="btn btn-secondary" 
          onClick={() => navigate('/')}
          style={{ display: 'inline-flex', padding: '0.5rem 1rem', borderRadius: '8px' }}
        >
          <ArrowLeft size={16} /> Back to Queue
        </button>
        <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800 }}>Pre-Consultation Summary</h1>
      </div>

      <div className="grid-2">
        {/* Left Column: Patient Profile & Vitals */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Patient Profile Card */}
          <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '6px', background: 'var(--primary)' }}></div>
            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
              <div style={{ 
                width: '64px', 
                height: '64px', 
                borderRadius: '50%', 
                background: 'var(--primary-light)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'var(--primary)'
              }}>
                <User size={32} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>{patient.name}</h2>
                <p style={{ color: 'var(--text-muted)' }}>
                  ID: {patient.id} • {patient.age} years • {patient.sex === 'M' ? 'Male' : patient.sex === 'F' ? 'Female' : 'Other'}
                </p>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', marginTop: '1.5rem', paddingTop: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>KNOWN ALLERGIES</span>
                {patient.allergies.length > 0 ? (
                  patient.allergies.map(a => (
                    <span key={a} className="badge badge-critical" style={{ marginTop: '0.25rem', display: 'inline-block' }}>
                      <AlertTriangle size={12} style={{ marginRight: '0.25rem' }} /> {a}
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: '0.9rem', color: 'var(--success-text)', fontWeight: 600 }}>No known allergies</span>
                )}
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>ACTIVE MEDICATIONS</span>
                {patient.activeMedications.length > 0 ? (
                  <ul style={{ paddingLeft: '1rem', fontSize: '0.9rem', margin: '0.25rem 0 0 0' }}>
                    {patient.activeMedications.map(m => (
                      <li key={m} style={{ color: 'var(--text-main)' }}>{m}</li>
                    ))}
                  </ul>
                ) : (
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>None documented</span>
                )}
              </div>
            </div>
          </div>

          {/* Vitals Snapshot Card */}
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={18} className="logo-icon" /> Capturing Vitals (Pre-recorded)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '1rem' }}>
              {Object.entries(patient.vitals).map(([key, val]) => (
                <div key={key} style={{ background: 'var(--bg-app)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                    {key}
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.25rem', color: 'var(--text-main)' }}>
                    {val || 'N/A'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Past Medical History & Action */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Past Visits Summary */}
          <div className="card" style={{ flexGrow: 1 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={18} style={{ color: 'var(--primary)' }} /> Past Encounters
            </h3>
            {patient.pastVisits.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {patient.pastVisits.map((visit, index) => (
                  <div key={index} style={{ borderLeft: '3px solid var(--border)', paddingLeft: '1rem', position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <Calendar size={14} style={{ color: 'var(--text-light)' }} />
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{visit.date}</span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>{visit.diagnosis}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      <Pill size={14} /> Prescribed: {visit.medications.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-light)', padding: '2rem 0' }}>
                No past records found in clinic EMR.
              </div>
            )}
          </div>

          {/* Action Trigger Card */}
          <div className="card" style={{ backgroundColor: 'var(--primary-light)', borderColor: 'var(--primary)', textAlign: 'center', padding: '2rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>Ready to Record Consult?</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0.5rem 0 1.5rem 0' }}>
              Pressing the button starts the microphone recording for speech-to-text transcript parsing.
            </p>
            <button 
              className="btn btn-primary" 
              onClick={handleStartConsult}
              style={{ width: '100%', padding: '1rem', display: 'flex', justifyContent: 'center', gap: '0.75rem', fontSize: '1.05rem', boxShadow: '0 4px 14px rgba(79, 70, 229, 0.4)' }}
            >
              <Play size={20} fill="currentColor" /> Start Consultation Recording
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
