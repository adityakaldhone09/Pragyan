import { api } from "@/services/apiClient";

export interface AIChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AICareerRecommendation {
  career: string;
  score: number;
  reason?: string;
}

export interface AssessmentReportInput {
  topMatches: unknown[];
  confidence?: number;
  strengths?: string[];
  weaknesses?: string[];
  targetCareer?: string;
}

export interface LearningRoadmapInput {
  targetCareer: string;
  skillGaps?: string[];
  timelineWeeks?: number;
  profileSummary?: string;
}

export const aiService = {
  chat(message: string, history: AIChatMessage[] = [], context: Record<string, unknown> = {}) {
    return api.post<{ reply: string; provider?: string; fallbackUsed?: boolean }>("/ai/chat", { message, history, context });
  },
  getCareerRecommendations() {
    return api.get<AICareerRecommendation[]>("/ai/recommend-careers");
  },
  generateAssessmentReport(input: AssessmentReportInput) {
    return api.post<{ report: unknown; mode: string }>("/ai/report", input);
  },
  generateLearningRoadmap(input: LearningRoadmapInput) {
    return api.post<{ roadmap: unknown; mode: string; fallback?: boolean }>("/ai/roadmap", input);
  },
};
