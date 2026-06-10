import { z } from 'zod';

export const quizQuestionSchema = z.object({
  id: z.string().min(1).optional(),
  question: z.string().min(5).max(500),
  options: z.array(z.string().min(1)).min(2).max(6),
  topic: z.string().min(1).optional(),
});

export const quizResponseSchema = z.object({
  questionId: z.string().min(1).optional(),
  question: z.string().min(5).max(500),
  selectedAnswer: z.string().min(1),
  options: z.array(z.string().min(1)).min(2).max(6).optional(),
});

export const generateQuizSchema = z.object({
  roadmapId: z.string().min(1).optional(),
  dayNumber: z.coerce.number().int().min(1).optional(),
  topic: z.string().min(2).max(200).optional(),
  skillLevel: z.string().min(2).max(80).optional(),
});

export const evaluateQuizSchema = z.object({
  roadmapId: z.string().min(1),
  dayNumber: z.coerce.number().int().min(1),
  topic: z.string().min(2).max(200),
  skillLevel: z.string().min(2).max(80).optional(),
  questions: z.array(quizQuestionSchema).min(1).max(20),
  responses: z.array(quizResponseSchema).min(1).max(20),
});

export const quizGenerationOutputSchema = z.object({
  questions: z.array(quizQuestionSchema).min(1).max(10),
});

export const quizEvaluationOutputSchema = z.object({
  score: z.number().min(0).max(10),
  percentage: z.number().min(0).max(100),
  correctAnswers: z.number().min(0).max(10),
  weakTopics: z.array(z.string().min(1)).max(10),
  improvementSuggestion: z.string().min(5).max(300),
});

export type GenerateQuizInput = z.infer<typeof generateQuizSchema>;
export type EvaluateQuizInput = z.infer<typeof evaluateQuizSchema>;
