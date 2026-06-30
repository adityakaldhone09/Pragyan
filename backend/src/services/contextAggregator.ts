import { profileBuilderService } from '@/services/profile-builder';
import { assessmentService } from '@/services/assessment';
import { progressService } from '@/services/progress';
import { recommendationEngineService } from '@/services/recommendation-engine';
import { aiMemoryService } from '@/services/aiMemory';
import { mentorMemoryService } from '@/modules/mentor/mentor.memory.service';
import redisClient from '@/lib/redis';

export interface AggregatedContext {
  profile?: any;
  careerGoal?: string | null;
  assessment?: any | null;
  roadmapProgress?: any[] | null;
  learningHistory?: any[] | null;
  projects?: any[] | null;
  certificates?: any[] | null;
  resumeStatus?: { hasResume: boolean } | null;
  previousConversations?: any[] | null;
  weakSkills?: string[] | null;
  strongSkills?: string[] | null;
  topCareer?: any | null;
}

class ContextAggregator {
  private ttl = 60 * 5; // 5 minutes

  private cacheKey(userId: string) {
    return `context:user:${userId}`;
  }

  async getContext(userId: string, options?: { forceRefresh?: boolean }): Promise<AggregatedContext> {
    const key = this.cacheKey(userId);
    if (!options?.forceRefresh) {
      try {
        const cached = await redisClient.get(key);
        if (cached) {
          return JSON.parse(cached) as AggregatedContext;
        }
      } catch (e) {
        // ignore cache failures
      }
    }

    // Fetch pieces in parallel; tolerate failures
    const [profileRes, assessmentRes, roadmapRes, recRes, aiProfileRes, aiMemRes] = await Promise.allSettled([
      profileBuilderService.getProfile(userId),
      assessmentService.getLatestAssessment(userId),
      progressService.getRoadmapProgress(userId),
      recommendationEngineService.getTopCareer(userId),
      aiMemoryService.getProfile(userId),
      aiMemoryService.getRecommendationHistory(userId, 10),
    ]);

    const profile = profileRes.status === 'fulfilled' ? profileRes.value : undefined;
    const assessment = assessmentRes.status === 'fulfilled' ? assessmentRes.value : null;
    const roadmapProgress = roadmapRes.status === 'fulfilled' ? roadmapRes.value : null;
    const topCareer = recRes.status === 'fulfilled' ? recRes.value : null;
    const aiProfile = aiProfileRes.status === 'fulfilled' ? aiProfileRes.value : null;
    const recommendationHistory = aiMemRes.status === 'fulfilled' ? aiMemRes.value : null;

    // Mentor conversations (recent) — best-effort
    let previousConversations: any[] | null = null;
    try {
      const active = await mentorMemoryService.getActiveConversation(userId);
      if (active) {
        previousConversations = await mentorMemoryService.getHistory(active.id, userId, 12);
      }
    } catch (e) {
      previousConversations = null;
    }

    const projects = profile?.projects || null;
    const certificates = profile?.certifications || null;
    const resumeMemory = aiProfile?.profileData && typeof aiProfile.profileData === 'object'
      ? (aiProfile.profileData as any).resume
      : null;
    const resumeStatus = {
      hasResume: Boolean((profile?.user as any)?.resume || (profile?.user as any)?.resumeText || resumeMemory?.hasResume),
      parsedProfile: resumeMemory?.parsedProfile,
      updatedAt: resumeMemory?.updatedAt,
    };
    const strongSkills = Array.isArray(profile?.user?.skills) ? profile.user.skills.slice(0, 5) : null;
    // weak skills: from assessment analysis if available
    const weakSkills = (assessment as any)?.analysis?.weaknesses || (assessment as any)?.weaknesses || null;

    const aggregated: AggregatedContext = {};
    if (profile) aggregated.profile = { user: profile.user, completion: profile.completion };
    if (topCareer) aggregated.topCareer = topCareer;
    if (profile?.user?.careerTrack || profile?.user?.currentTitle) aggregated.careerGoal = profile.user.careerTrack || profile.user.currentTitle;
    if (assessment) aggregated.assessment = assessment;
    if (roadmapProgress) aggregated.roadmapProgress = roadmapProgress as any;
    if (recommendationHistory) aggregated.learningHistory = recommendationHistory as any;
    if (projects) aggregated.projects = projects;
    if (certificates) aggregated.certificates = certificates;
    if (resumeStatus) aggregated.resumeStatus = resumeStatus;
    if (previousConversations) aggregated.previousConversations = previousConversations;
    if (weakSkills) aggregated.weakSkills = weakSkills;
    if (strongSkills) aggregated.strongSkills = strongSkills;

    // cache best-effort
    try {
      await redisClient.set(key, JSON.stringify(aggregated), this.ttl);
    } catch (e) {
      // ignore cache set failures
    }

    return aggregated;
  }

  async invalidate(userId: string) {
    const key = this.cacheKey(userId);
    try {
      await redisClient.del(key);
    } catch (e) {
      // ignore failures
    }
  }
}

export const contextAggregator = new ContextAggregator();

export default contextAggregator;
