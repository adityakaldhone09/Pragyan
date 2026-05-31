// Mock prisma before importing the service to avoid real DB calls
jest.mock('@/lib/prisma', () => ({
  prisma: {
    assessmentPath: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

import { AssessmentDecisionTreeService } from '@/services/assessmentDecisionTreeService';

describe('AssessmentDecisionTreeService.resolveCareerPath', () => {
  test('Government → Defence → 12th → Army', () => {
    const res = AssessmentDecisionTreeService.resolveCareerPath({ category: 'government', sector: 'defence', qualification: '12th', branch: 'army' });
    expect(res.careerPath).toBe('Defence');
    expect(res.recommendedRoles.length).toBeGreaterThan(0);
    expect(res.recommendedRoles).toContain('NDA');
    expect(res.confidence).toBeGreaterThan(0);
  });

  test('Government → Defence → 12th → Navy', () => {
    const res = AssessmentDecisionTreeService.resolveCareerPath({ category: 'government', sector: 'defence', qualification: '12th', branch: 'navy' });
    expect(res.careerPath).toBe('Defence');
    expect(res.recommendedRoles).toContain('Agniveer Navy');
  });

  test('Government → Defence → 12th → Air Force', () => {
    const res = AssessmentDecisionTreeService.resolveCareerPath({ category: 'government', sector: 'defence', qualification: '12th', branch: 'airforce' });
    expect(res.careerPath).toBe('Defence');
    expect(res.recommendedRoles).toContain('Agniveer Air Force');
  });

  test('Government → Defence → 12th → All', () => {
    const res = AssessmentDecisionTreeService.resolveCareerPath({ category: 'government', sector: 'defence', qualification: '12th', branch: 'all' });
    expect(res.careerPath).toBe('Defence');
    expect(res.recommendedRoles).toContain('NDA');
    expect(res.recommendedRoles).toContain('Coast Guard');
  });

  test('Government → Banking → Bachelor\'s', () => {
    const res = AssessmentDecisionTreeService.resolveCareerPath({ category: 'government', sector: 'banking', qualification: "bachelors" });
    expect(res.recommendedRoles).toContain('Bank PO');
  });

  test('Private → Software Development → Full Stack', () => {
    const res = AssessmentDecisionTreeService.resolveCareerPath({ category: 'private', sector: 'software_engineer', selectedRole: 'Full Stack Developer' });
    expect(res.recommendedRoles).toContain('Full Stack Developer');
  });

  test('Private → AI → AI Engineer', () => {
    const res = AssessmentDecisionTreeService.resolveCareerPath({ category: 'private', sector: 'ai_engineer', selectedRole: 'AI Engineer' });
    expect(res.recommendedRoles).toContain('AI Engineer');
  });

  test('Higher Studies → MBA', () => {
    const res = AssessmentDecisionTreeService.resolveCareerPath({ category: 'higher_studies', qualification: 'mba' });
    expect(res.recommendedRoles).toContain('MBA');
  });
});

describe('AssessmentDecisionTreeService.finishAssessment (mocked prisma)', () => {
  const mockAp: any = {
    id: '000000000000000000000000',
    userId: 'user1',
    selectedCategory: 'government',
    selectedSector: 'defence',
    selectedQualification: '12th',
    selectedBranch: 'army',
  };

  beforeAll(() => {
    const { prisma } = require('@/lib/prisma');
    prisma.assessmentPath.findUnique.mockResolvedValue(mockAp);
    prisma.assessmentPath.update.mockResolvedValue({ ...mockAp, finalCareerPath: 'Defence', confidence: 95 });
  });

  afterAll(() => {
    jest.resetModules();
  });

  test('finishAssessment persists finalCareerPath and returns result structure', async () => {
    const result = await AssessmentDecisionTreeService.finishAssessment('000000000000000000000000');
    expect(result.careerPath).toBe('Defence');
    expect(Array.isArray(result.recommendedRoles)).toBe(true);
    expect(result.confidence).toBe(95);
    expect(result).toHaveProperty('eligibleOpportunities');
    expect(result).toHaveProperty('roadmapTemplate');
  });
});
