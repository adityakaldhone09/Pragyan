import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';
import { sendError, sendSuccess } from '@/utils/response';
import { journeyService } from './journey.service';

export const getJourney = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  const { careerSlug = '' } = req.params;
  const data = await journeyService.getJourney(req.user.id, careerSlug || 'career-journey');
  return sendSuccess(res, data, 200, 'Journey fetched successfully');
});

export const getJourneyDashboard = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  const data = await journeyService.getDashboardJourney(req.user.id);
  return sendSuccess(res, data, 200, 'Journey dashboard fetched successfully');
});
