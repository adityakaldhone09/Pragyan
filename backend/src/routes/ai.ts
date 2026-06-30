// src/routes/ai.ts

import { Router } from 'express';
import * as aiController from '@/controllers/ai-recommendation';
import * as aiDecisionController from '@/controllers/aiDecision';
import * as aiMemoryController from '@/controllers/aiMemory';
import { authenticate } from '@/middleware/auth';
import { validate } from '@/middleware/validator';
import {
  aiChatSchema,
  assessmentReportSchema,
  dailyPlanSchema,
  learningRoadmapGenerationSchema,
  personalizedRoadmapSchema,
} from '@/validators/ai';

const router = Router();

router.get('/recommend-careers', authenticate, aiController.getRecommendations);
router.get('/roadmaps/:career', aiController.getRecommendedRoadmaps);
router.post('/personalized-roadmap', authenticate, validate(personalizedRoadmapSchema), aiController.getPersonalizedRoadmap);
router.get('/status', aiController.getStatus);
router.get('/telemetry', aiController.getTelemetry);
router.post('/chat', authenticate, validate(aiChatSchema), aiController.chatAssistant);
router.post('/action-event', authenticate, aiController.recordAIActionEvent);
router.post('/daily-plan', authenticate, validate(dailyPlanSchema), aiController.generateDailyPlan);
router.post('/report', authenticate, validate(assessmentReportSchema), aiController.generateAssessmentReport);
router.post('/roadmap', authenticate, validate(learningRoadmapGenerationSchema), aiController.generateLearningRoadmap);

// Adaptive decision engine
router.get('/decision/evaluate', authenticate, aiDecisionController.evaluate);

// Decision snapshots (longitudinal persistence)
import * as decisionSnapshotController from '@/controllers/decisionSnapshot';
router.post('/decision/snapshot', authenticate, decisionSnapshotController.createSnapshot);
router.get('/decision/snapshots', authenticate, decisionSnapshotController.getSnapshots);

// AI Memory & Personalization endpoints
router.get('/memory', authenticate, aiMemoryController.getProfile);
router.post('/memory', authenticate, aiMemoryController.saveProfile);
router.post('/memory/recommendation', authenticate, aiMemoryController.recordRecommendation);
router.post('/roadmap/mutate', authenticate, aiMemoryController.recordRoadmapMutation);
router.get('/personality', authenticate, aiMemoryController.getPersonality);
router.post('/personality', authenticate, aiMemoryController.savePersonality);
router.post('/learning-velocity', authenticate, aiMemoryController.recordLearningVelocity);
router.get('/learning-velocity', authenticate, aiMemoryController.getLearningVelocities);
router.post('/memory/feedback', authenticate, aiMemoryController.recordFeedback);
router.get('/memory/recommendations', authenticate, aiMemoryController.getRecommendationHistory);

router.post(
  '/recommend-career',
  aiController.getPythonCareerRecommendation
);
router.post(
  '/llm-career-recommendation',
  aiController.getLLMCareerRecommendation
);

export default router;
