import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getNotifications, markNotificationRead } from '../controllers/notificationController.js';

const router = Router();

router.get('/', requireAuth, getNotifications);
router.post('/:id/read', requireAuth, markNotificationRead);

export default router;
