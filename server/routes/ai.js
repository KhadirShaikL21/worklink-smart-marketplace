import { Router } from 'express';
import { body } from 'express-validator';
import { jobPostAssistant, aiChat } from '../controllers/aiController.js';

const router = Router();

router.post(
  '/job-assistant',
  [body('description').isString().notEmpty(), body('language').optional().isString()],
  jobPostAssistant
);

router.post('/chat', [body('message').isString().notEmpty()], aiChat);

export default router;
