import { Router } from 'express';
import { body } from 'express-validator';
import { jobPostAssistant, aiChat, analyzeDefect } from '../controllers/aiController.js';
import multer from 'multer';

// Memory storage for AI analysis (ephemeral)
const memoryStorage = multer.memoryStorage();
const uploadAnalysis = multer({ 
  storage: memoryStorage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const router = Router();

router.post(
  '/job-assistant',
  [body('description').isString().notEmpty(), body('language').optional().isString()],
  jobPostAssistant
);

router.post('/chat', [body('message').isString().notEmpty()], aiChat);

router.post(
  '/analyze-defect',
  uploadAnalysis.single('image'),
  analyzeDefect
);

export default router;
