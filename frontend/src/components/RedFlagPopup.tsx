import { AlertOctagon, PhoneCall, ShieldCheck, X } from 'lucide-react';

interface RedFlagPopupProps {
  type: string;
  triggeringText: string;
  escalationMessage: string;
  onAcknowledge: () => void;
  onEscalate: () => void;
}

export function RedFlagPopup({
  type,
  triggeringText,
  escalationMessage,
  onAcknowledge,
  onEscalate
}: RedFlagPopupProps) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      backdropFilter: 'blur(6px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div 
        className="card modal-animate" 
        style={{
          width: '500px',
          maxWidth: '90%',
          backgroundColor: 'var(--bg-panel)',
          border: '2px solid var(--critical-border)',
          boxShadow: 'var(--shadow-lg)',
          padding: '2rem',
          position: 'relative'
        }}
      >
        <button 
          onClick={onAcknowledge}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'var(--critical-bg)',
            color: '#ef4444',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem'
          }}>
            <AlertOctagon size={36} className="pulse-animation" style={{ borderRadius: '50%' }} />
          </div>
          <h2 style={{ color: '#ef4444', margin: 0, fontSize: '1.5rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {type} Red Flag Detected
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Real-time Audio Safety Sentinel Analysis
          </p>
        </div>

        <div style={{ 
          backgroundColor: 'var(--bg-app)', 
          borderLeft: '4px solid #ef4444', 
          padding: '1rem', 
          borderRadius: '6px',
          marginBottom: '1.5rem'
        }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>
            TRIGGERING SPEECH CAPTURED
          </span>
          <p style={{ fontStyle: 'italic', fontSize: '0.95rem', color: 'var(--text-main)', margin: 0 }}>
            "{triggeringText}"
          </p>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>
            ICMR CLINICAL ESCALATION ADVISORY
          </span>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', margin: 0 }}>
            {escalationMessage}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <button 
            className="btn btn-secondary" 
            onClick={onAcknowledge}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '0.5rem',
              borderColor: 'var(--border)',
              fontWeight: 600
            }}
          >
            <ShieldCheck size={18} /> Acknowledge
          </button>
          
          <button 
            className="btn btn-danger" 
            onClick={onEscalate}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '0.5rem',
              backgroundColor: '#ef4444',
              color: 'white',
              fontWeight: 600
            }}
          >
            <PhoneCall size={18} /> Escalate to ER
          </button>
        </div>
      </div>
    </div>
  );
}
export default RedFlagPopup;
