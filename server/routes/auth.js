import { Router } from 'express';
import { body } from 'express-validator';
import { login, register, refresh, me, logout, requestOtp, updateMe } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { uploadImage } from '../middleware/uploads.js';

const router = Router();

router.post(
  '/register',
  uploadImage.single('avatar'),
  [
    body('name').isString().notEmpty(),
    body('email').isEmail(),
    body('phone').isString().notEmpty(),
    body('password').isLength({ min: 6 }),
    body('isWorker').optional().isBoolean()
  ],
  register
);

router.post(
  '/login',
  [
    body('emailOrPhone').isString().notEmpty(),
    body('password').isLength({ min: 6 })
  ],
  login
);

router.post('/refresh', refresh);
router.post('/logout', requireAuth, logout);
router.get('/me', requireAuth, me);
router.patch('/me', requireAuth, updateMe);
router.post('/otp', requireAuth, requestOtp);

export default router;
