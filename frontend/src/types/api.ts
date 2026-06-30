export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
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
  experience?: string | null;
  experienceType?: string | null;
  education?: string | null;
  educationEntries?: unknown;
  skillLevel?: string | null;
  currentTitle?: string | null;
  careerTrack?: string | null;
  tenthBoard?: string | null;
  tenthScore?: string | null;
  twelfthBoard?: string | null;
  twelfthScore?: string | null;
  currentCourse?: string | null;
  cgpa?: string | null;
  xp?: number;
  streak?: number;
  createdAt?: string;
  updatedAt?: string;
  linkedAccounts?: Array<{
    provider: string;
    providerId?: string;
    avatar?: string | null;
    emailVerified?: boolean;
  }>;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface DashboardData {
  user: {
    id: string;
    fullName: string;
    xp?: number;
    streak?: number;
  };
  progress: UserProgress[];
  completedRoadmaps: Array<{ id: string; roadmapId: string; roadmap?: RoadmapSummary }>;
  stats: {
    totalRoadmapsStarted: number;
    totalRoadmapsCompleted: number;
    totalXp: number;
    currentStreak: number;
  };
}

export interface UserProgress {
  id: string;
  roadmapId: string;
  completedTasks: string[];
  completedDays: string[];
  progressPercentage: number;
  currentDay: number;
  xp?: number;
  streak?: number;
  roadmap?: RoadmapSummary;
}

export interface AssessmentQuestion {
  id?: string;
  question?: string;
  questionText?: string;
  options: string[];
  category?: string;
  tab?: string;
}

export interface AssessmentSaveResponse {
  id: string;
  completedAt?: string;
  analysis?: unknown;
}

export interface AssessmentResult {
  id?: string;
  suggestedCareers?: string[];
  strengths?: string[];
  weaknesses?: string[];
  scores?: Record<string, number> | string;
  summary?: {
    suggestedCareers?: string[];
    scores?: Record<string, number>;
    strengths?: string[];
    weaknesses?: string[];
    learningRoadmap?: Record<string, string[]>;
  };
  combinedMatches?: Array<{
    career?: string;
    match?: number;
    requiredSkills?: string[];
    missingSkills?: string[];
    reasons?: string[];
  }> | null;
  persisted?: {
    id: string;
    suggestedCareers?: string[];
    strengths?: string[];
    weaknesses?: string[];
    scores?: string;
  } | null;
}

export interface RoadmapTask {
  id?: string;
  title: string;
  description?: string;
  duration?: string;
  completed?: boolean;
  xp?: number;
}

export interface RoadmapDay {
  id?: string;
  title?: string;
  dayNumber?: number;
  description?: string;
  tasks?: RoadmapTask[];
}

export interface RoadmapWeek {
  id?: string;
  title?: string;
  weekNumber?: number;
  days?: RoadmapDay[];
}

export interface RoadmapSummary {
  id?: string;
  title: string;
  description?: string;
  category?: string;
  careerPath?: string;
  difficulty?: string;
  level?: string;
  duration?: string;
  icon?: string;
  estimatedHours?: number;
  requiredSkills?: string[];
  learningStructure?: Array<{
    day?: number;
    focus?: string;
    dailyTopics?: string[];
    tasks?: string[];
    resources?: Array<{ title: string; type?: string; url?: string; difficulty?: string }>;
    deliverable?: string;
    xp?: number;
  }>;
  milestones?: unknown;
  progression?: unknown;
  tags?: string[];
  weeks?: RoadmapWeek[];
}

export interface LearningResourceItem {
  id?: string;
  title: string;
  type?: string;
  resourceType?: string;
  url: string;
  difficulty?: string;
  description?: string;
  provider?: string;
  estimatedMinutes?: number | null;
  skill?: string;
  topic?: string;
}

export interface ProfileBuilderData {
  user: AuthUser;
  completion: {
    score: number;
    missing: string[];
    sections?: Array<{ key: string; label: string; score: number }>;
  };
  projects: PortfolioProject[];
  certifications: Certification[];
  githubRepositories: unknown[];
}

export interface PortfolioProject {
  id: string;
  title: string;
  description?: string | null;
  techStack?: string[];
  highlights?: string[];
  liveUrl?: string | null;
  repoUrl?: string | null;
  featured?: boolean;
}

export interface Certification {
  id: string;
  title: string;
  issuer: string;
  credentialId?: string | null;
  credentialUrl?: string | null;
  issuedAt?: string | null;
  expiresAt?: string | null;
  description?: string | null;
}
