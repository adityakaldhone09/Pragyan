import { apiClient, apiPaginatedRequest } from "./apiClient";
import type {
  AssessmentQuestion,
  AssessmentSubmissionResult,
  AssessmentSummary,
  AssessmentMatch,
  AdaptiveAnswerResponse,
  AdaptiveStartResponse,
  AdaptiveSubmitResponse,
} from "@/types/api";

export interface SaveAssessmentInput {
  answers: Record<string, string>;
}

export interface NextQuestionsInput {
  answers: Record<string, string>;
  limit?: number;
}

export interface AssessmentHistoryEntry {
  id: string;
  completedAt?: string;
  answers?: Record<string, string>;
  selectedOptions?: string[];
  analysis?: Record<string, unknown>;
}

export interface PersistedAssessmentRecord {
  id: string;
  answers: string;
  suggestedCareers: string[];
  scores: string;
  strengths: string[];
  weaknesses: string[];
}

export interface SubmitAssessmentResponse extends AssessmentSubmissionResult {
  persisted: PersistedAssessmentRecord | null;
}

export const assessmentService = {
  startAssessment() {
    return apiClient.post<AdaptiveStartResponse>("/assessment/start", {});
  },

  answerAssessment(input: { sessionId: string; questionId: string; answer: string }) {
    return apiClient.post<AdaptiveAnswerResponse>("/assessment/answer", input);
  },

  getAdaptiveNext(sessionId: string) {
    return apiClient.post<AdaptiveAnswerResponse>("/assessment/next", { sessionId });
  },

  submitAdaptiveAssessment(sessionId: string) {
    return apiClient.post<AdaptiveSubmitResponse>("/assessment/submit", { sessionId });
  },

  getAdaptiveResult(resultId: string) {
    return apiClient.get<{
      id: string;
      suggestedCareers: string[];
      scores: Record<string, number>;
      strengths: string[];
      weaknesses: string[];
      topMatches: Array<{ career: string; match: number }>;
      confidence: number;
      createdAt: string;
    }>(`/assessment/results/${encodeURIComponent(resultId)}`, { cacheTtlMs: 5 * 60_000, cacheKey: `assessment-result:${resultId}` });
  },

  getQuestions() {
    return apiClient.get<AssessmentQuestion[]>("/assessment/questions");
  },

  getQuestionsByCategory(category: string) {
    return apiClient.get<AssessmentQuestion[]>(`/assessment/questions/${encodeURIComponent(category)}`);
  },

  getNextQuestions(input: NextQuestionsInput) {
    return apiClient.post<AssessmentQuestion[]>("/assessment/next", {
      answers: input.answers,
      limit: input.limit ?? 3,
    });
  },

  saveAssessment(input: SaveAssessmentInput) {
    return apiClient.post<{ id: string; completedAt: string; analysis: unknown }>("/assessment/save", input);
  },

  submitAssessment(input: SaveAssessmentInput) {
    return apiClient.post<SubmitAssessmentResponse>(
      "/assessment/submit",
      input
    );
  },

  getLatestAssessment() {
    return apiClient.get<AssessmentHistoryEntry | null>("/assessment/latest", { cacheTtlMs: 30_000, cacheKey: "assessment-latest" });
  },

  getAssessmentHistory() {
    return apiPaginatedRequest<AssessmentHistoryEntry>("/assessment/history", { cacheTtlMs: 30_000, cacheKey: "assessment-history" });
  },

  getMetadata() {
    return apiClient.get<unknown>("/assessment/metadata");
  },
};
