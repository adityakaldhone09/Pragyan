import { apiClient } from "./apiClient";
import type { AIStatus, SmartDailyPlanResponse, TelemetrySnapshot, RoadmapSummary } from "@/types/api";

export interface AssistantChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AssistantChatInput {
  message: string;
  careerId?: string;
  context?: {
    career?: string;
    roadmap?: string;
    goal?: string;
    mentorLevel?: string;
    mentorDay?: string;
    mentorTopic?: string;
    completedTopics?: string[];
    weakSkills?: string[];
    roadmapTitle?: string;
  };
  history?: AssistantChatMessage[];
}

export interface DailyPlanInput {
  roadmapTitle: string;
  roadmapCategory?: string;
  currentDay: number;
  completedTopics: string[];
  weakSkills: string[];
  level: string;
  availableTime: number;
  missedDays: number;
  streak: number;
  currentFocus?: string;
  currentTopics?: string[];
}

export interface AssistantChatResponse {
  reply: string;
  provider?: string;
  fallbackUsed?: boolean;
}

export const aiService = {
  getStatus() {
    return apiClient.get<AIStatus>("/ai/status");
  },

  getTelemetry() {
    return apiClient.get<TelemetrySnapshot>("/ai/telemetry");
  },

  chat(input: AssistantChatInput) {
    return apiClient.post<AssistantChatResponse>("/ai/chat", input);
  },

  generateDailyPlan(input: DailyPlanInput) {
    return apiClient.post<SmartDailyPlanResponse>("/ai/daily-plan", input);
  },

  getRoadmapsForCareer(career: string) {
    return apiClient.get<RoadmapSummary[]>(`/ai/roadmaps/${encodeURIComponent(career)}`);
  },

  generatePersonalizedRoadmap(careerGoal: string, skillLevel: string) {
    return apiClient.post<RoadmapSummary[]>("/ai/personalized-roadmap", { careerGoal, skillLevel });
  },
};