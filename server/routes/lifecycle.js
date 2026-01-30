import { Router } from 'express';
import { acceptTask, completeTask, customerSatisfaction, submitRating } from '../controllers/lifecycleController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.post('/tasks/:taskId/accept', requireAuth, requireRole('worker'), acceptTask);
router.post('/tasks/:taskId/complete', requireAuth, requireRole('worker'), completeTask);
router.post('/jobs/:jobId/satisfaction', requireAuth, requireRole('customer'), customerSatisfaction);
router.post('/jobs/:jobId/rating', requireAuth, requireRole('customer'), submitRating);

export default router;
