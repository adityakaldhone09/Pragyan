import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { journeyService } from '@/modules/journey/journey.service';
import { xpService } from '@/services/xp';
import { progressService } from '@/services/progress';
import { getResourceCatalogBlueprint } from '@/data/resourceCatalog';
import { NotFoundError } from '@/utils/errors';
import type { CompleteLearningInput } from '@/validators/learning';

type LearningResource = {
  title: string;
  provider: string;
  type: string;
  url: string;
  description: string;
  estimatedMinutes: number;
  isOfficial: boolean;
};

type LearningDay = {
  dayNumber: number;
  title: string;
  topic: string;
  topicSlug: string;
  overview: string;
  task: string;
  resources: LearningResource[];
  xpReward: number;
  streakReward: number;
  completed: boolean;
  quizUnlocked: boolean;
  weakTopics: string[];
};

type LearningSnapshot = {
  roadmapId: string;
  roadmapTitle: string;
  careerTitle: string;
  currentDay: number;
  days: LearningDay[];
  today: LearningDay;
  progress: {
    currentDay: number;
    progressPercentage: number;
    xp: number;
    streak: number;
    completedDays: string[];
    quizCompletedDays: string[];
    quizUnlocked: boolean;
    weakTopics: string[];
    lastCompletedAt: string | null;
  };
  xp: number;
  streak: number;
  totalDays: number;
};

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toDayKey(date = new Date()) {
  return date.toISOString().split('T')[0];
}

function isAllowedResource(resource: Partial<LearningResource>) {
  const haystack = `${resource.title || ''} ${resource.provider || ''} ${resource.url || ''}`.toLowerCase();
  return !haystack.includes('geeksforgeeks') && !haystack.includes('gfg') && !haystack.includes('interviewbit');
}

function buildFallbackResources(topic: string): LearningResource[] {
  const normalized = topic.toLowerCase();
  const docsUrl =
    normalized.includes('html')
      ? 'https://developer.mozilla.org/en-US/docs/Learn/HTML/Introduction_to_HTML'
      : normalized.includes('css')
        ? 'https://developer.mozilla.org/en-US/docs/Learn/CSS/First_steps'
        : normalized.includes('javascript') || normalized.includes('js')
          ? 'https://developer.mozilla.org/en-US/docs/Web/JavaScript'
          : normalized.includes('react')
            ? 'https://react.dev/learn'
            : 'https://developer.mozilla.org/en-US/docs/Learn';

  return [
    {
      title: `${topic} on MDN`,
      provider: 'MDN Docs',
      type: 'documentation',
      url: docsUrl,
      description: `Official MDN reference material for ${topic}.`,
      estimatedMinutes: 25,
      isOfficial: true,
    },
    {
      title: `${topic} on W3Schools`,
      provider: 'W3Schools',
      type: 'documentation',
      url: `https://www.w3schools.com/${normalized.includes('html') ? 'html' : normalized.includes('css') ? 'css' : normalized.includes('javascript') || normalized.includes('js') ? 'js' : 'default'}.asp`,
      description: `Beginner-friendly explanation of ${topic}.`,
      estimatedMinutes: 20,
      isOfficial: true,
    },
    {
      title: `${topic} beginner tutorial`,
      provider: 'YouTube',
      type: 'youtube',
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${topic} beginner tutorial`)}`,
      description: `Free YouTube walkthrough for ${topic}.`,
      estimatedMinutes: 45,
      isOfficial: false,
    },
  ];
}

function buildTopicResources(topic: string, roadmapTitle: string): LearningResource[] {
  const candidates: Array<Partial<LearningResource> | null> = [
    getResourceCatalogBlueprint(topic, roadmapTitle, 'documentation'),
    getResourceCatalogBlueprint(topic, roadmapTitle, 'youtube'),
    getResourceCatalogBlueprint(topic, roadmapTitle, 'practice'),
    getResourceCatalogBlueprint(roadmapTitle, topic, 'documentation'),
    getResourceCatalogBlueprint(roadmapTitle, topic, 'youtube'),
    getResourceCatalogBlueprint(roadmapTitle, topic, 'practice'),
  ];

  const curated = candidates
    .filter((item): item is LearningResource => Boolean(item))
    .filter(isAllowedResource)
    .map((item) => ({
      title: item.title,
      provider: item.provider,
      type: item.type,
      url: item.url,
      description: item.description,
      estimatedMinutes: item.estimatedMinutes,
      isOfficial: item.isOfficial,
    }));

  const merged = [...curated];
  for (const fallback of buildFallbackResources(topic)) {
    if (merged.length >= 3) break;
    if (!merged.some((item) => item.url === fallback.url)) {
      merged.push(fallback);
    }
  }

  return merged.slice(0, 3);
}

function buildOverview(topic: string, roadmapTitle: string) {
  return `Master ${topic} as part of your ${roadmapTitle} roadmap. Keep the lesson practical, then turn it into a tiny artifact you can reuse in your portfolio.`;
}

function buildTask(topic: string, roadmapTitle: string, dayNumber: number, dayFocus?: string) {
  if (dayFocus) {
    return `Complete today's ${dayFocus} exercise and publish one small proof of work.`;
  }

  return `Create a small ${topic} practice project for Day ${dayNumber} of ${roadmapTitle}.`;
}

function mapJourneyDay(day: any, roadmapTitle: string, currentDay: number, weakTopics: string[]): LearningDay {
  const topic = String(day.focus || day.topics?.[0] || roadmapTitle).trim();
  const topicSlug = normalizeSlug(topic);
  const resources = buildTopicResources(topic, roadmapTitle);
  const xpReward = Math.max(20, Number(day.xpReward || day.tasks?.reduce?.((sum: number, task: any) => sum + Number(task.xp || 0), 0) || 35));

  return {
    dayNumber: Number(day.dayNumber || day.day || currentDay),
    title: `Day ${Number(day.dayNumber || day.day || currentDay)}`,
    topic,
    topicSlug,
    overview: buildOverview(topic, roadmapTitle),
    task: buildTask(topic, roadmapTitle, Number(day.dayNumber || day.day || currentDay), day.deliverable || day.tasks?.find?.((task: any) => task.type === 'project')?.title),
    resources,
    xpReward,
    streakReward: 1,
    completed: Number(day.dayNumber || day.day || currentDay) < currentDay,
    quizUnlocked: Number(day.dayNumber || day.day || currentDay) < currentDay,
    weakTopics: Array.from(new Set([...(weakTopics || []).slice(0, 3), ...(Array.isArray(day.topics) ? day.topics.slice(1, 3) : [])])).filter(Boolean),
  };
}

async function calculateNextStreak(userId: string) {
  const today = toDayKey();
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = toDayKey(yesterdayDate);

  const [todayEntry, yesterdayEntry, user] = await Promise.all([
    prisma.userDailyLearning.findUnique({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
    }),
    prisma.userDailyLearning.findUnique({
      where: {
        userId_date: {
          userId,
          date: yesterday,
        },
      },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { streak: true } }),
  ]);

  if (todayEntry) {
    return Number(user?.streak || 0);
  }

  if (yesterdayEntry) {
    return Number(user?.streak || 0) + 1;
  }

  return 1;
}

export class LearningService {
  private async resolveSnapshot(userId: string) {
    const dashboard = await journeyService.getDashboardJourney(userId);
    const journey = dashboard.currentJourney;

    if (!journey?.roadmapId) {
      throw new NotFoundError('No active roadmap found. Complete an assessment or roadmap selection first.');
    }

    const roadmapId = journey.roadmapId;
    const roadmapTitle = journey.roadmapTitle;
    const careerTitle = journey.careerTitle;
    const currentDay = Math.max(1, Number(journey.currentDay || dashboard.currentDay || 1));
    const weakTopics = journey.weakSkills || [];
    const totalDays = Math.max(1, journey.roadmapDays.length || currentDay);

    const [dailyRecords, progressRecord, roadmapProgress] = await Promise.all([
      prisma.dailyLearning.findMany({
        where: { userId, roadmapId },
        orderBy: { dayNumber: 'asc' },
      }),
      prisma.learningProgress.findUnique({
        where: {
          userId_roadmapId: {
            userId,
            roadmapId,
          },
        },
      }),
      progressService.getRoadmapProgress(userId, roadmapId).catch(() => null),
    ]);

    const completedDays = new Set(
      [
        ...(progressRecord?.completedDays || []),
        ...dailyRecords.filter((record) => record.completed).map((record) => String(record.dayNumber)),
      ].filter(Boolean)
    );

    const progressPercentage = Math.max(
      0,
      Math.min(100, Number(progressRecord?.progressPercentage || (completedDays.size / totalDays) * 100))
    );

    const progress = {
      currentDay: Number(progressRecord?.currentDay || roadmapProgress?.currentDay || currentDay),
      progressPercentage,
      xp: Number(progressRecord?.xp || 0),
      streak: Number(progressRecord?.streak || journey.streak || 0),
      completedDays: Array.from(completedDays),
      quizCompletedDays: progressRecord?.quizCompletedDays || [],
      quizUnlocked: Boolean(progressRecord?.quizUnlocked || dailyRecords.some((record) => record.unlockedQuiz)),
      weakTopics: progressRecord?.weakTopics || weakTopics,
      lastCompletedAt: progressRecord?.lastCompletedAt ? progressRecord.lastCompletedAt.toISOString() : null,
    };

    const days = journey.roadmapDays.map((day) => mapJourneyDay(day, roadmapTitle, progress.currentDay, weakTopics));
    const today = days.find((day) => day.dayNumber === progress.currentDay) || days[0] || mapJourneyDay({ dayNumber: progress.currentDay, focus: roadmapTitle, topics: [roadmapTitle], tasks: [] }, roadmapTitle, progress.currentDay, weakTopics);

    return {
      roadmapId,
      roadmapTitle,
      careerTitle,
      currentDay: progress.currentDay,
      days,
      today,
      progress,
      xp: Number(journey.xp || 0),
      streak: Number(journey.streak || 0),
      totalDays,
      journey,
    };
  }

  async getToday(userId: string): Promise<LearningSnapshot> {
    const snapshot = await this.resolveSnapshot(userId);
    await this.upsertDayRecord(userId, snapshot.roadmapId, snapshot.today, snapshot.totalDays);
    await this.upsertProgressRecord(userId, snapshot.roadmapId, snapshot.progress, snapshot.totalDays);
    return snapshot;
  }

  async getDay(userId: string, dayId: string) {
    const snapshot = await this.resolveSnapshot(userId);
    const numericDay = Number(dayId);
    const day =
      snapshot.days.find((item) => String(item.dayNumber) === String(dayId)) ||
      snapshot.days.find((item) => item.topicSlug === normalizeSlug(dayId)) ||
      (Number.isFinite(numericDay) ? snapshot.days.find((item) => item.dayNumber === numericDay) : null) ||
      (await prisma.dailyLearning.findFirst({
        where: {
          userId,
          roadmapId: snapshot.roadmapId,
          ...(Number.isFinite(numericDay) ? { dayNumber: numericDay } : { id: dayId }),
        },
      }).then((record) => (record ? snapshot.days.find((item) => item.dayNumber === record.dayNumber) || null : null)));

    if (!day) {
      throw new NotFoundError('Learning day not found');
    }

    await this.upsertDayRecord(userId, snapshot.roadmapId, day, snapshot.totalDays);
    return {
      ...snapshot,
      today: day,
      currentDay: day.dayNumber,
    };
  }

  async completeLearning(userId: string, input: CompleteLearningInput) {
    const snapshot = await this.resolveSnapshot(userId);
    if (snapshot.roadmapId !== input.roadmapId) {
      throw new NotFoundError('Learning roadmap mismatch');
    }

    const day = snapshot.days.find((item) => item.dayNumber === input.dayNumber);
    if (!day) {
      throw new NotFoundError('Learning day not found');
    }

    const today = toDayKey();
    const dayKey = String(day.dayNumber);
    const existing = await prisma.dailyLearning.findUnique({
      where: {
        userId_roadmapId_dayNumber: {
          userId,
          roadmapId: input.roadmapId,
          dayNumber: input.dayNumber,
        },
      },
    });

    if (existing?.completed) {
      return {
        alreadyCompleted: true,
        day,
        progress: snapshot.progress,
        xpAwarded: 0,
        streak: snapshot.streak,
      };
    }

    const progressRecord = await prisma.learningProgress.upsert({
      where: {
        userId_roadmapId: {
          userId,
          roadmapId: input.roadmapId,
        },
      },
      create: {
        userId,
        roadmapId: input.roadmapId,
        currentDay: input.dayNumber,
        progressPercentage: 0,
        xp: 0,
        streak: 0,
        quizUnlocked: false,
        completedDays: [],
        quizCompletedDays: [],
        weakTopics: [],
      },
      update: {},
    });

    const completedDays = Array.from(new Set([...progressRecord.completedDays, dayKey]));
    const nextProgressPercentage = Math.min(100, Math.round((completedDays.length / snapshot.totalDays) * 100));
    const streak = await calculateNextStreak(userId);
    const xpAwarded = Math.max(20, day.xpReward);

    const [xpResult, user] = await Promise.all([
      xpService.awardXp(userId, xpAwarded, 'daily-learning', {
        roadmapId: input.roadmapId,
        dayNumber: input.dayNumber,
        topic: day.topic,
      }),
      prisma.user.findUnique({ where: { id: userId }, select: { xp: true, streak: true } }),
    ]);

    await prisma.user.update({
      where: { id: userId },
      data: { streak },
    });

    await prisma.dailyLearning.upsert({
      where: {
        userId_roadmapId_dayNumber: {
          userId,
          roadmapId: input.roadmapId,
          dayNumber: input.dayNumber,
        },
      },
      create: {
        userId,
        roadmapId: input.roadmapId,
        dayNumber: input.dayNumber,
        topic: day.topic,
        topicSlug: day.topicSlug,
        overview: day.overview,
        task: day.task,
        resources: day.resources as unknown as Prisma.InputJsonValue,
        unlockedQuiz: true,
        completed: true,
        xpReward: xpAwarded,
        streakReward: 1,
        weakTopics: day.weakTopics,
        metadata: {
          roadmapTitle: snapshot.roadmapTitle,
          careerTitle: snapshot.careerTitle,
          completedAt: today,
        } as Prisma.InputJsonValue,
        completedAt: new Date(),
      },
      update: {
        unlockedQuiz: true,
        completed: true,
        xpReward: xpAwarded,
        streakReward: 1,
        completedAt: new Date(),
        metadata: {
          roadmapTitle: snapshot.roadmapTitle,
          careerTitle: snapshot.careerTitle,
          completedAt: today,
        } as Prisma.InputJsonValue,
      },
    });

    await prisma.learningProgress.upsert({
      where: {
        userId_roadmapId: {
          userId,
          roadmapId: input.roadmapId,
        },
      },
      create: {
        userId,
        roadmapId: input.roadmapId,
        currentDay: input.dayNumber + 1,
        completedDays,
        progressPercentage: nextProgressPercentage,
        xp: xpAwarded,
        streak,
        quizUnlocked: true,
        weakTopics: day.weakTopics,
        lastCompletedAt: new Date(),
      },
      update: {
        currentDay: input.dayNumber + 1,
        completedDays,
        progressPercentage: nextProgressPercentage,
        xp: { increment: xpAwarded },
        streak,
        quizUnlocked: true,
        weakTopics: day.weakTopics,
        lastCompletedAt: new Date(),
      },
    });

    await prisma.userDailyLearning.upsert({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
      create: {
        userId,
        date: today,
        tasksCompleted: 1,
        xpEarned: xpAwarded,
      },
      update: {
        tasksCompleted: { increment: 1 },
        xpEarned: { increment: xpAwarded },
      },
    });

    await prisma.userProgress.upsert({
      where: {
        userId_roadmapId: {
          userId,
          roadmapId: input.roadmapId,
        },
      },
      create: {
        userId,
        roadmapId: input.roadmapId,
        completedTasks: [dayKey],
        completedDays: [dayKey],
        progressPercentage: nextProgressPercentage,
        currentDay: input.dayNumber + 1,
        xp: xpAwarded,
        streak,
        lastActiveDate: new Date(),
      },
      update: {
        completedTasks: { push: dayKey },
        completedDays: { push: dayKey },
        progressPercentage: nextProgressPercentage,
        currentDay: input.dayNumber + 1,
        xp: { increment: xpAwarded },
        streak,
        lastActiveDate: new Date(),
      },
    });

    return {
      day,
      xpAwarded,
      streak,
      levelUp: xpResult.levelUp,
      progress: {
        currentDay: input.dayNumber + 1,
        progressPercentage: nextProgressPercentage,
        xp: Number((xpResult as any)?.user?.xp || user?.xp || 0),
        streak,
        completedDays,
      },
    };
  }

  private async upsertDayRecord(userId: string, roadmapId: string, day: LearningDay, totalDays: number) {
    await prisma.dailyLearning.upsert({
      where: {
        userId_roadmapId_dayNumber: {
          userId,
          roadmapId,
          dayNumber: day.dayNumber,
        },
      },
      create: {
        userId,
        roadmapId,
        dayNumber: day.dayNumber,
        topic: day.topic,
        topicSlug: day.topicSlug,
        overview: day.overview,
        task: day.task,
        resources: day.resources as unknown as Prisma.InputJsonValue,
        unlockedQuiz: false,
        completed: false,
        xpReward: day.xpReward,
        streakReward: day.streakReward,
        weakTopics: day.weakTopics,
        metadata: {
          totalDays,
        } as Prisma.InputJsonValue,
      },
      update: {
        topic: day.topic,
        topicSlug: day.topicSlug,
        overview: day.overview,
        task: day.task,
        resources: day.resources as unknown as Prisma.InputJsonValue,
        xpReward: day.xpReward,
        weakTopics: day.weakTopics,
        metadata: {
          totalDays,
        } as Prisma.InputJsonValue,
      },
    });
  }

  private async upsertProgressRecord(userId: string, roadmapId: string, progress: LearningSnapshot['progress'], totalDays: number) {
    await prisma.learningProgress.upsert({
      where: {
        userId_roadmapId: {
          userId,
          roadmapId,
        },
      },
      create: {
        userId,
        roadmapId,
        currentDay: progress.currentDay,
        completedDays: progress.completedDays,
        progressPercentage: progress.progressPercentage,
        xp: progress.xp,
        streak: progress.streak,
        quizUnlocked: progress.quizUnlocked,
        quizCompletedDays: progress.quizCompletedDays,
        weakTopics: progress.weakTopics,
        lastCompletedAt: progress.lastCompletedAt ? new Date(progress.lastCompletedAt) : null,
      },
      update: {
        currentDay: progress.currentDay,
        completedDays: progress.completedDays,
        progressPercentage: progress.progressPercentage,
        xp: progress.xp,
        streak: progress.streak,
        quizUnlocked: progress.quizUnlocked,
        quizCompletedDays: progress.quizCompletedDays,
        weakTopics: progress.weakTopics,
        lastCompletedAt: progress.lastCompletedAt ? new Date(progress.lastCompletedAt) : null,
      },
    });
  }
}

export const learningService = new LearningService();
