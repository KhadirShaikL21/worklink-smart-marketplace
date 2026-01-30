import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { sendMessage, listMessages, listRooms } from '../controllers/chatController.js';

const router = Router();

router.post('/', requireAuth, sendMessage);
router.get('/', requireAuth, listMessages);
router.get('/rooms', requireAuth, listRooms);

export default router;
