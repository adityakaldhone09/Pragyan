import { Router } from 'express';
import { authenticate } from '@/middleware/auth';
import { chat, getHistory, startConversation } from './mentor.controller';

const router = Router();

router.post('/conversation', authenticate, startConversation);
router.post('/chat', authenticate, chat);
router.get('/history/:conversationId', authenticate, getHistory);

export default router;
