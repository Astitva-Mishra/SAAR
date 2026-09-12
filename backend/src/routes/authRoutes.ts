import { Router } from 'express';
import {
  register,
  login,
  getMe,
  updateProfile,
  logout,
  providerTest,
  patientTest,
} from '../controllers/authController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// Public Authentication Endpoints
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

// Protected User Profile Endpoints
router.get('/me', authenticate, getMe);
router.patch('/profile', authenticate, updateProfile);

// Development/Testing RBAC Endpoints (Phase 4 Verification)
router.get('/provider-test', authenticate, requireRole('PROVIDER'), providerTest);
router.get('/patient-test', authenticate, requireRole('PATIENT'), patientTest);

export default router;
