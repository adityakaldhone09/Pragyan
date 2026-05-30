import { calculateJobMatch, type JobFeedItem } from '@/services/job-match-engine';

export type AdaptiveMode = 'recovery' | 'growth' | 'stretch';

export interface JourneyTask {
  id: string;
  title: string;
  type: 'learn' | 'practice' | 'quiz' | 'project' | 'revision';
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
  userLevel: number;
  userTitle: string | null;
  careerTrack: string | null;
  currentDay: number;
  adaptiveMode: AdaptiveMode;
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
    adaptiveMode: AdaptiveMode;
    adaptiveReason: string;
    difficultyMultiplier: number;
  };
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function toCareerSlug(value: string) {
  return normalize(value || 'career-journey');
}

export function capitalizeWords(value: string) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function buildFallbackDays(title: string, requiredSkills: string[], completedDayCount: number): JourneyDay[] {
  const focusSkills = requiredSkills.length ? requiredSkills.slice(0, 6) : [title, 'Foundations', 'Practice'];

  return Array.from({ length: 5 }, (_value, index) => {
    const dayNumber = index + 1;
    const topic = focusSkills[index % focusSkills.length];
    return {
      dayNumber,
      title: `Day ${dayNumber}`,
      focus: topic,
      topics: [topic, 'Practice', 'Review'],
      tasks: [
        {
          id: `${normalize(title)}-day-${dayNumber}-learn`,
          title: `Learn ${topic}`,
          type: 'learn',
          estimatedMinutes: 35,
          xp: 20,
          completed: dayNumber <= completedDayCount,
        },
        {
          id: `${normalize(title)}-day-${dayNumber}-practice`,
          title: `Practice ${topic}`,
          type: 'practice',
          estimatedMinutes: 30,
          xp: 25,
          completed: dayNumber <= completedDayCount,
        },
        {
          id: `${normalize(title)}-day-${dayNumber}-quiz`,
          title: `Quick quiz on ${topic}`,
          type: 'quiz',
          estimatedMinutes: 10,
          xp: 15,
          completed: dayNumber <= completedDayCount,
        },
        {
          id: `${normalize(title)}-day-${dayNumber}-project`,
          title: `Mini project for ${topic}`,
          type: 'project',
          estimatedMinutes: 45,
          xp: 30,
          completed: dayNumber <= completedDayCount,
        },
      ],
      resources: [],
      estimatedMinutes: 120,
      xpReward: 90,
      completed: dayNumber <= completedDayCount,
    };
  });
}

export function buildJourneyDays(
  roadmap: {
    title: string;
    learningStructure?: Array<{ day?: number; focus?: string; dailyTopics?: string[]; tasks?: string[]; resources?: Array<{ title?: string; provider?: string; type?: string; url?: string; estimatedMinutes?: number }>; deliverable?: string; xp?: number }> | null;
    requiredSkills?: string[];
  },
  completedDayCount: number
): JourneyDay[] {
  const sourceDays = Array.isArray(roadmap.learningStructure) && roadmap.learningStructure.length
    ? roadmap.learningStructure
    : buildFallbackDays(roadmap.title, roadmap.requiredSkills || [], completedDayCount).map((day) => ({
        day: day.dayNumber,
        focus: day.focus,
        dailyTopics: day.topics,
        tasks: day.tasks.map((task) => task.title),
        resources: day.resources,
        deliverable: day.tasks[day.tasks.length - 1]?.title,
        xp: day.xpReward,
      }));

  return sourceDays.map((day, index) => {
    const dayNumber = Number(day.day || index + 1);
    const topics = Array.from(new Set([...(day.dailyTopics || []), ...(day.tasks || []), day.focus || day.deliverable || roadmap.title].filter(Boolean).map(String)));
    const resources = (day.resources || []).map((resource) => ({
      title: resource.title || 'Learning resource',
      provider: resource.provider,
      type: resource.type,
      url: resource.url,
      estimatedMinutes: resource.estimatedMinutes,
    }));

    const tasks: JourneyTask[] = [
      ...topics.slice(0, 3).map((topic, taskIndex) => ({
        id: `${normalize(roadmap.title)}-day-${dayNumber}-topic-${taskIndex + 1}`,
        title: topic,
        type: 'learn' as const,
        estimatedMinutes: 25,
        xp: 15,
        completed: dayNumber <= completedDayCount,
        details: topic,
      })),
      {
        id: `${normalize(roadmap.title)}-day-${dayNumber}-quiz`,
        title: `Practice quiz for Day ${dayNumber}`,
        type: 'quiz',
        estimatedMinutes: 12,
        xp: 10,
        completed: dayNumber <= completedDayCount,
        details: 'Reinforce the core concepts before moving ahead.',
      },
      {
        id: `${normalize(roadmap.title)}-day-${dayNumber}-project`,
        title: day.deliverable || `Build a mini project for Day ${dayNumber}`,
        type: 'project',
        estimatedMinutes: 45,
        xp: 30,
        completed: dayNumber <= completedDayCount,
        details: 'Apply the day in a small outcome-driven task.',
      },
    ];

    const estimatedMinutes = Math.max(
      60,
      Math.round(
        tasks.reduce((sum, task) => sum + task.estimatedMinutes, 0) +
          resources.reduce((sum, resource) => sum + (resource.estimatedMinutes || 0), 0)
      )
    );

    return {
      dayNumber,
      title: `Day ${dayNumber}`,
      focus: day.focus || day.deliverable || roadmap.title,
      topics,
      tasks,
      resources,
      estimatedMinutes,
      xpReward: Number(day.xp || tasks.reduce((sum, task) => sum + task.xp, 0)),
      completed: dayNumber <= completedDayCount,
    };
  });
}

export function buildSkillProgress(
  requiredSkills: string[],
  userSkills: string[],
  weakSkills: string[]
): JourneySkillProgress[] {
  const normalizedUserSkills = new Set(userSkills.map((skill) => skill.toLowerCase().trim()).filter(Boolean));
  const normalizedWeakSkills = new Set(weakSkills.map((skill) => skill.toLowerCase().trim()).filter(Boolean));
  const combinedSkills = Array.from(new Set([...requiredSkills, ...weakSkills, ...userSkills]));

  return combinedSkills.filter(Boolean).map((skill) => {
    const normalized = skill.toLowerCase().trim();
    const completed = normalizedUserSkills.has(normalized);
    const weak = normalizedWeakSkills.has(normalized) || (!completed && requiredSkills.some((required) => required.toLowerCase().trim() === normalized));
    const mastery = completed ? (weak ? 76 : 92) : weak ? 42 : 64;

    return {
      skill,
      mastery,
      completed,
      weak,
    };
  });
}

export function buildJourneyJobs(userSkills: string[], jobs: JobFeedItem[]): JourneyJobEligibility[] {
  return jobs.map((job) => {
    const requiredSkills = Array.isArray(job.skills) ? job.skills : [];
    const missingSkills = requiredSkills.filter((skill) => {
      const normalized = skill.toLowerCase().trim();
      return !userSkills.some((userSkill) => userSkill.toLowerCase().trim() === normalized);
    });

    const matchPercentage = calculateJobMatch(userSkills, requiredSkills);

    return {
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      salary: job.salary,
      jobType: 'Full-time',
      role: job.title,
      requiredSkills,
      missingSkills,
      matchPercentage,
      eligible: matchPercentage >= 70,
      source: job.source,
      applyLink: job.applyLink,
    };
  });
}

export function buildPlacementReadiness(
  progressPercentage: number,
  skillCoverage: number,
  topCareerMatch: number,
  completedSkills: string[],
  missingSkills: string[],
  eligibleJobs: number,
  streak = 0,
  currentDay = 1
): PlacementReadiness {
  const streakScore = Math.min(100, streak * 12);
  const jobFitScore = Math.min(100, eligibleJobs * 20);
  const quizProxyScore = Math.min(100, Math.round((skillCoverage * 0.6) + (progressPercentage * 0.4)));
  const projectProxyScore = Math.min(100, Math.round((progressPercentage * 0.75) + (completedSkills.length ? 15 : 0)));
  const interviewConfidenceScore = Math.max(0, Math.min(100, topCareerMatch));
  const weakSkillPenalty = Math.min(18, missingSkills.length * 3);

  const rawScore =
    (progressPercentage * 0.24) +
    (skillCoverage * 0.26) +
    (streakScore * 0.12) +
    (quizProxyScore * 0.12) +
    (projectProxyScore * 0.1) +
    (jobFitScore * 0.08) +
    (interviewConfidenceScore * 0.08) -
    weakSkillPenalty;

  const score = Math.max(0, Math.min(100, Math.round(rawScore)));
  const strengths = [...completedSkills].slice(0, 4);
  const weakAreas = [...missingSkills].slice(0, 4);
  const recommendedNextStep = score >= 80
    ? `Apply to 2 aligned roles and run one mock interview today.`
    : weakAreas.length
      ? `Close ${weakAreas[0]} with a project + quiz loop, then continue Day ${currentDay}.`
      : `Finish Day ${currentDay} and add one project artifact to your portfolio.`;

  return {
    score,
    label: score >= 80 ? 'Placement ready' : score >= 60 ? 'Building momentum' : 'Foundations in progress',
    completedSkills,
    missingSkills,
    eligibleJobs,
    strengths,
    weakAreas,
    recommendedNextStep,
    factors: [
      { label: 'Roadmap progress', score: Math.round(progressPercentage), weight: 0.24, note: 'How far through the execution plan you are.' },
      { label: 'Skill coverage', score: Math.round(skillCoverage), weight: 0.26, note: 'How many required skills are already covered.' },
      { label: 'Consistency', score: streakScore, weight: 0.12, note: 'How stable your daily momentum is.' },
      { label: 'Quiz retention', score: quizProxyScore, weight: 0.12, note: 'Estimated from progress and skill coverage.' },
      { label: 'Project readiness', score: projectProxyScore, weight: 0.10, note: 'Estimated from roadmap completion and completed skills.' },
      { label: 'Job eligibility', score: jobFitScore, weight: 0.08, note: 'How many roles are currently in reach.' },
      { label: 'Interview confidence', score: interviewConfidenceScore, weight: 0.08, note: 'Current top-career alignment signal.' },
    ],
  };
}

export function pickAdaptiveMode(progressPercentage: number, streak: number, weakSkills: string[]): { mode: AdaptiveMode; reason: string; multiplier: number } {
  if (progressPercentage < 30 || streak === 0) {
    return {
      mode: 'recovery',
      reason: weakSkills.length ? `Recovery mode is active so you can stabilize ${weakSkills[0]} before the next leap.` : 'Recovery mode is active to rebuild momentum and close missed days.',
      multiplier: 0.85,
    };
  }

  if (progressPercentage >= 70 && streak >= 5) {
    return {
      mode: 'stretch',
      reason: 'Stretch mode is active because your streak and progress show you are ready for harder challenges.',
      multiplier: 1.15,
    };
  }

  return {
    mode: 'growth',
    reason: 'Growth mode is active to keep the pace challenging without overwhelming your current momentum.',
    multiplier: 1,
  };
}
