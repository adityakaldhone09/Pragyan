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
  currentTitle?: string | null;
  careerTrack?: string | null;
  tenthBoard?: string | null;
  tenthScore?: string | null;
  twelfthBoard?: string | null;
  twelfthScore?: string | null;
  currentCourse?: string | null;
  cgpa?: string | null;
  linkedAccounts?: Array<{
    provider: string;
    providerId: string;
    avatar?: string | null;
    emailVerified?: boolean;
  }>;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface StoredAuthSession extends AuthSession {
  expiresAt?: number;
}

export interface ProviderConnectionStatus {
  linked: boolean;
  email?: string;
  username?: string;
  verified?: boolean;
  avatar?: string | null;
}

export interface ConnectedProvidersResponse {
  google: ProviderConnectionStatus;
  github: ProviderConnectionStatus;
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

export interface RoadmapLearningResource {
  title: string;
  provider: string;
  type: string;
  url: string;
  estimatedMinutes?: number;
}

export interface RoadmapLearningDay {
  day: number;
  focus: string;
  dailyTopics?: string[];
  tasks: string[];
  resources?: RoadmapLearningResource[];
  deliverable: string;
  xp: number;
}

export interface RoadmapSummary {
  id?: string;
  title: string;
  description?: string;
  category?: string;
  careerPath?: string;
  level?: string;
  difficulty?: string;
  duration?: string;
  estimatedHours?: number;
  icon?: string;
  tags?: string[];
  progress?: number;
  milestones?: RoadmapMilestone[];
  requiredSkills?: string[];
  learningStructure?: RoadmapLearningDay[];
  progression?: Array<{
    stage: string;
    title: string;
    description: string;
  }>;
}

export type LearningResourceType = 'youtube' | 'documentation' | 'practice' | 'article' | 'mini-project' | 'certification';

export interface LearningResourceItem {
  id: string;
  resourceKey?: string;
  roadmapId?: string | null;
  roadmapCategory: string;
  roadmapTitle?: string | null;
  skill: string;
  topic: string;
  topicSlug?: string;
  dayNumber?: number | null;
  resourceType: LearningResourceType | string;
  difficulty: string;
  title: string;
  url: string;
  description: string;
  provider: string;
  estimatedMinutes?: number | null;
  isOfficial?: boolean;
  aiScore?: number;
  aiReason?: string;
  tags?: string[];
  metadata?: Record<string, unknown> | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface LearningResourceHistoryItem {
  id: string;
  userId: string;
  resourceId: string;
  roadmapId?: string | null;
  completed: boolean;
  progressPercent: number;
  notes?: string | null;
  source?: string | null;
  completedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  resource?: LearningResourceItem;
}

export interface LearningResourceDayGroup {
  dayNumber: number;
  focus: string;
  resources: LearningResourceItem[];
  completedCount: number;
  totalCount: number;
  progress: number;
}

export interface LearningResourceRecommendation {
  roadmap: RoadmapSummary;
  resources: LearningResourceItem[];
  days: LearningResourceDayGroup[];
  history: LearningResourceHistoryItem[];
  profile?: {
    careerGoal: string;
    completedTopics: string[];
    weakSkills: string[];
    assessmentWeaknesses: string[];
    assessmentStrengths: string[];
    skillSignal: string[];
  };
  ai: {
    enabled: boolean;
    provider: string;
    used: boolean;
    summary?: string;
  };
  totalTopics: number;
  topics: string[];
}

export interface RoadmapDomainSection {
  id: string;
  title: string;
  summary: string;
  priority: number;
  focusPoints: string[];
  category?: string;
  roadmaps: RoadmapSummary[];
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

export interface LLMCareerRecommendation {
  topCareers: Array<{
    career: string;
    confidence: number;
    reason: string;
    requiredSkills: string[];
    missingSkills: string[];
    roadmap: string[];
  }>;
  summary: string;
  provider?: string;
  fallbackUsed?: boolean;
}
