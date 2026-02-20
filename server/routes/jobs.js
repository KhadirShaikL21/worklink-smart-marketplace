import { Router } from 'express';
import { body } from 'express-validator';
import { createJob, formTeam, formTeamOptimized, listMyJobs, listOpenJobs, applyForJob, getJob, assignWorkers, verifyStartOtp, completeJob, startTravel, arrivedAtLocation, acceptJob, raiseDispute, triggerSOS } from '../controllers/jobController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { uploadMixed } from '../middleware/uploads.js';

const router = Router();

router.post(
  '/',
  requireAuth,
  requireRole('customer'),
  [
    body('title').isString().notEmpty(),
    body('description').isString().notEmpty(),
    body('location.coordinates').isArray({ min: 2, max: 2 })
  ],
  createJob
);

router.get('/', requireAuth, listMyJobs);
router.get('/open', requireAuth, requireRole('worker'), listOpenJobs);
router.get('/:jobId', requireAuth, getJob);
router.post('/:jobId/apply', requireAuth, requireRole('worker'), applyForJob);
router.post('/:jobId/assign', requireAuth, requireRole('customer'), assignWorkers);
router.post('/:jobId/start-travel', requireAuth, startTravel);
router.post('/:jobId/arrived', requireAuth, arrivedAtLocation);
router.post('/:jobId/accept', requireAuth, acceptJob);
router.post('/:jobId/start', requireAuth, verifyStartOtp);
router.post('/:jobId/complete', requireAuth, uploadMixed.fields([{ name: 'video', maxCount: 1 }, { name: 'photos', maxCount: 3 }]), completeJob);

router.post('/:jobId/team', requireAuth, requireRole('customer'), formTeam);
router.post('/:jobId/team/optimize', requireAuth, requireRole('customer'), formTeamOptimized);

router.post('/:jobId/dispute', requireAuth, raiseDispute);
router.post('/:jobId/sos', requireAuth, triggerSOS);

export default router;
