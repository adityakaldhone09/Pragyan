import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { aiProvider } from '@/services/aiProvider';
import { learningService } from '@/services/learningService';
import { xpService } from '@/services/xp';
import { safeParseAIResponse } from '@/ai/safeParser';
import { quizEvaluationOutputSchema, quizGenerationOutputSchema } from '@/validators/quiz';

type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  topic: string;
};

type QuizGenerationResult = {
  roadmapId: string;
  dayNumber: number;
  topic: string;
  skillLevel: string;
  questions: QuizQuestion[];
};

function buildGenerationPrompt(input: { topic: string; dayNumber: number; skillLevel: string; roadmapTitle: string; careerTitle: string; weakTopics: string[] }) {
  return `
You are Gemini generating a Pragyan daily quiz.
Return valid JSON only with this structure:
{
  "questions": [
    {
      "id": "q1",
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "topic": "string"
    }
  ]
}

Rules:
- Generate exactly 10 MCQ questions.
- Keep the quiz level ${input.skillLevel}.
- Focus on Day ${input.dayNumber} topic: ${input.topic}.
- Use the roadmap context: ${input.roadmapTitle}.
- User career goal: ${input.careerTitle}.
- Prefer practical, beginner-friendly questions.
- Do not include answers or explanations.
- Weak areas to reinforce: ${input.weakTopics.join(', ') || 'none'}.
- Every question must have exactly 4 options.
`.trim();
}

function buildEvaluationPrompt(input: {
  topic: string;
  dayNumber: number;
  skillLevel: string;
  roadmapTitle: string;
  questions: Array<{ question: string; selectedAnswer: string; options?: string[] }>;
}) {
  return `
You are evaluating a Pragyan daily quiz.
Return valid JSON only with this structure:
{
  "score": number,
  "percentage": number,
  "correctAnswers": number,
  "weakTopics": string[],
  "improvementSuggestion": string
}

Rules:
- Score should be out of 10.
- percentage should be 0-100.
- Consider the topic "${input.topic}" for Day ${input.dayNumber}.
- Skill level: ${input.skillLevel}.
- Roadmap: ${input.roadmapTitle}.
- The questions and selected answers are:
${JSON.stringify(input.questions, null, 2)}
- Keep weakTopics short and actionable.
- improvementSuggestion should be one concise sentence.
`.trim();
}

function normalizeQuizQuestions(raw: any): QuizQuestion[] {
  const questions = Array.isArray(raw?.questions) ? raw.questions : [];
  return questions
    .map((question: any, index: number) => ({
      id: String(question.id || `q${index + 1}`),
      question: String(question.question || question.prompt || '').trim(),
      options: Array.isArray(question.options) ? question.options.map((option: unknown) => String(option)) : [],
      topic: String(question.topic || '').trim(),
    }))
    .filter((question) => question.question && question.options.length >= 2)
    .slice(0, 10);
}

function toDayKey(date = new Date()) {
  return date.toISOString().split('T')[0];
}

export class QuizService {
  async generateQuiz(userId: string, input: { roadmapId?: string; dayNumber?: number; topic?: string; skillLevel?: string }) {
    const learning = input.dayNumber
      ? await learningService.getDay(userId, String(input.dayNumber))
      : await learningService.getToday(userId);
    if (!learning.today.completed) {
      throw new Error('Complete the daily learning task before starting the quiz.');
    }
    const dayNumber = input.dayNumber || learning.today.dayNumber;
    const topic = input.topic || learning.today.topic;
    const skillLevel = input.skillLevel || learning.journey.mentorContext.learningLevel || 'beginner';
    const questions = await this.generateQuestions({
      roadmapId: input.roadmapId || learning.roadmapId,
      dayNumber,
      topic,
      skillLevel,
      roadmapTitle: learning.roadmapTitle,
      careerTitle: learning.careerTitle,
      weakTopics: learning.today.weakTopics,
    });

    return {
      roadmapId: learning.roadmapId,
      dayNumber,
      topic,
      skillLevel,
      questions,
      quizUnlocked: true,
    } satisfies QuizGenerationResult & { quizUnlocked: boolean };
  }

  async evaluateQuiz(
    userId: string,
    input: {
      roadmapId: string;
      dayNumber: number;
      topic: string;
      skillLevel?: string;
      questions: Array<{ id?: string; question: string; options: string[] }>;
      responses: Array<{ questionId?: string; question: string; selectedAnswer: string; options?: string[] }>;
    }
  ) {
    const learning = input.dayNumber
      ? await learningService.getDay(userId, String(input.dayNumber))
      : await learningService.getToday(userId);
    const currentDay = await prisma.dailyLearning.findUnique({
      where: {
        userId_roadmapId_dayNumber: {
          userId,
          roadmapId: input.roadmapId,
          dayNumber: input.dayNumber,
        },
      },
    });

    if (!currentDay?.completed) {
      throw new Error('Complete the daily learning task before starting the quiz.');
    }

    const skillLevel = input.skillLevel || learning.journey.mentorContext.learningLevel || 'beginner';
    const prompt = buildEvaluationPrompt({
      topic: input.topic,
      dayNumber: input.dayNumber,
      skillLevel,
      roadmapTitle: learning.roadmapTitle,
      questions: input.responses.map((response, index) => ({
        question: response.question || input.questions[index]?.question || '',
        selectedAnswer: response.selectedAnswer,
        options: response.options || input.questions[index]?.options || [],
      })),
    });

    let evaluation: {
      score: number;
      percentage: number;
      correctAnswers: number;
      weakTopics: string[];
      improvementSuggestion: string;
    };

    try {
      const raw = await aiProvider.generateJsonRaw(prompt, { timeoutMs: 20000, maxTokens: 1200 });
      evaluation = safeParseAIResponse(JSON.parse(raw), quizEvaluationOutputSchema);
    } catch {
      evaluation = await this.fallbackEvaluation(input, learning.today.topic, skillLevel);
    }

    const xpEarned = Math.max(10, Math.round(15 + (evaluation.percentage * 0.6)));
    const completed = evaluation.percentage >= 60;
    const dayKey = String(input.dayNumber);
    const today = toDayKey();

    await xpService.awardXp(userId, xpEarned, 'daily-quiz', {
      roadmapId: input.roadmapId,
      dayNumber: input.dayNumber,
      topic: input.topic,
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
        currentDay: input.dayNumber + (completed ? 1 : 0),
        completedDays: completed ? [dayKey] : [],
        progressPercentage: completed ? 100 : 0,
        xp: xpEarned,
        streak: 0,
        quizUnlocked: true,
        quizCompletedDays: [dayKey],
        weakTopics: evaluation.weakTopics,
        lastCompletedAt: new Date(),
      },
      update: {
        quizUnlocked: true,
        quizCompletedDays: { push: dayKey },
        weakTopics: Array.from(new Set([...(evaluation.weakTopics || []), ...(currentDay?.weakTopics || [])])),
        lastCompletedAt: new Date(),
        xp: { increment: xpEarned },
      },
    });

    await prisma.dailyLearning.updateMany({
      where: {
        userId,
        roadmapId: input.roadmapId,
        dayNumber: input.dayNumber,
      },
      data: {
        metadata: {
          quizScore: evaluation.score,
          quizPercentage: evaluation.percentage,
          quizXpEarned: xpEarned,
          quizCompleted: completed,
          weakTopics: evaluation.weakTopics,
          evaluatedAt: today,
        } as Prisma.InputJsonValue,
      },
    });

    if (completed) {
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
          completedTasks: [],
          completedDays: [dayKey],
          progressPercentage: 100,
          currentDay: input.dayNumber + 1,
          xp: xpEarned,
          streak: 0,
          lastActiveDate: new Date(),
        },
        update: {
          currentDay: input.dayNumber + 1,
          completedDays: { push: dayKey },
          progressPercentage: 100,
          lastActiveDate: new Date(),
        },
      });
    }

    return {
      score: evaluation.score,
      percentage: evaluation.percentage,
      correctAnswers: evaluation.correctAnswers,
      weakTopics: evaluation.weakTopics,
      improvementSuggestion: evaluation.improvementSuggestion,
      xpEarned,
      completionStatus: completed,
    };
  }

  private async generateQuestions(input: { roadmapId: string; dayNumber: number; topic: string; skillLevel: string; roadmapTitle: string; careerTitle: string; weakTopics: string[] }) {
    const prompt = buildGenerationPrompt(input);
    try {
      const raw = await aiProvider.generateJsonRaw(prompt, { timeoutMs: 20000, maxTokens: 1600 });
      const parsed = safeParseAIResponse(JSON.parse(raw), quizGenerationOutputSchema);
      const questions = normalizeQuizQuestions(parsed);
      if (questions.length) {
        return questions;
      }
    } catch {
      // fall through to deterministic fallback
    }

    return Array.from({ length: 10 }, (_value, index) => ({
      id: `q${index + 1}`,
      question: `Which statement best describes ${input.topic} concept ${index + 1}?`,
      options: [
        `${input.topic} core idea`,
        `A related ${input.skillLevel} concept`,
        'An unrelated concept',
        'A deployment step',
      ],
      topic: input.topic,
    }));
  }

  private async fallbackEvaluation(
    input: { questions: Array<{ question: string; options: string[] }>; responses: Array<{ question: string; selectedAnswer: string; options?: string[] }> },
    topic: string,
    skillLevel: string
  ) {
    const matched = input.responses.filter((response, index) => {
      const options = response.options || input.questions[index]?.options || [];
      const first = options[0];
      return first ? response.selectedAnswer.trim().toLowerCase() === first.trim().toLowerCase() : false;
    });

    const correctAnswers = matched.length;
    const percentage = Math.round((correctAnswers / Math.max(1, input.questions.length)) * 100);
    const weakTopics = percentage >= 80 ? [] : [topic, skillLevel].filter(Boolean).slice(0, 2);

    return {
      score: correctAnswers,
      percentage,
      correctAnswers,
      weakTopics,
      improvementSuggestion: percentage >= 80
        ? 'Great job. Move to a slightly harder build and revisit the notes once.'
        : `Revisit ${topic}, then answer the same ideas with a short project or flashcards.`,
    };
  }
}

export const quizService = new QuizService();
