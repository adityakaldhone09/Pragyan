// src/services/progress.ts

import { prisma } from '@/lib/prisma';
import { NotFoundError } from '@/utils/errors';
import { xpService } from '@/services/xp';

interface UpsertRoadmapProgressInput {
  roadmapId: string;
  completedTasks?: string[];
  completedDays?: string[];
  progressPercentage?: number;
  currentDay?: number;
}

interface UpdateRoadmapTaskInput {
  roadmapId: string;
  totalTasks: number;
  dayId?: string;
  completed?: boolean;
  xpReward?: number;
}

export class ProgressService {
  async getUserProgress(userId: string, roadmapId: string) {
    let progress = await prisma.userProgress.findUnique({
      where: {
        userId_roadmapId: {
          userId,
          roadmapId,
        },
      },
    });

    if (!progress) {
      // Create new progress record
      progress = await prisma.userProgress.create({
        data: {
          userId,
          roadmapId,
          completedTasks: [],
          completedDays: [],
          progressPercentage: 0,
          currentDay: 1,
          xp: 0,
          streak: 0,
        },
      });
    }

    return progress;
  }

  async completeTask(userId: string, roadmapId: string, taskId: string) {
    const [progress, task] = await Promise.all([
      this.getUserProgress(userId, roadmapId),
      prisma.task.findUnique({
        where: { id: taskId },
        include: { day: true },
      }),
    ]);

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Add task to completed tasks
    const updatedCompletedTasks = Array.from(new Set([...progress.completedTasks, taskId]));

    // Add day to completed days if all tasks are done
    let updatedCompletedDays = progress.completedDays;
    const tasksInDay = await prisma.task.findMany({
      where: { dayId: task.dayId },
    });

    const allTasksCompleted = tasksInDay.every((t) =>
      updatedCompletedTasks.includes(t.id)
    );

    if (allTasksCompleted && !updatedCompletedDays.includes(task.dayId)) {
      updatedCompletedDays = [...updatedCompletedDays, task.dayId];
    }

    // Calculate progress percentage
    const allTasks = await prisma.task.findMany({
      where: {
        day: {
          week: {
            roadmapId,
          },
        },
      },
    });

    const progressPercentage = (updatedCompletedTasks.length / allTasks.length) * 100;

    // Update user XP
    const xpReward = task.xp;
    const updatedProgress = await prisma.userProgress.update({
      where: {
        userId_roadmapId: {
          userId,
          roadmapId,
        },
      },
      data: {
        completedTasks: updatedCompletedTasks,
        completedDays: updatedCompletedDays,
        progressPercentage,
        currentDay: progress.currentDay + 1,
        xp: progress.xp + xpReward,
        lastActiveDate: new Date(),
      },
    });

    // Update user XP
    await xpService.awardXp(userId, xpReward, 'task-complete', { taskId, roadmapId });

    return updatedProgress;
  }

  async getDashboardData(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const [allProgress, completedRoadmaps] = await Promise.all([
      prisma.userProgress.findMany({
        where: { userId },
        include: {
          roadmap: true,
        },
      }),
      prisma.completedRoadmap.findMany({
        where: { userId },
        include: {
          roadmap: true,
        },
      }),
    ]);

    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        xp: user.xp,
        streak: user.streak,
      },
      progress: allProgress,
      completedRoadmaps,
      stats: {
        totalRoadmapsStarted: allProgress.length,
        totalRoadmapsCompleted: completedRoadmaps.length,
        totalXp: user.xp,
        currentStreak: user.streak,
      },
    };
  }

  async calculateStreak(userId: string) {
    const lastActiveDate = await prisma.userProgress.findFirst({
      where: { userId },
      orderBy: { lastActiveDate: 'desc' },
      select: { lastActiveDate: true },
    });

    if (!lastActiveDate || !lastActiveDate.lastActiveDate) {
      return 0;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastActive = new Date(lastActiveDate.lastActiveDate);
    lastActive.setHours(0, 0, 0, 0);

    const diffTime = Math.abs(today.getTime() - lastActive.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays <= 1 ? 1 : 0;
  }

  async completeRoadmap(userId: string, roadmapId: string) {
    const completed = await prisma.completedRoadmap.create({
      data: {
        userId,
        roadmapId,
      },
    });

    return completed;
  }

  async upsertRoadmapProgress(userId: string, input: UpsertRoadmapProgressInput) {
    const progress = await this.getUserProgress(userId, input.roadmapId);

    const nextCompletedTasks = input.completedTasks ?? progress.completedTasks;
    const nextCompletedDays = input.completedDays ?? progress.completedDays;
    const nextProgressPercentage = input.progressPercentage ?? progress.progressPercentage;
    const nextCurrentDay = input.currentDay ?? progress.currentDay;

    return prisma.userProgress.update({
      where: {
        userId_roadmapId: {
          userId,
          roadmapId: input.roadmapId,
        },
      },
      data: {
        completedTasks: nextCompletedTasks,
        completedDays: nextCompletedDays,
        progressPercentage: nextProgressPercentage,
        currentDay: nextCurrentDay,
        lastActiveDate: new Date(),
      },
    });
  }

  async getRoadmapProgress(userId: string, roadmapId?: string) {
    if (roadmapId) {
      return this.getUserProgress(userId, roadmapId);
    }

    return prisma.userProgress.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async updateRoadmapTask(userId: string, taskId: string, input: UpdateRoadmapTaskInput) {
    const completed = input.completed ?? true;
    const xpReward = input.xpReward ?? 10;
    const today = new Date().toISOString().split('T')[0];

    const progress = await this.getUserProgress(userId, input.roadmapId);
    const alreadyCompleted = progress.completedTasks.includes(taskId);

    let completedTasks = [...progress.completedTasks];
    let completedDays = [...progress.completedDays];
    let xpDelta = 0;

    if (completed && !alreadyCompleted) {
      completedTasks.push(taskId);
      xpDelta = xpReward;

      if (input.dayId && !completedDays.includes(input.dayId)) {
        completedDays.push(input.dayId);
      }
    }

    if (!completed && alreadyCompleted) {
      completedTasks = completedTasks.filter((id) => id !== taskId);
      if (input.dayId) {
        completedDays = completedDays.filter((id) => id !== input.dayId);
      }
      xpDelta = -Math.min(xpReward, progress.xp);
    }

    const safeTotalTasks = Math.max(1, input.totalTasks);
    const progressPercentage = Math.min(100, (completedTasks.length / safeTotalTasks) * 100);

    const updatedProgress = await prisma.userProgress.update({
      where: {
        userId_roadmapId: {
          userId,
          roadmapId: input.roadmapId,
        },
      },
      data: {
        completedTasks,
        completedDays,
        progressPercentage,
        currentDay: Math.min(safeTotalTasks, Math.max(1, completedTasks.length + 1)),
        xp: Math.max(0, progress.xp + xpDelta),
        lastActiveDate: new Date(),
      },
    });

    if (xpDelta !== 0) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const previousStreak = user?.streak ?? 0;
      const nextStreak = xpDelta > 0 ? await this.calculateNextStreak(userId, today) : previousStreak;

      await xpService.awardXp(userId, xpDelta, 'task-complete', { taskId, roadmapId: input.roadmapId });

      if (xpDelta > 0) {
        await Promise.all([
          prisma.user.update({ where: { id: userId }, data: { streak: nextStreak } }),
          prisma.completedTaskHistory.upsert({
            where: {
              userId_taskId: {
                userId,
                taskId,
              },
            },
            update: {
              completedAt: new Date(),
              roadmapId: input.roadmapId,
              xpAwarded: xpReward,
            },
            create: {
              userId,
              taskId,
              roadmapId: input.roadmapId,
              xpAwarded: xpReward,
            },
          }),
          prisma.userDailyLearning.upsert({
            where: {
              userId_date: {
                userId,
                date: today,
              },
            },
            update: {
              tasksCompleted: {
                increment: 1,
              },
              xpEarned: {
                increment: xpReward,
              },
            },
            create: {
              userId,
              date: today,
              tasksCompleted: 1,
              xpEarned: xpReward,
            },
          }),
          this.ensureAchievement(userId, completedTasks.length, nextStreak),
        ]);
      }
    }

    const [user, achievements] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { xp: true, streak: true },
      }),
      prisma.userAchievement.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    return {
      progress: updatedProgress,
      user,
      achievements,
    };
  }

  private async calculateNextStreak(userId: string, today: string) {
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().split('T')[0];

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
      prisma.user.findUnique({ where: { id: userId } }),
    ]);

    if (todayEntry) {
      return user?.streak ?? 0;
    }

    if (yesterdayEntry) {
      return (user?.streak ?? 0) + 1;
    }

    return 1;
  }

  private async ensureAchievement(userId: string, completedTaskCount: number, streak: number) {
    const pending: Array<{ code: string; title: string; description: string }> = [];

    if (completedTaskCount >= 1) {
      pending.push({
        code: 'first-task',
        title: 'First Step',
        description: 'Completed your first learning task.',
      });
    }

    if (completedTaskCount >= 10) {
      pending.push({
        code: 'ten-tasks',
        title: 'Momentum Builder',
        description: 'Completed 10 learning tasks.',
      });
    }

    if (streak >= 3) {
      pending.push({
        code: 'streak-3',
        title: 'Consistency Starter',
        description: 'Maintained a 3-day learning streak.',
      });
    }

    await Promise.all(
      pending.map((achievement) =>
        prisma.userAchievement.upsert({
          where: {
            userId_code: {
              userId,
              code: achievement.code,
            },
          },
          update: {
            unlockedAt: new Date(),
          },
          create: {
            userId,
            code: achievement.code,
            title: achievement.title,
            description: achievement.description,
          },
        })
      )
    );
  }
}

export const progressService = new ProgressService();
