import { Router } from 'express';
import { createIntent, capture, release, refund, listPayments } from '../controllers/paymentController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.post('/intent', requireAuth, requireRole('customer'), createIntent);
router.post('/:paymentId/capture', requireAuth, requireRole('customer'), capture);
router.post('/:paymentId/release', requireAuth, requireRole('customer'), release);
router.post('/:paymentId/refund', requireAuth, requireRole('customer'), refund);
router.get('/', requireAuth, listPayments);

export default router;
