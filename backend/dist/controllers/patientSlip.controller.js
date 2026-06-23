"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.patientSlipController = patientSlipController;
const consultation_service_1 = require("../services/consultation.service");
const logger_1 = require("../utils/logger");
const HINDI_TRANSLATIONS = {
    'Medications': 'दवाइयाँ',
    'Follow-up Date': 'अगली मुलाकात',
    'Danger Signs': 'खतरे के संकेत',
    'General Advice': 'सामान्य सलाह',
    'Come back immediately if': 'तुरंत वापस आएं अगर',
    'tablets': 'गोलियाँ',
    'capsules': 'कैप्सूल',
    'times a day': 'बार दिन में',
    'after meals': 'खाने के बाद',
    'before meals': 'खाने से पहले',
    'with water': 'पानी के साथ',
};
async function patientSlipController(req, res) {
    const { consultationId, language = 'en' } = req.body;
    const consultation = (0, consultation_service_1.getConsultation)(consultationId);
    if (!consultation) {
        res.status(404).json({ error: 'Consultation not found' });
        return;
    }
    const soapNote = consultation.soapNote;
    if (!soapNote) {
        res.status(400).json({ error: 'SOAP note not yet generated for this consultation' });
        return;
    }
    try {
        const slip = soapNote.patientSlip ?? {
            medications: [],
            followUpDate: 'As advised by physician',
            dangerSigns: [],
            generalAdvice: soapNote.plan?.patientEducation || '',
        };
        // Build English slip content
        const enContent = buildEnglishSlip(slip, consultation.date);
        // Build Hindi slip content
        const hiContent = buildHindiSlip(slip, consultation.date);
        logger_1.logger.info('Patient slip generated', {
            requestId: req.requestId,
            consultationId,
            language,
        });
        res.json({
            consultationId,
            language,
            slip,
            content: language === 'hi' ? hiContent : enContent,
            contentEn: enContent,
            contentHi: hiContent,
        });
    }
    catch (err) {
        logger_1.logger.error('Patient slip controller: Failed', {
            requestId: req.requestId,
            error: err instanceof Error ? err.message : String(err),
        });
        res.status(500).json({ error: 'Patient slip generation failed' });
    }
}
function buildEnglishSlip(slip, date) {
    const lines = [
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '   PATIENT DISCHARGE SLIP',
        `   Date: ${new Date(date).toLocaleDateString('en-IN')}`,
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        '📋 MEDICATIONS:',
    ];
    if (slip.medications && slip.medications.length > 0) {
        slip.medications.forEach((med, i) => {
            lines.push(`${i + 1}. ${med.name} ${med.dose || ''}`);
            lines.push(`   ${med.frequency || ''} ${med.duration ? `for ${med.duration}` : ''}`);
            if (med.instructions)
                lines.push(`   (${med.instructions})`);
        });
    }
    else {
        lines.push('   As prescribed by your doctor');
    }
    lines.push('', `📅 FOLLOW-UP: ${slip.followUpDate || 'As advised'}`);
    if (slip.dangerSigns && slip.dangerSigns.length > 0) {
        lines.push('', '⚠️ COME BACK IMMEDIATELY IF:');
        slip.dangerSigns.forEach((s) => lines.push(`  • ${s}`));
    }
    if (slip.generalAdvice) {
        lines.push('', '💡 GENERAL ADVICE:', `   ${slip.generalAdvice}`);
    }
    lines.push('', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'AI-assisted documentation.', 'Reviewed and approved by your physician.', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return lines.join('\n');
}
function buildHindiSlip(slip, date) {
    const lines = [
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '   रोगी पर्ची (Patient Slip)',
        `   दिनांक: ${new Date(date).toLocaleDateString('hi-IN')}`,
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        '📋 दवाइयाँ (Medications):',
    ];
    if (slip.medications && slip.medications.length > 0) {
        slip.medications.forEach((med, i) => {
            lines.push(`${i + 1}. ${med.name} ${med.dose || ''}`);
            lines.push(`   ${med.frequency || ''} ${med.duration ? `${med.duration} के लिए` : ''}`);
            if (med.instructions)
                lines.push(`   (${med.instructions})`);
        });
    }
    else {
        lines.push('   डॉक्टर द्वारा निर्धारित दवाएं लें');
    }
    lines.push('', `📅 अगली मुलाकात: ${slip.followUpDate || 'डॉक्टर की सलाह अनुसार'}`);
    if (slip.dangerSigns && slip.dangerSigns.length > 0) {
        lines.push('', '⚠️ इन स्थितियों में तुरंत वापस आएं:');
        slip.dangerSigns.forEach((s) => lines.push(`  • ${s}`));
    }
    if (slip.generalAdvice) {
        lines.push('', '💡 सामान्य सलाह:', `   ${slip.generalAdvice}`);
    }
    lines.push('', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'AI-सहायता से तैयार दस्तावेज।', 'आपके चिकित्सक द्वारा समीक्षित और अनुमोदित।', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return lines.join('\n');
}
//# sourceMappingURL=patientSlip.controller.js.map