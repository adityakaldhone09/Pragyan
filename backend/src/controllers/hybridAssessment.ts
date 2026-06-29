import type { NextFunction, Request, Response } from 'express';
import * as hybridAssessmentService from '@/services/hybridAssessment/hybridAssessmentService';
import { saveUserAnswers } from '@/services/hybridAssessment/userAnswerService';
import type { DomainAnswer, HybridUserProfile, UserAssessmentAnswerInput } from '@/types/hybridAssessment';

export async function parseResume(req: Request, res: Response, next: NextFunction) {
  try {
    const { resumeText } = req.body as { resumeText?: string };
    if (!resumeText) return res.status(400).json({ success: false, error: 'resumeText is required' });

    const data = await hybridAssessmentService.handleResumeUpload(resumeText);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
}

export async function getDomainQuestions(req: Request, res: Response, next: NextFunction) {
  try {
    const questions = hybridAssessmentService.getPhase2Questions(req.params.domain);
    return res.status(200).json({ success: true, data: { questions } });
  } catch (error) {
    return next(error);
  }
}

export async function saveHybridAnswers(req: Request, res: Response, next: NextFunction) {
  try {
    const { answers } = req.body as { answers?: UserAssessmentAnswerInput[] };
    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ success: false, error: 'answers array is required' });
    }

    const effectiveUserId = req.user?.id || answers[0]?.userId;
    if (!effectiveUserId) {
      return res.status(400).json({ success: false, error: 'userId is required' });
    }

    const normalizedAnswers = answers.map((answer) => ({ ...answer, userId: effectiveUserId }));
    for (const answer of normalizedAnswers) {
      if (!answer.questionText || !answer.questionType || !Array.isArray(answer.selectedAnswer)) {
        return res.status(400).json({
          success: false,
          error: 'Each answer requires questionText, questionType, and selectedAnswer',
        });
      }
    }

    const data = await saveUserAnswers(normalizedAnswers);
    return res.status(201).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
}

export async function startHybridAssessment(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, profile, domainAnswers } = req.body as {
      userId?: string;
      profile?: HybridUserProfile;
      domainAnswers?: DomainAnswer[];
    };
    const effectiveUserId = req.user?.id || userId;

    if (!effectiveUserId || !profile) {
      return res.status(400).json({ success: false, error: 'userId and profile are required' });
    }

    const skillBaselines = hybridAssessmentService.buildSkillBaselines(domainAnswers || []);
    const result = await hybridAssessmentService.startAssessmentSession(effectiveUserId, profile, skillBaselines);
    return res.status(201).json({ success: true, data: result });
  } catch (error) {
    return next(error);
  }
}

export async function submitHybridAnswer(req: Request, res: Response, next: NextFunction) {
  try {
    const { sessionId } = req.params;
    const { answer } = req.body as { answer?: string };
    if (!answer) return res.status(400).json({ success: false, error: 'answer is required' });

    const data = await hybridAssessmentService.submitAssessmentAnswer(sessionId, answer);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
}
