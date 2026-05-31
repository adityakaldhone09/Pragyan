import { prisma } from '@/lib/prisma';

export interface XpProgression {
  xp: number;
  level: number;
  title: string;
  currentThreshold: number;
  nextThreshold: number;
  xpToNextLevel: number;
  progressPercent: number;
  nextTitle: string;
  milestone: string;
}

export const XP_LEVEL_TITLES: Record<number, string> = {
  1: 'Explorer',
  2: 'Learner',
  3: 'Builder',
  4: 'Developer',
  5: 'Professional',
  6: 'Expert',
};

export function computeXpProgression(xp: number): XpProgression {
  const safeXp = Math.max(0, Number(xp) || 0);
  const level = Math.max(1, Math.floor(Math.sqrt(safeXp / 100)) + 1);
  const currentThreshold = Math.max(0, Math.pow(Math.max(1, level) - 1, 2) * 100);
  const nextThreshold = Math.max(currentThreshold + 100, Math.pow(Math.max(1, level), 2) * 100);
  const progressPercent = Math.max(0, Math.min(100, Math.round(((safeXp - currentThreshold) / Math.max(1, nextThreshold - currentThreshold)) * 100)));
  const title = XP_LEVEL_TITLES[level] ?? 'Learner';
  const nextTitle = XP_LEVEL_TITLES[level + 1] ?? 'Legend';

  return {
    xp: safeXp,
    level,
    title,
    currentThreshold,
    nextThreshold,
    xpToNextLevel: Math.max(0, nextThreshold - safeXp),
    progressPercent,
    nextTitle,
    milestone: safeXp >= nextThreshold ? `Ready for ${nextTitle}` : `Earn ${Math.max(0, nextThreshold - safeXp)} XP to reach ${nextTitle}`,
  };
}

function computeLevelFromXp(xp: number) {
  const progression = computeXpProgression(xp);
  return { level: progression.level, title: progression.title };
}

export class XpService {
  getProgression(xp: number): XpProgression {
    return computeXpProgression(xp);
  }

  async getUserProgression(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, xp: true, level: true, currentTitle: true, streak: true } });
    if (!user) throw new Error('User not found');

    const progression = computeXpProgression(user.xp || 0);

    return {
      ...progression,
      storedLevel: user.level,
      storedTitle: user.currentTitle || progression.title,
      streak: user.streak || 0,
    };
  }

  async awardXp(userId: string, amount: number, reason = 'award', meta?: any) {
    if (!amount || amount === 0) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      return { user, levelUp: false };
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    await prisma.userXpLog.create({
      data: { userId, amount, reason, meta: meta || {} },
    });

    const newXp = Number(user.xp || 0) + Number(amount);
    const { level, title } = computeLevelFromXp(newXp);

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        xp: { increment: amount },
        ...(user.level !== level ? { level, currentTitle: title } : {}),
      },
      select: { id: true, xp: true, level: true, currentTitle: true, streak: true },
    });

    if (user.level !== level) {
      // award achievement for level milestone
      const code = `level-${level}`;
      await prisma.userAchievement.upsert({
        where: { userId_code: { userId, code } },
        update: { unlockedAt: new Date() },
        create: { userId, code, title: `Reached Level ${level}`, description: `Reached Level ${level} - ${title}` },
      });
    }

    return { user: updated, levelUp: user.level !== level, previousLevel: user.level, newLevel: level };
  }
}

export const xpService = new XpService();
