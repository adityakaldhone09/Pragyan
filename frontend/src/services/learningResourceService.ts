import { apiClient, apiPaginatedRequest } from './apiClient';
import type { LearningResourceHistoryItem, LearningResourceItem, LearningResourceRecommendation, RoadmapSummary } from '@/types/api';

export interface LearningResourceQuery {
  roadmapId?: string;
  category?: string;
  skill?: string;
  topic?: string;
  type?: string;
  difficulty?: string;
  dayNumber?: number;
  page?: number;
  limit?: number;
  query?: string;
}

export interface LearningResourceHistoryInput {
  resourceId: string;
  roadmapId?: string;
  completed: boolean;
  progressPercent?: number;
  quizScore?: number;
  notes?: string;
  source?: string;
}

export const learningResourceService = {
  getResources(query?: LearningResourceQuery) {
    const params = new URLSearchParams();
    if (query?.roadmapId) params.set('roadmapId', query.roadmapId);
    if (query?.category) params.set('category', query.category);
    if (query?.skill) params.set('skill', query.skill);
    if (query?.topic) params.set('topic', query.topic);
    if (query?.type) params.set('type', query.type);
    if (query?.difficulty) params.set('difficulty', query.difficulty);
    if (query?.dayNumber) params.set('dayNumber', String(query.dayNumber));
    if (query?.page) params.set('page', String(query.page));
    if (query?.limit) params.set('limit', String(query.limit));
    if (query?.query) params.set('query', query.query);

    return apiPaginatedRequest<LearningResourceItem>(`/learning-resources${params.toString() ? `?${params.toString()}` : ''}`);
  },

  getRoadmapRecommendations(roadmapId: string, params?: { dayNumber?: number; refresh?: boolean }) {
    const searchParams = new URLSearchParams();
    if (params?.dayNumber) searchParams.set('dayNumber', String(params.dayNumber));
    if (params?.refresh) searchParams.set('refresh', 'true');

    return apiClient.get<LearningResourceRecommendation>(`/learning-resources/roadmaps/${encodeURIComponent(roadmapId)}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`);
  },

  getPersonalizedResources(roadmapId: string) {
    return apiClient.get<LearningResourceRecommendation>(`/learning-resources/personalized?roadmapId=${encodeURIComponent(roadmapId)}`);
  },

  getHistory(roadmapId?: string) {
    const query = roadmapId ? `?roadmapId=${encodeURIComponent(roadmapId)}` : '';
    return apiClient.get<LearningResourceHistoryItem[]>(`/learning-resources/history${query}`);
  },

  saveHistory(input: LearningResourceHistoryInput) {
    return apiClient.post<LearningResourceHistoryItem>(`/learning-resources/history`, input);
  },
};

export type LearningResourceCatalog = Awaited<ReturnType<typeof apiPaginatedRequest<LearningResourceItem>>>;