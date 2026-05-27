import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';
import { sendError, sendPaginated, sendSuccess } from '@/utils/response';
import { learningResourceService } from '@/services/learning-resources';

export const getLearningResources = asyncHandler(async (req: Request, res: Response) => {
  const result = await learningResourceService.listResources({
    roadmapId: req.query.roadmapId as string | undefined,
    category: req.query.category as string | undefined,
    skill: req.query.skill as string | undefined,
    topic: req.query.topic as string | undefined,
    type: req.query.type as string | undefined,
    difficulty: req.query.difficulty as string | undefined,
    dayNumber: req.query.dayNumber ? Number(req.query.dayNumber) : undefined,
    query: req.query.query as string | undefined,
    page: req.query.page ? Number(req.query.page) : 1,
    limit: req.query.limit ? Number(req.query.limit) : 24,
  });

  return sendPaginated(res, result.resources, result.page, result.limit, result.total, 200);
});

export const getRoadmapLearningResources = asyncHandler(async (req: Request, res: Response) => {
  const { roadmapId } = req.params;
  const refresh = String(req.query.refresh || '').toLowerCase() === 'true';
  const dayNumber = req.query.dayNumber ? Number(req.query.dayNumber) : undefined;

  const result = await learningResourceService.getRoadmapRecommendations(
    roadmapId,
    req.user?.id,
    refresh,
    dayNumber
  );

  if (!result) {
    return sendError(res, 404, 'Roadmap not found');
  }

  return sendSuccess(res, result, 200, 'Roadmap learning resources fetched');
});

export const getPersonalizedLearningResources = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  const { roadmapId } = req.query as { roadmapId?: string };
  if (!roadmapId) {
    return sendError(res, 400, 'roadmapId is required');
  }

  const result = await learningResourceService.getRoadmapRecommendations(roadmapId, req.user.id, false);
  if (!result) {
    return sendError(res, 404, 'Roadmap not found');
  }

  return sendSuccess(res, result, 200, 'Personalized learning resources fetched');
});

export const getLearningResourceHistory = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  const roadmapId = req.query.roadmapId as string | undefined;
  const history = await learningResourceService.getHistory(req.user.id, roadmapId);

  return sendSuccess(res, history, 200, 'Learning history fetched');
});

export const upsertLearningResourceHistory = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  const result = await learningResourceService.upsertHistory(req.user.id, req.body);
  return sendSuccess(res, result, 200, 'Learning history saved');
});