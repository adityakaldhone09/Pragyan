export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role?: string;
  avatar?: string | null;
  provider?: string;
  emailVerified?: boolean;
  bio?: string | null;
  skills?: string[];
  interests?: string[];
  education?: string | null;
  experience?: string | null;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface StoredAuthSession extends AuthSession {
  expiresAt?: number;
}

export interface AssessmentQuestion {
  id: string;
  question: string;
  options: string[];
  category?: string;
  type?: string;
  dataSourced?: boolean;
}

export interface AdaptiveProgress {
  answered: number;
  totalRelevant: number;
}

export interface AdaptiveStartResponse {
  sessionId: string;
  question: AssessmentQuestion;
  confidence: number;
  progress: AdaptiveProgress;
}

export interface AdaptiveAnswerResponse {
  sessionId: string;
  confidence: number;
  nextQuestion: AssessmentQuestion | null;
  shouldSubmit: boolean;
  progress?: AdaptiveProgress;
}

export interface AdaptiveCareerMatch {
  careerId: string;
  career: string;
  category: string;
  match: number;
  reasons: string[];
  salaryRange: string;
  demandForecast: number;
  growthRate: number;
  skillGaps: string[];
}

export interface AdaptiveSubmitResponse {
  resultId: string;
  sessionId: string;
  confidence: number;
  topMatches: AdaptiveCareerMatch[];
  allMatches: AdaptiveCareerMatch[];
  summary: {
    topMatch: AdaptiveCareerMatch | null;
    secondaryMatches: AdaptiveCareerMatch[];
    confidence: number;
    suggestedCareers: string[];
    scores: Record<string, number>;
    strengths: string[];
    weaknesses: string[];
    learningRoadmap: Record<string, string[]>;
  };
  ai?: {
    summary?: string;
    skillGaps?: string[];
    roadmap?: Array<{ week: number; items: string[] }>;
    nextActions?: string[];
    targetLevel?: string;
  };
}

export interface AssessmentMatch {
  careerId: string;
  career: string;
  match: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  salaryEstimate?: string;
  category?: string;
  reasons: string[];
  requiredSkills: string[];
  missingSkills: string[];
}

export interface AssessmentSummary {
  suggestedCareers: string[];
  scores: Record<string, number>;
  strengths: string[];
  weaknesses: string[];
}

export interface AssessmentSubmissionResult {
  persisted: {
    id: string;
    answers: string;
    suggestedCareers: string[];
    scores: string;
    strengths: string[];
    weaknesses: string[];
  } | null;
  combinedMatches: AssessmentMatch[] | null;
  summary: AssessmentSummary;
  enhancements?: {
    summary?: string;
    skillGaps?: string[];
    roadmap?: Array<{ week: number; items: string[] }>;
    nextActions?: string[];
    targetLevel?: string;
  };
}

export interface RoadmapWeekTask {
  id?: string;
  title?: string;
  name?: string;
  completed?: boolean;
}

export interface RoadmapMilestone {
  id: string | number;
  title: string;
  status?: 'completed' | 'in-progress' | 'locked' | string;
  duration?: string;
  modules?: RoadmapWeekTask[];
  description?: string;
  progress?: number;
  category?: string;
  level?: string;
  tags?: string[];
}

export interface RoadmapSummary {
  id?: string;
  title: string;
  description?: string;
  category?: string;
  level?: string;
  duration?: string;
  estimatedHours?: number;
  icon?: string;
  tags?: string[];
  progress?: number;
  milestones?: RoadmapMilestone[];
}

export interface JobFeedItem {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  salary: string | null;
  skills: string[];
  applyLink: string;
  source: string;
  createdAt: string;
  matchScore: number;
  applied: boolean;
  appliedAt?: string | null;
}

export interface JobFeed {
  recentJobs: JobFeedItem[];
  recommendedJobs: JobFeedItem[];
  appliedJobs: JobFeedItem[];
}

export interface AIStatus {
  enabled: boolean;
  provider: string;
  model: string;
  fallbackAvailable: {
    gemini: boolean;
    groq: boolean;
  };
}

export interface TelemetrySnapshot {
  calls: number;
  cacheHits: number;
  failures: number;
  fallbacks: number;
  serviceUnavailable: number;
  providerCalls: Record<string, number>;
  providerFailures: Record<string, number>;
  providerServiceUnavailable: Record<string, number>;
}