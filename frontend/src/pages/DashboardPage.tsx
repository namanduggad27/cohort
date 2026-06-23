import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Clock, 
  AlertOctagon, 
  TrendingUp, 
  ArrowLeft, 
  ShieldCheck, 
  History,
  Coins
} from 'lucide-react';
import { listConsultations } from '../services/api';
import type { Consultation } from '../types/consultation.types';

export function DashboardPage() {
  const navigate = useNavigate();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const list = await listConsultations();
        setConsultations(list);
      } catch (err) {
        console.error('Failed to load consultation history.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Compute stats
  const totalConsults = consultations.length;
  const approvedConsults = consultations.filter(c => c.status === 'approved').length;
  
  let totalRedFlags = 0;
  let totalDrugInteractions = 0;
  let totalCostInr = 0;
  
  consultations.forEach(c => {
    if (c.soapNote?.flags?.redFlags) {
      totalRedFlags += c.soapNote.flags.redFlags.length;
    }
    if (c.soapNote?.flags?.drugInteractions) {
      totalDrugInteractions += c.soapNote.flags.drugInteractions.length;
    }
    if (c.costBreakdown?.total_inr) {
      totalCostInr += c.costBreakdown.total_inr;
    }
  });

  // 4 minutes saved per consultation
  const totalMinutesSaved = totalConsults * 4;

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="app-container">
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>EMR Analytics & EOD Dashboard</h1>
          <p style={{ color: 'var(--text-muted)' }}>Clinic Performance & Clinical Safety Insights</p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ArrowLeft size={16} /> Back to Queue
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        {/* Total consultations */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL CONSULTATIONS</span>
              <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.25rem' }}>{totalConsults}</div>
            </div>
            <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'var(--primary-light)', color: 'var(--primary)' }}>
              <Users size={20} />
            </div>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--success-text)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <ShieldCheck size={14} /> {approvedConsults} approved & saved
          </div>
        </div>

        {/* Time saved */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>PHYSICIAN TIME SAVED</span>
              <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.25rem' }}>{totalMinutesSaved}m</div>
            </div>
            <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
              <Clock size={20} />
            </div>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <TrendingUp size={14} /> At ~4 min saved per consult
          </div>
        </div>

        {/* Red Flags Triggered */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>RED FLAGS INTERCEPTED</span>
              <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.25rem', color: totalRedFlags > 0 ? 'var(--critical-text)' : 'inherit' }}>
                {totalRedFlags}
              </div>
            </div>
            <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'var(--critical-bg)', color: 'var(--critical-text)' }}>
              <AlertOctagon size={20} />
            </div>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            {totalDrugInteractions} drug interaction alerts
          </div>
        </div>

        {/* Total Cost */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>COMPUTE BUDGET SPENT</span>
              <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.25rem' }}>₹{totalCostInr.toFixed(2)}</div>
            </div>
            <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(249, 115, 22, 0.15)', color: '#f97316' }}>
              <Coins size={20} />
            </div>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--success-text)', marginTop: '0.5rem', fontWeight: 600 }}>
            Avg ₹{(totalConsults > 0 ? (totalCostInr / totalConsults) : 0).toFixed(2)} per consult
          </div>
        </div>
      </div>

      {/* Consultations Table / List */}
      <div className="card" style={{ padding: '1.5rem', textAlign: 'left' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <History size={20} /> Today's Consultation Log
        </h3>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>Loading consultations...</div>
        ) : consultations.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-light)', padding: '3rem 0' }}>
            No consultations processed today yet. Start a consult from the Patient Queue.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Patient ID</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Date & Time</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Duration</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Compute Cost</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Alerts Surface</th>
                  <th style={{ padding: '0.75rem 1rem' }}>EMR Status</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {consultations.map((consult) => {
                  const hasFlags = (consult.soapNote?.flags?.redFlags?.length ?? 0) > 0 || (consult.soapNote?.flags?.drugInteractions?.length ?? 0) > 0;
                  
                  return (
                    <tr key={consult.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '1rem', fontWeight: 600 }}>{consult.patientId}</td>
                      <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                        {new Date(consult.date).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                      </td>
                      <td style={{ padding: '1rem' }}>{formatDuration(consult.durationSeconds)}</td>
                      <td style={{ padding: '1rem', fontWeight: 600 }}>₹{consult.costBreakdown?.total_inr.toFixed(2) || '0.00'}</td>
                      <td style={{ padding: '1rem' }}>
                        {hasFlags ? (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {(consult.soapNote?.flags?.redFlags?.length ?? 0) > 0 && (
                              <span className="badge badge-critical" style={{ fontSize: '0.65rem' }}>Red Flag</span>
                            )}
                            {(consult.soapNote?.flags?.drugInteractions?.length ?? 0) > 0 && (
                              <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>Interaction</span>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--success-text)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            <ShieldCheck size={14} /> Safe
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span className={`badge ${consult.status === 'approved' ? 'badge-success' : 'badge-warning'}`}>
                          {consult.status}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                          onClick={() => navigate(`/consult/${consult.id}/slip`)}
                        >
                          View Rx Slip
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
export default DashboardPage;
