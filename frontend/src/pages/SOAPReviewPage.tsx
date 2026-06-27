import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Check, 
  AlertTriangle, 
  BookOpen, 
  FileText, 
  HelpCircle,
  Activity,
  AlertOctagon,
  Calculator,
  CornerDownRight,
  Download,
  Mic,
  Heart,
  User
} from 'lucide-react';
import { getConsultation, approveConsultation } from '../services/api';
import type { Consultation, SOAPNote, RedFlag, DrugInteraction, MissingField } from '../types/consultation.types';
import { getPatientById } from '../services/patientStore';
import { downloadWordDocument } from '../services/wordExport';

export function SOAPReviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [soap, setSoap] = useState<SOAPNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'S' | 'O' | 'A' | 'P'>('all');

  // For inline editing
  const [editedSoap, setEditedSoap] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      try {
        const data = await getConsultation(id);
        setConsultation(data);
        if (data.soapNote) {
          setSoap(data.soapNote);
          setEditedSoap(JSON.parse(JSON.stringify(data.soapNote))); // Deep copy
        }
      } catch (err) {
        setErrorMsg('Failed to load consultation data.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="app-container" style={{ textAlign: 'center', marginTop: '4rem' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #ccc', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'pulse 1s infinite alternate', margin: '0 auto 1rem auto' }} />
        <h3>Synthesizing Clinical EMR Record...</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Structuring Hinglish transcript into medical SOAP format</p>
      </div>
    );
  }

  if (errorMsg || !consultation || !soap) {
    return (
      <div className="app-container" style={{ textAlign: 'center', marginTop: '4rem' }}>
        <h2 style={{ color: 'var(--critical-text)' }}>Error</h2>
        <p>{errorMsg || 'SOAP note analysis could not be retrieved.'}</p>
        <button className="btn btn-secondary" onClick={() => navigate('/')} style={{ marginTop: '1rem' }}>
          Back to Queue
        </button>
      </div>
    );
  }

  const patient = getPatientById(consultation.patientId);
  const patientName = patient?.name || 'Patient Case';

  const handleFieldChange = (section: 'subjective' | 'objective' | 'assessment' | 'plan', field: string, value: string) => {
    setEditedSoap((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleApprove = async () => {
    setSaving(true);
    try {
      await approveConsultation(consultation.id, 'doc-101');
      navigate(`/consult/${consultation.id}/slip`);
    } catch (err) {
      alert('Approval failed. Please check network.');
    } finally {
      setSaving(false);
    }
  };

  const handleResolveMissingField = (index: number, answer: string) => {
    if (!answer) return;
    
    const updatedMissing = [...editedSoap.flags.missingInformation];
    const resolvedField = updatedMissing.splice(index, 1)[0];

    const currentHPI = editedSoap.subjective.historyOfPresentIllness || '';
    const newHPI = `${currentHPI}\n[Physician Confirmed ${resolvedField.field}]: ${answer}`.trim();

    setEditedSoap((prev: any) => ({
      ...prev,
      subjective: {
        ...prev.subjective,
        historyOfPresentIllness: newHPI
      },
      flags: {
        ...prev.flags,
        missingInformation: updatedMissing
      }
    }));
  };

  const handleDownloadWord = () => {
    downloadWordDocument(patientName, consultation, editedSoap);
  };

  const showConfidenceWarning = soap.transcriptionConfidence < 0.88;
  const confidenceColor = soap.transcriptionConfidence >= 0.9 ? 'var(--success-text)' : soap.transcriptionConfidence >= 0.8 ? 'var(--warning-text)' : 'var(--critical-text)';

  return (
    <div className="app-container" style={{ maxWidth: '1400px', paddingBottom: '5rem' }}>
      
      {/* Top Header & Actions Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderLeft: '6px solid var(--primary)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <User size={28} style={{ color: 'var(--primary)' }} />
            <div>
              <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {patientName} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 600 }}>({patient?.age || '--'} Yrs / {patient?.sex || '--'})</span>
              </h1>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', gap: '1rem', marginTop: '0.2rem' }}>
                <span><FileText size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> EMR ID: <code>{consultation.id.slice(0, 8).toUpperCase()}</code></span>
                <span>⏱️ Duration: {soap.duration}</span>
                <span>🌐 Language: <strong style={{ textTransform: 'uppercase' }}>Hinglish ({consultation.language})</strong></span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Confidence Badge */}
          <div style={{ textAlign: 'right', paddingRight: '1rem', borderRight: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>AI STT CONFIDENCE</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: confidenceColor, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Activity size={18} /> {(soap.transcriptionConfidence * 100).toFixed(0)}%
            </div>
            {showConfidenceWarning && (
              <span style={{ fontSize: '0.65rem', color: 'var(--warning-text)', display: 'block', fontStyle: 'italic' }}>Check low confidence terms</span>
            )}
          </div>

          <button 
            className="btn btn-secondary"
            onClick={handleDownloadWord}
            style={{ padding: '0.65rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, borderColor: 'var(--primary)', color: 'var(--primary)' }}
          >
            <Download size={18} /> Download Word (.doc)
          </button>

          <button 
            className="btn btn-success" 
            onClick={handleApprove}
            disabled={saving}
            style={{ padding: '0.65rem 1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}
          >
            {saving ? 'Saving...' : 'Approve & Prescription'} <Check size={18} />
          </button>
        </div>
      </div>

      {/* Main Grid: Left Panel (Transcript & Alerts) vs Right Panel (Structured SOAP Form) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(350px, 1fr) minmax(500px, 1.6fr)', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: Vitals, Alerts, Transcript */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Vitals & Cost Snapshot */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'uppercase' }}>
              <Heart size={18} style={{ color: '#ec4899' }} /> Recorded Vitals Snapshot
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', background: 'var(--bg-app)', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>BP & HR</span>
                <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>{patient?.vitals?.bp || '--'} • {patient?.vitals?.pulse || '--'}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Temp & SpO2</span>
                <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>{patient?.vitals?.temp || '--'} • {patient?.vitals?.spo2 || '--'}</strong>
              </div>
            </div>

            {consultation.costBreakdown && (
              <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-muted)' }}><Calculator size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> AI Compute Cost:</span>
                <strong style={{ color: 'var(--primary)' }}>₹{consultation.costBreakdown.total_inr.toFixed(2)} (Under Budget)</strong>
              </div>
            )}
          </div>

          {/* Red Flags Triage Banners */}
          {editedSoap.flags?.redFlags?.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {editedSoap.flags.redFlags.map((flag: RedFlag, index: number) => (
                <div key={index} className="card" style={{ borderColor: 'var(--critical-border)', backgroundColor: 'var(--critical-bg)', color: 'var(--critical-text)', padding: '1.25rem' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <AlertOctagon size={24} className="pulse-animation" />
                    <h3 style={{ margin: 0, fontWeight: 800, color: 'var(--critical-text)', fontSize: '1rem', textTransform: 'uppercase' }}>
                      🚨 {flag.type} Red Flag Alert
                    </h3>
                  </div>
                  <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', fontWeight: 600 }}>{flag.description}</p>
                  <div style={{ fontSize: '0.8rem', opacity: 0.95, background: 'rgba(239, 68, 68, 0.15)', padding: '0.5rem', borderRadius: '4px' }}>
                    <strong>Mandatory Action:</strong> {flag.escalationMessage}
                    {flag.icmrReference && <div style={{ marginTop: '0.25rem', fontSize: '0.75rem' }}><BookOpen size={12} style={{ display: 'inline' }} /> Citation: {flag.icmrReference}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Drug Interactions Banner */}
          {editedSoap.flags?.drugInteractions?.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {editedSoap.flags.drugInteractions.map((warn: DrugInteraction, index: number) => (
                <div key={index} className="card" style={{ borderColor: 'var(--warning-border)', backgroundColor: 'var(--warning-bg)', color: 'var(--warning-text)', padding: '1.25rem' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <AlertTriangle size={24} />
                    <h3 style={{ margin: 0, fontWeight: 800, color: 'var(--warning-text)', fontSize: '1rem' }}>
                      ⚠️ DRUG INTERACTION: {warn.drugA.toUpperCase()} + {warn.drugB.toUpperCase()}
                    </h3>
                  </div>
                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem' }}><strong>Mechanism:</strong> {warn.mechanism}</p>
                  <p style={{ margin: 0, fontSize: '0.85rem', background: 'rgba(245, 158, 11, 0.15)', padding: '0.5rem', borderRadius: '4px' }}><strong>Recommendation:</strong> {warn.recommendation}</p>
                </div>
              ))}
            </div>
          )}

          {/* Recorded Hinglish Transcript Box */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'uppercase' }}>
              <Mic size={18} style={{ color: 'var(--primary)' }} /> Live Audio Transcript (Hinglish)
            </h3>
            <div style={{ 
              background: 'var(--bg-app)', 
              padding: '1rem', 
              borderRadius: '6px', 
              border: '1px solid var(--border)', 
              maxHeight: '350px', 
              overflowY: 'auto',
              fontSize: '0.9rem',
              lineHeight: 1.6,
              color: 'var(--text-main)',
              fontStyle: 'italic',
              whiteSpace: 'pre-wrap'
            }}>
              "{consultation.transcript || 'No transcript recorded.'}"
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Highly Organized Medical SOAP Editor */}
        <div className="card" style={{ padding: '1.5rem' }}>
          
          {/* Missing Information Checkpoints */}
          {editedSoap.flags?.missingInformation?.length > 0 && (
            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--primary-light)', borderRadius: '6px', border: '1px dashed var(--primary)' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <HelpCircle size={16} /> Physician Prompt Checkpoint (Missing Fields)
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {editedSoap.flags.missingInformation.map((field: MissingField, index: number) => (
                  <button 
                    key={index}
                    type="button"
                    className="btn" 
                    style={{ background: '#fff', color: 'var(--primary)', border: '1px solid var(--primary)', fontSize: '0.8rem', padding: '0.35rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontWeight: 600 }}
                    onClick={() => {
                      const val = prompt(field.prompt);
                      if (val) handleResolveMissingField(index, val);
                    }}
                  >
                    <span>+ Confirm {field.field}</span> <CornerDownRight size={14} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Section Navigation Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid var(--border)', marginBottom: '1.5rem', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
            {(['all', 'S', 'O', 'A', 'P'] as const).map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: '6px',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: activeTab === tab ? 'var(--primary)' : 'transparent',
                  color: activeTab === tab ? '#fff' : 'var(--text-muted)',
                  transition: 'all 0.2s'
                }}
              >
                {tab === 'all' ? '📑 Full EMR Report' : `${tab} Section`}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* SUBJECTIVE */}
            {(activeTab === 'all' || activeTab === 'S') && (
              <div style={{ borderLeft: '4px solid #3b82f6', paddingLeft: '1rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#3b82f6', margin: '0 0 1rem 0', textTransform: 'uppercase' }}>
                  S - Subjective Clinical Notes
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>CHIEF COMPLAINT</label>
                    <textarea 
                      className="input-textarea"
                      style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-app)', color: 'var(--text-main)', minHeight: '50px', fontFamily: 'inherit', fontWeight: 600, marginTop: '0.2rem' }}
                      value={editedSoap.subjective.chiefComplaint}
                      onChange={e => handleFieldChange('subjective', 'chiefComplaint', e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>HISTORY OF PRESENT ILLNESS (HPI)</label>
                    <textarea 
                      style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-app)', color: 'var(--text-main)', minHeight: '90px', fontFamily: 'inherit', marginTop: '0.2rem' }}
                      value={editedSoap.subjective.historyOfPresentIllness}
                      onChange={e => handleFieldChange('subjective', 'historyOfPresentIllness', e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>PAST MEDICAL HISTORY</label>
                      <textarea 
                        style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-app)', color: 'var(--text-main)', minHeight: '60px', fontFamily: 'inherit', marginTop: '0.2rem' }}
                        value={editedSoap.subjective.pastMedicalHistory}
                        onChange={e => handleFieldChange('subjective', 'pastMedicalHistory', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>ALLERGIES</label>
                      <textarea 
                        style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-app)', minHeight: '60px', fontFamily: 'inherit', marginTop: '0.2rem', borderColor: editedSoap.flags?.drugInteractions?.length > 0 ? 'var(--warning-border)' : 'var(--border)', fontWeight: 700, color: '#ef4444' }}
                        value={editedSoap.subjective.allergies}
                        onChange={e => handleFieldChange('subjective', 'allergies', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* OBJECTIVE */}
            {(activeTab === 'all' || activeTab === 'O') && (
              <div style={{ borderLeft: '4px solid #10b981', paddingLeft: '1rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#10b981', margin: '0 0 1rem 0', textTransform: 'uppercase' }}>
                  O - Objective Findings
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>VITALS SNAPSHOT</label>
                    <textarea 
                      style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-app)', color: 'var(--text-main)', minHeight: '70px', fontFamily: 'inherit', marginTop: '0.2rem' }}
                      value={editedSoap.objective.vitals}
                      onChange={e => handleFieldChange('objective', 'vitals', e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>PHYSICAL EXAMINATION</label>
                    <textarea 
                      style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-app)', color: 'var(--text-main)', minHeight: '70px', fontFamily: 'inherit', marginTop: '0.2rem' }}
                      value={editedSoap.objective.physicalExamination}
                      onChange={e => handleFieldChange('objective', 'physicalExamination', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ASSESSMENT */}
            {(activeTab === 'all' || activeTab === 'A') && (
              <div style={{ borderLeft: '4px solid #8b5cf6', paddingLeft: '1rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#8b5cf6', margin: '0 0 1rem 0', textTransform: 'uppercase' }}>
                  A - Assessment & Diagnosis
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>PRIMARY DIAGNOSIS (PHYSICIAN REVIEW REQUIRED)</label>
                    <input 
                      type="text" 
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '2px solid #8b5cf6', background: 'var(--bg-app)', color: 'var(--text-main)', fontWeight: 800, fontSize: '1.05rem', fontFamily: 'inherit', marginTop: '0.2rem' }}
                      value={editedSoap.assessment.diagnosis}
                      onChange={e => handleFieldChange('assessment', 'diagnosis', e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>DIFFERENTIAL DIAGNOSIS</label>
                      <textarea 
                        style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-app)', color: 'var(--text-main)', minHeight: '70px', fontFamily: 'inherit', marginTop: '0.2rem' }}
                        value={editedSoap.assessment.differentialDiagnosis}
                        onChange={e => handleFieldChange('assessment', 'differentialDiagnosis', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>CLINICAL IMPRESSION</label>
                      <textarea 
                        style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-app)', color: 'var(--text-main)', minHeight: '70px', fontFamily: 'inherit', marginTop: '0.2rem' }}
                        value={editedSoap.assessment.clinicalImpression}
                        onChange={e => handleFieldChange('assessment', 'clinicalImpression', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PLAN */}
            {(activeTab === 'all' || activeTab === 'P') && (
              <div style={{ borderLeft: '4px solid #f59e0b', paddingLeft: '1rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f59e0b', margin: '0 0 1rem 0', textTransform: 'uppercase' }}>
                  P - Treatment Plan & Prescriptions
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>PRESCRIBED MEDICATIONS & DOSAGE INSTRUCTIONS</label>
                    <textarea 
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-app)', color: 'var(--text-main)', minHeight: '80px', fontFamily: 'inherit', fontWeight: 600, marginTop: '0.2rem', borderColor: editedSoap.flags?.drugInteractions?.length > 0 ? 'var(--warning-border)' : 'var(--border)' }}
                      value={editedSoap.plan.medications}
                      onChange={e => handleFieldChange('plan', 'medications', e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>INVESTIGATIONS ORDERED</label>
                      <textarea 
                        style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-app)', color: 'var(--text-main)', minHeight: '60px', fontFamily: 'inherit', marginTop: '0.2rem' }}
                        value={editedSoap.plan.investigations}
                        onChange={e => handleFieldChange('plan', 'investigations', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>REFERRALS & ADVICE</label>
                      <textarea 
                        style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-app)', color: 'var(--text-main)', minHeight: '60px', fontFamily: 'inherit', marginTop: '0.2rem' }}
                        value={`${editedSoap.plan.referrals || ''}\n${editedSoap.plan.patientEducation || ''}`.trim()}
                        onChange={e => {
                          const lines = e.target.value.split('\n');
                          handleFieldChange('plan', 'referrals', lines[0] || '');
                          handleFieldChange('plan', 'patientEducation', lines.slice(1).join('\n') || '');
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>FOLLOW UP SCHEDULE</label>
                    <input 
                      type="text" 
                      style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-app)', color: 'var(--text-main)', fontWeight: 700, fontFamily: 'inherit', marginTop: '0.2rem' }}
                      value={editedSoap.plan.followUp}
                      onChange={e => handleFieldChange('plan', 'followUp', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
export default SOAPReviewPage;
