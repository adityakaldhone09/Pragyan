import { apiClient } from './apiClient';
import type { XpProgression } from '@/types/api';

export const xpService = {
  getProgression() {
    return apiClient.get<XpProgression>('/xp/progression');
  },
};