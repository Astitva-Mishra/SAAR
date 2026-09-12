import { PatientCase } from '@/types';

export interface PatientProfile {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  mobile: string;
  email: string;
  abhaId: string;
  emergencyContact: string;
  bloodGroup: string;
}

export const DEMO_PATIENT: PatientProfile = {
  id: 'patient-rahul-01',
  name: 'Rahul Sharma',
  age: 29,
  gender: 'Male',
  mobile: '9876543210',
  email: 'rahul.sharma@example.com',
  abhaId: '91-8834-1290-4421',
  emergencyContact: '+91 98765-01234 (Spouse)',
  bloodGroup: 'B+',
};

export const DEMO_CASES: PatientCase[] = [
  {
    id: 'case-104',
    caseId: 'ARG-2026-104',
    patientId: 'patient-rahul-01',
    patientName: 'Rahul Sharma',
    patientAge: 29,
    patientGender: 'MALE',
    chiefComplaint: 'Stomach pain and nausea',
    symptoms: ['Stomach pain', 'Nausea', 'Loss of appetite', 'Post-meal bloating'],
    duration: '3 days',
    severity: 'MODERATE',
    answers: [
      {
        questionId: 'pain_location',
        questionText: 'Where exactly is the pain located?',
        answerText: 'Upper abdomen, centered below the ribcage',
      },
      {
        questionId: 'pain_severity',
        questionText: 'How severe is the pain?',
        answerText: 'Moderate (5 out of 10) - persistent dull ache',
      },
      {
        questionId: 'meal_timing',
        questionText: 'Does the pain occur before or after eating?',
        answerText: 'Worsens approximately 30-45 minutes after eating meals',
      },
      {
        questionId: 'vomiting_present',
        questionText: 'Have you experienced vomiting?',
        answerText: 'No vomiting, but frequent sensation of nausea',
      },
      {
        questionId: 'bowel_changes',
        questionText: 'Have you noticed any changes in bowel movements?',
        answerText: 'Normal bowel habits, no blood or black stools observed',
      },
    ],
    riskLevel: 'LOW',
    safetyFlags: [],
    safetyMessage: 'Low risk. No acute chest pain, dyspnea, or loss of consciousness detected.',
    department: 'Gastroenterology',
    aiSummary: {
      chiefComplaintStructured: 'Epigastric dull pain associated with post-prandial nausea',
      symptomChronology: 'Persistent 3-day history with worsening following food intake',
      associatedSymptoms: ['Nausea', 'Post-meal fullness', 'Epigastric tenderness'],
      pertinentNegatives: ['Vomiting', 'Hematemesis', 'Melena', 'High fever', 'Jaundice'],
      suggestedReviewFocus: [
        'Dyspepsia vs Peptic ulcer spectrum',
        'Dietary trigger evaluation',
        'H. pylori screening consideration',
      ],
    },
    status: 'SUBMITTED',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 'case-072',
    caseId: 'ARG-2026-072',
    patientId: 'patient-rahul-01',
    patientName: 'Rahul Sharma',
    patientAge: 29,
    patientGender: 'MALE',
    chiefComplaint: 'Dry cough and throat irritation',
    symptoms: ['Sore throat', 'Dry cough', 'Mild fatigue'],
    duration: '5 days',
    severity: 'MILD',
    answers: [
      {
        questionId: 'throat_pain',
        questionText: 'Is swallowing painful?',
        answerText: 'Mild irritation while swallowing liquids',
      },
      {
        questionId: 'fever_check',
        questionText: 'Have you recorded an elevated body temperature?',
        answerText: 'No fever recorded on thermometer',
      },
    ],
    riskLevel: 'LOW',
    safetyFlags: [],
    safetyMessage: 'Routine outpatient care. Vital signs within normal baseline.',
    department: 'ENT',
    aiSummary: {
      chiefComplaintStructured: 'Subacute pharyngeal irritation with non-productive cough',
      symptomChronology: 'Gradual onset 5 days ago, stable intensity',
      associatedSymptoms: ['Throat tickle', 'Dry cough'],
      pertinentNegatives: ['High fever', 'Shortness of breath', 'Stridor'],
      suggestedReviewFocus: ['Upper respiratory viral irritation', 'Allergic pharyngitis'],
    },
    clinicalNotes: 'Prescribed warm saline gargles twice daily and hydration. Advised follow-up if symptoms persist beyond 10 days.',
    status: 'COMPLETED',
    completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(), // 14 days ago
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
  },
  {
    id: 'case-019',
    caseId: 'ARG-2026-019',
    patientId: 'patient-rahul-01',
    patientName: 'Rahul Sharma',
    patientAge: 29,
    patientGender: 'MALE',
    chiefComplaint: 'Mild rash on forearm with itching',
    symptoms: ['Localized skin rash', 'Pruritus', 'Mild erythema'],
    duration: '2 days',
    severity: 'MILD',
    answers: [
      {
        questionId: 'rash_onset',
        questionText: 'Did this rash occur after touching any plant or chemical?',
        answerText: 'Noticed after gardening over the weekend',
      },
    ],
    riskLevel: 'LOW',
    safetyFlags: [],
    safetyMessage: 'Localized superficial skin reaction. No systemic involvement.',
    department: 'Dermatology',
    aiSummary: {
      chiefComplaintStructured: 'Localized pruritic erythematous papules on right distal forearm',
      symptomChronology: 'Acute onset 48 hours post plant contact',
      associatedSymptoms: ['Mild localized itching'],
      pertinentNegatives: ['Facial swelling', 'Dyspnea', 'Blisters', 'Mucosal involvement'],
      suggestedReviewFocus: ['Contact dermatitis', 'Topical emollient / antihistamine'],
    },
    clinicalNotes: 'Diagnosed mild contact dermatitis. Advised calamine lotion application and avoidance of irritants.',
    status: 'COMPLETED',
    completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(), // 60 days ago
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
  },
];
