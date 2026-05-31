import { careerIntelligenceService } from '@/services/career-intelligence';

describe('careerIntelligenceService', () => {
  it('returns top 5 realistic roles for a software profile', () => {
    const result = careerIntelligenceService.generateCareerIntelligence({
      category: 'Private Job',
      interest: 'Software Development',
      qualification: "Bachelor's Degree",
      skills: ['HTML', 'CSS', 'JavaScript'],
      personality: ['Problem Solving', 'Logical Thinking'],
      goal: 'High Salary Technology Career',
    });

    expect(result.recommendedRoles.length).toBeLessThanOrEqual(5);
    expect(result.recommendedRoles[0].role).toBe('Full Stack Developer');
    expect(result.recommendedRoles[0].confidence).toBeGreaterThan(0);
    expect(result.recommendedRoles[0]).toMatchObject({
      salaryRange: expect.any(String),
      roadmapDuration: expect.any(String),
      difficulty: expect.any(String),
      placementReadinessScore: expect.any(Number),
    });
    expect(result.recommendedRoles[0].relatedAlternatives.length).toBeGreaterThan(0);
    expect(result.futureGrowthOpportunities.length).toBeGreaterThan(0);
  });

  it('returns government roles for defence-oriented profile', () => {
    const result = careerIntelligenceService.generateCareerIntelligence({
      category: 'Government Job',
      interest: 'Defence',
      qualification: '12th',
      skills: ['Mathematics', 'English'],
      personality: ['Discipline', 'Leadership'],
      goal: 'Serve the nation',
      age: 18,
      stream: 'Science',
    });

    expect(result.recommendedRoles[0].role).toBe('NDA');
    expect(result.recommendedRoles[0].roadmapTemplate).toBe('nda-roadmap');
    expect(result.recommendedRoles[0].dashboardType).toBe('defence-dashboard');
    expect(result.recommendedRoles[0].roadmapHints.length).toBeGreaterThan(0);
    expect(result.recommendedRoles[0].confidence).toBeLessThanOrEqual(100);
    expect(result.placementReadinessScore).toBeGreaterThanOrEqual(0);
  });

  it('returns mba role for higher studies profile', () => {
    const result = careerIntelligenceService.generateCareerIntelligence({
      category: 'Higher Studies',
      interest: 'Management',
      qualification: "Bachelor's Degree",
      skills: ['Communication'],
      personality: ['Leadership'],
      goal: 'Management career',
    });

    expect(result.recommendedRoles.map((item) => item.role)).toContain('MBA');
    expect(result.recommendedRoles[0].salaryRange).toBeDefined();
    expect(result.recommendedRoles[0].futureGrowthOpportunities.length).toBeGreaterThan(0);
  });
});
