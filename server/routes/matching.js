import { Router } from 'express';
import { getRanking } from '../controllers/matchingController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// For now, allow customer/admin to fetch ranking for a job
router.post('/:jobId/rank', requireAuth, requireRole('customer'), getRanking);

export default router;
