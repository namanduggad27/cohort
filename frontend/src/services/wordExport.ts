import type { Consultation, SOAPNote } from '../types/consultation.types';

export function downloadWordDocument(patientName: string, consultation: Consultation, soap: SOAPNote) {
  const htmlContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>Clinical Consultation Report - ${patientName}</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11pt; line-height: 1.6; color: #1f2937; padding: 20px; }
        .header { text-align: center; border-bottom: 3px solid #1e40af; padding-bottom: 15px; margin-bottom: 20px; }
        .header h1 { color: #1e40af; font-size: 20pt; margin: 0; text-transform: uppercase; letter-spacing: 1px; }
        .header p { color: #6b7280; font-size: 10pt; margin: 5px 0 0 0; }
        
        .meta-table { width: 100%; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; margin-bottom: 20px; }
        .meta-table td { padding: 10px 15px; border: none; font-size: 10.5pt; }
        
        h2 { color: #1e40af; font-size: 13pt; background-color: #eff6ff; padding: 8px 12px; border-left: 4px solid #2563eb; margin-top: 25px; margin-bottom: 12px; }
        
        .section-content { padding: 0 10px; margin-bottom: 15px; }
        .field-label { font-weight: bold; color: #475569; font-size: 10pt; text-transform: uppercase; display: block; margin-top: 10px; margin-bottom: 3px; }
        .field-value { background-color: #ffffff; padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 4px; margin-bottom: 10px; min-height: 20px; }
        
        .vitals-box { background-color: #f1f5f9; padding: 12px; border-radius: 6px; border: 1px solid #cbd5e1; margin-bottom: 20px; font-weight: bold; color: #0f172a; }
        
        .alert-box { background-color: #fef2f2; border: 1px solid #fecaca; border-left: 5px solid #ef4444; padding: 15px; margin-bottom: 20px; color: #991b1b; border-radius: 4px; }
        .alert-title { font-weight: bold; font-size: 12pt; margin-bottom: 8px; color: #b91c1c; }
        
        .warning-box { background-color: #fffbeb; border: 1px solid #fde68a; border-left: 5px solid #f59e0b; padding: 15px; margin-bottom: 20px; color: #92400e; border-radius: 4px; }
        
        .transcript-box { background-color: #f8fafc; border: 1px dashed #94a3b8; padding: 15px; font-style: italic; margin-top: 10px; border-radius: 6px; color: #334155; line-height: 1.8; }
        
        .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center; font-size: 9pt; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🏥 Clinical Consultation Report</h1>
        <p>Indian Primary Care Safety-First Electronic Medical Record (EMR)</p>
      </div>
      
      <table class="meta-table">
        <tr>
          <td><strong>Patient Name:</strong> ${patientName}</td>
          <td><strong>Consultation ID:</strong> ${consultation.id.slice(0, 8).toUpperCase()}</td>
          <td><strong>Date & Time:</strong> ${new Date(soap.date).toLocaleString()}</td>
        </tr>
      </table>

      <div class="vitals-box">
        🩺 <strong>Recorded Vitals Snapshot:</strong> &nbsp;&nbsp; ${soap.objective.vitals || 'Not Recorded'}
      </div>

      ${soap.flags?.redFlags?.length > 0 ? `
        <div class="alert-box">
          <div class="alert-title">🚨 CRITICAL RED FLAG TRIAGE ALERT</div>
          ${soap.flags.redFlags.map(f => `
            <div style="margin-bottom: 10px;">
              <strong>[${f.type.toUpperCase()}] ${f.description}</strong><br>
              <span style="color: #7f1d1d;">Mandatory Action: ${f.escalationMessage}</span>
              ${f.icmrReference ? `<br><small style="color: #64748b;">Citation: ${f.icmrReference}</small>` : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${soap.flags?.drugInteractions?.length > 0 ? `
        <div class="warning-box">
          <div style="font-weight: bold; font-size: 11pt; margin-bottom: 8px;">⚠️ CRITICAL DRUG INTERACTION DETECTED</div>
          ${soap.flags.drugInteractions.map(d => `
            <div style="margin-bottom: 10px;">
              <strong>${d.drugA.toUpperCase()} + ${d.drugB.toUpperCase()} (${d.severity})</strong><br>
              <span>Mechanism: ${d.mechanism}</span><br>
              <strong>Recommendation:</strong> ${d.recommendation}
            </div>
          `).join('')}
        </div>
      ` : ''}

      <h2>S - Subjective Notes</h2>
      <div class="section-content">
        <span class="field-label">Chief Complaint</span>
        <div class="field-value">${soap.subjective.chiefComplaint || 'None recorded'}</div>

        <span class="field-label">History of Present Illness (HPI)</span>
        <div class="field-value">${soap.subjective.historyOfPresentIllness || 'None recorded'}</div>

        <table style="width: 100%; border: none; margin: 0;">
          <tr>
            <td style="width: 50%; padding: 0 10px 0 0;">
              <span class="field-label">Past Medical History</span>
              <div class="field-value">${soap.subjective.pastMedicalHistory || 'None'}</div>
            </td>
            <td style="width: 50%; padding: 0 0 0 10px;">
              <span class="field-label">Known Allergies</span>
              <div class="field-value" style="color: #b91c1c; font-weight: bold;">${soap.subjective.allergies || 'None reported'}</div>
            </td>
          </tr>
        </table>

        <span class="field-label">Current Medications</span>
        <div class="field-value">${soap.subjective.medications || 'None'}</div>
      </div>

      <h2>O - Objective Findings</h2>
      <div class="section-content">
        <span class="field-label">Physical Examination</span>
        <div class="field-value">${soap.objective.physicalExamination || 'Within normal limits'}</div>

        <span class="field-label">Pending / Recommended Investigations</span>
        <div class="field-value">${soap.objective.investigations || 'None ordered'}</div>
      </div>

      <h2>A - Assessment & Diagnosis</h2>
      <div class="section-content">
        <span class="field-label" style="color: #1e40af; font-size: 11pt;">Primary Clinical Diagnosis</span>
        <div class="field-value" style="font-weight: bold; font-size: 11.5pt; border-color: #3b82f6; background-color: #f0fdf4; color: #166534;">${soap.assessment.diagnosis || 'Pending Review'}</div>

        <span class="field-label">Differential Diagnosis</span>
        <div class="field-value">${soap.assessment.differentialDiagnosis || 'None listed'}</div>

        <span class="field-label">Clinical Impression</span>
        <div class="field-value">${soap.assessment.clinicalImpression || 'None recorded'}</div>
      </div>

      <h2>P - Treatment Plan & Prescriptions</h2>
      <div class="section-content">
        <span class="field-label">Prescribed Medications & Dosage Instructions</span>
        <div class="field-value" style="white-space: pre-wrap; font-weight: 500;">${soap.plan.medications || 'None prescribed'}</div>

        <span class="field-label">Diagnostic Workup Ordered</span>
        <div class="field-value">${soap.plan.investigations || 'None'}</div>

        <span class="field-label">Referrals & Patient Advice</span>
        <div class="field-value" style="white-space: pre-wrap;">${soap.plan.referrals ? soap.plan.referrals + '\n' : ''}${soap.plan.patientEducation || ''}</div>

        <span class="field-label">Follow-Up Schedule</span>
        <div class="field-value" style="font-weight: bold;">${soap.plan.followUp || 'As needed PRN'}</div>
      </div>

      ${consultation.transcript ? `
        <h2>🎙️ Recorded Consultation Transcript (Hinglish)</h2>
        <div class="section-content">
          <div class="transcript-box">
            "${consultation.transcript}"
          </div>
        </div>
      ` : ''}
      
      <div class="footer">
        Generated by Clinical Scribe EMR Engine • Powered by Groq Whisper & Claude 3.5 Sonnet • Secure Medical Record
      </div>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Clinical_Report_${patientName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
