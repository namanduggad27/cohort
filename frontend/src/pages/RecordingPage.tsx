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
import { getPatientById } from '../services/patientStore';
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
    { time: 2, speaker: 'Doctor', text: 'Namaste Rajiv ji, bataiye aaj kya takleef ho rahi hai?' },
    { time: 7, speaker: 'Patient', text: 'Ji Doctor sahab, kal raat se chest mein left side bohot tej dard ho raha hai... sharp pain in left chest, and sweating a lot.' },
    { time: 13, speaker: 'Patient', text: 'Aur yeh pain dheere dheere mere left arm ki taraf radiate ho raha hai. Saans lene mein bhi thodi problem ho rahi hai.' },
    { time: 18, speaker: 'Patient', text: 'Chest mein bohot heaviness aur tightness lag rahi hai Doctor sahab.', triggerRedFlag: true },
    { time: 24, speaker: 'Doctor', text: 'Yeh pain kab se hai Rajiv ji? Kya kal raat 10 baje se shuru hua tha?' },
    { time: 29, speaker: 'Patient', text: 'Haan Doctor sahab, karib kal raat 10 baje dinner ke baad shuru hua tha.' },
    { time: 35, speaker: 'Doctor', text: 'Kya aapko ghabrahat ya vomiting jaisa feel ho raha hai?' },
    { time: 40, speaker: 'Patient', text: 'Haan Doctor sahab, bohot pasina aa raha hai aur ghabrahat bohot jyada ho rahi hai.' }
  ],
  'pat-002': [
    { time: 2, speaker: 'Doctor', text: 'Sunita ji, bataiye kya pareshani hai?' },
    { time: 7, speaker: 'Patient', text: 'Doctor sahab, mujhe 2-3 din se bohot tej headache ho raha hai aur high fever hai. Main 5 months pregnant bhi hoon.' },
    { time: 13, speaker: 'Doctor', text: 'Fever kitna hai Sunita ji? Aapne thermometer se check kiya tha kya?' },
    { time: 18, speaker: 'Patient', text: 'Ji Doctor sahab, kal raat 102.2 check kiya tha. Aankhon ke saamne thoda blurriness aur dhundhlapan bhi lag raha hai.' },
    { time: 24, speaker: 'Patient', text: 'Aur sir bohot zor se phat raha hai, severe headache hai.', triggerRedFlag: true },
    { time: 30, speaker: 'Doctor', text: 'Kya aapke feet aur pairon mein swelling ya sujan hai?' },
    { time: 35, speaker: 'Patient', text: 'Haan Doctor sahab, kal se dono feet thode swollen lag rahe hain.' }
  ],
  'pat-003': [
    { time: 2, speaker: 'Doctor', text: 'Amit ji, Namaste. Kya haal hai? Sugar aur BP theek chal raha hai?' },
    { time: 8, speaker: 'Patient', text: 'Doctor sahab, sugar ki medicine toh theek chal rahi hai, lekin kal se legs aur knees mein bohot pain hai. Badan dard ke liye koi strong painkiller likh dijiye.' },
    { time: 15, speaker: 'Doctor', text: 'Amit ji, aap pehle se kaun kaun si medicines le rahe hain regular?' },
    { time: 21, speaker: 'Patient', text: 'Main Metformin 500mg aur Atorvastatin leta hoon. Aur woh blood thinner wali tablet... Warfarin 2mg bhi chal rahi hai.' },
    { time: 28, speaker: 'Doctor', text: 'Warfarin ke saath Aspirin ya Brufen (NSAIDs) bilkul nahi le sakte, isse stomach bleeding ka risk rehta hai.' }
  ],
  'pat-004': [
    { time: 2, speaker: 'Doctor', text: 'Namaste ji, bacche ko kya takleef ho rahi hai?' },
    { time: 7, speaker: 'Patient', text: 'Doctor sahab, Aarav ko kal raat se bohot tej fever hai... 103.5 fever hai. Kuch kha pee nahi raha hai.' },
    { time: 13, speaker: 'Patient', text: 'Jo bhi milk pilati hoon sab vomit kar deta hai. Aur kal se bohot dull aur lethargic ho gaya hai, ro bhi nahi pa raha.' },
    { time: 19, speaker: 'Patient', text: 'Bohot lethargic hokar bas sota rehta hai aur aankhein bhi nahi khol raha.', triggerRedFlag: true },
    { time: 25, speaker: 'Doctor', text: 'Kya bacche ki saans bohot fast chal rahi hai?' },
    { time: 30, speaker: 'Patient', text: 'Haan Doctor sahab, bohot tej tej saans le raha hai aur chest bhi andar dhans rahi hai.' }
  ]
};

const DEFAULT_SIMULATION_SCRIPT: SimulatedLine[] = [
  { time: 2, speaker: 'Doctor', text: 'Namaste ji, bataiye aaj kya takleef ho rahi hai?' },
  { time: 7, speaker: 'Patient', text: 'Doctor sahab, pichle 2-3 din se bohot tej fever aur sar dard (headache) ho raha hai.' },
  { time: 13, speaker: 'Patient', text: 'Saath mein badan dard (body ache) aur kamzori (weakness) bhi lag rahi hai. Kuch khane ka mann nahi kar raha.' },
  { time: 18, speaker: 'Doctor', text: 'Accha, koi cough ya throat pain toh nahi hai? Aur temperature kitna check kiya tha?' },
  { time: 24, speaker: 'Patient', text: 'Kal raat 101.5 fever check kiya tha Doctor sahab. Cough thoda bohot hai.' },
  { time: 30, speaker: 'Doctor', text: 'Theek hai, darne ki koi baat nahi. Main vitals check karke kuch medicines likh deta hoon.' }
];

export function RecordingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const patient = id ? getPatientById(id) : undefined;

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
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

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
          const script = SIMULATION_SCRIPTS[patient?.id || ''] || DEFAULT_SIMULATION_SCRIPT;
          const currentLine = script.find(line => line.time === nextTime);
          
          if (currentLine) {
            setTickerLines(lines => [...lines, { speaker: currentLine.speaker, text: currentLine.text }]);
            
            // Check for red flag trigger
            if (currentLine.triggerRedFlag) {
              if (patient?.id === 'pat-001') {
                setActiveRedFlag({
                  type: 'CARDIAC',
                  triggeringText: 'Ji Doctor sahab, kal raat se chest mein left side bohot tej dard ho raha hai... sharp pain in left chest, and sweating a lot.',
                  escalationMessage: 'Possible STEMI/ACS pattern. Immediate ECG required. Transfer to cardiac center.'
                });
              } else if (patient?.id === 'pat-002') {
                setActiveRedFlag({
                  type: 'PRE-ECLAMPSIA',
                  triggeringText: 'Main 5 months pregnant bhi hoon... severe headache... aankhon ke saamne blurriness',
                  escalationMessage: 'Elevated BP (150/95) with pre-eclamptic warning signs (severe headache, edema, vision changes) in a 20-week pregnancy. Immediate OB-GYN evaluation required.'
                });
              } else if (patient?.id === 'pat-004') {
                setActiveRedFlag({
                  type: 'PEDIATRIC SEVERE ILLNESS',
                  triggeringText: '103.5 fever... kuch kha pee nahi raha... sab vomit kar deta hai... bohot lethargic ho gaya hai... tej saans le raha hai',
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
    setTickerLines([{ speaker: 'System', text: '🎙️ Live Microphone Active. Listening for speech stream...' }]);
    setSimulatedTime(0);
    setErrorMsg(null);
    await recorder.startRecording();

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        if (recognitionRef.current) recognitionRef.current.stop();
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-IN';

        recognition.onresult = (event: any) => {
          const results = Array.from(event.results);
          const latestResult = results[results.length - 1] as any;
          const transcript = latestResult[0].transcript.trim();
          if (transcript) {
            setTickerLines(prev => {
              const withoutInterim = prev.filter(l => !l.text.startsWith('⏳'));
              if (latestResult.isFinal) {
                return [...withoutInterim, { speaker: 'Patient/Doc', text: transcript }];
              } else {
                return [...withoutInterim, { speaker: 'Patient/Doc', text: `⏳ ${transcript}...` }];
              }
            });
          }
        };

        recognition.onerror = () => {};
        recognition.start();
        recognitionRef.current = recognition;
      } else {
        setTickerLines(prev => [...prev, { speaker: 'System', text: 'ℹ️ Live browser preview not available. Full audio will be transcribed by Groq Whisper when stopped.' }]);
      }
    } catch (e) {
      console.warn('Speech preview start failed:', e);
    }
  };

  const handleStartSimulation = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    recorder.resetRecording();
    setIsSimulating(true);
    setTickerLines([{ speaker: 'System', text: '⚡ Simulated Hinglish Consultation Stream Initialized.' }]);
    setSimulatedTime(0);
    setErrorMsg(null);
  };

  const handleStop = async () => {
    setProcessing(true);
    setErrorMsg(null);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    try {
      let targetBlob: Blob | null = null;
      
      if (isSimulating) {
        setIsSimulating(false);
        if (timerRef.current) clearInterval(timerRef.current);
        targetBlob = new Blob([new Uint8Array([1, 2, 3, 4])], { type: 'audio/webm' });
      } else {
        targetBlob = await recorder.stopRecording();
      }

      if (!targetBlob || targetBlob.size === 0) {
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
