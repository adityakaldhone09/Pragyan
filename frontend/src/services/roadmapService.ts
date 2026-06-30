import { api } from "@/services/apiClient";
import type { PaginatedResponse, RoadmapSummary, UserProgress } from "@/types/api";

export const roadmapService = {
  async getByCareer(career: string) {
    const params = new URLSearchParams({ query: career, limit: "1" });
    const response = await api.paginated<RoadmapSummary>(`/roadmaps?${params.toString()}`);
    return response.data[0] || null;
  },
  listByCareer(career: string): Promise<PaginatedResponse<RoadmapSummary>> {
    const params = new URLSearchParams({ query: career, limit: "10" });
    return api.paginated<RoadmapSummary>(`/roadmaps?${params.toString()}`);
  },
  getProgress(roadmapId: string) {
    return api.get<UserProgress>(`/roadmaps/progress?roadmapId=${encodeURIComponent(roadmapId)}`);
  },
  updateTask(taskId: string, input: { roadmapId: string; totalTasks: number; dayId?: string; completed: boolean; xpReward?: number }) {
    return api.patch<{ progress: UserProgress }>(`/roadmaps/task/${encodeURIComponent(taskId)}`, input);
  },
};
