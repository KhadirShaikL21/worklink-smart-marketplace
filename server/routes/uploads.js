import { Router } from 'express';
import { uploadSingleImage, uploadSingleAudio, uploadSingleVideo } from '../controllers/uploadController.js';
import { uploadImage, uploadAudio, uploadVideo } from '../middleware/uploads.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/image', requireAuth, uploadImage.single('file'), uploadSingleImage);
router.post('/audio', requireAuth, uploadAudio.single('file'), uploadSingleAudio);
router.post('/video', requireAuth, uploadVideo.single('file'), uploadSingleVideo);

export default router;
