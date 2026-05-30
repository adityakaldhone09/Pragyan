import { prisma } from '@/lib/prisma';

export interface DailyAnalyticsSnapshotInput {
  date?: string;
  readinessScore: number;
  xp: number;
  streak: number;
  completedTasks: number;
  studyHours: number;
  eligibleJobs: number;
  weakSkillCount: number;
}

export interface DailyAnalyticsTrendPoint {
  date: string;
  readinessScore: number;
  xp: number;
  studyHours: number;
  completedTasks: number;
  streak: number;
  eligibleJobs: number;
  weakSkillCount: number;
}

function toDayKey(date = new Date()) {
  return date.toISOString().split('T')[0];
}

function buildDateWindow(days: number) {
  const window = Array.from({ length: days }, (_, index) => {
    const value = new Date();
    value.setUTCDate(value.getUTCDate() - (days - 1 - index));
    return toDayKey(value);
  });

  return window;
}

export class DailyAnalyticsService {
  async upsertDailySnapshot(userId: string, input: DailyAnalyticsSnapshotInput) {
    const date = input.date || toDayKey();

    return prisma.dailyAnalyticsSnapshot.upsert({
      where: {
        userId_date: {
          userId,
          date,
        },
      },
      update: {
        readinessScore: input.readinessScore,
        xp: Math.round(input.xp),
        streak: Math.round(input.streak),
        completedTasks: Math.round(input.completedTasks),
        studyHours: input.studyHours,
        eligibleJobs: Math.round(input.eligibleJobs),
        weakSkillCount: Math.round(input.weakSkillCount),
      },
      create: {
        userId,
        date,
        readinessScore: input.readinessScore,
        xp: Math.round(input.xp),
        streak: Math.round(input.streak),
        completedTasks: Math.round(input.completedTasks),
        studyHours: input.studyHours,
        eligibleJobs: Math.round(input.eligibleJobs),
        weakSkillCount: Math.round(input.weakSkillCount),
      },
    });
  }

  async getTrend(userId: string, days = 7): Promise<DailyAnalyticsTrendPoint[]> {
    const window = buildDateWindow(days);
    const snapshots = await prisma.dailyAnalyticsSnapshot.findMany({
      where: {
        userId,
        date: {
          in: window,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    const byDate = new Map(snapshots.map((snapshot) => [snapshot.date, snapshot]));

    return window.map((date) => {
      const snapshot = byDate.get(date);

      return {
        date,
        readinessScore: snapshot?.readinessScore ?? 0,
        xp: snapshot?.xp ?? 0,
        studyHours: snapshot?.studyHours ?? 0,
        completedTasks: snapshot?.completedTasks ?? 0,
        streak: snapshot?.streak ?? 0,
        eligibleJobs: snapshot?.eligibleJobs ?? 0,
        weakSkillCount: snapshot?.weakSkillCount ?? 0,
      };
    });
  }
}

export const dailyAnalyticsService = new DailyAnalyticsService();