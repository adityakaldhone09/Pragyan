import { apiClient } from "./apiClient";
import type { JourneyDashboardSnapshot, JourneyPayload } from "@/types/api";

export const journeyService = {
  getJourney(careerSlug?: string) {
    const path = careerSlug ? `/journey/${encodeURIComponent(careerSlug)}` : "/journey/dashboard";
    return apiClient.get<JourneyPayload | JourneyDashboardSnapshot>(path);
  },

  getDashboardJourney() {
    return apiClient.get<JourneyDashboardSnapshot>("/journey/dashboard");
  },
};
