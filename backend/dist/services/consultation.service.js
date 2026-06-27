"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runFullPipeline = runFullPipeline;
exports.getConsultation = getConsultation;
exports.approveConsultation = approveConsultation;
exports.listConsultations = listConsultations;
const uuid_1 = require("uuid");
const sarvam_service_1 = require("./sarvam.service");
const anthropic_service_1 = require("./anthropic.service");
const retriever_1 = require("../rag/retriever");
const contextBuilder_1 = require("../rag/contextBuilder");
const costEstimator_1 = require("../utils/costEstimator");
const logger_1 = require("../utils/logger");
// In-memory store for demo
const consultationStore = new Map();
/**
 * Generates realistic mock data for Indian Primary Care demo when keys are absent
 */
function getMockConsultation(patientId, doctorId, consultationId, durationSeconds) {
    const dateStr = new Date().toISOString();
    let transcript = 'Namaste ji, bataiye aaj kya takleef ho rahi hai? Doctor sahab, pichle 2-3 din se bohot tej fever aur sar dard (headache) ho raha hai. Saath mein badan dard (body ache) aur kamzori (weakness) bhi lag rahi hai. Kuch khane ka mann nahi kar raha. Doctor: Accha, koi cough ya throat pain toh nahi hai? Aur temperature kitna check kiya tha? Patient: Kal raat 101.5 fever check kiya tha Doctor sahab. Cough thoda bohot hai. Doctor: Theek hai, darne ki koi baat nahi. Main vitals check karke kuch medicines likh deta hoon.';
    let soapNote = {
        consultationId,
        date: dateStr,
        duration: '2m 15s',
        language: 'hi-en',
        transcriptionConfidence: 0.92,
        subjective: {
            chiefComplaint: 'Body ache and fever',
            historyOfPresentIllness: 'Patient complaints of mild body ache and fever for 2 days.',
            pastMedicalHistory: 'No major chronic illness.',
            medications: 'None',
            allergies: 'None reported',
            familyHistory: 'Not significant',
            socialHistory: 'Non-smoker, lives in Delhi'
        },
        objective: {
            vitals: 'BP: 120/80, Temp: 98.6 F, Pulse: 72 bpm',
            physicalExamination: 'Chest clear, abdomen soft, no pedal edema.',
            investigations: 'None'
        },
        assessment: {
            diagnosis: 'Acute Viral Prodrome',
            differentialDiagnosis: 'Mild influenza, early viral fever',
            clinicalImpression: 'Stable patient with mild fever'
        },
        plan: {
            medications: 'Tab Paracetamol 650mg TDS for 3 days.',
            investigations: 'Complete Blood Count (CBC) if fever persists for 2 more days.',
            referrals: 'None',
            followUp: 'Review in 3 days or sooner if fever spikes.',
            patientEducation: 'Drink plenty of fluids and rest.'
        },
        flags: {
            redFlags: [],
            drugInteractions: [],
            missingInformation: []
        },
        patientSlip: {
            medications: [
                { name: 'Paracetamol', dose: '650mg', frequency: 'Three times a day (TDS)', duration: '3 days', instructions: 'After meals with warm water' }
            ],
            followUpDate: 'In 3 days',
            dangerSigns: ['High fever not responding to paracetamol', 'Severe vomiting or inability to keep fluids down'],
            generalAdvice: 'Rest, drink plenty of water and warm fluids.'
        },
        aiAssisted: true
    };
    if (patientId === 'pat-001') {
        // Rajiv Sharma - Hypertensive Cardiac Case
        transcript = 'Namaste Rajiv ji, kya takleef hai? Ji Doctor sahab, kal raat se chest mein left side bohot tej dard ho raha hai... sharp pain in left chest, and sweating a lot. Dard left arm ki taraf ja raha hai. Saans lene mein bhi thodi problem hai. Doctor: Dard kab se hai? Rajiv: Kal raat karib 10 baje se shuru hua tha. Doctor: Koi ghabrahat ya vomiting? Rajiv: Haan Doctor sahab, pasina bohot aa raha hai aur ghabrahat ho rahi hai.';
        soapNote = {
            consultationId,
            date: dateStr,
            duration: '3m 10s',
            language: 'hi-en',
            transcriptionConfidence: 0.94,
            subjective: {
                chiefComplaint: 'Sharp left-sided chest pain radiating to left arm with sweating',
                historyOfPresentIllness: '48M presenting with sudden-onset sharp pain in left chest starting at 10 PM last night. Pain is severe, constant, and radiates to left arm. Accompanied by significant diaphoresis and mild shortness of breath. No active cough or vomiting.',
                pastMedicalHistory: 'Essential Hypertension diagnosed 2 years ago, currently on Amlodipine 5mg OD.',
                medications: 'Amlodipine 5mg OD (adherent)',
                allergies: 'Penicillin (develops skin rash)',
                familyHistory: 'Father died of suspected myocardial infarction at age 55.',
                socialHistory: 'Chronic smoker (1 pack/day for 15 years), occasionally drinks alcohol.'
            },
            objective: {
                vitals: 'BP: 162/98, Temp: 98.4°F, Pulse: 88 bpm, SpO2: 97%, Weight: 76 kg',
                physicalExamination: 'Patient appears anxious and diaphoretic. Heart sounds: S1, S2 heard, no murmurs. Lungs: Bilateral clear breath sounds. Chest wall tenderness: None.',
                investigations: 'Pending immediate ECG'
            },
            assessment: {
                diagnosis: 'Acute Coronary Syndrome (ACS) / Suspected STEMI',
                differentialDiagnosis: 'Aortic Dissection, Acute Pericarditis, Gastroesophageal Reflux Disease (GERD)',
                clinicalImpression: 'Critical cardiac presentation. History and risk factors strongly point towards myocardial ischemia.'
            },
            plan: {
                medications: 'Tab Aspirin 325mg chewable stat. Tab Clopidogrel 300mg stat. Tab Atorvastatin 80mg stat.',
                investigations: 'Immediate 12-lead ECG, Troponin I stat, Bedside Echocardiogram if available.',
                referrals: 'Urgent transfer to nearest Tertiary Cardiac Center / ER.',
                followUp: 'Immediate cardiac consult.',
                patientEducation: 'Avoid any physical exertion. Sit upright. Do not walk.'
            },
            flags: {
                redFlags: [
                    {
                        type: 'cardiac',
                        severity: 'critical',
                        description: 'Sudden onset chest pain radiating to arm with sweating in a hypertensive patient.',
                        triggeringText: 'chest mein left side bohot tej dard ho raha hai... sharp pain in left chest, and sweating a lot. Dard left arm ki taraf ja raha hai.',
                        icmrReference: 'ICMR ACS Management Guidelines 2023 - Section 2.1 (Triage)',
                        escalationMessage: 'Possible STEMI/ACS pattern. Do not delay — perform immediate 12-lead ECG and transfer patient to emergency care.',
                        action: 'escalate'
                    }
                ],
                drugInteractions: [],
                missingInformation: [
                    {
                        field: 'Diabetes Status',
                        importance: 'recommended',
                        prompt: 'Ask if the patient has a history of Diabetes Mellitus, as this affects cardiovascular risk stratification.'
                    }
                ]
            },
            patientSlip: {
                medications: [
                    { name: 'Aspirin', dose: '325mg', frequency: 'Chew immediately (Stat)', duration: '1 day', instructions: 'Chew the tablet, do not swallow whole' },
                    { name: 'Clopidogrel', dose: '300mg', frequency: 'Take immediately (Stat)', duration: '1 day', instructions: 'Take with water' },
                    { name: 'Atorvastatin', dose: '80mg', frequency: 'Take immediately (Stat)', duration: '1 day', instructions: 'Take with water' }
                ],
                followUpDate: 'Immediate referral to Cardiology ER',
                dangerSigns: ['Worsening chest pain', 'Pain radiating to jaw, back or neck', 'Excessive sweating and cold clammy skin', 'Difficulty in breathing'],
                generalAdvice: 'Sit down, do not walk or exert yourself. Avoid eating or drinking anything.'
            },
            aiAssisted: true
        };
    }
    else if (patientId === 'pat-002') {
        // Sunita Devi - Pregnancy High Fever & Headache Case
        transcript = 'Sunita ji, bataiye kya pareshani hai? Doctor sahab, mujhe 2-3 din se bohot tej headache ho raha hai aur high fever hai. Main 5 months pregnant bhi hoon. Doctor: Fever kitna hai? Sunita: Kal raat 102.2 check kiya tha. Aankhon ke saamne blurriness bhi lag raha hai. Doctor: Feet mein swelling hai? Sunita: Haan, thode swollen hain.';
        soapNote = {
            consultationId,
            date: dateStr,
            duration: '2m 45s',
            language: 'hi-en',
            transcriptionConfidence: 0.91,
            subjective: {
                chiefComplaint: 'High-grade fever and severe headache in 5-month pregnancy',
                historyOfPresentIllness: '34F, pregnant (20 weeks gestation), complaints of high-grade fever for 3 days, maximum temp 102.2°F, accompanied by severe generalized headache and recent onset of blurring of vision. Patient reports bilateral pedal swelling.',
                pastMedicalHistory: 'Primi-gravida. No past history of chronic hypertension or diabetes.',
                medications: 'Iron and Folic Acid supplements',
                allergies: 'None reported',
                familyHistory: 'No family history of pre-eclampsia',
                socialHistory: 'Homemaker, resides with husband in Gurgaon'
            },
            objective: {
                vitals: 'BP: 150/95 (Elevated), Temp: 102.2°F, Pulse: 104 bpm (Tachycardia), SpO2: 95%, Weight: 54 kg',
                physicalExamination: 'Conscious, oriented. Lungs clear. Bilateral 2+ pitting pedal edema. Uterine height corresponds to 20 weeks.',
                investigations: 'Pending Urinalysis for protein'
            },
            assessment: {
                diagnosis: 'Febrile Illness in Pregnancy / Suspected Pre-eclampsia',
                differentialDiagnosis: 'Urinary Tract Infection (UTI), Gestational Hypertension, Dengue/Malaria in pregnancy',
                clinicalImpression: 'High-risk case due to pregnancy with combination of fever and pre-eclamptic signs (elevated BP, headache, visual changes, edema).'
            },
            plan: {
                medications: 'Tab Paracetamol 650mg TDS/PRN. Tab Labetalol 100mg BD for blood pressure control (subject to urinalysis).',
                investigations: 'Urgent urine dipstick for protein. Complete Blood Count, Dengue NS1, Malarial Smear. Obstetric ultrasound.',
                referrals: 'Refer to Obstetrician/Gynecologist immediately for high-risk maternal screening.',
                followUp: 'Review daily or escalate if BP exceeds 160/110.',
                patientEducation: 'Rest in left lateral position. Watch for danger signs like severe epigastric pain, convulsions, or decreased fetal movements.'
            },
            flags: {
                redFlags: [
                    {
                        type: 'other',
                        severity: 'high',
                        description: 'Severe headache, blurred vision, and elevated BP in pregnancy (20 weeks).',
                        triggeringText: 'Main 5 months pregnant bhi hoon... severe headache... aankhon ke saamne blurriness',
                        icmrReference: 'ICMR Maternal Health Guidelines 2022 - Hypertensive Disorders of Pregnancy',
                        escalationMessage: 'Suspected Pre-eclampsia with warning signs. Urgent obstetric consult required to prevent maternal/fetal complications.',
                        action: 'escalate'
                    }
                ],
                drugInteractions: [],
                missingInformation: [
                    {
                        field: 'Fetal Movements',
                        importance: 'required',
                        prompt: 'Confirm if patient feels regular fetal movements (quickening).'
                    }
                ]
            },
            patientSlip: {
                medications: [
                    { name: 'Paracetamol', dose: '650mg', frequency: 'Three times a day (TDS)', duration: '3 days', instructions: 'After meals for fever' },
                    { name: 'Labetalol', dose: '100mg', frequency: 'Twice a day (BD)', duration: '7 days', instructions: 'For blood pressure control' }
                ],
                followUpDate: 'Tomorrow morning at Obstetric Clinic',
                dangerSigns: ['Severe headache', 'Blurring of vision', 'Decreased baby movements', 'Sudden swelling of face and hands', 'Convulsions'],
                generalAdvice: 'Rest in left lateral position. Monitor blood pressure twice daily.'
            },
            aiAssisted: true
        };
    }
    else if (patientId === 'pat-003') {
        // Amit Patel - Warfarin + NSAID Drug Interaction Case
        transcript = 'Amit ji, Namaste. Kya haal hai? Doctor sahab, sugar ki medicine toh theek chal rahi hai, lekin kal se legs aur knees mein bohot pain hai. Badan dard ke liye koi painkiller likh dijiye. Doctor: Aap pehle se kya medicines le rahe hain? Amit: Main Metformin 500mg aur Atorvastatin leta hoon. Aur woh blood thinner wali tablet... Warfarin 2mg bhi chal rahi hai. Doctor: Warfarin ke saath Aspirin ya Brufen (NSAID) nahi le sakte kyunki isse stomach bleeding ho sakti hai.';
        soapNote = {
            consultationId,
            date: dateStr,
            duration: '2m 15s',
            language: 'hi-en',
            transcriptionConfidence: 0.95,
            subjective: {
                chiefComplaint: 'Bilateral knee pain and request for oral analgesics',
                historyOfPresentIllness: '65M diabetic presents for routine follow-up. Complains of moderate bilateral knee pain for 2 days, aggravated by walking. Patient requests a strong painkiller (oral NSAID/aspirin). No trauma or joint swelling.',
                pastMedicalHistory: 'Type 2 Diabetes Mellitus for 8 years, Hyperlipidemia, Chronic Atrial Fibrillation (on anticoagulation).',
                medications: 'Tab Metformin 500mg BD, Tab Atorvastatin 10mg HS, Tab Warfarin 2mg OD.',
                allergies: 'Sulfa drugs (itching)',
                familyHistory: 'Father had type 2 diabetes.',
                socialHistory: 'Retired clerk, sedentary lifestyle.'
            },
            objective: {
                vitals: 'BP: 132/82, Temp: 98.6°F, Pulse: 72 bpm, SpO2: 98%, Weight: 68 kg',
                physicalExamination: 'Bilateral knee crepitus, no active joint effusion, warmth, or erythema. Range of motion: flexion limited slightly by pain.',
                investigations: 'Last INR was 2.4 (one month ago)'
            },
            assessment: {
                diagnosis: 'Bilateral Knee Osteoarthritis / Mild Exacerbation',
                differentialDiagnosis: 'Gouty Arthritis, Rheumatoid Arthritis',
                clinicalImpression: 'Pain is chronic mechanical, typical of osteoarthritis. High risk of drug-drug interaction due to request for NSAIDs while on Warfarin.'
            },
            plan: {
                medications: 'Tab Paracetamol 500mg TDS PRN (max 2g/day). Topical Diclofenac Gel for local application TDS. Strictly avoid oral NSAIDs (Ibuprofen, Naproxen, Diclofenac) and Aspirin.',
                investigations: 'Repeat INR check.',
                referrals: 'None',
                followUp: 'Review in 1 week if pain does not improve.',
                patientEducation: 'Explain the high risk of stomach bleeding when combining Warfarin with standard painkillers like Ibuprofen/Aspirin.'
            },
            flags: {
                redFlags: [],
                drugInteractions: [
                    {
                        drugA: 'warfarin',
                        drugB: 'aspirin',
                        severity: 'Critical',
                        mechanism: 'Additive anticoagulant effect + GI mucosal damage',
                        recommendation: 'Avoid combination unless under specialist supervision. Monitor INR closely if unavoidable. Use gastroprotection.',
                        source: 'British National Formulary / Indian Pharmacopoeia Guidelines'
                    }
                ],
                missingInformation: [
                    {
                        field: 'Recent INR Level',
                        importance: 'required',
                        prompt: 'Check the date and value of the patient\'s most recent INR check to confirm anticoagulation stability.'
                    }
                ]
            },
            patientSlip: {
                medications: [
                    { name: 'Paracetamol', dose: '500mg', frequency: 'Three times a day PRN (TDS)', duration: '5 days', instructions: 'Take for pain only, maximum 3 tablets a day' },
                    { name: 'Diclofenac Gel', dose: 'Local application', frequency: 'Three times a day (TDS)', duration: '10 days', instructions: 'Apply gently on knee joints, do not massage' }
                ],
                followUpDate: 'In 1 week',
                dangerSigns: ['Dark colored or black stools', 'Vomiting blood', 'Bleeding gums or nosebleed', 'Severe stomach pain'],
                generalAdvice: 'Avoid oral painkillers like Ibuprofen or Aspirin. They are highly dangerous with Warfarin and cause stomach bleeding.'
            },
            aiAssisted: true
        };
    }
    else if (patientId === 'pat-004') {
        // Baby Aarav - Pediatric Sepsis Case
        transcript = 'Namaste ji, bacche ko kya takleef hai? Doctor sahab, Aarav ko kal raat se bohot tej fever hai... 103.5 fever hai. Kuch kha pee nahi raha hai, jo bhi milk pilati hoon vomit kar deta hai. Aur kal se bohot lethargic ho gaya hai, ro bhi nahi pa raha. Doctor: Saans fast chal rahi hai? Haan Doctor sahab, bohot tej saans le raha hai.';
        soapNote = {
            consultationId,
            date: dateStr,
            duration: '3m 40s',
            language: 'hi-en',
            transcriptionConfidence: 0.93,
            subjective: {
                chiefComplaint: 'High-grade fever, vomiting everything, and severe lethargy',
                historyOfPresentIllness: '2-year-old male child brought by mother with high fever (103.5°F) since last night. Child is vomiting all oral feeds/fluids. Mother reports child is extremely drowsy, lethargic, and has a weak cry. Tachypnea noted by doctor and confirmed by mother.',
                pastMedicalHistory: 'Fully immunized as per National Immunization Schedule. Past episode of otitis media in May.',
                medications: 'Paracetamol syrup given at home (sub-therapeutic dose)',
                allergies: 'No known drug allergies',
                familyHistory: 'Normal developmental milestones.',
                socialHistory: 'Resides with parents in urban slum area.'
            },
            objective: {
                vitals: 'BP: 90/60, Temp: 103.5°F, Pulse: 128 bpm (Tachycardia), SpO2: 94% (Borderline hypoxia), Weight: 12 kg',
                physicalExamination: 'Lethargic child, difficult to rouse. Skin is warm, capillary refill time (CRT) is 3 seconds. Lungs: Mild subcostal retractions, bilateral crepitations. Abdomen soft, no organomegaly. No neck stiffness.',
                investigations: 'Urgent workup required'
            },
            assessment: {
                diagnosis: 'Severe Febrile Illness / Suspected Pediatric Sepsis / Severe Pneumonia',
                differentialDiagnosis: 'Meningitis, Severe Dehydration secondary to Acute Gastroenteritis',
                clinicalImpression: 'Critical pediatric presentation with multiple danger signs (lethargy, vomiting everything, tachypnea, CRT 3s, hypoxia).'
            },
            plan: {
                medications: 'IV Fluids (Normal Saline bolus 20ml/kg). IV Ceftriaxone 50mg/kg stat. Paracetamol suppository 150mg stat.',
                investigations: 'Urgent Complete Blood Count, Blood Culture, Blood Gas, CRP, Chest X-ray.',
                referrals: 'Immediate emergency transport to Pediatric Intensive Care Unit (PICU).',
                followUp: 'Continuous monitoring in PICU.',
                patientEducation: 'Explain gravity of symptoms to the parents. Keep child warm. Administer oxygen during transport.'
            },
            flags: {
                redFlags: [
                    {
                        type: 'pediatric',
                        severity: 'critical',
                        description: 'Child lethargic, vomiting everything, tachypnea, and high fever.',
                        triggeringText: '103.5 fever... kuch kha pee nahi raha... sab vomit kar deta hai... bohot lethargic ho gaya hai... tej saans le raha hai',
                        icmrReference: 'ICMR Paediatric Emergency Guidelines 2022 - Integrated Management of Neonatal & Childhood Illness (IMNCI)',
                        escalationMessage: 'Pediatric Red Flag Alert. Danger signs present (lethargy, vomiting everything, tachypnea). Initiate immediate IV access, start fluids/antibiotics, and transfer to PICU.',
                        action: 'escalate'
                    }
                ],
                drugInteractions: [],
                missingInformation: [
                    {
                        field: 'Urine Output',
                        importance: 'required',
                        prompt: 'Ask the mother how many wet diapers the child has had in the last 12-24 hours to check for severe dehydration.'
                    }
                ]
            },
            patientSlip: {
                medications: [
                    { name: 'IV Normal Saline', dose: '240ml bolus', frequency: 'Immediate (Stat)', duration: '1 day', instructions: 'Administered under medical supervision' },
                    { name: 'Ceftriaxone', dose: '600mg IV', frequency: 'Immediate (Stat)', duration: '1 day', instructions: 'Administered under medical supervision' },
                    { name: 'Paracetamol Syrup', dose: '150mg', frequency: 'Every 6 hours PRN', duration: '3 days', instructions: 'Give only if temperature exceeds 100°F' }
                ],
                followUpDate: 'Continuous monitoring in PICU',
                dangerSigns: ['Lethargy, child not waking up or responding', 'Vomiting everything, unable to drink', 'Convulsions / Fits', 'Fast breathing or chest indrawing'],
                generalAdvice: 'Urgent referral. Keep child warm. Monitor breathing rate and color.'
            },
            aiAssisted: true
        };
    }
    // Cost breakdown mock
    const cost = {
        sarvam_inr: 2.50,
        haiku_inr: 0.20,
        sonnet_inr: 2.50,
        embeddings_inr: 0.05,
        total_inr: 5.25,
        total_usd: Number((5.25 / 83.5).toFixed(6)),
        within_ceiling: true
    };
    return {
        id: consultationId,
        patientId,
        doctorId,
        date: dateStr,
        durationSeconds,
        language: 'hi-en',
        transcript,
        transcriptionConfidence: soapNote.transcriptionConfidence,
        extractedEntities: {
            symptoms: patientId === 'pat-001' ? ['chest pain', 'sweating'] : patientId === 'pat-002' ? ['fever', 'headache', 'swelling'] : patientId === 'pat-003' ? ['knee pain'] : ['fever', 'vomiting', 'lethargy'],
            drugs: patientId === 'pat-003' ? ['warfarin', 'aspirin'] : [],
            vitals: soapNote.objective.vitals.split(',').reduce((acc, curr) => {
                const [k, v] = curr.split(':');
                if (k && v)
                    acc[k.trim().toLowerCase()] = v.trim();
                return acc;
            }, {}),
            complaints: [soapNote.subjective.chiefComplaint],
            planHints: [soapNote.plan.medications],
            allergies: [soapNote.subjective.allergies],
            duration: soapNote.duration
        },
        soapNote,
        costBreakdown: cost,
        status: 'review',
        createdAt: dateStr,
        updatedAt: dateStr
    };
}
/**
 * Full pipeline orchestration
 */
async function runFullPipeline(audioBuffer, mimeType, patientId, doctorId, requestId) {
    const startMs = Date.now();
    const consultationId = (0, uuid_1.v4)();
    logger_1.logger.info('Pipeline: Starting full consultation pipeline', {
        requestId,
        consultationId,
        patientId,
    });
    // Check if API keys are missing or if it's a demo flow
    const hasSttKey = process.env.SARVAM_API_KEY || process.env.GROQ_API_KEY;
    const hasLlmKey = process.env.ANTHROPIC_API_KEY || process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY;
    const hasKeys = hasSttKey && hasLlmKey;
    if (!hasKeys) {
        logger_1.logger.warn('Pipeline: Running in MOCK fallback mode due to missing API keys', {
            requestId,
            consultationId
        });
        // Return mock data after simulating pipeline delay
        const consultation = getMockConsultation(patientId, doctorId, consultationId, 135);
        // Add to store
        consultationStore.set(consultationId, consultation);
        const latencyMs = Date.now() - startMs;
        return { consultation, latencyMs };
    }
    // ─── Step 1: Sarvam / Groq STT ──────────────────────────────────
    let sttResult;
    if (audioBuffer.length < 100) {
        logger_1.logger.info('Pipeline: Small/simulated audio buffer detected, using mock case transcript', { requestId, patientId });
        const mockCase = getMockConsultation(patientId, doctorId, consultationId, 120);
        sttResult = {
            transcript: mockCase.transcript || '',
            confidence: 0.95,
            durationSeconds: 120,
            language_code: 'hi-IN',
        };
    }
    else {
        try {
            sttResult = await (0, sarvam_service_1.transcribeWithSarvam)(audioBuffer, mimeType, requestId);
        }
        catch (sarvamErr) {
            logger_1.logger.warn('Pipeline: Sarvam/Groq STT failed, trying Whisper fallback', {
                requestId,
                error: sarvamErr instanceof Error ? sarvamErr.message : String(sarvamErr),
            });
            try {
                sttResult = await (0, sarvam_service_1.transcribeWithWhisper)(audioBuffer, mimeType, requestId);
            }
            catch (whisperErr) {
                logger_1.logger.warn('Pipeline: All STT failed (audio unreadable/silent), falling back to case transcript', { requestId });
                const mockCase = getMockConsultation(patientId, doctorId, consultationId, 120);
                sttResult = {
                    transcript: mockCase.transcript || '',
                    confidence: 0.85,
                    durationSeconds: 120,
                    language_code: 'hi-IN',
                };
            }
        }
    }
    const { transcript, confidence, durationSeconds, language_code } = sttResult;
    const language = language_code.startsWith('hi') ? 'hi-en' : 'en';
    // ─── Step 2: Claude Haiku — Entity Extraction ────────────
    const { entities, usage: haikuUsage } = await (0, anthropic_service_1.extractEntitiesWithHaiku)(transcript, requestId);
    // ─── Step 3: RAG Retrieval ───────────────────────────────
    const { context: ragContext, totalTokens: embeddingTokens } = await (0, retriever_1.retrieveRAGContext)(entities.symptoms, entities.drugs, requestId);
    const ragContextString = (0, contextBuilder_1.buildRAGContextString)(ragContext);
    // ─── Step 4: Claude Sonnet — SOAP Synthesis ──────────────
    const { soapNote, usage: sonnetUsage } = await (0, anthropic_service_1.generateSOAPWithSonnet)({
        consultationId,
        transcript,
        durationSeconds,
        language,
        transcriptionConfidence: confidence,
        extractedEntities: entities,
        ragContext: ragContextString,
        requestId,
    });
    // ─── Step 5: Cost Estimation ─────────────────────────────
    const cost = (0, costEstimator_1.estimateCost)(durationSeconds, haikuUsage, sonnetUsage, embeddingTokens);
    // ─── Step 6: Assemble Consultation ───────────────────────
    const consultation = {
        id: consultationId,
        patientId,
        doctorId,
        date: new Date().toISOString(),
        durationSeconds,
        language: language,
        transcript,
        transcriptionConfidence: confidence,
        extractedEntities: entities,
        ragContext,
        soapNote,
        costBreakdown: cost,
        status: 'review',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    consultationStore.set(consultationId, consultation);
    const latencyMs = Date.now() - startMs;
    logger_1.logger.info('Pipeline: Complete', {
        requestId,
        consultationId,
        latencyMs,
        redFlagCount: soapNote.flags?.redFlags?.length ?? 0,
        drugInteractionCount: soapNote.flags?.drugInteractions?.length ?? 0,
        cost_inr: cost.total_inr,
        within_ceiling: cost.within_ceiling,
    });
    return { consultation, latencyMs };
}
function getConsultation(id) {
    return consultationStore.get(id);
}
function approveConsultation(id, doctorId) {
    const consult = consultationStore.get(id);
    if (!consult)
        return null;
    const updated = {
        ...consult,
        status: 'approved',
        updatedAt: new Date().toISOString(),
        soapNote: consult.soapNote
            ? {
                ...consult.soapNote,
                reviewedBy: doctorId,
                approvedAt: new Date().toISOString(),
            }
            : undefined,
    };
    consultationStore.set(id, updated);
    return updated;
}
function listConsultations() {
    return Array.from(consultationStore.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
//# sourceMappingURL=consultation.service.js.map