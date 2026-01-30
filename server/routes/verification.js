import { Router } from 'express';
import { requestOtp, verifyOtp, uploadIdDocs, faceMatch, adminApprove } from '../controllers/verificationController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.post('/request-otp', requireAuth, requestOtp);
router.post('/verify-otp', requireAuth, verifyOtp);
router.post('/id-docs', requireAuth, requireRole('worker'), uploadIdDocs);
router.post('/face-match', requireAuth, requireRole('worker'), faceMatch);
router.post('/admin/approve/:userId', requireAuth, requireRole('admin'), adminApprove);

export default router;
