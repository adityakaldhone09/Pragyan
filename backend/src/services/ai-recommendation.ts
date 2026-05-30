import { prisma } from '@/lib/prisma';
import { NotFoundError } from '@/utils/errors';
import { recommendationEngineService } from '@/services/recommendation-engine';
import { roadmapGenerationService } from '@/services/roadmap-generation';

interface CareerMatchResult {
  career: string;
  score: number;
  reason: string;
}

interface SkillRecommendation {
  skill: string;
  confidence: number;
  reason: string;
}

interface JobRecommendation {
  id: string;
  title: string;
  company: string;
  location: string;
  matchScore: number;
}

export class AIRecommendationService {
  async recommendCareers(userId: string): Promise<CareerMatchResult[]> {
    return recommendationEngineService.getLegacyCareerList(userId);
  }

  async getCareerRecommendations(userId: string): Promise<CareerMatchResult[]> {
    return recommendationEngineService.getLegacyCareerList(userId);
  }

  async getSkillRecommendations(userId: string): Promise<SkillRecommendation[]> {
    return recommendationEngineService.getRecommendedSkills(userId);
  }

  async getJobRecommendations(userId: string): Promise<JobRecommendation[]> {
    return recommendationEngineService.getLegacyJobs(userId);
  }

  async getRecommendedRoadmaps(career: string) {
    const tokens = String(career || '')
      .toLowerCase()
      .split(/[^a-z0-9+]+/)
      .filter((token) => token.length > 2);

    const roadmaps = await prisma.roadmap.findMany({
      take: 20,
      orderBy: { updatedAt: 'desc' },
    });

    const scored = roadmaps
      .map((roadmap) => {
        const haystack = [roadmap.title, roadmap.category, roadmap.description, ...(roadmap.tags || [])]
          .join(' ')
          .toLowerCase();

        let score = 0;
        tokens.forEach((token) => {
          if (haystack.includes(token)) score += 10;
        });

        return { roadmap, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((item) => item.roadmap);

    return scored;
  }

  async generatePersonalizedRoadmap(userId: string, careerGoal: string, skillLevel: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return roadmapGenerationService.generatePersonalizedRoadmap(userId, careerGoal, skillLevel);
  }
}

export const aiRecommendationService = new AIRecommendationService();
