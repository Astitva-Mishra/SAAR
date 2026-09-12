import Groq from 'groq-sdk';
import config from '../config/environment';
import { SeverityLevel, ICase, IDocumentSummary } from '../models/Case';

export interface ExtractedClinicalData {
  chiefComplaint: string;
  symptoms: string[];
  duration: string;
  severity: SeverityLevel;
  location?: string | null;
  onset?: string | null;
  associatedSymptoms: string[];
  pertinentNegatives: string[];
  language?: string;
  extractionMethod: 'groq' | 'rule_based_fallback';
}

export interface StructuredCaseSummary {
  chiefComplaintStructured: string;
  symptomChronology: string;
  associatedSymptoms: string[];
  pertinentNegatives: string[];
  suggestedReviewFocus: string[];
  summaryMethod: 'groq' | 'rule_based_fallback';
}

// Lazy-initialized Groq client instance
let groqClient: Groq | null = null;

function getGroqClient(): Groq | null {
  if (!config.groqApiKey || config.groqApiKey.trim() === '') {
    return null;
  }
  if (!groqClient) {
    groqClient = new Groq({ apiKey: config.groqApiKey, timeout: 15000 });
  }
  return groqClient;
}

/**
 * Deterministic Rule-Based Fallback Extraction
 * Guaranteed to operate without internet, external API keys, or LLM access.
 */
export function fallbackExtractClinicalInformation(text: string): ExtractedClinicalData {
  const normalized = text.toLowerCase();
  const detectedSymptoms: string[] = [];
  const pertinentNegatives: string[] = [];

  // Symptom lexicon mapping with Hindi / Hinglish colloquialisms
  const symptomDictionary: { term: string; matches: string[] }[] = [
    { term: 'Headache', matches: ['headache', 'sar dard', 'sir dard', 'migraine', 'head ache'] },
    { term: 'Fever', matches: ['fever', 'bukhar', 'tap', 'temperature', 'chills'] },
    { term: 'Body Ache', matches: ['body ache', 'body toot rahi', 'badan dard', 'muscle pain', 'myalgia'] },
    { term: 'Cough', matches: ['cough', 'khansi', 'khasi'] },
    { term: 'Chest Pain', matches: ['chest pain', 'chaati me dard', 'seene me dard', 'chest pressure'] },
    {
      term: 'Abdominal Pain',
      matches: [
        'stomach pain',
        'pet dard',
        'pet me dard',
        'pet mein dard',
        'pet ke right side',
        'pet ke left side',
        'pet me',
        'abdominal pain',
        'belly pain',
        'stomach ache',
      ],
    },
    { term: 'Nausea', matches: ['nausea', 'ji ghabrana', 'mitli', 'feeling sick'] },
    { term: 'Vomiting', matches: ['vomit', 'vomiting', 'ulti', 'puking'] },
    { term: 'Shortness of Breath', matches: ['shortness of breath', 'difficulty breathing', 'saans lene me takleef', 'breathless', 'dyspnea'] },
    { term: 'Sore Throat', matches: ['sore throat', 'gala kharab', 'throat irritation', 'throat pain'] },
    { term: 'Dizziness', matches: ['dizziness', 'chakkar', 'lightheaded', 'faint'] },
    { term: 'Diarrhea', matches: ['diarrhea', 'loose motion', 'dast', 'watery stool'] },
    { term: 'Skin Rash', matches: ['rash', 'khujli', 'itching', 'skin redness', 'pruritus'] },
    { term: 'Bleeding', matches: ['bleeding', 'khoon', 'blood'] },
  ];

  // Detect explicit negations (e.g. "don't have fever or vomiting", "without cough", "bukhar nahi")
  const negationRegex = /(?:don'?t have|do not have|no|without|denies|denied)\s+([^.,;]+)/gi;
  let match: RegExpExecArray | null;
  const negatedPhrases: string[] = [];

  while ((match = negationRegex.exec(normalized)) !== null) {
    negatedPhrases.push(match[1]);
  }

  // Also check Hindi style: "<symptom> nahi"
  const hindiNegationRegex = /([a-z\s]+)\s+nahi/gi;
  while ((match = hindiNegationRegex.exec(normalized)) !== null) {
    negatedPhrases.push(match[1]);
  }

  const checkNegated = (keyword: string): boolean => {
    return negatedPhrases.some((phrase) => phrase.includes(keyword));
  };

  const knownSymptomKeywords = [
    { key: 'fever', label: 'fever' },
    { key: 'bukhar', label: 'fever' },
    { key: 'vomit', label: 'vomiting' },
    { key: 'ulti', label: 'vomiting' },
    { key: 'chest pain', label: 'chest pain' },
    { key: 'cough', label: 'cough' },
    { key: 'khansi', label: 'cough' },
    { key: 'headache', label: 'headache' },
    { key: 'shortness of breath', label: 'breathing difficulty' },
    { key: 'difficulty breathing', label: 'breathing difficulty' },
  ];

  for (const item of knownSymptomKeywords) {
    if (checkNegated(item.key) && !pertinentNegatives.includes(item.label)) {
      pertinentNegatives.push(item.label);
    }
  }

  for (const entry of symptomDictionary) {
    // Avoid marking symptom if explicitly denied
    const isDenied = pertinentNegatives.some((neg) =>
      entry.term.toLowerCase().includes(neg) || neg.includes(entry.term.toLowerCase())
    );
    if (!isDenied && entry.matches.some((keyword) => normalized.includes(keyword))) {
      detectedSymptoms.push(entry.term);
    }
  }

  // Extract duration using regex patterns (e.g., "3 days", "2 weeks", "4 din")
  let duration = 'Recent onset';
  const durationMatch = normalized.match(/(\d+|one|two|three|four|five|six|seven|several|few)\s*(days?|weeks?|months?|hours?|din|hafte|mahine)/i);
  if (durationMatch) {
    duration = durationMatch[0].trim();
  }

  // Extract severity heuristic
  let severity: SeverityLevel = 'MODERATE';
  if (
    normalized.includes('severe') ||
    normalized.includes('unbearable') ||
    normalized.includes('extreme') ||
    normalized.includes('bahut tez') ||
    normalized.includes('bahut zyada')
  ) {
    severity = 'SEVERE';
  } else if (
    normalized.includes('mild') ||
    normalized.includes('slight') ||
    normalized.includes('halka') ||
    normalized.includes('thoda')
  ) {
    severity = 'MILD';
  }

  // Detect location
  let location: string | null = null;
  if (normalized.includes('right side')) location = 'Right side';
  else if (normalized.includes('left side')) location = 'Left side';
  else if (normalized.includes('upper')) location = 'Upper region';
  else if (normalized.includes('lower')) location = 'Lower region';

  // Primary chief complaint
  const chiefComplaint = detectedSymptoms.length > 0 ? detectedSymptoms[0] : text.slice(0, 80).trim();
  const associatedSymptoms = detectedSymptoms.slice(1);

  return {
    chiefComplaint,
    symptoms: detectedSymptoms.length > 0 ? detectedSymptoms : [chiefComplaint],
    duration,
    severity,
    location,
    onset: duration,
    associatedSymptoms,
    pertinentNegatives,
    language: /[^\u0000-\u007F]+/.test(text) || normalized.includes('hai') || normalized.includes('dard') ? 'Hindi/Hinglish' : 'English',
    extractionMethod: 'rule_based_fallback',
  };
}

/**
 * Extract structured clinical intake information using Groq LLM
 * Falls back to deterministic extraction on any error, missing key, or schema violation.
 */
export async function extractClinicalInformation(text: string): Promise<ExtractedClinicalData> {
  const client = getGroqClient();

  if (!client) {
    return fallbackExtractClinicalInformation(text);
  }

  const systemPrompt = `You are a clinical intake language processor for CareKare, an AI-assisted hospital case-taking system.
Your job is to convert patient-described complaints into structured clinical intake information.

CRITICAL CLINICAL RULES:
1. Do NOT diagnose any disease, syndrome, or medical condition.
2. Do NOT prescribe medications or recommend treatments.
3. Do NOT invent symptoms that the patient did not report.
4. NEVER assume unmentioned symptoms are absent. If unmentioned, set field to null or empty list [].
5. Only record a symptom in "pertinentNegatives" if the patient EXPLICITLY DENIED having it (e.g. "I don't have fever" -> "fever").
6. Understand English, Hindi, and Hinglish (e.g. "Mujhe 3 din se bukhar hai aur body toot rahi hai" -> Fever, Body ache, 3 days duration; "Pet ke right side mein dard hai" -> Abdominal pain, right side).
7. Return strictly a JSON object matching this schema:
{
  "chiefComplaint": string (concise primary symptom, e.g. "Headache", "Abdominal pain"),
  "symptoms": string[] (all reported symptoms),
  "duration": string (e.g. "3 days", "since yesterday", "few hours", "unspecified"),
  "severity": "MILD" | "MODERATE" | "SEVERE",
  "location": string or null,
  "onset": string or null,
  "associatedSymptoms": string[],
  "pertinentNegatives": string[] (ONLY explicitly denied symptoms),
  "language": string (e.g. "English", "Hinglish", "Hindi")
}`;

  try {
    const response = await client.chat.completions.create({
      model: config.groqModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return fallbackExtractClinicalInformation(text);
    }

    const parsed = JSON.parse(content);

    // Validate structured output structure
    if (!parsed.chiefComplaint || typeof parsed.chiefComplaint !== 'string') {
      return fallbackExtractClinicalInformation(text);
    }

    const validSeverity: SeverityLevel = ['MILD', 'MODERATE', 'SEVERE'].includes(parsed.severity)
      ? parsed.severity
      : 'MODERATE';

    return {
      chiefComplaint: parsed.chiefComplaint.trim(),
      symptoms: Array.isArray(parsed.symptoms) && parsed.symptoms.length > 0
        ? parsed.symptoms.map(String)
        : [parsed.chiefComplaint.trim()],
      duration: parsed.duration && typeof parsed.duration === 'string' ? parsed.duration.trim() : 'Recent onset',
      severity: validSeverity,
      location: parsed.location && typeof parsed.location === 'string' ? parsed.location.trim() : null,
      onset: parsed.onset && typeof parsed.onset === 'string' ? parsed.onset.trim() : null,
      associatedSymptoms: Array.isArray(parsed.associatedSymptoms) ? parsed.associatedSymptoms.map(String) : [],
      pertinentNegatives: Array.isArray(parsed.pertinentNegatives) ? parsed.pertinentNegatives.map(String) : [],
      language: parsed.language || 'English',
      extractionMethod: 'groq',
    };
  } catch (_error) {
    // Graceful fallback to deterministic extraction on timeout or API error
    return fallbackExtractClinicalInformation(text);
  }
}

/**
 * Deterministic Fallback for Physician-Ready Case Summary
 */
export function fallbackGenerateCaseSummary(caseData: Partial<ICase>): StructuredCaseSummary {
  const complaint = caseData.chiefComplaint || 'Chief complaint reported';
  const duration = caseData.duration || 'Not specified';
  const severity = caseData.severity || 'Moderate';
  const symptoms = caseData.symptoms || [complaint];
  const associated = symptoms.filter((s) => s.toLowerCase() !== complaint.toLowerCase());
  const flags = caseData.safetyFlags || [];

  const focusPoints: string[] = [
    `Confirm onset chronology and trajectory (${duration})`,
    `Review reported ${severity.toLowerCase()} symptom profile`,
  ];

  if (flags.length > 0) {
    focusPoints.push(`Evaluate documented safety alerts: ${flags.join(', ')}`);
  }

  if (caseData.answers && caseData.answers.length > 0) {
    focusPoints.push('Review patient department questionnaire responses');
  }

  return {
    chiefComplaintStructured: `Patient presents with ${complaint} (${severity.toLowerCase()} severity)`,
    symptomChronology: `Symptoms described with an onset duration of ${duration}`,
    associatedSymptoms: associated,
    pertinentNegatives: [],
    suggestedReviewFocus: focusPoints,
    summaryMethod: 'rule_based_fallback',
  };
}

/**
 * Generate Structured Physician-Ready Summary using Groq LLM
 * Falls back to deterministic summary on API failure.
 */
export async function generateCaseSummary(caseData: Partial<ICase>): Promise<StructuredCaseSummary> {
  const client = getGroqClient();

  if (!client) {
    return fallbackGenerateCaseSummary(caseData);
  }

  const systemPrompt = `You are a clinical documentation assistant for CareKare.
Your task is to generate a concise, objective, structured physician-ready intake summary from patient-provided case data.

CRITICAL CLINICAL BOUNDARIES:
1. Do NOT make a diagnosis or suggest possible diseases.
2. Do NOT suggest medications, dosages, or treatments.
3. Preserve all patient-stated uncertainties and specifics.
4. Do NOT invent examination findings, lab findings, or medical history.
5. "suggestedReviewFocus" must ONLY highlight clinical areas for the attending physician to clarify or examine during the upcoming consultation.
6. Return strictly a JSON object matching this schema:
{
  "chiefComplaintStructured": string,
  "symptomChronology": string,
  "associatedSymptoms": string[],
  "pertinentNegatives": string[],
  "suggestedReviewFocus": string[]
}`;

  const userPayload = {
    chiefComplaint: caseData.chiefComplaint,
    symptoms: caseData.symptoms,
    duration: caseData.duration,
    severity: caseData.severity,
    department: caseData.department,
    safetyFlags: caseData.safetyFlags,
    answers: caseData.answers,
  };

  try {
    const response = await client.chat.completions.create({
      model: config.groqModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify(userPayload) },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
      max_tokens: 600,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return fallbackGenerateCaseSummary(caseData);
    }

    const parsed = JSON.parse(content);

    return {
      chiefComplaintStructured: parsed.chiefComplaintStructured || `Patient reports ${caseData.chiefComplaint}`,
      symptomChronology: parsed.symptomChronology || `Duration reported as ${caseData.duration}`,
      associatedSymptoms: Array.isArray(parsed.associatedSymptoms) ? parsed.associatedSymptoms.map(String) : [],
      pertinentNegatives: Array.isArray(parsed.pertinentNegatives) ? parsed.pertinentNegatives.map(String) : [],
      suggestedReviewFocus: Array.isArray(parsed.suggestedReviewFocus) ? parsed.suggestedReviewFocus.map(String) : [],
      summaryMethod: 'groq',
    };
  } catch (_error) {
    return fallbackGenerateCaseSummary(caseData);
  }
}

/**
 * Deterministic Fallback for Document Clinical Information Extraction
 */
export function fallbackExtractClinicalInformationFromDocument(documentText: string): IDocumentSummary {
  const normalized = documentText.toLowerCase();

  // Document type heuristic
  let documentType = 'Medical Document';
  if (normalized.includes('prescription') || normalized.includes('rx') || normalized.includes('tab ') || normalized.includes('cap ')) {
    documentType = 'Prescription';
  } else if (normalized.includes('laboratory') || normalized.includes('test report') || normalized.includes('pathology') || normalized.includes('blood test') || normalized.includes('hemoglobin') || normalized.includes('wbc')) {
    documentType = 'Laboratory Report';
  } else if (normalized.includes('discharge') || normalized.includes('admission') || normalized.includes('hospital')) {
    documentType = 'Discharge Summary';
  } else if (normalized.includes('x-ray') || normalized.includes('mri') || normalized.includes('ct scan') || normalized.includes('ultrasound')) {
    documentType = 'Diagnostic Imaging Report';
  }

  // Dates extraction (e.g., DD/MM/YYYY, YYYY-MM-DD, Month DD, YYYY)
  const dateRegex = /\b(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[/-]\d{1,2}[/-]\d{1,2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4})\b/gi;
  const datesFound = Array.from(new Set(documentText.match(dateRegex) || [])).slice(0, 5);

  // Common medication patterns
  const knownMeds = [
    'paracetamol', 'metformin', 'aspirin', 'amoxicillin', 'pantoprazole',
    'atorvastatin', 'losartan', 'azithromycin', 'ibuprofen', 'cetirizine',
    'omeprazole', 'amlodipine', 'telmisartan', 'crocin', 'dollo', 'dolo 650',
    'cough syrup', 'insulin'
  ];
  const detectedMeds: string[] = [];
  for (const med of knownMeds) {
    if (normalized.includes(med)) {
      detectedMeds.push(med.charAt(0).toUpperCase() + med.slice(1));
    }
  }

  // Lab values regex (e.g., Hb: 12.5, Glucose: 110 mg/dl, BP: 120/80, etc.)
  const labRegex = /\b(?:Hb|Hemoglobin|WBC|Platelets|RBC|Glucose|Blood Sugar|Creatinine|BUN|Cholesterol|TSH|BP|Blood Pressure|SGOT|SGPT|Bilirubin)[:\s]+([0-9./]+(?:\s*[a-zA-Z/%]+)?)\b/gi;
  const detectedLabs: string[] = [];
  let labMatch: RegExpExecArray | null;
  while ((labMatch = labRegex.exec(documentText)) !== null) {
    detectedLabs.push(labMatch[0].trim());
  }

  // Previous diagnoses extraction (strictly preserve provenance)
  const diagRegex = /(?:diagnosis|history of|known case of|k\/c\/o|impression|previous diagnosis)[:\s]+([^.,\n\r]+)/gi;
  const detectedDiagnoses: string[] = [];
  let diagMatch: RegExpExecArray | null;
  while ((diagMatch = diagRegex.exec(normalized)) !== null) {
    const diag = diagMatch[1].trim();
    if (diag.length > 2 && diag.length < 60) {
      detectedDiagnoses.push(diag);
    }
  }

  // General observations
  const observations: string[] = [];
  if (detectedMeds.length > 0) {
    observations.push(`Patient document lists active/previous medications: ${detectedMeds.join(', ')}`);
  }
  if (detectedLabs.length > 0) {
    observations.push(`Recorded laboratory/vital findings: ${detectedLabs.slice(0, 3).join(', ')}`);
  }
  if (detectedDiagnoses.length > 0) {
    observations.push(`Historical documented conditions noted: ${detectedDiagnoses.join(', ')}`);
  }
  if (observations.length === 0) {
    observations.push('Document text extracted for clinical review by attending provider.');
  }

  return {
    documentType,
    dates: datesFound,
    medications: detectedMeds,
    labValues: detectedLabs.slice(0, 6),
    previousDiagnoses: detectedDiagnoses,
    observations,
  };
}

/**
 * Extract Clinical Information from Uploaded Document via Groq
 * Strictly enforces clinical boundaries:
 * 1. Document data does NOT automatically become a current diagnosis.
 * 2. Only extracts what is explicitly present in the document.
 * 3. Preserves provenance (previous documented diagnoses vs active complaints).
 */
export async function extractClinicalInformationFromDocument(documentText: string): Promise<IDocumentSummary> {
  const client = getGroqClient();

  if (!client) {
    return fallbackExtractClinicalInformationFromDocument(documentText);
  }

  // Truncate document text safely for LLM context window
  const safeText = documentText.slice(0, 15000);

  const systemPrompt = `You are a clinical document information extraction assistant for CareKare.
Your task is to analyze extracted text from a patient-uploaded medical document (e.g. lab report, prescription, discharge summary) and extract structured clinical information.

CRITICAL CLINICAL BOUNDARIES & RULES:
1. Do NOT invent or infer medical facts that are not present.
2. The uploaded document must NOT automatically become a current diagnosis. If a document mentions "Previous diagnosis: hypertension", record it under "previousDiagnoses" as historical documentation. Do NOT convert it to an active diagnosis.
3. Extract:
   - "documentType": string (e.g., "Prescription", "Laboratory Report", "Discharge Summary", "Diagnostic Imaging Report", or "Medical Record")
   - "dates": string[] (dates mentioned in document, e.g. "12/03/2026")
   - "medications": string[] (medications, dosages or prescriptions listed)
   - "labValues": string[] (test results, laboratory values or vitals)
   - "previousDiagnoses": string[] (past or documented diagnoses explicitly written in the record)
   - "observations": string[] (objective observations noted in the document)
4. Return strictly a JSON object with schema:
{
  "documentType": string,
  "dates": string[],
  "medications": string[],
  "labValues": string[],
  "previousDiagnoses": string[],
  "observations": string[]
}`;

  try {
    const response = await client.chat.completions.create({
      model: config.groqModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: safeText },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
      max_tokens: 600,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return fallbackExtractClinicalInformationFromDocument(documentText);
    }

    const parsed = JSON.parse(content);

    return {
      documentType: parsed.documentType && typeof parsed.documentType === 'string' ? parsed.documentType.trim() : 'Medical Document',
      dates: Array.isArray(parsed.dates) ? parsed.dates.map(String).slice(0, 10) : [],
      medications: Array.isArray(parsed.medications) ? parsed.medications.map(String).slice(0, 15) : [],
      labValues: Array.isArray(parsed.labValues) ? parsed.labValues.map(String).slice(0, 15) : [],
      previousDiagnoses: Array.isArray(parsed.previousDiagnoses) ? parsed.previousDiagnoses.map(String).slice(0, 10) : [],
      observations: Array.isArray(parsed.observations) ? parsed.observations.map(String).slice(0, 10) : [],
    };
  } catch (_error) {
    return fallbackExtractClinicalInformationFromDocument(documentText);
  }
}

