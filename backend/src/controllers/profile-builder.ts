import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';
import { profileBuilderService } from '@/services/profile-builder';
import { sendError, sendSuccess } from '@/utils/response';
import { authService } from '@/services/auth';
import { safeParseAIResponse } from '@/ai/safeParser';
import { profileCoachSchema, type ProfileCoachResult } from '@/validators/profile-builder-ai';
import type { CertificationInput, GithubImportInput, PortfolioProjectInput } from '@/validators/profile-builder';
import { routeAI } from '@/ai/aiRouter';
import { buildResumeAnalysisPrompt } from '@/ai/promptBuilder';

function requireUser(req: Request, res: Response) {
  if (!req.user) {
    sendError(res, 401, 'Unauthorized');
    return null;
  }
  return req.user.id;
}

function deterministicCoach(profile: Awaited<ReturnType<typeof profileBuilderService.getProfile>>) : ProfileCoachResult {
  const strengths = [
    profile.user.fullName ? 'Identity is complete' : null,
    profile.user.skills?.length ? 'Skills are documented' : null,
    profile.projects.length ? 'Portfolio work is present' : null,
    profile.certifications.length ? 'Credentials are listed' : null,
    profile.githubRepositories.length ? 'GitHub is connected' : null,
  ].filter(Boolean) as string[];

  const missingFields = [
    !profile.user.location ? 'Location' : null,
    !profile.user.phone ? 'Phone number' : null,
    !profile.user.education ? 'Education details' : null,
    !profile.user.currentTitle ? 'Current title' : null,
    !profile.user.careerTrack ? 'Career track' : null,
  ].filter(Boolean) as string[];

  return {
    summary: 'Your profile is ready for deeper matching, but a clearer career story and more proof of work will improve recommendations.',
    completionScore: profile.completion.score,
    strengths,
    missingFields,
    nextSteps: [
      'Add one strong headline that matches your target role.',
      'Import one more GitHub repository or add a featured project.',
      'Fill the missing identity and education fields.',
    ],
    suggestedHeadline: profile.user.currentTitle || 'Career builder focused on practical project proof',
    suggestedCareerTrack: profile.user.careerTrack || 'Software, data, or product career paths',
  };
}

export const getBuilderProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;

  const data = await profileBuilderService.getProfile(userId);
  return sendSuccess(res, data, 200, 'Profile builder data fetched successfully');
});

export const updateCoreProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;

  const updated = await authService.updateUserProfile(userId, req.body);
  return sendSuccess(res, updated, 200, 'Profile updated successfully');
});

export const createProject = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;

  const project = await profileBuilderService.saveProject(userId, req.body as PortfolioProjectInput);
  return sendSuccess(res, project, 201, 'Project created successfully');
});

export const updateProject = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;

  const project = await profileBuilderService.saveProject(userId, req.body as PortfolioProjectInput, req.params.projectId);
  return sendSuccess(res, project, 200, 'Project updated successfully');
});

export const deleteProject = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;

  const result = await profileBuilderService.deleteProject(userId, req.params.projectId);
  return sendSuccess(res, result, 200, 'Project deleted successfully');
});

export const createCertification = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;

  const certification = await profileBuilderService.saveCertification(userId, req.body as CertificationInput);
  return sendSuccess(res, certification, 201, 'Certification created successfully');
});

export const updateCertification = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;

  const certification = await profileBuilderService.saveCertification(userId, req.body as CertificationInput, req.params.certificationId);
  return sendSuccess(res, certification, 200, 'Certification updated successfully');
});

export const deleteCertification = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;

  const result = await profileBuilderService.deleteCertification(userId, req.params.certificationId);
  return sendSuccess(res, result, 200, 'Certification deleted successfully');
});

export const importGithubRepositories = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;

  const imported = await profileBuilderService.importGithubRepositories(userId, req.body as GithubImportInput);
  return sendSuccess(res, { imported }, 201, 'GitHub repositories imported successfully');
});

export const generateCoach = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;

  const profile = await profileBuilderService.getProfile(userId);

  try {
    const result = await routeAI('resume_analysis', {
      prompt: buildResumeAnalysisPrompt({
        profile: {
          skills: profile.user.skills || [],
          interests: profile.user.interests || [],
          education: profile.user.education || '',
          careerGoal: profile.user.careerTrack || profile.user.currentTitle || '',
          experience: profile.user.experience || profile.user.experienceType || '',
          personality: profile.user.preferences || [],
        },
        targetRole: profile.user.currentTitle || profile.user.careerTrack || 'Career builder',
        notes: [
          `completionScore:${profile.completion.score}`,
          `projects:${profile.projects.length}`,
          `certifications:${profile.certifications.length}`,
          `githubRepositories:${profile.githubRepositories.length}`,
          `missingFields:${profile.completion.missing.join(', ')}`,
        ],
      }),
      format: 'json',
    });
    const parsed = safeParseAIResponse(JSON.parse(result.value), profileCoachSchema);
    return sendSuccess(res, parsed, 200, 'Profile coach generated successfully');
  } catch (error) {
    const fallback = deterministicCoach(profile);
    return sendSuccess(res, fallback, 200, 'Profile coach generated successfully');
  }
});
