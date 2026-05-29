import { prisma } from '@/lib/prisma';

function computeLevelFromXp(xp: number) {
  const safeXp = Math.max(0, Number(xp) || 0);
  const level = Math.max(1, Math.floor(Math.sqrt(safeXp / 100)) + 1);

  const titles = {
    1: 'Novice',
    2: 'Apprentice',
    3: 'Skilled',
    4: 'Pro',
    5: 'Expert',
    6: 'Master',
  } as Record<number, string>;

  return { level, title: titles[level] ?? 'Learner' };
}

export class XpService {
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
