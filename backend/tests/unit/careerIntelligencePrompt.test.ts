jest.mock('@/services/ai-layers', () => ({
  aiLayers: {
    generateStructuredJson: jest.fn().mockResolvedValue(JSON.stringify({
      recommendedRoles: [
        {
          role: 'Full Stack Developer',
          confidence: 97,
          reason: 'Enhanced reason',
          requiredSkills: ['React', 'Node.js'],
          salaryRange: '6-18 LPA',
          roadmapDuration: '180 Days',
          difficulty: 'Intermediate',
          relatedAlternatives: ['Frontend Developer'],
          roadmapHints: ['Start with React'],
          placementReadinessScore: 88,
          futureGrowthOpportunities: ['Tech Lead'],
          dashboardType: 'software-dashboard',
          roadmapTemplate: 'fullstack-roadmap',
        },
      ],
      placementReadinessScore: 88,
      futureGrowthOpportunities: ['Tech Lead'],
    })),
  },
}));

import { careerIntelligenceService } from '@/services/career-intelligence';

describe('careerIntelligence hybrid prompt', () => {
  it('builds a prompt that preserves deterministic roles', () => {
    const base = careerIntelligenceService.generateCareerIntelligence({
      category: 'Private Job',
      interest: 'Software Development',
      qualification: "Bachelor's Degree",
      skills: ['HTML', 'CSS', 'JavaScript'],
      personality: ['Problem Solving', 'Logical Thinking'],
      goal: 'High Salary Technology Career',
    });

    const prompt = careerIntelligenceService.buildCareerIntelligencePrompt({
      category: 'Private Job',
      interest: 'Software Development',
      qualification: "Bachelor's Degree",
      skills: ['HTML', 'CSS', 'JavaScript'],
      personality: ['Problem Solving', 'Logical Thinking'],
      goal: 'High Salary Technology Career',
      enhanceWithAI: true,
    }, base);

    expect(prompt).toContain('Do not generate random roles.');
    expect(prompt).toContain('Do not change the order of roles or remove any role from the list.');
    expect(prompt).toContain('Backend-selected roles to enhance');
    expect(prompt).toContain('Full Stack Developer');
  });

  it('returns enhanced output without changing selected roles', async () => {
    const result = await careerIntelligenceService.generateCareerIntelligenceResponse({
      category: 'Private Job',
      interest: 'Software Development',
      qualification: "Bachelor's Degree",
      skills: ['HTML', 'CSS', 'JavaScript'],
      personality: ['Problem Solving', 'Logical Thinking'],
      goal: 'High Salary Technology Career',
      enhanceWithAI: true,
    });

    expect(result.recommendedRoles[0].role).toBe('Full Stack Developer');
    expect(result.recommendedRoles[0].reason).toBe('Enhanced reason');
    expect(result.recommendedRoles[0].roadmapTemplate).toBe('fullstack-roadmap');
    expect(result.placementReadinessScore).toBe(88);
  });
});
