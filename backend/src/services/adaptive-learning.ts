export type AdaptiveLearningMode = 'recovery' | 'growth' | 'stretch';

export type AdaptiveExplanationDepth = 'simple' | 'practical' | 'advanced';

export interface AdaptiveLearningInput {
  streak: number;
  progressPercent?: number;
  quizScore?: number;
  weakSkillCount?: number;
  completedTopicsCount?: number;
  availableTime?: number;
  missedDays?: number;
}

export interface AdaptiveLearningProfile {
  mode: AdaptiveLearningMode;
  difficultyMultiplier: number;
  revisionBias: number;
  projectBias: number;
  explanationDepth: AdaptiveExplanationDepth;
  reason: string;
  quizScore?: number;
}

export interface AdaptiveTaskMix {
  learn: number;
  practice: number;
  quiz: number;
  revision: number;
  project: number;
}

export function normalizeQuizScore(score?: number | null) {
  if (!Number.isFinite(Number(score))) {
    return undefined;
  }

  const normalized = Number(score);
  if (normalized <= 1) {
    return Math.round(normalized * 100);
  }

  return Math.max(0, Math.min(100, Math.round(normalized)));
}

export function getAdaptiveMode(input: AdaptiveLearningInput): AdaptiveLearningMode {
  const quizScore = normalizeQuizScore(input.quizScore);
  const streak = Math.max(0, Number(input.streak || 0));
  const progress = Math.max(0, Math.min(100, Number(input.progressPercent || 0)));
  const missedDays = Math.max(0, Number(input.missedDays || 0));

  if (typeof quizScore === 'number' && quizScore < 45) {
    return 'recovery';
  }

  if (streak > 7 && progress > 60 && typeof quizScore === 'number' && quizScore > 80) {
    return 'stretch';
  }

  if (missedDays >= 5) {
    return 'recovery';
  }

  if (streak < 3 || progress < 25) {
    return 'recovery';
  }

  return 'growth';
}

export function getAdaptiveDifficulty(input: AdaptiveLearningInput) {
  const mode = getAdaptiveMode(input);

  switch (mode) {
    case 'recovery':
      return 0.85;
    case 'stretch':
      return 1.2;
    case 'growth':
    default:
      return 1;
  }
}

export function getRecommendedTaskMix(input: AdaptiveLearningInput): AdaptiveTaskMix {
  const mode = getAdaptiveMode(input);

  if (mode === 'recovery') {
    return { learn: 35, practice: 20, quiz: 10, revision: 25, project: 10 };
  }

  if (mode === 'stretch') {
    return { learn: 20, practice: 30, quiz: 15, revision: 10, project: 25 };
  }

  return { learn: 25, practice: 30, quiz: 15, revision: 15, project: 15 };
}

export function shouldUnlockProject(input: AdaptiveLearningInput) {
  const quizScore = normalizeQuizScore(input.quizScore) ?? 0;
  const streak = Math.max(0, Number(input.streak || 0));
  const progress = Math.max(0, Math.min(100, Number(input.progressPercent || 0)));
  const availableTime = Math.max(0, Number(input.availableTime || 0));

  return availableTime >= 120 && streak > 4 && progress >= 40 && quizScore >= 70;
}

export function shouldTriggerRevision(input: AdaptiveLearningInput) {
  const quizScore = normalizeQuizScore(input.quizScore) ?? 0;
  const missedDays = Math.max(0, Number(input.missedDays || 0));
  const weakSkills = Math.max(0, Number(input.weakSkillCount || 0));

  return quizScore < 45 || missedDays >= 5 || weakSkills >= 3;
}

export function deriveAdaptiveLearningProfile(input: AdaptiveLearningInput): AdaptiveLearningProfile {
  const mode = getAdaptiveMode(input);
  const quizScore = normalizeQuizScore(input.quizScore);

  if (mode === 'recovery') {
    return {
      mode,
      difficultyMultiplier: 0.85,
      revisionBias: 2,
      projectBias: -1,
      explanationDepth: 'simple',
      reason: quizScore !== undefined && quizScore < 45
        ? `Quiz score ${quizScore}% suggests the topic needs more revision before stretching.`
        : 'Recent signals suggest a lighter plan with more revision and guided examples.',
      quizScore,
    };
  }

  if (mode === 'stretch') {
    return {
      mode,
      difficultyMultiplier: 1.2,
      revisionBias: -1,
      projectBias: 2,
      explanationDepth: 'advanced',
      reason: quizScore !== undefined && quizScore > 80
        ? `Quiz score ${quizScore}% plus strong consistency unlocks stretch mode.`
        : 'Momentum is strong, so the plan can safely push harder projects and deeper explanations.',
      quizScore,
    };
  }

  return {
    mode: 'growth',
    difficultyMultiplier: 1,
    revisionBias: 1,
    projectBias: 1,
    explanationDepth: 'practical',
    reason: quizScore !== undefined
      ? `Quiz score ${quizScore}% supports balanced growth with some revision and practice.`
      : 'Balanced learning signal detected, so the plan should mix learning, practice, and a guided build.',
    quizScore,
  };
}
