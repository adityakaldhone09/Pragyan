import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';
import { sendError, sendSuccess } from '@/utils/response';
import { ensureJobsSynced, storeJobs } from '@/services/job-sync';
import { getJobFeedForUser, markJobApplied } from '@/services/job-match-engine';

export const getJobs = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  const syncResult = await ensureJobsSynced();
  if (!syncResult.jobs.length) {
    return sendSuccess(
      res,
      {
        recentJobs: [],
        recommendedJobs: [],
        appliedJobs: [],
        syncWarning: 'No job feed was returned from RapidAPI. Check RAPID_API_KEY and the JSearch API status.',
      },
      200,
      'Job feed fetched successfully'
    );
  }

  const feed = await getJobFeedForUser(req.user.id);
  return sendSuccess(res, feed, 200, 'Job feed fetched successfully');
});

export const applyToJob = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  const { jobId } = req.params;

  if (!jobId) {
    return sendError(res, 400, 'Job ID is required');
  }

  const job = await markJobApplied(req.user.id, jobId);
  return sendSuccess(res, job, 200, 'Job marked as applied');
});

export const syncJobs = asyncHandler(async (_req: Request, res: Response) => {
  try {
    const result = await storeJobs();
    return sendSuccess(res, result, 200, 'Jobs synced and stored successfully');
  } catch (error) {
    return sendError(
      res,
      500,
      error instanceof Error ? error.message : 'Failed to sync jobs'
    );
  }
});