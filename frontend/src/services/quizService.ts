import { apiClient } from './apiClient';

export async function getTodayQuiz(roadmapId?: string) {
  const path = `/api/quiz/today${roadmapId ? `?roadmapId=${encodeURIComponent(roadmapId)}` : ''}`;
  const res = await apiClient.get(path);
  return res.data;
}

export async function submitQuiz(payload: { quizId?: string; answers: number[]; roadmapId?: string; dayNumber?: number }) {
  const res = await apiClient.post('/api/quiz/submit', payload);
  return res.data;
}
