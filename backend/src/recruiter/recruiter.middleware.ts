import { NextFunction, Request, Response } from 'express';
import { sendError } from '@/utils/response';

export function requireRecruiter(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  if (req.user.role !== 'RECRUITER') {
    return sendError(res, 403, 'Recruiter access required');
  }

  next();
}
