import { apiClient, apiPaginatedRequest } from "./apiClient";
import type { RoadmapSummary } from "@/types/api";

export interface RoadmapProgressInput {
  roadmapId: string;
  completedTasks: string[];
  completedDays: string[];
  progressPercentage: number;
  currentDay: number;
}

export interface RoadmapTaskProgressInput {
  roadmapId: string;
  totalTasks: number;
  dayId: string;
  completed: boolean;
  xpReward?: number;
}

export const roadmapService = {
  getAllRoadmaps(query?: { category?: string; careerPath?: string; level?: string; page?: number; limit?: number; query?: string }) {
    const params = new URLSearchParams();
    if (query?.category) params.set("category", query.category);
    if (query?.careerPath) params.set("careerPath", query.careerPath);
    if (query?.level) params.set("level", query.level);
    if (query?.query) params.set("query", query.query);
    if (query?.page) params.set("page", String(query.page));
    if (query?.limit) params.set("limit", String(query.limit));

    return apiPaginatedRequest<RoadmapSummary>(`/roadmaps${params.toString() ? `?${params.toString()}` : ""}`);
  },

  getRoadmap(id: string) {
    return apiClient.get<RoadmapSummary>(`/roadmaps/${id}`);
  },

  getRoadmapsByCategory(category: string, page = 1, limit = 10) {
    return apiPaginatedRequest<RoadmapSummary>(`/roadmaps/category/${encodeURIComponent(category)}?page=${page}&limit=${limit}`);
  },

  searchRoadmaps(query: string) {
    return apiClient.get<RoadmapSummary[]>(`/roadmaps/search?q=${encodeURIComponent(query)}`);
  },

  getCategories() {
    return apiClient.get<string[]>("/roadmaps/categories");
  },

  saveProgress(input: RoadmapProgressInput) {
    return apiClient.post<unknown>("/roadmaps/progress", input);
  },

  getProgress(roadmapId?: string) {
    const query = roadmapId ? `?roadmapId=${encodeURIComponent(roadmapId)}` : "";
    return apiClient.get<unknown>(`/roadmaps/progress${query}`);
  },

  updateTaskProgress(id: string, input: RoadmapTaskProgressInput) {
    return apiClient.patch<unknown>(`/roadmaps/task/${id}`, input);
  },

  skillUp(careerId: string) {
    return apiClient.get<unknown>(`/roadmaps/skillup/${careerId}`);
  },
};