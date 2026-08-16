import { Router } from 'express';
import { authenticate } from '@/middleware/auth';
// import { authorize } from '@/middleware/auth'; // Temporarily disabled
import * as adminController from '@/controllers/admin';
import * as careerRoadmapController from '@/modules/career-roadmap/career-roadmap.controller';
import { validate } from '@/middleware/validator';
import {
	createCareerSchema,
	createDaySchema,
	createModuleSchema,
	createResourceSchema,
	createTopicSchema,
	createWeekSchema,
	reorderItemsSchema,
	searchTopicsSchema,
	updateCareerSchema,
	updateDaySchema,
	updateModuleSchema,
	updateResourceSchema,
	updateTopicSchema,
	updateWeekSchema,
} from '@/modules/career-roadmap/career-roadmap.validators';

const router = Router();

// TEMPORARY: Allow any authenticated user (remove in production!)
router.use(authenticate);
// router.use(authenticate, authorize('ADMIN')); // Restore this in production

router.get('/dashboard', adminController.getAdminDashboard);
router.get('/users', adminController.getUsers);
router.get('/current-users', adminController.getCurrentUsers);
router.patch('/users/:id/role', adminController.updateUserRole);
router.post('/users/:id/verify-email', adminController.verifyUserEmail);
router.post('/users/:id/block', adminController.blockUser);
router.post('/users/:id/unblock', adminController.unblockUser);
router.get('/organizations', adminController.getOrganizations);
router.patch('/organizations/:id', adminController.updateOrganizationStatus);
router.delete('/organizations/:id', adminController.deleteOrganization);
router.get('/roadmaps', adminController.getRoadmapStats);
router.get('/resources', adminController.getResources);
router.post('/resources', adminController.createResource);
router.put('/resources/:id', adminController.updateResource);
router.delete('/resources/:id', adminController.deleteResource);
router.get('/assessments', adminController.getAssessmentAnalytics);
router.get('/assessments/completion-rates', adminController.getAssessmentCompletionRates);

router.post('/assessment-questions', adminController.createAssessmentQuestion);
router.get('/adaptive/decision-tree', adminController.getDecisionTree);
router.put('/adaptive/decision-tree', adminController.upsertDecisionTree);
router.get('/adaptive/weights', adminController.getWeights);
router.put('/adaptive/weights', adminController.upsertWeights);

router.get('/careers', careerRoadmapController.getAdminCareers);
router.post('/career', validate(createCareerSchema), careerRoadmapController.createCareer);
router.put('/career/:id', validate(updateCareerSchema), careerRoadmapController.updateCareer);
router.delete('/career/:id', careerRoadmapController.deleteCareer);
router.patch('/career/:id/publish', careerRoadmapController.publishCareer);
router.put('/publish/:careerId', careerRoadmapController.publishCareer);
router.post('/module', validate(createModuleSchema), careerRoadmapController.createModule);
router.put('/module/:id', validate(updateModuleSchema), careerRoadmapController.updateModule);
router.delete('/module/:id', careerRoadmapController.deleteModule);
router.put('/modules/reorder', validate(reorderItemsSchema), careerRoadmapController.reorderModules);
router.post('/week', validate(createWeekSchema), careerRoadmapController.createWeek);
router.put('/week/:id', validate(updateWeekSchema), careerRoadmapController.updateWeek);
router.delete('/week/:id', careerRoadmapController.deleteWeek);
router.put('/weeks/reorder', validate(reorderItemsSchema), careerRoadmapController.reorderWeeks);
router.post('/day', validate(createDaySchema), careerRoadmapController.createDay);
router.put('/day/:id', validate(updateDaySchema), careerRoadmapController.updateDay);
router.delete('/day/:id', careerRoadmapController.deleteDay);
router.put('/days/reorder', validate(reorderItemsSchema), careerRoadmapController.reorderDays);
router.post('/topic', validate(createTopicSchema), careerRoadmapController.createTopic);
router.put('/topic/:id', validate(updateTopicSchema), careerRoadmapController.updateTopic);
router.delete('/topic/:id', careerRoadmapController.deleteTopic);
router.put('/topics/reorder', validate(reorderItemsSchema), careerRoadmapController.reorderTopics);
router.get('/topics', validate(searchTopicsSchema, 'query'), careerRoadmapController.searchTopics);
router.get('/career-resources', careerRoadmapController.getResources);
router.post('/resource', validate(createResourceSchema), careerRoadmapController.addResource);
router.put('/resource/reorder', careerRoadmapController.reorderResources);
router.put('/resource/:id', validate(updateResourceSchema), careerRoadmapController.updateResource);
router.delete('/resource/:id', careerRoadmapController.deleteResource);
router.post('/resources/fix-titles', careerRoadmapController.fixResourceTitles);
router.get('/security/metrics', adminController.getSecurityMetrics);

export default router;
