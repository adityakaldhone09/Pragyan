export type HybridExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
export type HybridCareerTrack = 'Government Job' | 'Private Job';
export type HybridQuestionType = 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE';

export interface HybridUserProfile {
  userId: string;
  role: string;
  domain: string;
  experience: HybridExperienceLevel;
  age?: number;
  education?: string;
  careerTrack?: HybridCareerTrack;
  hobbies?: string[];
  interests?: string[];
  currentSkills?: string[];
  contactInfo?: string;
  tenthGrade?: string;
  twelfthGrade?: string;
  highestQualification?: string;
  targetRole?: string;
  domainExperience?: string;
  careerPath?: string;
  careerSubPath?: string;
}

export interface ParsedProfilePayload {
  Education: string;
  Experience: string;
  Skills: string[];
  ContactInfo: string;
  confidence: number;
}

export interface DomainQuestion {
  id: string;
  domain: string;
  skill: string;
  question: string;
  type: 'rating';
}

export interface DomainAnswer {
  skill: string;
  rating: number;
}

export interface SkillBaseline {
  skill: string;
  rating: number;
}

export type FunnelLevel = 'General' | 'Specific' | 'Specialization' | 'Depth';

export interface HybridAssessmentQuestion {
  questionId: string;
  questionText: string;
  options?: string[] | null;
  topic: string;
  funnelLevel: FunnelLevel;
}

export interface QAExchange {
  question: HybridAssessmentQuestion;
  userAnswer: string;
  isCorrect: boolean;
  evaluatedTopic: string;
}

export interface TopicMastery {
  topic: string;
  funnelLevelReached: FunnelLevel;
  status: 'mastered' | 'weak' | 'failed';
  attempts: number;
}

export interface HybridAssessmentFinalSummary {
  strengths: string[];
  weakTopics: string[];
  topicMastery: TopicMastery[];
  recommendedMode: 'Recovery' | 'Growth' | 'Stretch';
  recommendedRole: string;
  requiredJobSkills: string[];
  skillGaps: string[];
  jobAvailabilityInsight: string;
  realizedStrengths?: string[];
  unrealizedStrengths?: string[];
  learnedSkills?: string[];
  weaknesses?: string[];
}

export interface StateMachineResponse {
  currentFunnelLevel: FunnelLevel;
  reasoningToast: string;
  isCompleted: boolean;
  nextQuestion?: HybridAssessmentQuestion | null;
  evaluation?: {
    topic: string;
    isCorrect: boolean;
    consecutiveFailuresOnTopic: number;
  } | null;
  finalSummary?: HybridAssessmentFinalSummary | null;
}

export interface HybridAssessmentSession {
  id: string;
  userId: string;
  profile: HybridUserProfile;
  skillBaselines: SkillBaseline[];
  history: QAExchange[];
  currentFunnelLevel: FunnelLevel;
  currentTopic: string;
  consecutiveFailures: number;
  isCompleted: boolean;
  finalSummary?: HybridAssessmentFinalSummary;
  createdAt: string;
  updatedAt: string;
}

export interface RecommendationResult {
  recommendedCareer: string;
  confidenceScore: number;
  reasoning: string;
}

export interface RoadmapTask {
  title: string;
  description: string;
  estimatedMinutes: number;
}

export interface RoadmapTopic {
  title: string;
  tasks: RoadmapTask[];
}

export interface RoadmapModule {
  title: string;
  topics: RoadmapTopic[];
}

export interface Roadmap {
  domain: string;
  track: {
    title: string;
    modules: RoadmapModule[];
  };
}

export interface DailyPlan {
  mode: 'Recovery' | 'Growth' | 'Stretch';
  date: string;
  tasks: RoadmapTask[];
}

export interface MentorContext {
  weakTopics: string[];
  assessmentSummary: string;
  proactiveWarnings: string[];
}

export interface DownstreamResult {
  recommendation: RecommendationResult;
  roadmap: Roadmap;
  dailyPlan: DailyPlan;
  mentorContext: MentorContext;
}

export interface UserAssessmentAnswerInput {
  userId: string;
  sessionId?: string;
  phase: 1 | 2 | 3;
  questionId?: string;
  questionText: string;
  questionType: HybridQuestionType;
  topic?: string;
  funnelLevel?: FunnelLevel;
  options: string[];
  selectedAnswer: string[];
}
