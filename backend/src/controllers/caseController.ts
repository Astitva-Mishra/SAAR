import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Case, { ICase, IDepartmentAnswer, ICaseDocument } from '../models/Case';
import PatientProfile from '../models/PatientProfile';
import { extractClinicalInformation, generateCaseSummary } from '../services/aiService';
import { evaluateSafety } from '../services/safetyService';
import { mapToDepartment } from '../services/departmentService';
import { getQuestionsForCase } from '../services/questionService';
import { processDocument } from '../services/documentService';
import {
  parseMultipartRequest,
  isValidExtension,
  isValidMimeType,
  MAX_FILE_SIZE_BYTES,
} from '../utils/multipartParser';

/**
 * Generate unique human-readable Case ID (e.g., ARG-2026-104)
 */
async function generateUniqueCaseId(): Promise<string> {
  const year = new Date().getFullYear();
  for (let attempt = 0; attempt < 10; attempt++) {
    const randomSuffix = Math.floor(100 + Math.random() * 9000);
    const candidate = `ARG-${year}-${randomSuffix}`;
    const exists = await Case.exists({ caseId: candidate });
    if (!exists) {
      return candidate;
    }
  }
  return `ARG-${year}-${Date.now().toString().slice(-4)}`;
}

/**
 * Helper to find a case by either MongoDB ObjectId or unique caseId string
 */
async function findCaseByIdOrCaseId(idParam: string): Promise<ICase | null> {
  if (mongoose.Types.ObjectId.isValid(idParam)) {
    const byMongoId = await Case.findById(idParam);
    if (byMongoId) return byMongoId;
  }
  return Case.findOne({ caseId: idParam.toUpperCase() });
}

/**
 * Create a new patient intake Case
 * POST /api/cases
 * Protected: PATIENT role only
 */
export async function createCase(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { chiefComplaint, patientClarifications, age, gender } = req.body;

    // 1. Validation
    if (!chiefComplaint || typeof chiefComplaint !== 'string' || chiefComplaint.trim().length < 3) {
      res.status(400).json({
        success: false,
        message: 'Chief complaint is required and must be at least 3 characters.',
      });
      return;
    }

    if (chiefComplaint.length > 1000) {
      res.status(400).json({
        success: false,
        message: 'Chief complaint exceeds maximum allowed length of 1000 characters.',
      });
      return;
    }

    // Authenticated patient from req.user
    const patientUser = req.user!;
    const patientId = patientUser._id as mongoose.Types.ObjectId;

    // 2. Resolve patient demographics (Profile, Request, or safe defaults)
    let patientAge = typeof age === 'number' && age > 0 ? age : 28;
    let patientGender = gender && ['MALE', 'FEMALE', 'OTHER'].includes(gender) ? gender : 'MALE';

    // If not supplied in request, check if a PatientProfile document exists
    const profile = await PatientProfile.findOne({ userId: patientId });
    if (profile) {
      if (!age) patientAge = profile.age;
      if (!gender) patientGender = profile.gender;
    }

    // 3. AI / Deterministic Fallback Clinical Extraction
    const extracted = await extractClinicalInformation(chiefComplaint.trim());

    // 4. Deterministic Clinical Department Recommendation
    const department = mapToDepartment({
      complaintText: chiefComplaint,
      symptoms: extracted.symptoms,
    });

    // 5. Deterministic Red-Flag Safety Evaluation
    const safetyResult = evaluateSafety({
      complaintText: chiefComplaint,
      symptoms: extracted.symptoms,
      severity: extracted.severity,
    });

    // 6. Controlled Question Selection based on Department and Symptoms
    const questions = getQuestionsForCase({
      department,
      symptoms: extracted.symptoms,
      chiefComplaint,
    });

    // 7. Generate Unique Case ID
    const caseId = await generateUniqueCaseId();

    // 8. Create and Persist Case
    const newCase = new Case({
      caseId,
      patientId,
      patientName: patientUser.name,
      patientAge,
      patientGender,
      chiefComplaint: chiefComplaint.trim(),
      symptoms: extracted.symptoms,
      duration: extracted.duration,
      severity: extracted.severity,
      patientClarifications: patientClarifications?.trim() || undefined,
      answers: [],
      riskLevel: safetyResult.riskLevel,
      safetyFlags: safetyResult.safetyFlags,
      safetyMessage: safetyResult.safetyMessage,
      department,
      aiSummary: {
        chiefComplaintStructured: extracted.chiefComplaint,
        symptomChronology: `Duration: ${extracted.duration}`,
        associatedSymptoms: extracted.associatedSymptoms,
        pertinentNegatives: extracted.pertinentNegatives,
        suggestedReviewFocus: [
          `Review patient reported ${extracted.severity.toLowerCase()} ${extracted.chiefComplaint.toLowerCase()}`,
        ],
      },
      status: 'SUBMITTED',
    });

    await newCase.save();

    res.status(201).json({
      success: true,
      message: 'Case intake created successfully.',
      case: newCase,
      questions,
      extracted,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get cases list for authenticated user
 * GET /api/cases
 * Patient: retrieves own cases
 * Provider: retrieves all cases for triage review with optional status/risk/search filters
 */
export async function getCases(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user!;
    let query: any = {};

    if (user.role === 'PATIENT') {
      query.patientId = user._id;
    } else if (user.role === 'PROVIDER') {
      // Optional status filter
      if (req.query.status && typeof req.query.status === 'string' && req.query.status !== 'ALL') {
        query.status = req.query.status.toUpperCase();
      }

      // Optional riskLevel filter
      if (req.query.riskLevel && typeof req.query.riskLevel === 'string' && req.query.riskLevel !== 'ALL') {
        query.riskLevel = req.query.riskLevel.toUpperCase();
      }

      // Optional text search filter
      if (req.query.search && typeof req.query.search === 'string' && req.query.search.trim().length > 0) {
        const escapedTerm = req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const searchRegex = new RegExp(escapedTerm, 'i');
        query.$or = [
          { caseId: searchRegex },
          { patientName: searchRegex },
          { chiefComplaint: searchRegex },
          { department: searchRegex },
        ];
      }
    }

    const cases = await Case.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: cases.length,
      cases,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get single case by ID or caseId
 * GET /api/cases/:id
 * Enforces patient ownership and provider access
 */
export async function getCaseById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const user = req.user!;

    const caseDoc = await findCaseByIdOrCaseId(id);

    if (!caseDoc) {
      res.status(404).json({
        success: false,
        message: `Case not found for identifier: ${id}`,
      });
      return;
    }

    // Role-based ownership check
    if (user.role === 'PATIENT' && caseDoc.patientId.toString() !== user._id.toString()) {
      res.status(403).json({
        success: false,
        message: 'Access denied: You do not have permission to view another patient case.',
      });
      return;
    }

    const questions = getQuestionsForCase({
      department: caseDoc.department,
      symptoms: caseDoc.symptoms,
      chiefComplaint: caseDoc.chiefComplaint,
    });

    res.status(200).json({
      success: true,
      case: caseDoc,
      questions,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Submit answers to department questions and generate physician-ready summary
 * PATCH /api/cases/:id/answers
 * Protected: PATIENT role only (must own case)
 */
export async function submitAnswers(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const { answers } = req.body;
    const user = req.user!;

    if (!answers || !Array.isArray(answers)) {
      res.status(400).json({
        success: false,
        message: 'Answers must be provided as an array of question-answer objects.',
      });
      return;
    }

    const caseDoc = await findCaseByIdOrCaseId(id);

    if (!caseDoc) {
      res.status(404).json({
        success: false,
        message: `Case not found for identifier: ${id}`,
      });
      return;
    }

    // Ownership check
    if (caseDoc.patientId.toString() !== user._id.toString()) {
      res.status(403).json({
        success: false,
        message: 'Access denied: You can only submit answers for your own case.',
      });
      return;
    }

    // Validate and sanitize answers
    const sanitizedAnswers: IDepartmentAnswer[] = [];
    for (const ans of answers) {
      if (ans && typeof ans === 'object' && ans.questionId && ans.answerText) {
        sanitizedAnswers.push({
          questionId: String(ans.questionId).trim(),
          questionText: String(ans.questionText || ans.questionId).trim(),
          answerText: String(ans.answerText).trim(),
        });
      }
    }

    caseDoc.answers = sanitizedAnswers;

    // Deterministic Safety Re-Evaluation with answers
    const updatedSafety = evaluateSafety({
      complaintText: caseDoc.chiefComplaint,
      symptoms: caseDoc.symptoms,
      severity: caseDoc.severity,
      answers: sanitizedAnswers,
      priorRiskLevel: caseDoc.riskLevel,
    });

    caseDoc.riskLevel = updatedSafety.riskLevel;
    caseDoc.safetyFlags = updatedSafety.safetyFlags;
    caseDoc.safetyMessage = updatedSafety.safetyMessage;

    // Generate Structured Physician-Ready Summary (Groq with deterministic fallback)
    const summary = await generateCaseSummary(caseDoc);
    caseDoc.aiSummary = {
      chiefComplaintStructured: summary.chiefComplaintStructured,
      symptomChronology: summary.symptomChronology,
      associatedSymptoms: summary.associatedSymptoms,
      pertinentNegatives: summary.pertinentNegatives,
      suggestedReviewFocus: summary.suggestedReviewFocus,
    };

    caseDoc.status = 'SUBMITTED';

    await caseDoc.save();

    res.status(200).json({
      success: true,
      message: 'Answers recorded and physician intake summary generated.',
      case: caseDoc,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update case status
 * PATCH /api/cases/:id/status
 * Protected: PROVIDER role only
 */
export async function updateCaseStatus(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const user = req.user!;

    const allowedStatuses = ['SUBMITTED', 'IN_REVIEW', 'COMPLETED'];
    if (!status || !allowedStatuses.includes(String(status).toUpperCase())) {
      res.status(400).json({
        success: false,
        message: `Invalid status. Allowed statuses are: [${allowedStatuses.join(', ')}]`,
      });
      return;
    }

    const targetStatus = String(status).toUpperCase();
    const caseDoc = await findCaseByIdOrCaseId(id);

    if (!caseDoc) {
      res.status(404).json({
        success: false,
        message: `Case not found for identifier: ${id}`,
      });
      return;
    }

    // Transition validation
    if (caseDoc.status === 'COMPLETED') {
      res.status(400).json({
        success: false,
        message: 'Completed cases cannot be reverted or modified.',
      });
      return;
    }

    caseDoc.status = targetStatus as any;
    caseDoc.providerId = user._id as mongoose.Types.ObjectId;

    if (targetStatus === 'COMPLETED') {
      caseDoc.completedAt = new Date();
    }

    await caseDoc.save();

    res.status(200).json({
      success: true,
      message: `Case status updated to ${targetStatus}.`,
      case: caseDoc,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Save provider clinical notes
 * PATCH /api/cases/:id/notes
 * Protected: PROVIDER role only
 */
export async function updateClinicalNotes(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const { clinicalNotes } = req.body;
    const user = req.user!;

    if (clinicalNotes === undefined || typeof clinicalNotes !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Clinical notes must be provided as a string.',
      });
      return;
    }

    if (clinicalNotes.length > 5000) {
      res.status(400).json({
        success: false,
        message: 'Clinical notes cannot exceed 5000 characters.',
      });
      return;
    }

    const caseDoc = await findCaseByIdOrCaseId(id);

    if (!caseDoc) {
      res.status(404).json({
        success: false,
        message: `Case not found for identifier: ${id}`,
      });
      return;
    }

    caseDoc.clinicalNotes = clinicalNotes.trim();
    caseDoc.providerId = user._id as mongoose.Types.ObjectId;

    // Automatically transition to IN_REVIEW if physician started taking notes
    if (caseDoc.status === 'SUBMITTED') {
      caseDoc.status = 'IN_REVIEW';
    }

    await caseDoc.save();

    res.status(200).json({
      success: true,
      message: 'Clinical notes saved successfully.',
      case: caseDoc,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Complete patient case consultation
 * POST /api/cases/:id/complete
 * Protected: PROVIDER role only
 */
export async function completeCase(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const { clinicalNotes } = req.body;
    const user = req.user!;

    const caseDoc = await findCaseByIdOrCaseId(id);

    if (!caseDoc) {
      res.status(404).json({
        success: false,
        message: `Case not found for identifier: ${id}`,
      });
      return;
    }

    if (caseDoc.status === 'COMPLETED') {
      res.status(400).json({
        success: false,
        message: 'Case is already marked as COMPLETED.',
      });
      return;
    }

    if (clinicalNotes && typeof clinicalNotes === 'string') {
      caseDoc.clinicalNotes = clinicalNotes.trim();
    }

    caseDoc.status = 'COMPLETED';
    caseDoc.completedAt = new Date();
    caseDoc.providerId = user._id as mongoose.Types.ObjectId;

    await caseDoc.save();

    res.status(200).json({
      success: true,
      message: 'Consultation completed successfully.',
      case: caseDoc,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Upload and process a medical document for a case
 * POST /api/cases/:id/documents
 * Protected: PATIENT role only (must own the case)
 */
export async function uploadCaseDocument(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const user = req.user!;

    const caseDoc = await findCaseByIdOrCaseId(id);

    if (!caseDoc) {
      res.status(404).json({
        success: false,
        message: `Case not found for identifier: ${id}`,
      });
      return;
    }

    // Ownership check: Patient can only upload to their own case
    if (caseDoc.patientId.toString() !== user._id.toString()) {
      res.status(403).json({
        success: false,
        message: 'Access denied: You can only upload documents to your own case.',
      });
      return;
    }

    // Check maximum document count limit (max 5 per case)
    if (caseDoc.documents && caseDoc.documents.length >= 5) {
      res.status(400).json({
        success: false,
        message: 'Maximum document limit reached. A maximum of 5 documents is allowed per case.',
      });
      return;
    }

    // Parse multipart/form-data upload
    let parseResult;
    try {
      parseResult = await parseMultipartRequest(req, MAX_FILE_SIZE_BYTES);
    } catch (parseErr: any) {
      res.status(400).json({
        success: false,
        message: parseErr.message || 'Invalid or malformed document upload.',
      });
      return;
    }

    if (!parseResult.files || parseResult.files.length === 0) {
      res.status(400).json({
        success: false,
        message: 'No file provided. Please select a document to upload.',
      });
      return;
    }

    const uploadedFile = parseResult.files[0];

    // Validate extension
    if (!isValidExtension(uploadedFile.filename)) {
      res.status(400).json({
        success: false,
        message: `Unsupported file type. Supported formats are: PDF, PNG, JPG, JPEG, WEBP.`,
      });
      return;
    }

    // Validate MIME type
    if (!isValidMimeType(uploadedFile.mimeType)) {
      res.status(400).json({
        success: false,
        message: `Unsupported MIME type "${uploadedFile.mimeType}". Allowed: PDF, PNG, JPG, JPEG, WEBP.`,
      });
      return;
    }

    // Validate size limit (10MB)
    if (uploadedFile.size > MAX_FILE_SIZE_BYTES || uploadedFile.buffer.length > MAX_FILE_SIZE_BYTES) {
      res.status(400).json({
        success: false,
        message: `File size exceeds the maximum limit of 10MB.`,
      });
      return;
    }

    // Validate not empty
    if (uploadedFile.size === 0 || uploadedFile.buffer.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Uploaded file is empty (0 bytes).',
      });
      return;
    }

    // Process document: OCR / text extraction & Groq clinical information extraction
    const processedDoc = await processDocument(uploadedFile);

    // Initialize documents array if not already present
    if (!caseDoc.documents) {
      caseDoc.documents = [];
    }

    caseDoc.documents.push(processedDoc);

    // If text was extracted, integrate with deterministic safety evaluation
    if (processedDoc.extractionStatus === 'EXTRACTED' && processedDoc.extractedText) {
      const allDocTexts = caseDoc.documents
        .filter((d) => d.extractionStatus === 'EXTRACTED' && d.extractedText)
        .map((d) => d.extractedText!);

      const updatedSafety = evaluateSafety({
        complaintText: caseDoc.chiefComplaint,
        symptoms: caseDoc.symptoms,
        severity: caseDoc.severity,
        answers: caseDoc.answers,
        priorRiskLevel: caseDoc.riskLevel,
        documentTexts: allDocTexts,
      });

      caseDoc.riskLevel = updatedSafety.riskLevel;
      caseDoc.safetyFlags = updatedSafety.safetyFlags;
      caseDoc.safetyMessage = updatedSafety.safetyMessage;
    }

    await caseDoc.save();

    res.status(201).json({
      success: true,
      message:
        processedDoc.extractionStatus === 'EXTRACTED'
          ? 'Medical document uploaded and clinical information extracted successfully.'
          : 'Document uploaded, but automatic text extraction could not read the file.',
      document: {
        documentId: processedDoc.documentId,
        filename: processedDoc.filename,
        originalName: processedDoc.originalName,
        mimeType: processedDoc.mimeType,
        size: processedDoc.size,
        extractionStatus: processedDoc.extractionStatus,
        extractedText: processedDoc.extractedText || '',
        extractedSummary: processedDoc.extractedSummary,
        errorMessage: processedDoc.errorMessage,
        uploadedAt: processedDoc.uploadedAt,
      },
      case: caseDoc,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all documents attached to a case
 * GET /api/cases/:id/documents
 * Protected: Patient (own case) or Provider (any case)
 */
export async function getCaseDocuments(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const user = req.user!;

    const caseDoc = await findCaseByIdOrCaseId(id);

    if (!caseDoc) {
      res.status(404).json({
        success: false,
        message: `Case not found for identifier: ${id}`,
      });
      return;
    }

    // Role-based access check
    if (user.role === 'PATIENT' && caseDoc.patientId.toString() !== user._id.toString()) {
      res.status(403).json({
        success: false,
        message: 'Access denied: You cannot view documents of another patient case.',
      });
      return;
    }

    const safeDocuments = (caseDoc.documents || []).map((doc) => ({
      documentId: doc.documentId,
      filename: doc.filename,
      originalName: doc.originalName,
      mimeType: doc.mimeType,
      size: doc.size,
      extractionStatus: doc.extractionStatus,
      extractedSummary: doc.extractedSummary,
      errorMessage: doc.errorMessage,
      uploadedAt: doc.uploadedAt,
      // Provide preview or extractedText if needed, never internal file system path
      extractedTextPreview: doc.extractedText ? doc.extractedText.slice(0, 500) : '',
      extractedText: doc.extractedText || '',
    }));

    res.status(200).json({
      success: true,
      count: safeDocuments.length,
      documents: safeDocuments,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete an attached document from a case
 * DELETE /api/cases/:id/documents/:docId
 * Protected: PATIENT role only (must own case)
 */
export async function deleteCaseDocument(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id, docId } = req.params;
    const user = req.user!;

    const caseDoc = await findCaseByIdOrCaseId(id);

    if (!caseDoc) {
      res.status(404).json({
        success: false,
        message: `Case not found for identifier: ${id}`,
      });
      return;
    }

    if (caseDoc.patientId.toString() !== user._id.toString()) {
      res.status(403).json({
        success: false,
        message: 'Access denied: You can only remove documents from your own case.',
      });
      return;
    }

    const initialCount = caseDoc.documents?.length || 0;
    caseDoc.documents = (caseDoc.documents || []).filter((d) => d.documentId !== docId);

    if (caseDoc.documents.length === initialCount) {
      res.status(404).json({
        success: false,
        message: `Document with ID "${docId}" not found in this case.`,
      });
      return;
    }

    await caseDoc.save();

    res.status(200).json({
      success: true,
      message: 'Document removed successfully.',
      documents: caseDoc.documents,
    });
  } catch (error) {
    next(error);
  }
}

