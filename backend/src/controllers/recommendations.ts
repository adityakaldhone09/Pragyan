import { Request, Response } from 'express';
import { recommendationEngineService } from '@/services/recommendation-engine';
import { careerIntelligenceService } from '@/services/career-intelligence';
import { sendError, sendSuccess } from '@/utils/response';
import { asyncHandler } from '@/middleware/errorHandler';

export const generateRecommendations = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  // Generate recommendations directly - the profile is passed as request body
  // This will call the career matching engine which handles MongoDB operations
  const data = await recommendationEngineService.generateRecommendations(req.user.id, req.body);
  return sendSuccess(res, data, 200, 'AI recommendations generated successfully');
});

export const generateCareerIntelligence = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  const data = await careerIntelligenceService.generateCareerIntelligenceResponse(req.body || {}, req.user.id);
  return sendSuccess(res, data, 200, 'Career intelligence generated successfully');
});

export const getTopCareer = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  const topCareer = await recommendationEngineService.getTopCareer(req.user.id);

  if (!topCareer) {
    return sendError(res, 404, 'No recommendations found. Complete an assessment first.');
  }

  return sendSuccess(res, topCareer, 200, 'Top career recommendation fetched successfully');
});

export const getRoadmapRecommendations = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  const data = await recommendationEngineService.getRecommendedRoadmaps(req.user.id);
  return sendSuccess(res, data, 200, 'Roadmap recommendations fetched successfully');
});

export const getRoadmapSections = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  const data = await recommendationEngineService.getRoadmapDomainSections(req.user.id);
  return sendSuccess(res, data, 200, 'Roadmap sections fetched successfully');
});

export const getCareerRecommendations = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  const recommendations = await recommendationEngineService.getLegacyCareerList(req.user.id);
  return sendSuccess(res, recommendations, 200, 'Career recommendations fetched successfully');
});

export const getSkillRecommendations = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  const recommendations = await recommendationEngineService.getRecommendedSkills(req.user.id);
  return sendSuccess(res, recommendations, 200, 'Skill recommendations fetched successfully');
});

export const getJobRecommendations = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  const recommendations = await recommendationEngineService.getLegacyJobs(req.user.id);
  return sendSuccess(res, recommendations, 200, 'Job recommendations fetched successfully');
});

export const explainCareer = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  const { careerId } = req.params;
  if (!careerId) return sendError(res, 400, 'careerId is required');

  const explanation = await recommendationEngineService.explainCareer(req.user.id, careerId);
  if (!explanation) return sendError(res, 404, 'Career not found');

  return sendSuccess(res, explanation, 200, 'Career explanation generated successfully');
});
