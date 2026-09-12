export type UserRole = 'PATIENT' | 'PROVIDER';

export interface PatientProfileData {
  age?: number;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  height?: number;
  weight?: number;
  bloodGroup?: string;
  preferredLanguage?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContact?: string;
  abhaPlaceholder?: string;
}

export interface User {
  id: string;
  name: string;
  emailOrMobile: string;
  email?: string;
  phone?: string;
  aadhaarMasked?: string;
  role: UserRole;
  specialty?: string;
  qualification?: string;
  registrationNumber?: string;
  experienceYears?: number;
  hospitalOrClinic?: string;
  city?: string;
  languages?: string[];
  bio?: string;
  patientProfile?: PatientProfileData;
  avatarUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CaseStatus = 'SUBMITTED' | 'IN_REVIEW' | 'COMPLETED';

export type RiskLevel = 'LOW' | 'MODERATE' | 'POTENTIALLY_URGENT' | 'EMERGENCY';

export type SeverityLevel = 'MILD' | 'MODERATE' | 'SEVERE';

export interface DepartmentQuestionAnswer {
  questionId: string;
  questionText: string;
  answerText: string;
}

export interface DocumentSummary {
  documentType?: string;
  dates?: string[];
  medications?: string[];
  labValues?: string[];
  previousDiagnoses?: string[];
  observations?: string[];
}

export interface CaseDocument {
  documentId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  extractionStatus: 'PENDING' | 'EXTRACTED' | 'FAILED';
  extractedText?: string;
  extractedSummary?: DocumentSummary;
  errorMessage?: string;
  uploadedAt: string;
}

export interface AISummary {
  chiefComplaintStructured: string;
  symptomChronology: string;
  associatedSymptoms: string[];
  pertinentNegatives: string[];
  suggestedReviewFocus: string[];
}

export interface PatientCase {
  id: string;
  caseId: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: 'MALE' | 'FEMALE' | 'OTHER';
  providerId?: string;
  providerName?: string;
  chiefComplaint: string;
  symptoms: string[];
  duration: string;
  severity: SeverityLevel;
  patientClarifications?: string;
  answers: DepartmentQuestionAnswer[];
  documents?: CaseDocument[];
  riskLevel: RiskLevel;
  safetyFlags: string[];
  safetyMessage?: string;
  department: string;
  aiSummary: AISummary;
  clinicalNotes?: string;
  status: CaseStatus;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface DepartmentQuestionConfig {
  id: string;
  text: string;
  type: 'radio' | 'text';
  options?: string[];
  placeholder?: string;
}

export interface CreateCaseResponse {
  success: boolean;
  message?: string;
  case: PatientCase;
  questions: DepartmentQuestionConfig[];
  extracted?: any;
}

export interface CasesListResponse {
  success: boolean;
  count: number;
  cases: PatientCase[];
}

export interface CaseDetailResponse {
  success: boolean;
  case: PatientCase;
  questions?: DepartmentQuestionConfig[];
}
