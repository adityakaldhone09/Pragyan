import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';
import { sendError, sendSuccess } from '@/utils/response';
import { notesService } from './notes.service';

export const generateNote = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  const data = await notesService.generate(req.user.id, req.body);
  return sendSuccess(res, data, 201, 'Notes generated');
});

export const listNotes = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  const data = await notesService.list(req.user.id, req.query as never);
  return sendSuccess(res, data, 200, 'Notes fetched');
});
