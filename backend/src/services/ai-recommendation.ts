import axios from 'axios';

import { prisma } from '@/lib/prisma';
import { NotFoundError } from '@/utils/errors';
import { recommendationEngineService } from '@/services/recommendation-engine';

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

  async generatePersonalizedRoadmap(
    userId: string,
    careerGoal: string,
    skillLevel: string
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        progress: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const recommended = await this.getRecommendedRoadmaps(careerGoal);

    const filteredRoadmaps = recommended.filter((roadmap) => {
      if (skillLevel === 'beginner') {
        return roadmap.level === 'beginner';
      }
      if (skillLevel === 'intermediate') {
        return roadmap.level === 'intermediate' || roadmap.level === 'beginner';
      }
      return true;
    });

    const alreadyStarted = user.progress.map((entry) => entry.roadmapId);
    return filteredRoadmaps.filter((roadmap) => !alreadyStarted.includes(roadmap.id));
  }
  async getPythonCareerRecommendation(skills: string[]) {
  try {
    const response = await axios.post(
      'http://127.0.0.1:5001/recommend',
      {
        skills,
      }
    );

    return response.data;
  } catch (error) {
    console.error('Python AI Engine Error:', error);

    throw new Error(
      'Failed to get career recommendation'
    );
  }
}
}

export const aiRecommendationService = new AIRecommendationService();
