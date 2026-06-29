import { calculatePlacementReadiness, getCareerByRole, getCareerBySlug, getCareersByCategory } from '@/data/careerCatalog';
import { careerIntelligenceService } from '@/services/career-intelligence';

describe('careerCatalog lookups', () => {
  it('finds a role by normalized role name', () => {
    const entry = getCareerByRole('Full Stack Developer');
    expect(entry).toBeDefined();
    expect(entry?.slug).toBe('full-stack-developer');
    expect(entry?.dashboardType).toBe('software-dashboard');
    expect(entry?.requiredSkills).toContain('React');
  });

  it('finds a role by slug', () => {
    const entry = getCareerBySlug('nda');
    expect(entry).toBeDefined();
    expect(entry?.role).toBe('NDA');
    expect(entry?.roadmapDays).toBe(180);
    expect(entry?.difficulty).toBe('Intermediate');
  });

  it('returns category-scoped careers', () => {
    const privateCareers = getCareersByCategory('private');
    expect(privateCareers.length).toBeGreaterThan(5);
    expect(privateCareers.some((item) => item.role === 'AI Engineer')).toBe(true);
  });
});

describe('placement readiness scoring', () => {
  it('computes a bounded readiness score and action', () => {
    const entry = getCareerByRole('Full Stack Developer');
    expect(entry).toBeDefined();

    const readiness = calculatePlacementReadiness(entry!, {
      skillCoverage: 72,
      roadmapProgress: 50,
      projectCompletion: 80,
      quizPerformance: 65,
    });

    expect(readiness.readinessScore).toBeGreaterThanOrEqual(0);
    expect(readiness.readinessScore).toBeLessThanOrEqual(100);
    expect(readiness.skillCoverage).toBe(72);
    expect(readiness.roadmapProgress).toBe(50);
    expect(readiness.projectCompletion).toBe(80);
    expect(readiness.interviewReadiness).toBeGreaterThanOrEqual(0);
    expect(readiness.recommendedAction.length).toBeGreaterThan(0);
  });

  it('includes readiness breakdown in career intelligence output', () => {
    const result = careerIntelligenceService.generateCareerIntelligence({
      category: 'Private Job',
      interest: 'Software Development',
      qualification: "Bachelor's Degree",
      skills: ['HTML', 'CSS', 'JavaScript'],
      personality: ['Problem Solving'],
      goal: 'High Salary Technology Career',
      roadmapProgress: 40,
      projectCompletion: 55,
      quizPerformance: 60,
    });

    expect(result.recommendedRoles[0].readinessBreakdown).toBeDefined();
    expect(result.recommendedRoles[0].readinessBreakdown.skillCoverage).toBeGreaterThanOrEqual(0);
    expect(result.recommendedRoles[0].readinessBreakdown.recommendedAction.length).toBeGreaterThan(0);
  });
});
