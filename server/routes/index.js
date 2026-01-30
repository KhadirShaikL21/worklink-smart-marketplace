import { Router } from 'express';
import authRoutes from './auth.js';
import aiRoutes from './ai.js';
import matchingRoutes from './matching.js';
import uploadRoutes from './uploads.js';
import jobRoutes from './jobs.js';
import lifecycleRoutes from './lifecycle.js';
import verificationRoutes from './verification.js';
import paymentRoutes from './payments.js';
import notificationRoutes from './notifications.js';
import chatRoutes from './chat.js';
import workerRoutes from './workers.js';

const router = Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use('/ai', aiRoutes);
router.use('/matching', matchingRoutes);
router.use('/uploads', uploadRoutes);
router.use('/jobs', jobRoutes);
router.use('/', lifecycleRoutes);
router.use('/verification', verificationRoutes);
router.use('/payments', paymentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/chat', chatRoutes);
router.use('/workers', workerRoutes);

export default router;
