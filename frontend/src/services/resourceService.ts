import { api } from "@/services/apiClient";
import type { LearningResourceItem } from "@/types/api";

export const supportedResourceDomains = [
  "AI Engineer",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "SOC Analyst",
  "Cyber Security",
  "Data Science",
  "Cloud",
];

export const resourceService = {
  async list(domain = "Data Scientist", type?: string, query?: string) {
    const params = new URLSearchParams({ category: domain, limit: "24" });
    if (type && type !== "All") params.set("type", type);
    if (query) params.set("query", query);
    const response = await api.paginated<LearningResourceItem>(`/learning-resources?${params.toString()}`);
    return response.data;
  },
};
