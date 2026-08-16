/**
 * Unified Assessment Routes (Phases 1-7)
 * This router handles all assessment phase endpoints
 */

import { Router, Request, Response } from 'express';
import { authenticate } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';
import { sendSuccess, sendError } from '@/utils/response';
import { prisma } from '@/lib/prisma';
import { phase4TechnicalAssessmentService } from '@/services/phase4TechnicalAssessment';
import { phase5SpecializationDetectionService } from '@/services/phase5SpecializationDetection';
import { phase6ConfidenceValidationService } from '@/services/phase6ConfidenceValidation';
import { phase7FinalReportService } from '@/services/phase7FinalReport';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * PHASE 1: User Discovery & Profile Collection
 */

// Save Phase 1 data
router.post(
  '/phase-1',
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) return sendError(res, 401, 'Unauthorized');

    const { phase1Schema } = await import('@/validators/assessment');
    const parsed = phase1Schema.safeParse(req.body);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      return sendError(res, 400, firstError?.message ?? 'Validation failed');
    }

    const { personalInfo: pi, education: edu, careerGoal, experience: exp } = parsed.data;
    const userId = req.user.id;
    const now = new Date();

    const userProfileUpdate = {
      firstName: pi.firstName,
      lastName: pi.lastName,
      fullName: `${pi.firstName} ${pi.lastName}`.trim(),
      age: pi.age,
      gender: pi.gender,
      country: pi.country,
      state: pi.state,
      city: pi.city,
      location: `${pi.city}, ${pi.state}, ${pi.country}`.trim(),
      currentStatus: edu.currentStatus,
      education: edu.highestQualification,
      currentCourse: edu.degree ?? edu.highestQualification,
      collegeName: edu.collegeName,
      university: edu.university,
      degree: edu.degree,
      branch: edu.branch,
      currentYear: edu.currentYear,
      expectedGraduationYear: edu.expectedGraduationYear ?? undefined,
      cgpa: edu.cgpaOrPercentage,
      careerGoal,
      careerTrack: careerGoal,
      programmingExperience: exp.programmingExperience,
      skillLevel: exp.programmingExperience,
      previouslyWorked: exp.previouslyWorked,
      experienceType: exp.previouslyWorked ? 'experienced' : 'fresher',
      experience: exp.previouslyWorked ? `${exp.yearsOfExperience ?? 0} years` : 'fresher',
      yearsOfExperience: exp.yearsOfExperience ?? undefined,
      currentCompany: exp.currentCompany,
      currentRole: exp.currentRole,
    } as any;

    // Check for existing phase 1 session
    const existingSession = await prisma.assessmentSession.findFirst({
      where: { userId, phase: 1 },
      orderBy: { completedAt: 'desc' },
    });

    const phasePayload = {
      answers: JSON.stringify({ phase: 1, ...parsed.data }),
      selectedOptions: [],
      analysis: JSON.stringify({
        phase: 1,
        completionPercent: 100,
        personalInfo: pi,
        education: edu,
        careerGoal,
        experience: exp,
        savedAt: now.toISOString(),
      }),
      completedAt: now,
    };

    const [, session] = await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: userProfileUpdate,
      }),
      existingSession
        ? prisma.assessmentSession.update({
            where: { id: existingSession.id },
            data: phasePayload,
          })
        : prisma.assessmentSession.create({
            data: {
              userId,
              phase: 1,
              ...phasePayload,
            },
          }),
    ]);

    // Invalidate context cache
    try {
      const { contextAggregator } = await import('@/services/contextAggregator');
      await contextAggregator.invalidate(userId).catch(() => undefined);
    } catch (e) {
      // ignore
    }

    return sendSuccess(
      res,
      {
        sessionId: session.id,
        phase: 1,
        completionPercent: 100,
        nextPhase: 2,
        redirectTo: '/assessment/phase-2',
      },
      201,
      'Phase 1 saved successfully'
    );
  })
);

// Get Phase 1 data
router.get(
  '/phase-1',
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) return sendError(res, 401, 'Unauthorized');

    const session = await prisma.assessmentSession.findFirst({
      where: { userId: req.user.id, phase: 1 },
      orderBy: { completedAt: 'desc' },
    });

    if (!session) {
      return sendSuccess(res, null, 200, 'No phase 1 data found');
    }

    let analysis: Record<string, unknown> = {};
    try {
      analysis = JSON.parse(session.analysis);
    } catch {
      /* ignore */
    }

    return sendSuccess(
      res,
      {
        sessionId: session.id,
        phase: 1,
        completionPercent: 100,
        personalInfo: (analysis as any).personalInfo ?? null,
        education: (analysis as any).education ?? null,
        careerGoal: (analysis as any).careerGoal ?? null,
        experience: (analysis as any).experience ?? null,
        savedAt: (analysis as any).savedAt ?? session.completedAt,
      },
      200,
      'Phase 1 data retrieved'
    );
  })
);

/**
 * PHASE 2: Interest & Domain Discovery
 */

router.post(
  '/phase-2',
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) return sendError(res, 401, 'Unauthorized');

    const { phase2Schema } = await import('@/validators/assessment');
    const parsed = phase2Schema.safeParse(req.body);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      return sendError(res, 400, firstError?.message ?? 'Validation failed');
    }

    const userId = req.user.id;
    const now = new Date();
    const data = parsed.data;

    const phasePayload = {
      answers: JSON.stringify({ phase: 2, ...data }),
      selectedOptions: data.preferredDomains,
      analysis: JSON.stringify({
        phase: 2,
        completionPercent: 100,
        careerObjective: data.careerObjective,
        preferredDomains: data.preferredDomains,
        skillConfidence: data.skillConfidence,
        favoriteSubjects: data.favoriteSubjects,
        workStyle: data.workStyle,
        learningStyle: data.learningStyle,
        motivation: data.motivation,
        savedAt: now.toISOString(),
      }),
      completedAt: now,
    };

    const userProfileUpdate = {
      careerGoal: data.careerObjective,
      careerTrack: data.careerObjective,
      interests: data.preferredDomains,
      preferences: [...data.workStyle, ...data.learningStyle],
    } as any;

    const existingSession = await prisma.assessmentSession.findFirst({
      where: { userId, phase: 2 },
      orderBy: { completedAt: 'desc' },
    });

    const [, session] = await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: userProfileUpdate,
      }),
      existingSession
        ? prisma.assessmentSession.update({
            where: { id: existingSession.id },
            data: phasePayload,
          })
        : prisma.assessmentSession.create({
            data: {
              userId,
              phase: 2,
              ...phasePayload,
            },
          }),
    ]);

    try {
      const { contextAggregator } = await import('@/services/contextAggregator');
      await contextAggregator.invalidate(userId).catch(() => undefined);
    } catch (e) {
      // ignore
    }

    return sendSuccess(
      res,
      {
        sessionId: session.id,
        phase: 2,
        completionPercent: 100,
        nextPhase: 3,
        redirectTo: '/assessment/phase-3',
      },
      201,
      'Phase 2 saved successfully'
    );
  })
);

// Get Phase 2 data
router.get(
  '/phase-2',
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) return sendError(res, 401, 'Unauthorized');

    const session = await prisma.assessmentSession.findFirst({
      where: { userId: req.user.id, phase: 2 },
      orderBy: { completedAt: 'desc' },
    });

    if (!session) {
      return sendSuccess(res, null, 200, 'No phase 2 data found');
    }

    let analysis: Record<string, unknown> = {};
    try {
      analysis = JSON.parse(session.analysis);
    } catch {
      /* ignore */
    }

    return sendSuccess(
      res,
      {
        sessionId: session.id,
        phase: 2,
        completionPercent: 100,
        careerObjective: (analysis as any).careerObjective ?? null,
        preferredDomains: (analysis as any).preferredDomains ?? [],
        skillConfidence: (analysis as any).skillConfidence ?? null,
        favoriteSubjects: (analysis as any).favoriteSubjects ?? [],
        workStyle: (analysis as any).workStyle ?? [],
        learningStyle: (analysis as any).learningStyle ?? [],
        motivation: (analysis as any).motivation ?? null,
        savedAt: (analysis as any).savedAt ?? session.completedAt,
      },
      200,
      'Phase 2 data retrieved'
    );
  })
);

/**
 * PHASE 3: Hybrid Adaptive Assessment
 */

router.post(
  '/phase-3',
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) return sendError(res, 401, 'Unauthorized');

    const userId = req.user.id;
    const { adaptiveAssessmentService } = await import('@/services/adaptive-assessment');

    const started = await adaptiveAssessmentService.startAssessment(userId);

    return sendSuccess(
      res,
      {
        sessionId: started.sessionId,
        question: started.question,
        confidence: started.confidence,
        progress: started.progress,
        phase: 3,
        nextPhase: 4,
        nextPhaseRoute: '/assessment/phase-4',
        assessmentCompleted: false,
      },
      201,
      'Phase 3 started'
    );
  })
);

// Answer Phase 3
router.post(
  '/phase-3/answer',
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) return sendError(res, 401, 'Unauthorized');

    const { sessionId, questionId, answer } = req.body;
    if (!sessionId || !questionId || !answer) {
      return sendError(res, 400, 'sessionId, questionId, and answer are required');
    }

    const { adaptiveAssessmentService } = await import('@/services/adaptive-assessment');
    const result = await adaptiveAssessmentService.answerQuestion({
      sessionId,
      questionId,
      answer,
      userId: req.user.id,
    });

    return sendSuccess(res, result, 200, 'Answer recorded');
  })
);

// Submit Phase 3
router.post(
  '/phase-3/submit',
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) return sendError(res, 401, 'Unauthorized');

    const { sessionId } = req.body;
    if (!sessionId) {
      return sendError(res, 400, 'sessionId is required');
    }

    const { adaptiveAssessmentService } = await import('@/services/adaptive-assessment');
    const result = await adaptiveAssessmentService.submitAssessment({
      sessionId,
      userId: req.user.id,
    });

    return sendSuccess(
      res,
      {
        ...result,
        nextPhase: 4,
        nextPhaseRoute: '/assessment/phase-4',
        assessmentCompleted: false,
      },
      200,
      'Phase 3 assessment completed'
    );
  })
);

/**
 * PHASE 4: Technical Assessment
 */

router.post(
  '/phase-4',
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) return sendError(res, 401, 'Unauthorized');

    const userId = req.user.id;

    // Load Phase 2 for domains
    const phase2Session = await prisma.assessmentSession.findFirst({
      where: { userId, phase: 2 },
      orderBy: { completedAt: 'desc' },
    });

    if (!phase2Session) {
      return sendError(res, 400, 'Phase 2 must be completed before starting Phase 4');
    }

    let phase2Analysis: any = {};
    try {
      phase2Analysis = JSON.parse(phase2Session.analysis);
    } catch {
      /* ignore */
    }

    const domains: string[] = phase2Analysis.preferredDomains || ['Full Stack Development', 'Software Development'];

    // Load Phase 3 profile
    const phase3Session = await prisma.assessmentSession.findFirst({
      where: { userId, phase: 3 },
      orderBy: { completedAt: 'desc' },
    });

    let cognitiveProfile: Record<string, any> = {};
    if (phase3Session) {
      try {
        const phase3Analysis = JSON.parse(phase3Session.analysis);
        cognitiveProfile = {
          confidence: phase3Analysis.confidence || 0,
          traits: phase3Analysis.traits || {},
        };
      } catch {
        /* ignore */
      }
    }

    // Load Phase 1 profile
    const phase1Session = await prisma.assessmentSession.findFirst({
      where: { userId, phase: 1 },
      orderBy: { completedAt: 'desc' },
    });

    let profileContext: Record<string, any> = {};
    if (phase1Session) {
      try {
        const phase1Analysis = JSON.parse(phase1Session.analysis);
        profileContext = {
          education: phase1Analysis.education?.highestQualification || 'Not specified',
          experienceLevel: phase1Analysis.experience?.programmingExperience || 'Beginner',
          careerGoal: phase1Analysis.careerGoal || 'Explore Career Options',
        };
      } catch {
        /* ignore */
      }
    }

    const started = await phase4TechnicalAssessmentService.startAssessment({
      userId,
      domains,
      cognitiveProfile,
      profileContext,
    });

    return sendSuccess(
      res,
      {
        ...started,
        nextPhase: 5,
        nextPhaseRoute: '/assessment/phase-5',
        assessmentCompleted: false,
      },
      201,
      'Phase 4 started'
    );
  })
);

// Answer Phase 4
router.post(
  '/phase-4/answer',
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) return sendError(res, 401, 'Unauthorized');

    const { sessionId, questionId, answer } = req.body;
    if (!sessionId || !questionId || !answer) {
      return sendError(res, 400, 'sessionId, questionId, and answer are required');
    }

    const result = await phase4TechnicalAssessmentService.answerQuestion({
      sessionId,
      questionId,
      answer,
    });

    return sendSuccess(res, result, 200, 'Answer recorded');
  })
);

// Submit Phase 4
router.post(
  '/phase-4/submit',
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) return sendError(res, 401, 'Unauthorized');

    const { sessionId } = req.body;
    if (!sessionId) {
      return sendError(res, 400, 'sessionId is required');
    }

    const result = await phase4TechnicalAssessmentService.submitAssessment({
      sessionId,
      userId: req.user.id,
    });

    return sendSuccess(
      res,
      {
        ...result,
        nextPhase: 5,
        nextPhaseRoute: '/assessment/phase-5',
        assessmentCompleted: false,
      },
      200,
      'Phase 4 assessment completed'
    );
  })
);

/**
 * PHASE 5: Specialization Detection
 */

router.post(
  '/phase-5',
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) return sendError(res, 401, 'Unauthorized');

    const userId = req.user.id;

    // Load all prior phases
    const [phase1Session, phase2Session, phase3Session, phase4Session] = await Promise.all([
      prisma.assessmentSession.findFirst({
        where: { userId, phase: 1 },
        orderBy: { completedAt: 'desc' },
      }),
      prisma.assessmentSession.findFirst({
        where: { userId, phase: 2 },
        orderBy: { completedAt: 'desc' },
      }),
      prisma.assessmentSession.findFirst({
        where: { userId, phase: 3 },
        orderBy: { completedAt: 'desc' },
      }),
      prisma.assessmentSession.findFirst({
        where: { userId, phase: 4 },
        orderBy: { completedAt: 'desc' },
      }),
    ]);

    if (!phase1Session || !phase2Session) {
      return sendError(res, 400, 'Phase 1 and 2 must be completed before starting Phase 5');
    }

    let profileContext: any = {};
    try {
      const phase1Analysis = JSON.parse(phase1Session.analysis);
      profileContext = {
        education: phase1Analysis.education?.highestQualification || 'Not specified',
        experienceLevel: phase1Analysis.experience?.programmingExperience || 'Beginner',
        careerGoal: phase1Analysis.careerGoal || 'Explore Career Options',
      };
    } catch {
      /* ignore */
    }

    let phase2Domains: string[] = [];
    try {
      const phase2Analysis = JSON.parse(phase2Session.analysis);
      phase2Domains = phase2Analysis.preferredDomains || [];
    } catch {
      /* ignore */
    }

    let phase3CognitiveProfile: Record<string, any> = {};
    if (phase3Session) {
      try {
        const phase3Analysis = JSON.parse(phase3Session.analysis);
        phase3CognitiveProfile = {
          confidence: phase3Analysis.confidence || 0,
          traits: phase3Analysis.traits || {},
        };
      } catch {
        /* ignore */
      }
    }

    let phase4TechnicalProfile: Record<string, any> = {};
    if (phase4Session) {
      try {
        const phase4Analysis = JSON.parse(phase4Session.analysis);
        phase4TechnicalProfile = {
          technicalConfidence: phase4Analysis.technicalConfidence || 0,
          domainScores: phase4Analysis.domainScores || {},
          strengths: phase4Analysis.strengths || [],
          weaknesses: phase4Analysis.weaknesses || [],
          knowledgeGaps: phase4Analysis.knowledgeGaps || [],
        };
      } catch {
        /* ignore */
      }
    }

    const started = await phase5SpecializationDetectionService.startAssessment({
      userId,
      profileContext,
      phase2Domains,
      phase3CognitiveProfile,
      phase4TechnicalProfile,
    });

    return sendSuccess(
      res,
      {
        ...started,
      },
      201,
      'Phase 5 started'
    );
  })
);

// Answer Phase 5
router.post(
  '/phase-5/answer',
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) return sendError(res, 401, 'Unauthorized');

    const { sessionId, questionId, answer } = req.body;
    if (!sessionId || !questionId || !answer) {
      return sendError(res, 400, 'sessionId, questionId, and answer are required');
    }

    const result = await phase5SpecializationDetectionService.answerQuestion({
      sessionId,
      questionId,
      answer,
    });

    return sendSuccess(res, result, 200, 'Answer recorded');
  })
);

// Submit Phase 5
router.post(
  '/phase-5/submit',
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) return sendError(res, 401, 'Unauthorized');

    const { sessionId } = req.body;
    if (!sessionId) {
      return sendError(res, 400, 'sessionId is required');
    }

    const result = await phase5SpecializationDetectionService.submitAssessment({
      sessionId,
      userId: req.user.id,
    });

    return sendSuccess(
      res,
      {
        ...result,
        nextPhase: 6,
        nextPhaseRoute: '/assessment/phase-6',
        assessmentCompleted: false,
      },
      200,
      'Phase 5 assessment completed'
    );
  })
);

/**
 * PHASE 6: Confidence Validation
 */

router.post(
  '/phase-6',
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) return sendError(res, 401, 'Unauthorized');

    const userId = req.user.id;

    // Verify Phase 1-2 are done
    const [phase1, phase2] = await Promise.all([
      prisma.assessmentSession.findFirst({
        where: { userId, phase: 1 },
        orderBy: { completedAt: 'desc' },
      }),
      prisma.assessmentSession.findFirst({
        where: { userId, phase: 2 },
        orderBy: { completedAt: 'desc' },
      }),
    ]);

    if (!phase1 || !phase2) {
      return sendError(res, 400, 'Phase 1 and 2 must be completed before Phase 6');
    }

    const validation = await phase6ConfidenceValidationService.startValidation({ userId });

    return sendSuccess(res, validation, 201, 'Phase 6 validation started');
  })
);

// Answer Phase 6
router.post(
  '/phase-6/answer',
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) return sendError(res, 401, 'Unauthorized');

    const { sessionId, questionId, answer } = req.body;
    if (!sessionId || !questionId || !answer) {
      return sendError(res, 400, 'sessionId, questionId, and answer are required');
    }

    const result = await phase6ConfidenceValidationService.answerFollowUpQuestion({
      sessionId,
      questionId,
      answer,
    });

    return sendSuccess(res, result, 200, 'Follow-up answer recorded');
  })
);

// Validate Phase 6
router.post(
  '/phase-6/validate',
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) return sendError(res, 401, 'Unauthorized');

    const { sessionId } = req.body;
    if (!sessionId) {
      return sendError(res, 400, 'sessionId is required');
    }

    const result = await phase6ConfidenceValidationService.completeValidation({
      sessionId,
      userId: req.user.id,
    });

    return sendSuccess(
      res,
      {
        ...result,
        nextPhase: 7,
        nextPhaseRoute: '/assessment/phase-7',
        assessmentCompleted: false,
      },
      200,
      'Phase 6 validation completed'
    );
  })
);

/**
 * PHASE 7: Final Report Generation
 */

router.post(
  '/phase-7',
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) return sendError(res, 401, 'Unauthorized');

    const userId = req.user.id;

    // Verify Phase 1-2 minimum
    const [phase1, phase2] = await Promise.all([
      prisma.assessmentSession.findFirst({
        where: { userId, phase: 1 },
        orderBy: { completedAt: 'desc' },
      }),
      prisma.assessmentSession.findFirst({
        where: { userId, phase: 2 },
        orderBy: { completedAt: 'desc' },
      }),
    ]);

    if (!phase1 || !phase2) {
      return sendError(res, 400, 'Phase 1 and 2 must be completed before Phase 7');
    }

    const report = await phase7FinalReportService.generateFinalReport({ userId });

    return sendSuccess(res, report, 201, 'Final career report generated successfully');
  })
);

// Get Phase 7 Report
router.get(
  '/phase-7',
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) return sendError(res, 401, 'Unauthorized');

    const report = await phase7FinalReportService.getReport(req.user.id);

    if (!report) {
      return sendError(res, 404, 'No assessment report found. Please complete Phase 7 first.');
    }

    return sendSuccess(res, report, 200, 'Assessment report retrieved successfully');
  })
);

export default router;
