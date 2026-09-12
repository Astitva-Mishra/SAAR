import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type SeverityLevel = 'MILD' | 'MODERATE' | 'SEVERE';
export type RiskLevel = 'LOW' | 'MODERATE' | 'POTENTIALLY_URGENT' | 'EMERGENCY';
export type CaseStatus = 'SUBMITTED' | 'IN_REVIEW' | 'COMPLETED';

export interface IDepartmentAnswer {
  questionId: string;
  questionText: string;
  answerText: string;
}

export interface IDocumentSummary {
  documentType?: string;
  dates?: string[];
  medications?: string[];
  labValues?: string[];
  previousDiagnoses?: string[];
  observations?: string[];
}

export interface ICaseDocument {
  documentId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  extractionStatus: 'PENDING' | 'EXTRACTED' | 'FAILED';
  extractedText?: string;
  extractedSummary?: IDocumentSummary;
  errorMessage?: string;
  uploadedAt: Date;
}

export interface IAISummary {
  chiefComplaintStructured: string;
  symptomChronology: string;
  associatedSymptoms: string[];
  pertinentNegatives: string[];
  suggestedReviewFocus: string[];
}

export interface ICase extends Document {
  caseId: string;
  patientId: Types.ObjectId;
  patientName: string;
  patientAge: number;
  patientGender: 'MALE' | 'FEMALE' | 'OTHER';
  providerId?: Types.ObjectId;
  chiefComplaint: string;
  symptoms: string[];
  duration: string;
  severity: SeverityLevel;
  patientClarifications?: string;
  answers: IDepartmentAnswer[];
  documents: ICaseDocument[];
  riskLevel: RiskLevel;
  safetyFlags: string[];
  safetyMessage: string;
  department: string;
  aiSummary: IAISummary;
  clinicalNotes?: string;
  status: CaseStatus;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const departmentAnswerSchema = new Schema<IDepartmentAnswer>(
  {
    questionId: { type: String, required: true },
    questionText: { type: String, required: true },
    answerText: { type: String, required: true },
  },
  { _id: false }
);

const aiSummarySchema = new Schema<IAISummary>(
  {
    chiefComplaintStructured: { type: String, default: '' },
    symptomChronology: { type: String, default: '' },
    associatedSymptoms: { type: [String], default: [] },
    pertinentNegatives: { type: [String], default: [] },
    suggestedReviewFocus: { type: [String], default: [] },
  },
  { _id: false }
);

const caseDocumentSchema = new Schema<ICaseDocument>(
  {
    documentId: { type: String, required: true },
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    extractionStatus: {
      type: String,
      enum: ['PENDING', 'EXTRACTED', 'FAILED'],
      default: 'PENDING',
    },
    extractedText: { type: String, default: '' },
    extractedSummary: {
      documentType: { type: String, default: 'Medical Record' },
      dates: { type: [String], default: [] },
      medications: { type: [String], default: [] },
      labValues: { type: [String], default: [] },
      previousDiagnoses: { type: [String], default: [] },
      observations: { type: [String], default: [] },
    },
    errorMessage: { type: String },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const caseSchema = new Schema<ICase>(
  {
    caseId: {
      type: String,
      required: [true, 'Case ID is required'],
      unique: true,
      trim: true,
      index: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient ID reference is required'],
      index: true,
    },
    patientName: {
      type: String,
      required: [true, 'Patient name is required'],
      trim: true,
    },
    patientAge: {
      type: Number,
      required: [true, 'Patient age is required'],
    },
    patientGender: {
      type: String,
      enum: ['MALE', 'FEMALE', 'OTHER'],
      required: [true, 'Patient gender is required'],
    },
    providerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: undefined,
      index: true,
    },
    chiefComplaint: {
      type: String,
      required: [true, 'Chief complaint is required'],
      trim: true,
    },
    symptoms: {
      type: [String],
      default: [],
    },
    duration: {
      type: String,
      required: [true, 'Duration is required'],
      trim: true,
    },
    severity: {
      type: String,
      enum: {
        values: ['MILD', 'MODERATE', 'SEVERE'],
        message: 'Severity must be MILD, MODERATE, or SEVERE',
      },
      default: 'MODERATE',
    },
    patientClarifications: {
      type: String,
      trim: true,
      default: undefined,
    },
    answers: {
      type: [departmentAnswerSchema],
      default: [],
    },
    documents: {
      type: [caseDocumentSchema],
      default: [],
    },
    riskLevel: {
      type: String,
      enum: {
        values: ['LOW', 'MODERATE', 'POTENTIALLY_URGENT', 'EMERGENCY'],
        message: 'Risk level must be LOW, MODERATE, POTENTIALLY_URGENT, or EMERGENCY',
      },
      default: 'LOW',
    },
    safetyFlags: {
      type: [String],
      default: [],
    },
    safetyMessage: {
      type: String,
      default: '',
    },
    department: {
      type: String,
      required: [true, 'Recommended clinical department is required'],
      trim: true,
    },
    aiSummary: {
      type: aiSummarySchema,
      default: () => ({}),
    },
    clinicalNotes: {
      type: String,
      trim: true,
      default: undefined,
    },
    status: {
      type: String,
      enum: {
        values: ['SUBMITTED', 'IN_REVIEW', 'COMPLETED'],
        message: 'Status must be SUBMITTED, IN_REVIEW, or COMPLETED',
      },
      default: 'SUBMITTED',
      index: true,
    },
    completedAt: {
      type: Date,
      default: undefined,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const Case: Model<ICase> =
  mongoose.models.Case || mongoose.model<ICase>('Case', caseSchema);

export default Case;
