import { apiClient } from './apiClient';
import type { QuizEvaluationResponse, QuizGenerationResponse, QuizResponseChoice } from '@/types/api';

export async function getTodayQuiz(roadmapId?: string) {
  const path = `/quiz/today${roadmapId ? `?roadmapId=${encodeURIComponent(roadmapId)}` : ''}`;
  const res = await apiClient.get<QuizGenerationResponse>(path);
  return res;
}

export async function submitQuiz(payload: { quizId?: string; answers: number[]; roadmapId?: string; dayNumber?: number }) {
  const res = await apiClient.post('/quiz/submit', payload);
  return res;
}

export async function generateQuiz(payload: {
  roadmapId?: string;
  dayNumber?: number;
  topic?: string;
  skillLevel?: string;
}) {
  return apiClient.post<QuizGenerationResponse>('/quiz/generate', payload);
}

export async function evaluateQuiz(payload: {
  roadmapId: string;
  dayNumber: number;
  topic: string;
  skillLevel?: string;
  questions: Array<{ id: string; question: string; options: string[]; topic: string }>;
  responses: QuizResponseChoice[];
}) {
  return apiClient.post<QuizEvaluationResponse>('/quiz/evaluate', payload);
}
