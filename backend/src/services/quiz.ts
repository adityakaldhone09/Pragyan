import { prisma } from '@/lib/prisma';
import { journeyService } from '@/modules/journey/journey.service';
import { xpService } from '@/services/xp';

export class QuizService {
  async getTodayQuizForUser(userId: string, roadmapId?: string) {
    // Resolve roadmap/day
    let roadmap: string | null | undefined = roadmapId;
    let currentDay = 1;

    if (!roadmap) {
      const dashboard = await journeyService.getDashboardJourney(userId);
      roadmap = dashboard.currentJourney.roadmapId || undefined;
      currentDay = dashboard.currentJourney.currentDay || 1;
    }

    if (!roadmap) {
      return { generated: true, questions: [] };
    }

    // Try to find a persisted DailyQuiz for this roadmap/day
    const possible = await prisma.dailyQuiz.findMany({ where: { roadmapId } });
    const titleMatch = possible.find((q) => q.title?.includes(`Day ${currentDay}`));

    if (titleMatch) {
      return { generated: false, quiz: titleMatch };
    }

    // Fallback: generate simple quiz from current day's topics
    const journey = await journeyService.getJourney(userId, roadmap);
    const selectedDay = journey.roadmapDays.find((d) => d.dayNumber === currentDay) || journey.roadmapDays[0];
    const focus = selectedDay?.focus || journey.roadmapTitle || 'topic';
    const topics = selectedDay?.topics || [focus];

    const questions = topics.slice(0, 3).map((topic, i) => ({
      id: `gen-${currentDay}-${i}`,
      question: `Which topic best describes Day ${currentDay} focus on ${topic}?`,
      options: [topic, focus, 'Related topic A', 'Related topic B'],
      correctIndex: 0,
      estimatedMinutes: 5,
      xp: 25,
    }));

    return { generated: true, quiz: { id: null, roadmapId, title: `Day ${currentDay} Quiz`, questions, generated: true } };
  }

  async submitQuiz(userId: string, input: { quizId?: string | null; answers: number[]; roadmapId?: string; dayNumber?: number }) {
    const { quizId, answers, roadmapId, dayNumber } = input;
    let quizRecord: any = null;
    const resolvedRoadmapId = roadmapId || null;

    if (quizId) {
      quizRecord = await prisma.dailyQuiz.findUnique({ where: { id: quizId } });
    }

    if (!quizRecord) {
      // regenerate the quiz to score answers
      const fetched = await this.getTodayQuizForUser(userId, roadmapId);
      quizRecord = fetched.quiz;
    }

    const questions: any[] = quizRecord?.questions || [];
    const total = questions.length || 1;
    let correct = 0;
    for (let i = 0; i < total; i++) {
      const q = questions[i];
      const ans = answers[i];
      if (typeof q.correctIndex === 'number' && ans === q.correctIndex) correct++;
    }

    const score = Math.round((correct / total) * 100);
    // XP awarding rules
    const baseXp = questions.reduce((s, q) => s + (q.xp || 25), 0) || 50;
    let xpAwarded = 0;
    if (score >= 90) xpAwarded = Math.round(baseXp * 1.2);
    else if (score >= 70) xpAwarded = baseXp;
    else if (score >= 50) xpAwarded = Math.round(baseXp * 0.5);
    else xpAwarded = 0;

    const existingAttempt = quizRecord?.id
      ? await prisma.dailyQuizAttempt.findFirst({
          where: { userId, quizId: quizRecord.id },
        })
      : null;

    if (existingAttempt) {
      return {
        score: existingAttempt.score,
        xpAwarded: existingAttempt.xpAwarded,
        correct,
        total,
        levelInfo: null,
        alreadySubmitted: true,
      };
    }

    let levelInfo: any = null;
    if (xpAwarded > 0) {
      const res = await xpService.awardXp(userId, xpAwarded, 'daily-quiz', { quizId: quizRecord?.id, roadmapId, dayNumber });
      levelInfo = { levelUp: res.levelUp, previousLevel: res.previousLevel, newLevel: res.newLevel, user: res.user };
    }

    if (quizRecord?.id) {
      await prisma.dailyQuizAttempt.create({ data: { userId, quizId: quizRecord.id, score, xpAwarded } });
    }

    if (resolvedRoadmapId) {
      const progress = await prisma.userProgress.findUnique({
        where: { userId_roadmapId: { userId, roadmapId: resolvedRoadmapId } },
      });

      if (progress) {
        const nextDay = score >= 70 ? Math.max(progress.currentDay + 1, Number(dayNumber || progress.currentDay + 1)) : progress.currentDay;
        await prisma.userProgress.update({
          where: { userId_roadmapId: { userId, roadmapId: resolvedRoadmapId } },
          data: {
            currentDay: nextDay,
            lastActiveDate: new Date(),
          },
        });
      }
    }

    if (score === 100) {
      await prisma.userAchievement.upsert({
        where: { userId_code: { userId, code: 'perfect-quiz' } },
        update: { unlockedAt: new Date() },
        create: { userId, code: 'perfect-quiz', title: 'Perfect Quiz', description: 'Scored 100% on a daily quiz' },
      });
    }

    return { score, xpAwarded, correct, total, levelInfo };
  }
}

export const quizService = new QuizService();
