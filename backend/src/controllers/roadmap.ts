// src/controllers/roadmap.ts

import { Request, Response } from 'express';
import { roadmapService } from '@/services/roadmap';
import { progressService } from '@/services/progress';
import { recommendationEngineService } from '@/services/recommendation-engine';
import { contextAggregator } from '@/services/contextAggregator';
import { authService } from '@/services/auth';
import { sendSuccess, sendPaginated, sendError } from '@/utils/response';
import { CreateRoadmapInput, SearchRoadmapInput } from '@/validators/roadmap';
import { asyncHandler } from '@/middleware/errorHandler';

export const createRoadmap = asyncHandler(async (req: Request, res: Response) => {
  const input: CreateRoadmapInput = req.body;
  const roadmap = await roadmapService.createRoadmap(input);

  return sendSuccess(res, roadmap, 201, 'Roadmap created successfully');
});

export const getRoadmap = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const roadmap = await roadmapService.getRoadmapById(id);

  return sendSuccess(res, roadmap, 200, 'Roadmap fetched successfully');
});

export const getAllRoadmaps = asyncHandler(async (req: Request, res: Response) => {
  const input: SearchRoadmapInput = {
    query: req.query.query as string | undefined,
    category: req.query.category as string | undefined,
    careerPath: req.query.careerPath as string | undefined,
    level: req.query.level as any | undefined,
    page: parseInt(req.query.page as string) || 1,
    limit: parseInt(req.query.limit as string) || 10,
  };

  const result = await roadmapService.getAllRoadmaps(input);

  return sendPaginated(res, result.roadmaps, result.page, result.limit, result.total);
});

export const getRoadmapsByCategory = asyncHandler(async (req: Request, res: Response) => {
  const { category } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  const result = await roadmapService.getRoadmapsByCategory(category, page, limit);

  return sendPaginated(res, result.roadmaps, page, limit, result.total);
});

export const searchRoadmaps = asyncHandler(async (req: Request, res: Response) => {
  const { q } = req.query;

  if (!q || typeof q !== 'string') {
    return sendError(res, 400, 'Search query is required');
  }

  const roadmaps = await roadmapService.searchRoadmaps(q);

  return sendSuccess(res, roadmaps, 200, 'Search results fetched');
});

export const updateRoadmap = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const input: Partial<CreateRoadmapInput> = req.body;

  const roadmap = await roadmapService.updateRoadmap(id, input);

  return sendSuccess(res, roadmap, 200, 'Roadmap updated successfully');
});

export const deleteRoadmap = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  await roadmapService.deleteRoadmap(id);

  return sendSuccess(res, {}, 200, 'Roadmap deleted successfully');
});

export const getCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await roadmapService.getCategories();

  return sendSuccess(res, categories, 200, 'Categories fetched successfully');
});

export const saveRoadmapProgress = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  const { roadmapId, completedTasks, completedDays, progressPercentage, currentDay } = req.body;

  const progress = await progressService.upsertRoadmapProgress(req.user.id, {
    roadmapId,
    completedTasks,
    completedDays,
    progressPercentage,
    currentDay,
  });

  void contextAggregator.invalidate(req.user.id).catch(() => undefined);
  return sendSuccess(res, progress, 200, 'Roadmap progress saved');
});

export const getRoadmapProgress = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  const roadmapId = req.query.roadmapId as string | undefined;
  const progress = await progressService.getRoadmapProgress(req.user.id, roadmapId);

  return sendSuccess(res, progress, 200, 'Roadmap progress fetched');
});

export const updateRoadmapTaskProgress = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  const { id } = req.params;
  const { roadmapId, totalTasks, dayId, completed, xpReward } = req.body;

  const result = await progressService.updateRoadmapTask(req.user.id, id, {
    roadmapId,
    totalTasks,
    dayId,
    completed,
    xpReward,
  });

  void contextAggregator.invalidate(req.user.id).catch(() => undefined);
  return sendSuccess(res, result, 200, 'Task progress updated');
});

export const skillUp = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return sendError(res, 401, 'Unauthorized');

  const { careerId } = req.params;
  if (!careerId) return sendError(res, 400, 'careerId is required');

  const explanation = await recommendationEngineService.explainCareer(req.user.id, careerId);
  if (!explanation) return sendError(res, 404, 'Career not found');

  const user = await authService.getUserById(req.user.id);

  return sendSuccess(res, { explanation, user }, 200, 'SkillUp payload fetched');
});
