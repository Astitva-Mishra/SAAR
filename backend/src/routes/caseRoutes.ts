import { Router } from 'express';
import {
  createCase,
  getCases,
  getCaseById,
  submitAnswers,
  updateCaseStatus,
  updateClinicalNotes,
  completeCase,
  uploadCaseDocument,
  getCaseDocuments,
  deleteCaseDocument,
} from '../controllers/caseController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// Create new case (Patients only)
router.post('/', authenticate, requireRole('PATIENT'), createCase);

// Get list of cases (Filtered by ownership for patients, triage view for providers)
router.get('/', authenticate, getCases);

// Get single case details (Protected by ownership/role)
router.get('/:id', authenticate, getCaseById);

// Submit department question answers (Patients only, own case)
router.patch('/:id/answers', authenticate, requireRole('PATIENT'), submitAnswers);

// Medical Document Management Routes
// Upload document (Patients only, own case)
router.post('/:id/documents', authenticate, requireRole('PATIENT'), uploadCaseDocument);

// Get case documents (Patient own case, Provider triage view)
router.get('/:id/documents', authenticate, getCaseDocuments);

// Delete uploaded document (Patients only, own case)
router.delete('/:id/documents/:docId', authenticate, requireRole('PATIENT'), deleteCaseDocument);

// Provider Clinical Management Routes (Protected by PROVIDER role)
router.patch('/:id/status', authenticate, requireRole('PROVIDER'), updateCaseStatus);
router.patch('/:id/notes', authenticate, requireRole('PROVIDER'), updateClinicalNotes);
router.post('/:id/complete', authenticate, requireRole('PROVIDER'), completeCase);

export default router;
