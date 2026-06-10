import { prisma } from '@/lib/prisma';
import { journeyService } from '@/modules/journey/journey.service';
import { xpService } from '@/services/xp';
import { generateQuizWithGemini, evaluateQuizAnswers, type GeneratedQuiz, type QuizEvaluation } from '@/services/quiz-generation';

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

    // Get journey details for Gemini context
    const journey = await journeyService.getJourney(userId, roadmap);
    const selectedDay = journey.roadmapDays.find((d) => d.dayNumber === currentDay) || journey.roadmapDays[0];
    const topic = selectedDay?.focus || selectedDay?.dailyTopics?.[0] || 'topic';
    const careerPath = journey.careerTitle || journey.roadmapTitle || 'Career Development';

    // Determine user skill level based on journey progress
    const userLevel = currentDay <= 20 ? 'beginner' : currentDay <= 50 ? 'intermediate' : 'advanced';

    // Generate quiz using Gemini (no storage of questions)
    const quiz = await generateQuizWithGemini({
      careerPath,
      topic,
      dayNumber: currentDay,
      userLevel,
      resourcesCompleted: selectedDay?.resources?.map((r) => r.title) || [],
    });

    return { generated: true, quiz, dayNumber: currentDay, topic, careerPath };
  }

  async submitQuiz(userId: string, input: { quiz?: GeneratedQuiz; answers: number[]; roadmapId?: string; dayNumber?: number }) {
    const { quiz, answers, roadmapId, dayNumber } = input;

    if (!quiz) {
      return {
        score: 0,
        xpAwarded: 0,
        correct: 0,
        total: 0,
        levelInfo: null,
        error: 'No quiz provided',
      };
    }

    // Get user's current skill level
    const journey = roadmapId ? await journeyService.getJourney(userId, roadmapId) : null;
    const userSkillLevel = journey && journey.userLevel ? (journey.userLevel as 'beginner' | 'intermediate' | 'advanced') : 'beginner';

    // Evaluate quiz using Gemini analysis
    const evaluation: QuizEvaluation = await evaluateQuizAnswers({
      quiz,
      userAnswers: answers,
      userSkillLevel,
    });

    // Update user with new level if progressed
    let levelInfo: any = null;
    if (evaluation.xpAwarded > 0) {
      const xpResult = await xpService.awardXp(userId, evaluation.xpAwarded, 'quiz-completion', {
        topic: quiz.topic,
        careerPath: quiz.careerPath,
        quizLevel: quiz.difficulty,
      });
      levelInfo = { levelUp: xpResult.levelUp, previousLevel: xpResult.previousLevel, newLevel: xpResult.newLevel };
    }

    // Store assessment result with analysis (NOT questions)
    const assessmentResult = await prisma.assessmentResult.create({
      data: {
        userId,
        score: evaluation.score,
        level: evaluation.level,
        strengths: evaluation.strengths,
        weaknesses: evaluation.weaknesses,
        suggestedNextSteps: evaluation.suggestions,
        careerMatch: quiz.careerPath,
        roadmapId: roadmapId || undefined,
        topicsTested: [quiz.topic],
      },
    });

    // Update user progress if roadmapId provided
    if (roadmapId) {
      const progress = await prisma.userProgress.findUnique({
        where: { userId_roadmapId: { userId, roadmapId } },
      });

      if (progress) {
        const nextDay = evaluation.score >= 70 ? Math.max(progress.currentDay + 1, Number(dayNumber || progress.currentDay + 1)) : progress.currentDay;
        await prisma.userProgress.update({
          where: { userId_roadmapId: { userId, roadmapId } },
          data: {
            currentDay: nextDay,
            lastActiveDate: new Date(),
          },
        });
      }

      // Update user skill level if improved
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user && evaluation.level && evaluation.level !== (user.skillLevel as any)) {
        await prisma.user.update({
          where: { id: userId },
          data: { skillLevel: evaluation.level },
        });
      }
    }

    // Award achievement for perfect score
    if (evaluation.score === 100) {
      await prisma.userAchievement.upsert({
        where: { userId_code: { userId, code: 'perfect-quiz' } },
        update: { unlockedAt: new Date() },
        create: { userId, code: 'perfect-quiz', title: 'Perfect Quiz', description: 'Scored 100% on a daily quiz' },
      });
    }

    // Award achievement for progressing level
    if (levelInfo?.levelUp) {
      await prisma.userAchievement.upsert({
        where: { userId_code: { userId, code: `level-${evaluation.level}` } },
        update: { unlockedAt: new Date() },
        create: {
          userId,
          code: `level-${evaluation.level}`,
          title: `${evaluation.level} Certified`,
          description: `Reached ${evaluation.level} skill level`,
        },
      });
    }

    return {
      score: evaluation.score,
      level: evaluation.level,
      xpAwarded: evaluation.xpAwarded,
      strengths: evaluation.strengths,
      weaknesses: evaluation.weaknesses,
      suggestions: evaluation.suggestions,
      levelInfo,
      assessmentResultId: assessmentResult.id,
    };
  }
}

export const quizService = new QuizService();
