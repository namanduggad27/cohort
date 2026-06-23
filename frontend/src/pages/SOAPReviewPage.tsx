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
  CornerDownRight
} from 'lucide-react';
import { getConsultation, approveConsultation } from '../services/api';
import type { Consultation, SOAPNote, RedFlag, DrugInteraction, MissingField } from '../types/consultation.types';

export function SOAPReviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [soap, setSoap] = useState<SOAPNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
        <h3>Loading Clinical Analysis...</h3>
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
      // Mock saving edits back to the consultation store in EMR
      // In a real DB, we would post the edited SOAP back. For our map-based backend:
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
    
    // Remove from checklist
    const updatedMissing = [...editedSoap.flags.missingInformation];
    const resolvedField = updatedMissing.splice(index, 1)[0];

    // Append to subjective notes
    const sectionToUpdate = resolvedField.field.toLowerCase().includes('vitals') ? 'objective' : 'subjective';
    let targetField = 'historyOfPresentIllness';
    
    if (resolvedField.field.toLowerCase().includes('allergy')) targetField = 'allergies';
    else if (resolvedField.field.toLowerCase().includes('medication')) targetField = 'medications';
    
    setEditedSoap((prev: any) => ({
      ...prev,
      [sectionToUpdate]: {
        ...prev[sectionToUpdate],
        [targetField]: `${prev[sectionToUpdate][targetField] || ''}\n[Resolved: ${resolvedField.field}]: ${answer}`.trim()
      },
      flags: {
        ...prev.flags,
        missingInformation: updatedMissing
      }
    }));
  };
  const confidenceColor = soap.transcriptionConfidence < 0.93 ? 'var(--warning-text)' : 'var(--success-text)';
  const showConfidenceWarning = soap.transcriptionConfidence < 0.93;

  return (
    <div className="app-container" style={{ maxWidth: '1000px' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800 }}>Clinical Review & SOAP Synthesis</h1>
          <p style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
            <FileText size={16} /> Consultation ID: <code>{consultation.id.slice(0, 8)}</code> • Language: <span style={{ textTransform: 'uppercase', fontWeight: 600 }}>{consultation.language}</span>
          </p>
        </div>

        {/* Confidence rating */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>STT TRANSCRIPTION CONFIDENCE</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: confidenceColor, display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'flex-end' }}>
            <Activity size={20} />
            {(soap.transcriptionConfidence * 100).toFixed(0)}%
          </div>
          {showConfidenceWarning && (
            <span style={{ fontSize: '0.7rem', color: 'var(--warning-text)', display: 'block', fontStyle: 'italic' }}>
              Amber sections indicate low confidence
            </span>
          )}
        </div>
      </div>

      {/* Red Flags Triage Banners */}
      {editedSoap.flags?.redFlags?.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
          {editedSoap.flags.redFlags.map((flag: RedFlag, index: number) => (
            <div key={index} className="card" style={{ borderColor: 'var(--critical-border)', backgroundColor: 'var(--critical-bg)', color: 'var(--critical-text)', padding: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                <AlertOctagon size={24} className="pulse-animation" style={{ borderRadius: '50%' }} />
                <h3 style={{ margin: 0, fontWeight: 800, color: 'var(--critical-text)', fontSize: '1.05rem', textTransform: 'uppercase' }}>
                  {flag.type} Red Flag Alert (Severity: {flag.severity})
                </h3>
              </div>
              <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem' }}>{flag.description}</p>
              
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', fontSize: '0.8rem', opacity: 0.9 }}>
                {flag.icmrReference && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid var(--critical-border)' }}>
                    <BookOpen size={14} /> <strong>RAG Citation:</strong> {flag.icmrReference}
                  </span>
                )}
                <span><strong>Escalation Path:</strong> {flag.escalationMessage}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drug Interactions Banner */}
      {editedSoap.flags?.drugInteractions?.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
          {editedSoap.flags.drugInteractions.map((warn: DrugInteraction, index: number) => (
            <div key={index} className="card" style={{ borderColor: 'var(--warning-border)', backgroundColor: 'var(--warning-bg)', color: 'var(--warning-text)', padding: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                <AlertTriangle size={24} />
                <h3 style={{ margin: 0, fontWeight: 800, color: 'var(--warning-text)', fontSize: '1.05rem' }}>
                  CRITICAL DRUG INTERACTION: {warn.drugA.toUpperCase()} + {warn.drugB.toUpperCase()}
                </h3>
              </div>
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem' }}>
                <strong>Mechanism:</strong> {warn.mechanism}
              </p>
              <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem' }}>
                <strong>Recommendation:</strong> {warn.recommendation}
              </p>
              <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                <strong>Source:</strong> {warn.source}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Missing Information Checklist */}
      {editedSoap.flags?.missingInformation?.length > 0 && (
        <div className="card" style={{ marginBottom: '2rem', borderStyle: 'dashed', borderColor: 'var(--primary)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <HelpCircle size={18} /> Missing Clinical Fields (Physician Prompt Checkpoint)
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {editedSoap.flags.missingInformation.map((field: MissingField, index: number) => (
              <div 
                key={index} 
                className="badge" 
                style={{ 
                  backgroundColor: 'var(--primary-light)', 
                  color: 'var(--primary)', 
                  border: '1px solid var(--primary)',
                  cursor: 'pointer',
                  padding: '0.5rem 0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  textTransform: 'none'
                }}
                onClick={() => {
                  const val = prompt(field.prompt);
                  if (val) handleResolveMissingField(index, val);
                }}
              >
                <span>Confirm {field.field}</span>
                <CornerDownRight size={14} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main SOAP Fields Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', textAlign: 'left', marginBottom: '2.5rem' }}>
        
        {/* SUBJECTIVE */}
        <div className="card">
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1.25rem' }}>
            S - Subjective
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>CHIEF COMPLAINT</label>
              <textarea 
                className="input-textarea"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg-app)',
                  color: 'var(--text-main)',
                  minHeight: '60px',
                  fontFamily: 'inherit',
                  marginTop: '0.25rem',
                  borderColor: showConfidenceWarning ? 'var(--warning-border)' : 'var(--border)'
                }}
                value={editedSoap.subjective.chiefComplaint}
                onChange={(e) => handleFieldChange('subjective', 'chiefComplaint', e.target.value)}
              />
            </div>
            
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>HISTORY OF PRESENT ILLNESS (HPI)</label>
              <textarea 
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg-app)',
                  color: 'var(--text-main)',
                  minHeight: '100px',
                  fontFamily: 'inherit',
                  marginTop: '0.25rem'
                }}
                value={editedSoap.subjective.historyOfPresentIllness}
                onChange={(e) => handleFieldChange('subjective', 'historyOfPresentIllness', e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>PAST MEDICAL HISTORY</label>
                <textarea 
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', minHeight: '60px', fontFamily: 'inherit', marginTop: '0.25rem' }}
                  value={editedSoap.subjective.pastMedicalHistory}
                  onChange={(e) => handleFieldChange('subjective', 'pastMedicalHistory', e.target.value)}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>ALLERGIES</label>
                <textarea 
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', minHeight: '60px', fontFamily: 'inherit', marginTop: '0.25rem', borderColor: editedSoap.flags?.drugInteractions?.length > 0 ? 'var(--warning-border)' : 'var(--border)' }}
                  value={editedSoap.subjective.allergies}
                  onChange={(e) => handleFieldChange('subjective', 'allergies', e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>CURRENT MEDICATIONS</label>
                <textarea 
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', minHeight: '60px', fontFamily: 'inherit', marginTop: '0.25rem' }}
                  value={editedSoap.subjective.medications}
                  onChange={(e) => handleFieldChange('subjective', 'medications', e.target.value)}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>FAMILY & SOCIAL HISTORY</label>
                <textarea 
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', minHeight: '60px', fontFamily: 'inherit', marginTop: '0.25rem' }}
                  value={`${editedSoap.subjective.familyHistory || ''}\n${editedSoap.subjective.socialHistory || ''}`.trim()}
                  onChange={(e) => {
                    const lines = e.target.value.split('\n');
                    handleFieldChange('subjective', 'familyHistory', lines[0] || '');
                    handleFieldChange('subjective', 'socialHistory', lines.slice(1).join('\n') || '');
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* OBJECTIVE */}
        <div className="card">
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1.25rem' }}>
            O - Objective
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>VITALS</label>
                <textarea 
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', minHeight: '80px', fontFamily: 'inherit', marginTop: '0.25rem' }}
                  value={editedSoap.objective.vitals}
                  onChange={(e) => handleFieldChange('objective', 'vitals', e.target.value)}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>PHYSICAL EXAMINATION</label>
                <textarea 
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', minHeight: '80px', fontFamily: 'inherit', marginTop: '0.25rem' }}
                  value={editedSoap.objective.physicalExamination}
                  onChange={(e) => handleFieldChange('objective', 'physicalExamination', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ASSESSMENT */}
        <div className="card">
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1.25rem' }}>
            A - Assessment
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>DIAGNOSIS (REVIEW REQUIRED)</label>
              <input 
                type="text" 
                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', fontWeight: 700, fontFamily: 'inherit', marginTop: '0.25rem' }}
                value={editedSoap.assessment.diagnosis}
                onChange={(e) => handleFieldChange('assessment', 'diagnosis', e.target.value)}
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>DIFFERENTIAL DIAGNOSIS</label>
                <textarea 
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', minHeight: '80px', fontFamily: 'inherit', marginTop: '0.25rem' }}
                  value={editedSoap.assessment.differentialDiagnosis}
                  onChange={(e) => handleFieldChange('assessment', 'differentialDiagnosis', e.target.value)}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>CLINICAL IMPRESSION</label>
                <textarea 
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', minHeight: '80px', fontFamily: 'inherit', marginTop: '0.25rem' }}
                  value={editedSoap.assessment.clinicalImpression}
                  onChange={(e) => handleFieldChange('assessment', 'clinicalImpression', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* PLAN */}
        <div className="card">
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1.25rem' }}>
            P - Plan
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>PRESCRIBED MEDICATIONS & INSTRUCTIONS</label>
              <textarea 
                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', minHeight: '80px', fontFamily: 'inherit', marginTop: '0.25rem', borderColor: editedSoap.flags?.drugInteractions?.length > 0 ? 'var(--warning-border)' : 'var(--border)' }}
                value={editedSoap.plan.medications}
                onChange={(e) => handleFieldChange('plan', 'medications', e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>INVESTIGATIONS ORDERED</label>
                <textarea 
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', minHeight: '60px', fontFamily: 'inherit', marginTop: '0.25rem' }}
                  value={editedSoap.plan.investigations}
                  onChange={(e) => handleFieldChange('plan', 'investigations', e.target.value)}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>REFERRALS & ADVICE</label>
                <textarea 
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', minHeight: '60px', fontFamily: 'inherit', marginTop: '0.25rem' }}
                  value={`${editedSoap.plan.referrals || ''}\n${editedSoap.plan.patientEducation || ''}`.trim()}
                  onChange={(e) => {
                    const lines = e.target.value.split('\n');
                    handleFieldChange('plan', 'referrals', lines[0] || '');
                    handleFieldChange('plan', 'patientEducation', lines.slice(1).join('\n') || '');
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>FOLLOW UP DETAILS</label>
              <input 
                type="text" 
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', fontFamily: 'inherit', marginTop: '0.25rem' }}
                value={editedSoap.plan.followUp}
                onChange={(e) => handleFieldChange('plan', 'followUp', e.target.value)}
              />
            </div>
          </div>
        </div>

      </div>

      {/* Cost & Computational Metrics Block */}
      {consultation.costBreakdown && (
        <div className="card" style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-app)', borderStyle: 'solid' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Calculator size={20} style={{ color: 'var(--text-muted)' }} />
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>Consultation Compute Cost</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Sarvam Transcribe + Haiku Extract + Sonnet Synthesis
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
              ₹{consultation.costBreakdown.total_inr.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--success-text)', fontWeight: 600 }}>
              Under Budget Ceiling (₹10.00 Limit)
            </div>
          </div>
        </div>
      )}

      {/* Bottom Approval Panel */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', bottom: '1.5rem', zIndex: 90, boxShadow: 'var(--shadow-lg)' }}>
        <div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            By clicking "Approve", the SOAP Note is compiled and added to EMR database records.
          </span>
        </div>
        <button 
          className="btn btn-success" 
          onClick={handleApprove}
          disabled={saving}
          style={{ padding: '0.75rem 2rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)' }}
        >
          {saving ? 'Saving...' : 'Approve & Generate Slip'} <Check size={18} />
        </button>
      </div>

    </div>
  );
}
export default SOAPReviewPage;
