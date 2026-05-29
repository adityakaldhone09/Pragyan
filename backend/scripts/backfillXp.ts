import { prisma } from '@/lib/prisma';

async function run() {
  const users = await prisma.user.findMany({ select: { id: true, xp: true, level: true } });
  for (const u of users) {
    if (u.level === null || u.level === undefined) {
      const xp = Number(u.xp || 0);
      let level = 1;
      if (xp >= 6000) level = 6;
      else if (xp >= 3000) level = 5;
      else if (xp >= 1500) level = 4;
      else if (xp >= 500) level = 3;
      else if (xp >= 100) level = 2;

      const titles = { 1: 'Novice', 2: 'Apprentice', 3: 'Skilled', 4: 'Pro', 5: 'Expert', 6: 'Master' } as any;

      await prisma.user.update({ where: { id: u.id }, data: { level, currentTitle: titles[level] } });
      console.log('Updated', u.id, '->', level);
    }
  }

  console.log('Backfill complete');
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
