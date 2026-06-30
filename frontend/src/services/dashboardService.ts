import { api } from "@/services/apiClient";
import type { DashboardData } from "@/types/api";

export const dashboardService = {
  getDashboard() {
    return api.get<DashboardData>("/progress/user/dashboard");
  },
};
