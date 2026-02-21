import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import * as adminController from '../controllers/adminController.js';

const router = Router();

// All routes require authentication and 'admin' role
router.use(requireAuth, requireRole('admin'));

router.get('/stats', adminController.getDashboardStats);
router.get('/users', adminController.getUsers);
router.patch('/users/:userId/status', adminController.updateUserStatus);
router.get('/disputes', adminController.getDisputes);

export default router;
