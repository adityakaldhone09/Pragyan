import { prisma } from '@/lib/prisma';
import type { UserAssessmentAnswerInput } from '@/types/hybridAssessment';

export async function saveUserAnswer(input: UserAssessmentAnswerInput): Promise<void> {
  await prisma.userAssessmentAnswer.create({
    data: normalizeAnswer(input),
  });
}

export async function saveUserAnswers(inputs: UserAssessmentAnswerInput[]): Promise<{ count: number }> {
  if (!inputs.length) return { count: 0 };

  const result = await prisma.userAssessmentAnswer.createMany({
    data: inputs.map(normalizeAnswer),
  });

  return { count: result.count };
}

function normalizeAnswer(input: UserAssessmentAnswerInput) {
  return {
    userId: input.userId,
    sessionId: input.sessionId,
    phase: input.phase,
    questionId: input.questionId,
    questionText: input.questionText,
    questionType: input.questionType,
    topic: input.topic,
    funnelLevel: input.funnelLevel,
    options: input.options,
    selectedAnswer: input.selectedAnswer,
  };
}
