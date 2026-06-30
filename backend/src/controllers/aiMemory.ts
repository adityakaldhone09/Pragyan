import { Request, Response } from 'express';
import { sendSuccess, sendError } from '@/utils/response';
import { asyncHandler } from '@/middleware/errorHandler';
import { aiMemoryService } from '@/services/aiMemory';
import { contextAggregator } from '@/services/contextAggregator';

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return sendError(res, 401, 'Unauthorized');
  const profile = await aiMemoryService.getProfile(req.user.id);
  return sendSuccess(res, profile || null, 200, 'Memory profile fetched');
});

export const saveProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return sendError(res, 401, 'Unauthorized');
  const { profileData, compositeScore, xp } = req.body || {};
  const saved = await aiMemoryService.saveProfile(req.user.id, profileData || {}, compositeScore, xp);
  void contextAggregator.invalidate(req.user.id).catch(() => undefined);
  return sendSuccess(res, saved, 200, 'Memory profile saved');
});

export const recordRecommendation = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return sendError(res, 401, 'Unauthorized');
  const { recommendation, reason, score, source } = req.body || {};
  if (!recommendation) return sendError(res, 400, 'recommendation is required');
  const rec = await aiMemoryService.recordRecommendation(req.user.id, recommendation, reason, score, source);
  void contextAggregator.invalidate(req.user.id).catch(() => undefined);
  return sendSuccess(res, rec, 201, 'Recommendation recorded');
});

export const recordRoadmapMutation = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return sendError(res, 401, 'Unauthorized');
  const { mutation, reason } = req.body || {};
  if (!mutation) return sendError(res, 400, 'mutation is required');
  const m = await aiMemoryService.recordRoadmapMutation(req.user.id, mutation, reason);
  void contextAggregator.invalidate(req.user.id).catch(() => undefined);
  return sendSuccess(res, m, 201, 'Roadmap mutation recorded');
});

export const recordFeedback = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return sendError(res, 401, 'Unauthorized');
  const { target, feedbackType, note } = req.body || {};
  if (!target || !feedbackType) return sendError(res, 400, 'target and feedbackType are required');
  const rec = await aiMemoryService.recordFeedback(req.user.id, target, feedbackType, note);
  return sendSuccess(res, rec, 201, 'Feedback recorded');
});

export const getRecommendationHistory = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return sendError(res, 401, 'Unauthorized');
  const list = await aiMemoryService.getRecommendationHistory(req.user.id);
  return sendSuccess(res, list, 200, 'Recommendation history fetched');
});

export const getPersonality = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return sendError(res, 401, 'Unauthorized');
  const p = await aiMemoryService.getPersonality(req.user.id);
  return sendSuccess(res, p || null, 200, 'Personality profile fetched');
});

export const savePersonality = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return sendError(res, 401, 'Unauthorized');
  const { profile, confidence } = req.body || {};
  if (!profile) return sendError(res, 400, 'profile is required');
  const saved = await aiMemoryService.savePersonality(req.user.id, profile, confidence);
  void contextAggregator.invalidate(req.user.id).catch(() => undefined);
  return sendSuccess(res, saved, 200, 'Personality saved');
});

export const recordLearningVelocity = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return sendError(res, 401, 'Unauthorized');
  const { windowStart, windowEnd, metrics } = req.body || {};
  if (!windowStart || !windowEnd || !metrics) return sendError(res, 400, 'windowStart, windowEnd and metrics are required');
  const rec = await aiMemoryService.recordLearningVelocity(req.user.id, new Date(windowStart), new Date(windowEnd), metrics);
  void contextAggregator.invalidate(req.user.id).catch(() => undefined);
  return sendSuccess(res, rec, 201, 'Learning velocity recorded');
});

export const getLearningVelocities = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) return sendError(res, 401, 'Unauthorized');
  const list = await aiMemoryService.getLearningVelocities(req.user.id);
  return sendSuccess(res, list, 200, 'Learning velocities fetched');
});
