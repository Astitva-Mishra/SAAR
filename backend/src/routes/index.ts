import { Router } from 'express';
import healthRoutes from './healthRoutes';
import authRoutes from './authRoutes';
import caseRoutes from './caseRoutes';

const router = Router();

// Mount health endpoint
router.use('/health', healthRoutes);

// Authentication & RBAC routes (Phase 4)
router.use('/auth', authRoutes);

// Clinical Case Taking & Management routes (Phase 5)
router.use('/cases', caseRoutes);
// router.use('/ai', aiRoutes);
// router.use('/patients', patientRoutes);

export default router;
