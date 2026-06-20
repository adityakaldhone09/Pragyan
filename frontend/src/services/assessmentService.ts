import { apiClient, apiPaginatedRequest } from "./apiClient";
import type {
  AssessmentQuestion,
  AssessmentSubmissionResult,
  AssessmentSummary,
  AssessmentMatch,
  AdaptiveAnswerResponse,
  AdaptiveStartResponse,
  AdaptiveSubmitResponse,
  LLMCareerRecommendation,
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

export type HybridExperienceLevel = "beginner" | "intermediate" | "advanced";
export type HybridFunnelLevel = "General" | "Specific" | "Specialization" | "Depth";
export type HybridCareerTrack = "Government Job" | "Private Job";

export interface HybridUserProfile {
  userId: string;
  role: string;
  domain: string;
  experience: HybridExperienceLevel;
  age?: number;
  education?: string;
  careerTrack?: HybridCareerTrack;
  hobbies: string[];
  interests: string[];
  contactInfo?: string;
  tenthGrade?: string;
  twelfthGrade?: string;
  highestQualification?: string;
  targetRole: string;
  domainExperience?: string;
  currentSkills: string[];
  careerPath?: string;
  careerSubPath?: string;
}

export interface HybridParsedProfile {
  Education: string;
  Experience: string;
  Skills: string[];
  ContactInfo: string;
  confidence?: number;
}

export interface HybridDomainQuestion {
  id: string;
  domain: string;
  skill: string;
  question: string;
  type: "rating";
}

export interface HybridDomainAnswer {
  skill: string;
  rating: number;
}

export interface HybridAssessmentQuestion {
  questionId: string;
  questionText: string;
  options?: string[] | null;
  topic: string;
  funnelLevel: HybridFunnelLevel;
}

export type HybridQuestionType = "SINGLE_CHOICE" | "MULTIPLE_CHOICE";

export interface HybridUserAssessmentAnswerInput {
  userId: string;
  sessionId?: string;
  phase: 1 | 2 | 3;
  questionId?: string;
  questionText: string;
  questionType: HybridQuestionType;
  topic?: string;
  funnelLevel?: HybridFunnelLevel;
  options: string[];
  selectedAnswer: string[];
}

export interface HybridStateMachineResponse {
  currentFunnelLevel: HybridFunnelLevel;
  reasoningToast: string;
  isCompleted: boolean;
  nextQuestion?: HybridAssessmentQuestion | null;
  finalSummary?: {
    strengths: string[];
    weakTopics: string[];
    recommendedMode: "Recovery" | "Growth" | "Stretch";
    recommendedRole?: string;
    requiredJobSkills?: string[];
    skillGaps?: string[];
    jobAvailabilityInsight?: string;
    realizedStrengths?: string[];
    unrealizedStrengths?: string[];
    learnedSkills?: string[];
    weaknesses?: string[];
  } | null;
}

export interface HybridStartResponse {
  sessionId: string;
  response: HybridStateMachineResponse;
}

export interface HybridAnswerResponse {
  response: HybridStateMachineResponse;
  downstream?: unknown;
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

  getLLMCareerRecommendation(payload: {
    interests: string[];
    strengths: string[];
    weaknesses: string[];
    skills: string[];
    quizScore: number;
    learningHours: number;
  }) {
    return apiClient.post<LLMCareerRecommendation>(
      "/ai/llm-career-recommendation",
      payload,
      { timeoutMs: 30_000 }
    );
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

  parseHybridResume(resumeText: string) {
    return apiClient.post<HybridParsedProfile>("/assessment/hybrid/parse-resume", { resumeText }, { timeoutMs: 30_000 });
  },

  getHybridDomainQuestions(domain: string) {
    return apiClient.get<{ questions: HybridDomainQuestion[] }>(`/assessment/hybrid/domain-questions/${encodeURIComponent(domain)}`);
  },

  saveHybridAnswers(answers: HybridUserAssessmentAnswerInput[]) {
    return apiClient.post<{ count: number }>("/assessment/hybrid/answers", { answers });
  },

  startHybridAssessment(input: {
    userId: string;
    profile: HybridUserProfile;
    domainAnswers: HybridDomainAnswer[];
  }) {
    return apiClient.post<HybridStartResponse>("/assessment/hybrid/start", input, { timeoutMs: 45_000 });
  },

  submitHybridAnswer(sessionId: string, answer: string) {
    return apiClient.post<HybridAnswerResponse>(
      `/assessment/hybrid/${encodeURIComponent(sessionId)}/answer`,
      { answer },
      { timeoutMs: 45_000 }
    );
  },
};
