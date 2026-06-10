import { apiClient } from './apiClient';
import type { ResumeRecord, ResumeSnapshot } from '@/types/api';

export const resumeService = {
  getResume() {
    return apiClient.get<ResumeRecord | null>('/resume');
  },

  generateResume(regenerate = false) {
    return apiClient.post<ResumeRecord>('/resume/generate', { regenerate });
  },
};

export type { ResumeSnapshot, ResumeRecord };
