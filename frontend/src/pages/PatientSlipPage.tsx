import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Printer, 
  Share2, 
  Check, 
  FileText,
  CalendarDays,
  Sparkles
} from 'lucide-react';
import { getPatientSlip, getConsultation } from '../services/api';
import type { Consultation } from '../types/consultation.types';

export function PatientSlipPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [slipLang, setSlipLang] = useState<'en' | 'hi'>('en');
  const [slipData, setSlipData] = useState<any>(null);
  const [rawText, setRawText] = useState('');
  const [copied, setCopied] = useState(false);
  const [whatsAppSent, setWhatsAppSent] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      try {
        const consultData = await getConsultation(id);
        setConsultation(consultData);
        
        // Fetch patient slip contents
        const slipResponse = await getPatientSlip(id, slipLang);
        setSlipData(slipResponse.slip);
        setRawText(slipResponse.content);
      } catch (err) {
        setErrorMsg('Failed to load discharge slip.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  // Handle language switch
  const handleLanguageToggle = async (lang: 'en' | 'hi') => {
    if (!id) return;
    setSlipLang(lang);
    try {
      const response = await getPatientSlip(id, lang);
      setRawText(response.content);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    setWhatsAppSent(true);
    setTimeout(() => setWhatsAppSent(false), 3000);
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="app-container" style={{ textAlign: 'center', marginTop: '4rem' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #ccc', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'pulse 1s infinite alternate', margin: '0 auto 1rem auto' }} />
        <h3>Compiling Patient Slip...</h3>
      </div>
    );
  }

  if (errorMsg || !consultation || !slipData) {
    return (
      <div className="app-container" style={{ textAlign: 'center', marginTop: '4rem' }}>
        <h2 style={{ color: 'var(--critical-text)' }}>Discharge Slip Error</h2>
        <p>{errorMsg || 'The discharge slip could not be generated.'}</p>
        <button className="btn btn-secondary" onClick={() => navigate('/')} style={{ marginTop: '1rem' }}>
          Back to Queue
        </button>
      </div>
    );
  }

  return (
    <div className="app-container" style={{ maxWidth: '800px' }}>
      
      {/* Navigation Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/')} style={{ padding: '0.5rem 1rem', borderRadius: '8px' }}>
            <ArrowLeft size={16} /> Patient Queue
          </button>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800 }}>Discharge & Prescription Slip</h1>
        </div>

        {/* Language Toggler */}
        <div style={{ display: 'inline-flex', background: 'var(--bg-panel)', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <button 
            className="btn" 
            style={{ 
              padding: '0.4rem 1rem', 
              fontSize: '0.85rem', 
              borderRadius: '6px', 
              backgroundColor: slipLang === 'en' ? 'var(--primary)' : 'transparent',
              color: slipLang === 'en' ? 'white' : 'var(--text-muted)'
            }}
            onClick={() => handleLanguageToggle('en')}
          >
            English
          </button>
          <button 
            className="btn" 
            style={{ 
              padding: '0.4rem 1rem', 
              fontSize: '0.85rem', 
              borderRadius: '6px', 
              backgroundColor: slipLang === 'hi' ? 'var(--primary)' : 'transparent',
              color: slipLang === 'hi' ? 'white' : 'var(--text-muted)'
            }}
            onClick={() => handleLanguageToggle('hi')}
          >
            हिन्दी (Hindi)
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
        {/* Left Column: Visual Slip Preview */}
        <div className="card" style={{ padding: '2rem', position: 'relative', borderTop: '8px solid var(--primary)', backgroundColor: 'var(--bg-panel)' }}>
          {/* Clinic Header */}
          <div style={{ textAlign: 'center', borderBottom: '2px solid var(--border)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>AI CLINICAL CARE CENTER</h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
              Primary Health & Safety Outpost • Govt of India ABDM Compliant
            </p>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>
              Date: {new Date(consultation.date).toLocaleDateString(slipLang === 'hi' ? 'hi-IN' : 'en-IN')}
            </div>
          </div>

          {/* Section: Medications */}
          <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.75rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.25rem' }}>
              📋 {slipLang === 'hi' ? 'दवाइयाँ (Medications)' : 'PRESCRIBED MEDICATIONS'}
            </h3>
            {slipData.medications && slipData.medications.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {slipData.medications.map((med: any, idx: number) => (
                  <div key={idx} style={{ paddingLeft: '0.5rem', borderLeft: '3px solid var(--primary)' }}>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>
                      {idx + 1}. {med.name} {med.dose && `(${med.dose})`}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                      <strong>Frequency:</strong> {med.frequency} {med.duration && `| Duration: ${med.duration}`}
                    </div>
                    {med.instructions && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', fontStyle: 'italic', marginTop: '0.1rem' }}>
                        Instructions: {med.instructions}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.9rem' }}>
                No medications prescribed.
              </div>
            )}
          </div>

          {/* Section: Follow-up */}
          <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.25rem' }}>
              📅 {slipLang === 'hi' ? 'अगली मुलाकात (Follow-up)' : 'FOLLOW-UP DATE'}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--primary-light)', color: 'var(--primary)', padding: '0.5rem 0.75rem', borderRadius: '6px', fontWeight: 700, fontSize: '0.95rem' }}>
              <CalendarDays size={18} />
              {slipData.followUpDate}
            </div>
          </div>

          {/* Section: Danger Signs */}
          {slipData.dangerSigns && slipData.dangerSigns.length > 0 && (
            <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--critical-text)', marginBottom: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.25rem' }}>
                ⚠️ {slipLang === 'hi' ? 'खतरे के संकेत (Danger Signs)' : 'COME BACK IMMEDIATELY IF:'}
              </h3>
              <div style={{ backgroundColor: 'var(--critical-bg)', border: '1px solid var(--critical-border)', borderRadius: '6px', padding: '0.75rem 1rem' }}>
                <ul style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--critical-text)', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {slipData.dangerSigns.map((sign: string, i: number) => (
                    <li key={i}><strong>{sign}</strong></li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Section: General Advice */}
          {slipData.generalAdvice && (
            <div style={{ textAlign: 'left' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.25rem' }}>
                💡 {slipLang === 'hi' ? 'सामान्य सलाह (General Advice)' : 'GENERAL ADVICE'}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', margin: 0, lineHeight: 1.5 }}>
                {slipData.generalAdvice}
              </p>
            </div>
          )}

          {/* Footer EMR tag */}
          <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px dashed var(--border)', fontSize: '0.75rem', color: 'var(--text-light)', textAlign: 'center' }}>
            <span>Verified and Approved by Dr. Demo</span>
          </div>
        </div>

        {/* Right Column: Actions & Plaintext EMR Format */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Action Card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Patient Sharing Actions</h3>
            
            <button 
              className="btn btn-primary" 
              onClick={handleShareWhatsApp}
              style={{ 
                backgroundColor: whatsAppSent ? 'var(--success-text)' : '#25D366', 
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              {whatsAppSent ? <Check size={18} /> : <Share2 size={18} />}
              {whatsAppSent ? 'Dispatched via WhatsApp!' : 'Send WhatsApp Slip'}
            </button>

            <button className="btn btn-secondary" onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <Printer size={18} /> Print Rx Slip
            </button>

            <button className="btn btn-secondary" onClick={handleCopyText} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              {copied ? <Check size={18} style={{ color: 'var(--success-text)' }} /> : <FileText size={18} />}
              {copied ? 'Copied to Clipboard!' : 'Copy Plaintext Rx'}
            </button>
          </div>

          {/* Plain Text Receipt Container */}
          <div className="card" style={{ flexGrow: 1, backgroundColor: 'var(--bg-app)', borderStyle: 'dotted' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>EMR TEXT COPY</span>
              <span style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.2rem', color: 'var(--primary)' }}>
                <Sparkles size={12} /> Syncing
              </span>
            </div>
            <pre style={{
              fontFamily: 'var(--mono)',
              fontSize: '0.75rem',
              color: 'var(--text-main)',
              whiteSpace: 'pre-wrap',
              textAlign: 'left',
              margin: 0,
              padding: '0.5rem',
              backgroundColor: 'var(--bg-panel)',
              borderRadius: '4px',
              border: '1px solid var(--border)',
              maxHeight: '300px',
              overflowY: 'auto'
            }}>
              {rawText}
            </pre>
          </div>

          <button 
            className="btn btn-secondary"
            onClick={() => navigate('/dashboard')}
            style={{ width: '100%', borderColor: 'var(--primary)', color: 'var(--primary)', fontWeight: 700 }}
          >
            End Consultation & View Analytics
          </button>
        </div>
      </div>

    </div>
  );
}
export default PatientSlipPage;
