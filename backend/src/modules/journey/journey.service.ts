import { prisma } from '@/lib/prisma';
import { roadmapService } from '@/services/roadmap';
import { recommendationEngineService } from '@/services/recommendation-engine';
import { progressService } from '@/services/progress';
import { dailyAnalyticsService } from '@/services/daily-analytics';
import { getJobFeedForUser } from '@/services/job-match-engine';
import {
  buildJourneyDays,
  buildJourneyJobs,
  buildPlacementReadiness,
  buildSkillProgress,
  capitalizeWords,
  pickAdaptiveMode,
  toCareerSlug,
  type JourneyPayload,
} from './journey.utils';

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.filter(Boolean).map((value) => value.trim()).filter(Boolean)));
}

function toDayKey(date = new Date()) {
  return date.toISOString().split('T')[0];
}

export class JourneyService {
  private async resolveRoadmap(careerSlug: string, userId: string) {
    const normalizedSlug = toCareerSlug(careerSlug);
    const [topCareer, roadmapRecommendations, roadmapCatalog, userRoadmaps] = await Promise.all([
      recommendationEngineService.getTopCareer(userId),
      recommendationEngineService.getRecommendedRoadmaps(userId).catch(() => []),
      roadmapService.getAllRoadmaps({ page: 1, limit: 50 }).then((result) => result.roadmaps).catch(() => []),
      prisma.userRoadmap.findMany({
        where: { userId },
        include: { roadmap: true },
        orderBy: { updatedAt: 'desc' },
      }).catch(() => []),
    ]);

    const personalizedRoadmap = userRoadmaps
      .map((entry: any) => entry.roadmap)
      .find((roadmap: any) => {
        if (!roadmap) return false;
        const haystack = [roadmap.title, roadmap.category, roadmap.careerPath, roadmap.description, ...(roadmap.tags || [])]
          .filter(Boolean)
          .map((value) => toCareerSlug(String(value)));

        return haystack.includes(normalizedSlug);
      }) || userRoadmaps[0]?.roadmap || null;

    const personalizedRoadmapDetail = personalizedRoadmap?.id
      ? await roadmapService.getRoadmapById(personalizedRoadmap.id).catch(() => personalizedRoadmap)
      : null;

    const candidates = [personalizedRoadmapDetail, ...roadmapRecommendations, ...roadmapCatalog].filter(Boolean) as Array<any>;

    const selected = candidates.find((roadmap: any) => {
      const haystack = [roadmap.title, roadmap.category, roadmap.careerPath, roadmap.description, ...(roadmap.tags || [])]
        .filter(Boolean)
        .map((value) => toCareerSlug(String(value)));

      return haystack.includes(normalizedSlug);
    }) || personalizedRoadmapDetail || candidates[0] || null;

    const selectedCareerPath = (selected as any)?.careerPath || (selected as any)?.category || (selected as any)?.title;
    const resolvedCareerTitle = topCareer?.career || selectedCareerPath || capitalizeWords(careerSlug);
    const resolvedCareerSlug = toCareerSlug(topCareer?.career || selectedCareerPath || careerSlug);

    return { selected, topCareer, resolvedCareerTitle, resolvedCareerSlug };
  }

  async getJourney(userId: string, careerSlug: string): Promise<JourneyPayload> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, skills: true, xp: true, streak: true, level: true, currentTitle: true, careerTrack: true },
    });

    const userSkills = uniqueValues(user?.skills || []);
    const { selected, topCareer, resolvedCareerTitle, resolvedCareerSlug } = await this.resolveRoadmap(careerSlug, userId);
    const roadmap = selected?.id ? await roadmapService.getRoadmapById(selected.id) : null;
    const requiredSkills = uniqueValues((roadmap?.requiredSkills || selected?.tags || []).slice(0, 8));
    const progress = roadmap?.id ? await progressService.getRoadmapProgress(userId, roadmap.id) : null;
    const progressRecord = progress as any;
    const currentDay = Number(progressRecord?.currentDay || 1);
    const completedDayCount = Array.isArray(progressRecord?.completedDays) ? progressRecord.completedDays.length : 0;
    const roadmapDays = roadmap
      ? buildJourneyDays(
          {
            title: roadmap.title,
            learningStructure: (roadmap.learningStructure as any) || [],
            requiredSkills: roadmap.requiredSkills || requiredSkills,
          },
          completedDayCount
        )
      : [];
    const completedSkills = requiredSkills.filter((skill) => userSkills.some((userSkill) => userSkill.toLowerCase() === skill.toLowerCase()));
    const weakSkills = uniqueValues([
      ...(((topCareer as any)?.skillGaps as string[]) || []),
      ...requiredSkills.filter((skill) => !completedSkills.some((completedSkill) => completedSkill.toLowerCase() === skill.toLowerCase())),
    ]).slice(0, 6);
    const adaptive = pickAdaptiveMode(Number(progressRecord?.progressPercentage || 0), Number(user?.streak || 0), weakSkills);
    const jobFeed = await getJobFeedForUser(userId);
    const eligibleJobs = buildJourneyJobs(userSkills, [...jobFeed.recommendedJobs, ...jobFeed.recentJobs].slice(0, 8));
    const eligibleJobCount = eligibleJobs.filter((job) => job.eligible).length;
    const progressPercentage = Number(progressRecord?.progressPercentage || (roadmapDays.length ? (completedDayCount / roadmapDays.length) * 100 : 0));
    const skillCoverage = requiredSkills.length ? Math.round((completedSkills.length / requiredSkills.length) * 100) : 50;
    const topCareerMatch = Number((topCareer as any)?.match || 0);
    const readiness = buildPlacementReadiness(
      progressPercentage,
      skillCoverage,
      topCareerMatch,
      completedSkills,
      weakSkills,
      eligibleJobCount,
      Number(user?.streak || 0),
      currentDay
    );
    const skillProgress = buildSkillProgress(requiredSkills, userSkills, weakSkills);
    const selectedDay = roadmapDays.find((day) => day.dayNumber === currentDay) || roadmapDays[0] || null;

    const nextAction = eligibleJobs.find((job) => job.eligible)?.title
      ? `Apply to ${eligibleJobs.find((job) => job.eligible)?.title} and complete Day ${currentDay}.`
      : weakSkills[0]
        ? `Strengthen ${weakSkills[0]} and finish Day ${currentDay}.`
        : `Continue Day ${currentDay} of the journey.`;

    const aiInsights = [
      adaptive.reason,
      topCareer?.reasons?.[0] || `Your current journey aligns with ${resolvedCareerTitle}.`,
      eligibleJobs[0]
        ? `${eligibleJobs[0].matchPercentage}% eligible for ${eligibleJobs[0].title} right now.`
        : 'No high-fit jobs yet; keep building your skills and progress.',
    ];

    const currentPlan = {
      todayGoal: selectedDay?.focus || roadmap?.title || resolvedCareerTitle,
      estimatedMinutes: selectedDay?.estimatedMinutes || 90,
      tasks: selectedDay?.tasks.map((task) => ({
        type: task.type,
        title: task.title,
        minutes: task.estimatedMinutes,
        details: task.details,
      })) || [],
      xpReward: selectedDay?.xpReward || 60,
      level: roadmap?.level || 'Beginner',
      adaptiveMode: adaptive.mode,
      adaptiveReason: adaptive.reason,
      difficultyMultiplier: adaptive.multiplier,
    };

    const dailyLearning = await prisma.userDailyLearning.findUnique({
      where: {
        userId_date: {
          userId,
          date: toDayKey(),
        },
      },
    }).catch(() => null);

    await dailyAnalyticsService.upsertDailySnapshot(userId, {
      date: toDayKey(),
      readinessScore: readiness.score,
      xp: Number(user?.xp || 0),
      streak: Number(user?.streak || 0),
      completedTasks: Array.isArray(progressRecord?.completedTasks) ? progressRecord.completedTasks.length : 0,
      studyHours: Math.max(0.5, Number(dailyLearning?.tasksCompleted || 0) * 0.65 + Number(selectedDay?.estimatedMinutes || 0) / 120),
      eligibleJobs: eligibleJobCount,
      weakSkillCount: weakSkills.length,
    });

    return {
      careerSlug,
      resolvedCareerSlug,
      careerTitle: resolvedCareerTitle,
      roadmapId: roadmap?.id || selected?.id || null,
      roadmapTitle: roadmap?.title || selected?.title || resolvedCareerTitle,
      duration: roadmap?.duration || `${Math.max(30, roadmapDays.length * 7)} Days`,
      industryDemand: topCareer ? `${Math.max(70, Math.min(99, Math.round((Number((topCareer as any)?.match || 0)) + (Number((topCareer as any)?.demandForecast || 0) / 3))))}% demand` : 'High demand',
      salaryRange: (topCareer as any)?.salaryEstimate || selected?.tags?.[0] || '₹6-18 LPA',
      completionPercentage: Math.round(progressPercentage),
      xp: Number(user?.xp || 0),
      streak: Number(user?.streak || 0),
      userLevel: Number(user?.level || 1),
      userTitle: user?.currentTitle || null,
      careerTrack: user?.careerTrack || null,
      currentDay,
      adaptiveMode: adaptive.mode,
      adaptiveReason: adaptive.reason,
      weakSkills,
      completedSkills,
      nextAction,
      mentorContext: {
        career: resolvedCareerTitle,
        roadmapTitle: roadmap?.title || selected?.title || resolvedCareerTitle,
        currentDay: `Day ${currentDay}`,
        completedSkills,
        weakSkills,
        mentorLevel: roadmap?.level || 'Beginner',
        learningLevel: roadmap?.difficulty || roadmap?.level || 'Beginner',
      },
      roadmapDays,
      skillProgress,
      aiInsights,
      eligibleJobs,
      placementReadiness: readiness,
      topCareerMatch,
      currentPlan,
    };
  }

  async getDashboardJourney(userId: string) {
    const topCareer = await recommendationEngineService.getTopCareer(userId);
    const careerSlug = toCareerSlug(topCareer?.career || 'career-journey');
    const journey = await this.getJourney(userId, careerSlug);
    const trend = await dailyAnalyticsService.getTrend(userId, 7);

    return {
      currentJourney: journey,
      currentDay: journey.currentDay,
      xp: journey.xp,
      streak: journey.streak,
      aiInsights: journey.aiInsights,
      weakSkills: journey.weakSkills,
      nextAction: journey.nextAction,
      eligibleJobs: journey.eligibleJobs,
      placementReadiness: journey.placementReadiness,
      trend,
    };
  }
}

export const journeyService = new JourneyService();
