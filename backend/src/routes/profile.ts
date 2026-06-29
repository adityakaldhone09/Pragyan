import { Router } from 'express';
import { authenticate } from '@/middleware/auth';
import * as profileController from '@/controllers/profile';
import * as profileBuilderController from '@/controllers/profile-builder';
import { certificationSchema, githubImportSchema, portfolioProjectSchema } from '@/validators/profile-builder';
import { profileUpdateSchema } from '@/validators/auth';
import { validate } from '@/middleware/validator';

const router = Router();

router.get('/builder', authenticate, profileBuilderController.getBuilderProfile);
router.get('/builder/coach', authenticate, profileBuilderController.generateCoach);
router.patch('/builder', authenticate, validate(profileUpdateSchema), profileBuilderController.updateCoreProfile);
router.post('/builder/projects', authenticate, validate(portfolioProjectSchema), profileBuilderController.createProject);
router.patch('/builder/projects/:projectId', authenticate, validate(portfolioProjectSchema), profileBuilderController.updateProject);
router.delete('/builder/projects/:projectId', authenticate, profileBuilderController.deleteProject);
router.post('/builder/certifications', authenticate, validate(certificationSchema), profileBuilderController.createCertification);
router.patch('/builder/certifications/:certificationId', authenticate, validate(certificationSchema), profileBuilderController.updateCertification);
router.delete('/builder/certifications/:certificationId', authenticate, profileBuilderController.deleteCertification);
router.post('/builder/github/import', authenticate, validate(githubImportSchema), profileBuilderController.importGithubRepositories);

router.get('/providers', authenticate, profileController.getProviders);
router.post('/link/:provider', authenticate, profileController.startLink);
router.delete('/unlink/:provider', authenticate, profileController.unlinkProvider);

export default router;
