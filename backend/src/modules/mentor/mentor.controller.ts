import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';
import { sendError, sendSuccess } from '@/utils/response';
import { mentorService } from './mentor.service';

export const startConversation = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  const data = await mentorService.startConversation(req.user.id, req.body || {});
  return sendSuccess(res, data, 201, 'Mentor conversation started');
});

export const chat = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  const { message } = req.body || {};
  if (!message || typeof message !== 'string') {
    return sendError(res, 400, 'message is required');
  }

  const data = await mentorService.chat(req.user.id, req.body || {});
  return sendSuccess(res, data, 200, 'Mentor response generated');
});

export const getHistory = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  const { conversationId = '' } = req.params;
  if (!conversationId) {
    return sendError(res, 400, 'conversationId is required');
  }

  const data = await mentorService.getHistory(req.user.id, conversationId);
  return sendSuccess(res, data, 200, 'Mentor history fetched');
});
