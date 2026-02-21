import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { listWorkers, updateMyProfile, getWorkerById, getWorkersLeaderboard } from '../controllers/workerController.js';

const router = Router();

router.get('/leaderboard', requireAuth, getWorkersLeaderboard);
router.get('/', requireAuth, listWorkers);
router.get('/:id', requireAuth, getWorkerById);

router.patch('/me', requireAuth, updateMyProfile);

export default router;
