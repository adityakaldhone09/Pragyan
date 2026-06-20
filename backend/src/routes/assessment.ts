// src/routes/assessment.ts

import { Router } from 'express';
import * as assessmentController from '@/controllers/assessment';
import { authenticate } from '@/middleware/auth';
import { authorize } from '@/middleware/auth';
import { validate } from '@/middleware/validator';
import { assessmentAnswersSchema } from '@/validators/assessment';
import { assessmentCreateSchema } from '@/validators/assessment';
import { prisma } from '@/lib/prisma';
import * as decisionController from '@/controllers/assessmentDecisionTree';
import * as hybridAssessmentController from '@/controllers/hybridAssessment';

const router = Router();

router.get('/start', assessmentController.startAssessment);
router.post('/start', assessmentController.startAssessment);
router.post('/answer', authenticate, assessmentController.answerAssessment);
router.post('/submit', authenticate, assessmentController.submitAdaptiveAssessment);
router.get('/results/:id', authenticate, assessmentController.getAdaptiveAssessmentResult);

router.get('/questions', assessmentController.getQuestions);
router.get('/questions/:category', assessmentController.getQuestionsByCategory);

router.post('/create', authenticate, authorize('ADMIN'), validate(assessmentCreateSchema), assessmentController.createAssessment);

router.post('/submit-legacy', authenticate, validate(assessmentAnswersSchema), assessmentController.submitAssessment);
router.get('/result/:resultId', authenticate, assessmentController.getAssessmentResult);
router.post('/save', authenticate, validate(assessmentAnswersSchema), assessmentController.saveAssessment);
router.get('/history', authenticate, assessmentController.getAssessmentHistory);
router.get('/latest', authenticate, assessmentController.getLatestAssessment);

// Hybrid 3-phase assessment engine imported from backend (1).zip.
router.post('/hybrid/parse-resume', hybridAssessmentController.parseResume);
router.post('/hybrid/answers', authenticate, hybridAssessmentController.saveHybridAnswers);
router.get('/hybrid/domain-questions/:domain', hybridAssessmentController.getDomainQuestions);
router.post('/hybrid/start', hybridAssessmentController.startHybridAssessment);
router.post('/hybrid/:sessionId/answer', hybridAssessmentController.submitHybridAnswer);

/**
 * GET /api/assessment/metadata
 * Get assessment coverage info - what careers/skills/interests are covered
 */
router.get('/metadata', async (_req, res) => {
  try {
    console.log('[Assessment Metadata] Fetching coverage statistics');
    
    const [careerCount, skillCount, interestCount, careers] = await Promise.all([
      prisma.career.count(),
      prisma.careerSkillMapping.count(),
      prisma.careerInterestMapping.count(),
      prisma.career.findMany({ take: 10, select: { title: true, category: true } }),
    ]);

    const categories = [...new Set(careers.flatMap((c) => c.category ? [c.category] : []))];

    console.log(`[Assessment Metadata] Retrieved ${careerCount} careers, ${skillCount} skills, ${interestCount} interests`);

    return res.json({
      success: true,
      data: {
        assessmentCoverage: {
          totalJobRoles: careerCount,
          totalSkillsInDataset: skillCount,
          totalInterestsMapped: interestCount,
          uniqueCategories: categories.length,
          categories: categories.sort(),
          questionsGenerated: 15,
          message: `Assessment is dynamically generated from ${careerCount} job roles with ${skillCount} skill mappings and ${interestCount} interest mappings`
        },
        sampleCareers: careers.slice(0, 5).map((c) => c.title),
        status: 'Dataset-driven assessment system active'
      }
    });
  } catch (error) {
    console.error('[Assessment Metadata] Error fetching metadata:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch assessment metadata'
    });
  }
});

// Admin-only: persist a generated assessment
router.post('/generate', authenticate, authorize('ADMIN'), assessmentController.generateAndCreateAssessment);

// Adaptive next-question endpoint
router.post('/next', assessmentController.getNextQuestions);

// Decision-tree assessment endpoints (configuration-driven)
router.get('/decision/start', decisionController.startDecision);
router.post('/decision/next', decisionController.answerDecision);
router.post('/decision/complete', authenticate, decisionController.finishDecision);
router.get('/decision/result/:sessionId', authenticate, decisionController.getResult);

export default router;
