import { apiClient } from './apiClient';
import type { CompleteLearningInput, DailyLearningSnapshot } from '@/types/api';

export const learningService = {
  getToday() {
    return apiClient.get<DailyLearningSnapshot>('/learning/today');
  },

  getDay(dayId: string) {
    return apiClient.get<DailyLearningSnapshot>(`/learning/day/${encodeURIComponent(dayId)}`);
  },

  complete(input: CompleteLearningInput) {
    return apiClient.post<DailyLearningSnapshot>('/learning/complete', input);
  },
};
