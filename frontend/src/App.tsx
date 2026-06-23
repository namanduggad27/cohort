import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { BarChart3, Users, HeartPulse } from 'lucide-react';
import { QueuePage } from './pages/QueuePage';
import { PatientContextPage } from './pages/PatientContextPage';
import { RecordingPage } from './pages/RecordingPage';
import { SOAPReviewPage } from './pages/SOAPReviewPage';
import { PatientSlipPage } from './pages/PatientSlipPage';
import { DashboardPage } from './pages/DashboardPage';

function NavigationHeader() {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="app-header">
      <Link to="/" className="logo-container">
        <HeartPulse className="logo-icon" size={28} />
        <div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, lineHeight: 1.1 }}>Clinical Scribe</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.05em' }}>
            COHORT 40 CLINICAL AI
          </div>
        </div>
      </Link>
      
      <nav className="nav-links">
        <Link 
          to="/" 
          className={`nav-link ${isActive('/') ? 'active' : ''}`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}
        >
          <Users size={16} /> Patient Queue
        </Link>
        
        <Link 
          to="/dashboard" 
          className={`btn-dashboard ${isActive('/dashboard') ? 'active' : ''}`}
        >
          <BarChart3 size={16} /> EOD Dashboard
        </Link>
      </nav>
    </header>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <NavigationHeader />
        
        <main style={{ flexGrow: 1 }}>
          <Routes>
            <Route path="/" element={<QueuePage />} />
            <Route path="/patient/:id" element={<PatientContextPage />} />
            <Route path="/consult/:id/record" element={<RecordingPage />} />
            <Route path="/consult/:id/review" element={<SOAPReviewPage />} />
            <Route path="/consult/:id/slip" element={<PatientSlipPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
          </Routes>
        </main>
        
        <footer style={{ 
          padding: '1.5rem', 
          borderTop: '1px solid var(--border)', 
          textAlign: 'center', 
          fontSize: '0.8rem', 
          color: 'var(--text-muted)',
          backgroundColor: 'var(--bg-panel)'
        }}>
          <div>© 2026 Clinical Voice Scribe Safety Assistant. Government of India ABDM Standards.</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-light)', marginTop: '0.25rem' }}>
            Built with Sarvam Hinglish STT • Pinecone RAG • Claude 3.5 Sonnet Synthesis
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
