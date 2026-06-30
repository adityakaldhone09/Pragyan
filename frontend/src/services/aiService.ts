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

export interface AIChatAction {
  id: string;
  label: string;
  description?: string;
  route: string;
  type?: string;
}

export interface AIChatResponse {
  reply: string;
  provider?: string;
  fallbackUsed?: boolean;
  actions?: AIChatAction[];
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
    return api.post<AIChatResponse>("/ai/chat", { message, history, context });
  },
  recordActionEvent(payload: { actionId: string; actionType: string; label?: string; route: string; source?: string }) {
    return api.post('/ai/action-event', payload);
  },
  getCareerRecommendations() {
    return api.get<AICareerRecommendation[]>("/ai/recommend-careers");
  },
  getTopCareer() {
    return api.get<any>('/career-matching/top-career').then((match) => ({
      career: match?.career?.title || match?.career || "",
      score: match?.matchScore || match?.score || 0,
      reason: Array.isArray(match?.reasons) ? match.reasons[0] : match?.reason || undefined,
    }));
  },
  generateAssessmentReport(input: AssessmentReportInput) {
    return api.post<{ report: unknown; mode: string }>("/ai/report", input);
  },
  generateLearningRoadmap(input: LearningRoadmapInput) {
    return api.post<{ roadmap: unknown; mode: string; fallback?: boolean }>("/ai/roadmap", input);
  },
};
