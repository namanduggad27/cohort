import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Mic, 
  Square, 
  Pause, 
  Play, 
  AlertCircle, 
  Volume2,
  Sparkles,
  Info,
  Clock
} from 'lucide-react';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { uploadConsultationAudio } from '../services/api';
import { MOCK_PATIENTS } from './QueuePage';
import { RedFlagPopup } from '../components/RedFlagPopup';

interface SimulatedLine {
  time: number;
  speaker: 'Doctor' | 'Patient';
  text: string;
  triggerRedFlag?: boolean;
}

// Simulated dialogues for each patient case
const SIMULATION_SCRIPTS: Record<string, SimulatedLine[]> = {
  'pat-001': [
    { time: 2, speaker: 'Doctor', text: 'नमस्कार राजीव जी, क्या तकलीफ है आज?' },
    { time: 7, speaker: 'Patient', text: 'जी डॉक्टर साहब, कल रात से छाती में बाईं तरफ बहुत तेज दर्द हो रहा है... sharp pain in left chest, and sweating a lot.' },
    { time: 13, speaker: 'Patient', text: 'और यह दर्द धीरे-धीरे मेरे बाएं हाथ की तरफ जा रहा है। सांस लेने में भी थोड़ी तकलीफ हो रही है।' },
    { time: 18, speaker: 'Patient', text: 'छाती में बहुत भारीपन लग रहा है डॉक्टर साहब।', triggerRedFlag: true },
    { time: 24, speaker: 'Doctor', text: 'यह दर्द कब से है राजीव जी? क्या कल रात 10 बजे से है?' },
    { time: 29, speaker: 'Patient', text: 'हाँ डॉक्टर साहब, करीब कल रात 10 बजे खाना खाने के बाद शुरू हुआ था।' },
    { time: 35, speaker: 'Doctor', text: 'क्या आपको घबराहट या उल्टी जैसा महसूस हो रहा है?' },
    { time: 40, speaker: 'Patient', text: 'हाँ डॉक्टर साहब, बहुत पसीना आ रहा है और घबराहट बहुत ज्यादा हो रही है।' }
  ],
  'pat-002': [
    { time: 2, speaker: 'Doctor', text: 'सुनीता जी, कहिये क्या परेशानी है?' },
    { time: 7, speaker: 'Patient', text: 'डॉक्टर साहब, मुझे दो-तीन दिन से बहुत तेज सिरदर्द हो रहा है और बहुत ज्यादा बुखार है। मुझे ५ महीने का गर्भ भी है।' },
    { time: 13, speaker: 'Doctor', text: 'बुखार कितना है सुनीता जी? आपने नापा था क्या?' },
    { time: 18, speaker: 'Patient', text: 'जी डॉक्टर साहब, कल रात 102.2 नापा था। आँखों के सामने धुंधलापन भी लग रहा है।' },
    { time: 24, speaker: 'Patient', text: 'और सिर बहुत जोर से फट रहा है।', triggerRedFlag: true },
    { time: 30, speaker: 'Doctor', text: 'क्या आपके पैरों में सूजन है?' },
    { time: 35, speaker: 'Patient', text: 'हाँ डॉक्टर साहब, कल से थोड़े सूजे हुए लग रहे हैं।' }
  ],
  'pat-003': [
    { time: 2, speaker: 'Doctor', text: 'अमित जी, नमस्ते। क्या हाल है? शुगर ठीक चल रही है?' },
    { time: 8, speaker: 'Patient', text: 'डॉक्टर साहब, शुगर की दवाई तो ठीक चल रही है, लेकिन कल से पैरों और घुटनों में बहुत दर्द है। बदन दर्द के लिए कोई पेनकिलर लिख दीजिये।' },
    { time: 15, speaker: 'Doctor', text: 'अमित जी, आप पहले से कौन सी दवाइयां ले रहे हैं?' },
    { time: 21, speaker: 'Patient', text: 'मैं Metformin 500mg और Atorvastatin लेता हूँ। और वो खून पतला करने वाली गोली... warfarin 2mg भी चल रही है।' },
    { time: 28, speaker: 'Doctor', text: 'वारफारिन के साथ एस्पिरिन या ब्रूफेन (NSAID) नहीं ले सकते क्योंकि इससे पेट में ब्लीडिंग हो सकती है।' }
  ],
  'pat-004': [
    { time: 2, speaker: 'Doctor', text: 'नमस्ते जी, बच्चे को क्या तकलीफ है?' },
    { time: 7, speaker: 'Patient', text: 'डॉक्टर साहब, आरव को कल रात से बहुत तेज बुखार है... 103.5 बुखार है। कुछ खा-पी नहीं रहा है।' },
    { time: 13, speaker: 'Patient', text: 'जो भी दूध पिलाती हूँ सब उल्टी कर देता है। और कल से बहुत सुस्त हो गया है, रो भी नहीं पा रहा।' },
    { time: 19, speaker: 'Patient', text: 'सुस्त होकर बस सोता रहता है और आंखें भी नहीं खोल रहा।', triggerRedFlag: true },
    { time: 25, speaker: 'Doctor', text: 'क्या बच्चे की सांस तेज चल रही है?' },
    { time: 30, speaker: 'Patient', text: 'हाँ डॉक्टर साहब, बहुत तेज-तेज सांस ले रहा है और छाती भी धंस रही है।' }
  ]
};

export function RecordingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const patient = MOCK_PATIENTS.find(p => p.id === id);

  const recorder = useAudioRecorder();
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedTime, setSimulatedTime] = useState(0);
  const [tickerLines, setTickerLines] = useState<{ speaker: string; text: string }[]>([]);
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Red flag popup states
  const [activeRedFlag, setActiveRedFlag] = useState<{
    type: string;
    triggeringText: string;
    escalationMessage: string;
  } | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickerEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!patient) {
      navigate('/');
    }
  }, [patient, navigate]);

  // Scroll ticker to bottom
  useEffect(() => {
    tickerEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [tickerLines]);

  // Handle simulated clock ticking
  useEffect(() => {
    if (isSimulating && !activeRedFlag) {
      timerRef.current = setInterval(() => {
        setSimulatedTime(prev => {
          const nextTime = prev + 1;
          
          // Check if there are lines corresponding to nextTime
          const script = SIMULATION_SCRIPTS[patient?.id || ''] || [];
          const currentLine = script.find(line => line.time === nextTime);
          
          if (currentLine) {
            setTickerLines(lines => [...lines, { speaker: currentLine.speaker, text: currentLine.text }]);
            
            // Check for red flag trigger
            if (currentLine.triggerRedFlag) {
              if (patient?.id === 'pat-001') {
                setActiveRedFlag({
                  type: 'CARDIAC',
                  triggeringText: 'जी डॉक्टर साहब, कल रात से छाती में बाईं तरफ बहुत तेज दर्द हो रहा है... sharp pain in left chest, and sweating a lot.',
                  escalationMessage: 'Possible STEMI/ACS pattern. Immediate ECG required. Transfer to cardiac center.'
                });
              } else if (patient?.id === 'pat-002') {
                setActiveRedFlag({
                  type: 'PRE-ECLAMPSIA',
                  triggeringText: 'मुझे ५ महीने का गर्भ भी है... तेज सिरदर्द... आँखों के सामने धुंधलापन',
                  escalationMessage: 'Elevated BP (150/95) with pre-eclamptic warning signs (severe headache, edema, vision changes) in a 20-week pregnancy. Immediate OB-GYN evaluation required.'
                });
              } else if (patient?.id === 'pat-004') {
                setActiveRedFlag({
                  type: 'PEDIATRIC SEVERE ILLNESS',
                  triggeringText: '103.5 बुखार... कुछ खा-पी नहीं रहा... उल्टी कर देता है... बहुत सुस्त हो गया है... तेज सांस ले रहा है',
                  escalationMessage: 'Integrated Management of Neonatal & Childhood Illness (IMNCI) guidelines trigger: Child is lethargic, vomiting everything, and has tachypnea. Urgent fluid resuscitation and antibiotic administration. Refer to PICU immediately.'
                });
              }
            }
          }
          
          return nextTime;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isSimulating, activeRedFlag, patient]);

  if (!patient) return null;

  // Format time MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartRealRecording = async () => {
    setIsSimulating(false);
    setTickerLines([]);
    setSimulatedTime(0);
    setErrorMsg(null);
    await recorder.startRecording();
  };

  const handleStartSimulation = () => {
    recorder.resetRecording();
    setIsSimulating(true);
    setTickerLines([{ speaker: 'System', text: '⚡ Simulated Hinglish Consultation Stream Initialized.' }]);
    setSimulatedTime(0);
    setErrorMsg(null);
  };

  const handleStop = async () => {
    setProcessing(true);
    setErrorMsg(null);

    let audioBlobToSend: Blob | null = recorder.audioBlob;
    
    if (isSimulating) {
      setIsSimulating(false);
      if (timerRef.current) clearInterval(timerRef.current);
      
      // For simulated runs, we send a small dummy blob to trigger the pipeline in the backend
      audioBlobToSend = new Blob([new Uint8Array([1, 2, 3, 4])], { type: 'audio/webm' });
    } else {
      recorder.stopRecording();
    }

    // Wait slightly to let the recorder finalize its state
    setTimeout(async () => {
      try {
        const targetBlob = audioBlobToSend || recorder.audioBlob;
        if (!targetBlob) {
          throw new Error("No audio content available to process. Please record or run simulation first.");
        }
        
        const response = await uploadConsultationAudio(
          targetBlob,
          patient.id,
          'doc-101' // Mock Doc ID
        );
        
        navigate(`/consult/${response.consultation.id}/review`);
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Processing failed. Check API connectivity.');
        setProcessing(false);
      }
    }, 800);
  };

  const handleAcknowledgeRedFlag = () => {
    setActiveRedFlag(null);
  };

  const handleEscalateRedFlag = () => {
    alert(`🚨 ER Escalation Signal Dispatched to Triage Desk for Patient ${patient.name}`);
    setActiveRedFlag(null);
  };

  const displayTime = isSimulating ? simulatedTime : recorder.elapsedSeconds;
  const displayState = isSimulating ? (activeRedFlag ? 'paused' : 'recording') : recorder.state;

  return (
    <div className="app-container" style={{ maxWidth: '800px' }}>
      
      {/* Top Details */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>CONSULTATION FOR</span>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>{patient.name}</h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {patient.age}Y • {patient.sex} • BP: {patient.vitals.bp || 'N/A'} • Temp: {patient.vitals.temp || 'N/A'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <span className={`badge ${displayState === 'recording' ? 'badge-critical pulse-animation' : 'badge-info'}`}>
            {displayState === 'recording' ? 'LIVE LISTENING' : displayState === 'paused' ? 'PAUSED' : 'READY'}
          </span>
        </div>
      </div>

      {/* Recording Display Card */}
      <div className="card" style={{ padding: '3rem 2rem', textAlign: 'center', marginBottom: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
        
        {/* Timer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '3rem', fontWeight: 800, fontFamily: 'var(--mono)', color: displayState === 'recording' ? 'var(--critical-text)' : 'var(--text-main)' }}>
          <Clock size={36} />
          {formatTime(displayTime)}
        </div>
        
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '400px' }}>
          Max consultation time 10:00 minutes. Speech recognition handles code-switched Hindi/English dialogue in real-time.
        </p>

        {/* Audio Waveform simulation */}
        {displayState === 'recording' && (
          <div style={{ display: 'flex', gap: '4px', height: '32px', alignItems: 'center' }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 7, 6, 5, 4, 3, 4, 5, 6, 7, 8, 9, 8, 7, 6, 5].map((h, i) => (
              <div 
                key={i} 
                style={{ 
                  width: '3px', 
                  height: `${h * 3}px`, 
                  backgroundColor: 'var(--primary)', 
                  borderRadius: '2px',
                  animation: 'pulse 1s infinite alternate',
                  animationDelay: `${i * 0.05}s`
                }} 
              />
            ))}
          </div>
        )}

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '1rem' }}>
          {displayState === 'idle' ? (
            <>
              <button className="btn btn-primary" onClick={handleStartRealRecording}>
                <Mic size={18} /> Record Microphone
              </button>
              <button className="btn btn-secondary" onClick={handleStartSimulation} style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}>
                <Sparkles size={18} /> Run Case Simulation
              </button>
            </>
          ) : (
            <>
              {displayState === 'recording' && (
                <button 
                  className="btn btn-secondary" 
                  onClick={() => isSimulating ? setActiveRedFlag({ type: 'MANUAL', triggeringText: 'Manual Pause Triggered', escalationMessage: 'Manual inspection pause.' }) : recorder.pauseRecording()}
                >
                  <Pause size={18} /> Pause
                </button>
              )}

              {displayState === 'paused' && (
                <button 
                  className="btn btn-primary" 
                  onClick={() => isSimulating ? setActiveRedFlag(null) : recorder.resumeRecording()}
                >
                  <Play size={18} /> Resume
                </button>
              )}

              <button className="btn btn-danger" onClick={handleStop} disabled={processing} style={{ backgroundColor: '#ef4444', color: 'white' }}>
                <Square size={18} fill="white" /> Stop & Process
              </button>
            </>
          )}
        </div>

        {errorMsg && (
          <div style={{ color: 'var(--critical-text)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.9rem', marginTop: '1rem' }}>
            <AlertCircle size={16} /> {errorMsg}
          </div>
        )}
      </div>

      {/* Real-time transcript ticker */}
      {(tickerLines.length > 0 || displayState === 'recording') && (
        <div className="card" style={{ textAlign: 'left', padding: '1.5rem', maxHeight: '250px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Volume2 size={16} /> Live Transcript Ticker (Hinglish Supported)
          </h3>
          <div style={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingRight: '0.5rem' }}>
            {tickerLines.length === 0 ? (
              <span style={{ fontSize: '0.9rem', color: 'var(--text-light)', fontStyle: 'italic' }}>
                Start talking or run simulation to see speech stream...
              </span>
            ) : (
              tickerLines.map((line, idx) => (
                <div 
                  key={idx} 
                  style={{ 
                    fontSize: '0.9rem', 
                    color: line.speaker === 'Doctor' ? 'var(--primary)' : line.speaker === 'System' ? 'var(--text-light)' : 'var(--text-main)',
                    fontWeight: line.speaker === 'System' ? 500 : 'normal',
                    padding: '0.25rem 0.5rem',
                    background: line.speaker === 'System' ? 'var(--bg-app)' : 'none',
                    borderRadius: '4px'
                  }}
                >
                  <strong>{line.speaker === 'System' ? '' : `${line.speaker}: `}</strong>
                  {line.text}
                </div>
              ))
            )}
            <div ref={tickerEndRef} />
          </div>
        </div>
      )}

      {/* Simulation Info */}
      {isSimulating && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem', background: 'var(--info-bg)', border: '1px solid var(--info-border)', borderRadius: '8px', color: 'var(--info-text)', marginTop: '1.5rem', fontSize: '0.85rem', textAlign: 'left' }}>
          <Info size={16} style={{ flexShrink: 0 }} />
          <span>
            Running a clinical scenario simulation. The transcript is fed directly into our RAG pipelines. 
            At specific intervals, critical symptoms will trigger safety alerts in real-time.
          </span>
        </div>
      )}

      {/* Red flag popups */}
      {activeRedFlag && (
        <RedFlagPopup 
          type={activeRedFlag.type}
          triggeringText={activeRedFlag.triggeringText}
          escalationMessage={activeRedFlag.escalationMessage}
          onAcknowledge={handleAcknowledgeRedFlag}
          onEscalate={handleEscalateRedFlag}
        />
      )}

      {/* Processing Loader */}
      {processing && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(11, 15, 25, 0.85)',
          zIndex: 2000,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          gap: '1.5rem'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid rgba(255, 255, 255, 0.2)',
            borderTopColor: 'var(--primary)',
            borderRadius: '50%',
            animation: 'pulse 1s infinite alternate'
          }} />
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Analyzing Consultation Audio</h3>
            <p style={{ margin: '0.25rem 0 0 0', opacity: 0.7, fontSize: '0.9rem' }}>
              Sarvam Hinglish STT ➔ Claude Haiku Extraction ➔ Pinecone RAG Guidelines ➔ Claude Sonnet Synthesis
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
export default RecordingPage;
