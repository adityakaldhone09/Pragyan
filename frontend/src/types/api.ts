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
  age?: number | null;
  location?: string | null;
  phone?: string | null;
  linkedin?: string | null;
  skills?: string[];
  interests?: string[];
  preferences?: string[];
  education?: string | null;
  experience?: string | null;
  experienceType?: 'fresher' | 'experienced' | null;
  educationEntries?: Array<{
    qualification: string;
    city: string;
    percentage: number;
  }>;
  skillLevel?: string | null;
  xp?: number;
  streak?: number;
  level?: number;
  currentTitle?: string | null;
  careerTrack?: string | null;
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

export interface PortfolioProject {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  techStack: string[];
  highlights: string[];
  liveUrl?: string | null;
  repoUrl?: string | null;
  featured: boolean;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export interface Certification {
  id: string;
  userId: string;
  title: string;
  issuer: string;
  credentialId?: string | null;
  credentialUrl?: string | null;
  issuedAt?: string | null;
  expiresAt?: string | null;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GitHubRepositorySummary {
  id: string;
  userId: string;
  repoId: string;
  name: string;
  fullName: string;
  htmlUrl: string;
  description?: string | null;
  language?: string | null;
  stars: number;
  forks: number;
  isPrivate: boolean;
  defaultBranch?: string | null;
  pushedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileCompletionSection {
  key: string;
  label: string;
  score: number;
}

export interface ProfileBuilderSnapshot {
  user: AuthUser;
  providerStatus: ConnectedProvidersResponse;
  completion: {
    score: number;
    sections: ProfileCompletionSection[];
    missing: string[];
  };
  githubRepositories: GitHubRepositorySummary[];
  projects: PortfolioProject[];
  certifications: Certification[];
}

export interface AIProviderHealthResult {
  status: 'healthy' | 'unhealthy';
  model: string;
  latency: number;
  error?: string;
}

export interface AIHealthSnapshot {
  gemini: AIProviderHealthResult;
  groq: AIProviderHealthResult;
  telemetry: {
    calls: number;
    failures: number;
    fallbackCount: number;
    fallbackRate: number;
  };
  checkedAt: string;
  overallStatus: 'healthy' | 'degraded';
}

export interface XpProgression {
  xp: number;
  level: number;
  title: string;
  currentThreshold: number;
  nextThreshold: number;
  xpToNextLevel: number;
  progressPercent: number;
  nextTitle: string;
  milestone: string;
  storedLevel?: number;
  storedTitle?: string;
  streak?: number;
}

export interface ProfileCoachResponse {
  summary: string;
  completionScore: number;
  strengths: string[];
  missingFields: string[];
  nextSteps: string[];
  suggestedHeadline: string;
  suggestedCareerTrack: string;
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

export interface RoadmapProjectResource {
  title: string;
  url: string;
  provider: string;
}

export interface RoadmapProject {
  id: string;
  title: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  unlockAfterTopics: string[];
  estimatedMinutes: number;
  xpReward: number;
  skillsUsed: string[];
  githubIdeas?: string[];
  resources?: RoadmapProjectResource[];
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
  projects?: RoadmapProject[];
  progression?: Array<{
    stage: string;
    title: string;
    description: string;
  }>;
}

export type JourneyAdaptiveMode = 'recovery' | 'growth' | 'stretch';

export interface JourneyTask {
  id: string;
  title: string;
  type: 'learn' | 'practice' | 'quiz' | 'project' | 'revision' | string;
  estimatedMinutes: number;
  xp: number;
  completed: boolean;
  details?: string;
}

export interface JourneyDay {
  dayNumber: number;
  title: string;
  focus: string;
  topics: string[];
  tasks: JourneyTask[];
  resources: Array<{
    title: string;
    provider?: string;
    type?: string;
    url?: string;
    estimatedMinutes?: number;
  }>;
  estimatedMinutes: number;
  xpReward: number;
  completed: boolean;
}

export interface JourneySkillProgress {
  skill: string;
  mastery: number;
  completed: boolean;
  weak: boolean;
}

export interface JourneyJobEligibility {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string | null;
  jobType: string;
  role: string;
  requiredSkills: string[];
  missingSkills: string[];
  matchPercentage: number;
  eligible: boolean;
  source: string;
  applyLink: string;
}

export interface PlacementReadiness {
  score: number;
  label: string;
  completedSkills: string[];
  missingSkills: string[];
  eligibleJobs: number;
  strengths?: string[];
  weakAreas?: string[];
  recommendedNextStep?: string;
  factors?: Array<{
    label: string;
    score: number;
    weight: number;
    note: string;
  }>;
}

export interface DailyAnalyticsTrendPoint {
  date: string;
  readinessScore: number;
  xp: number;
  studyHours: number;
  completedTasks: number;
  streak: number;
  eligibleJobs: number;
  weakSkillCount: number;
}

export interface JourneyPayload {
  careerSlug: string;
  resolvedCareerSlug: string;
  careerTitle: string;
  roadmapId: string | null;
  roadmapTitle: string;
  duration: string;
  industryDemand: string;
  salaryRange: string;
  completionPercentage: number;
  xp: number;
  streak: number;
  currentDay: number;
  adaptiveMode: JourneyAdaptiveMode;
  adaptiveReason: string;
  weakSkills: string[];
  completedSkills: string[];
  nextAction: string;
  mentorContext: {
    career: string;
    roadmapTitle: string;
    currentDay: string;
    completedSkills: string[];
    weakSkills: string[];
    mentorLevel: string;
    learningLevel: string;
  };
  roadmapDays: JourneyDay[];
  skillProgress: JourneySkillProgress[];
  aiInsights: string[];
  eligibleJobs: JourneyJobEligibility[];
  placementReadiness: PlacementReadiness;
  topCareerMatch: number;
  currentPlan: {
    todayGoal: string;
    estimatedMinutes: number;
    tasks: Array<{ type: string; title: string; minutes: number; details?: string }>;
    xpReward: number;
    level: string;
    adaptiveMode: JourneyAdaptiveMode;
    adaptiveReason: string;
    difficultyMultiplier: number;
  };
  userLevel?: number;
  userTitle?: string | null;
  careerTrack?: string | null;
}

export interface JourneyDashboardSnapshot {
  currentJourney: JourneyPayload | null;
  currentDay: number;
  xp: number;
  streak: number;
  aiInsights: string[];
  weakSkills: string[];
  nextAction: string;
  eligibleJobs: JourneyJobEligibility[];
  placementReadiness: PlacementReadiness | null;
  trend?: DailyAnalyticsTrendPoint[];
}

export interface DailyLearningResourceItem {
  title: string;
  provider: string;
  type: string;
  url: string;
  description: string;
  estimatedMinutes: number;
  isOfficial?: boolean;
}

export interface DailyLearningDay {
  dayNumber: number;
  title: string;
  topic: string;
  topicSlug: string;
  overview: string;
  task: string;
  resources: DailyLearningResourceItem[];
  xpReward: number;
  streakReward: number;
  completed: boolean;
  quizUnlocked: boolean;
  weakTopics: string[];
}

export interface DailyLearningProgress {
  currentDay: number;
  progressPercentage: number;
  xp: number;
  streak: number;
  completedDays: string[];
  quizCompletedDays: string[];
  quizUnlocked: boolean;
  weakTopics: string[];
  lastCompletedAt: string | null;
}

export interface DailyLearningSnapshot {
  roadmapId: string;
  roadmapTitle: string;
  careerTitle: string;
  currentDay: number;
  days: DailyLearningDay[];
  today: DailyLearningDay;
  progress: DailyLearningProgress;
  xp: number;
  streak: number;
  totalDays: number;
}

export interface CompleteLearningInput {
  roadmapId: string;
  dayNumber: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  topic: string;
}

export interface QuizGenerationResponse {
  roadmapId: string;
  dayNumber: number;
  topic: string;
  skillLevel: string;
  questions: QuizQuestion[];
  quizUnlocked: boolean;
}

export interface QuizResponseChoice {
  questionId?: string;
  question: string;
  selectedAnswer: string;
  options?: string[];
}

export interface QuizEvaluationResponse {
  score: number;
  percentage: number;
  correctAnswers: number;
  weakTopics: string[];
  improvementSuggestion: string;
  xpEarned: number;
  completionStatus: boolean;
}

export interface ResumeProject {
  title: string;
  description: string;
  impact: string;
  technologies: string[];
  url?: string | null;
}

export interface ResumeExperience {
  title: string;
  company: string;
  period: string;
  description: string;
  achievements: string[];
}

export interface ResumeEducation {
  school: string;
  qualification: string;
  year?: string;
  description?: string;
}

export interface ResumeCertification {
  title: string;
  issuer: string;
  date?: string;
  url?: string | null;
}

export interface ResumeSnapshot {
  summary: string;
  skills: string[];
  projects: ResumeProject[];
  experience: ResumeExperience[];
  education: ResumeEducation[];
  certifications: ResumeCertification[];
  achievements: string[];
  targetRole: string;
}

export interface ResumeRecord {
  id: string;
  version: number;
  generatedAt: string;
  summary?: string | null;
  data: ResumeSnapshot;
}

export interface MentorContextSnapshot {
  career?: string;
  roadmap?: string;
  currentDay?: string;
  weakSkills?: string[];
  completedSkills?: string[];
  adaptiveMode?: string;
  currentGoal?: string;
  placementReadiness?: number;
  learningStyle?: string;
}

export interface MentorMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  contextSnapshot?: MentorContextSnapshot | null;
}

export interface MentorConversation {
  conversationId: string;
  title: string;
  journeyId?: string | null;
  messages: MentorMessage[];
}

export interface MentorChatResponse {
  conversationId: string;
  title: string;
  reply: string;
  provider?: string;
  fallbackUsed?: boolean;
  userMessageId?: string;
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
  quizScore?: number | null;
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
    adaptiveMode?: 'recovery' | 'growth' | 'stretch';
    adaptiveReason?: string;
    difficultyMultiplier?: number;
    recommendedTaskMix?: {
      learn: number;
      practice: number;
      quiz: number;
      revision: number;
      project: number;
    };
  };
  totalTopics: number;
  topics: string[];
}

export interface SmartDailyPlanTask {
  type: 'learn' | 'practice' | 'quiz' | 'revision' | 'project' | string;
  title: string;
  minutes: number;
  details?: string;
}

export interface SmartDailyPlanResponse {
  todayGoal: string;
  estimatedMinutes: number;
  tasks: SmartDailyPlanTask[];
  xpReward: number;
  level: string;
  rationale?: string;
  adaptiveMode?: 'recovery' | 'growth' | 'stretch';
  adaptiveReason?: string;
  difficultyMultiplier?: number;
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
