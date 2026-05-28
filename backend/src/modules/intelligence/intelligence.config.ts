function num(envVar: string | undefined, fallback: number) {
  if (envVar === undefined) return fallback;
  const n = Number(envVar);
  return Number.isFinite(n) ? n : fallback;
}

export const INTELLIGENCE_CONFIG = {
  // slope impact
  slopeMultiplier: num(process.env.INTELLIGENCE_SLOPE_MULTIPLIER, 3),
  maxSlopeImpact: num(process.env.INTELLIGENCE_MAX_SLOPE_IMPACT, 30),

  // streak thresholds
  streakLowThreshold: num(process.env.INTELLIGENCE_STREAK_LOW_THRESHOLD, 3),
  streakHighThreshold: num(process.env.INTELLIGENCE_STREAK_HIGH_THRESHOLD, 5),
  streakPenalty: num(process.env.INTELLIGENCE_STREAK_PENALTY, 12),

  // weak skill penalties
  weakSkillPenaltyPerSkill: num(process.env.INTELLIGENCE_WEAK_PENALTY_PER_SKILL, 4),
  maxWeakPenalty: num(process.env.INTELLIGENCE_MAX_WEAK_PENALTY, 40),

  // jobs boost
  jobsBoostPerRole: num(process.env.INTELLIGENCE_JOBS_BOOST_PER_ROLE, 6),
  maxJobsBoost: num(process.env.INTELLIGENCE_MAX_JOBS_BOOST, 30),

  // opportunity horizon
  opportunityHorizonDays: num(process.env.INTELLIGENCE_OPPORTUNITY_HORIZON_DAYS, 14),

  // confidence tuning
  confidenceHighDelta: num(process.env.INTELLIGENCE_CONFIDENCE_HIGH_DELTA, 0.5),
  confidenceMediumDelta: num(process.env.INTELLIGENCE_CONFIDENCE_MEDIUM_DELTA, 1.5),

  // momentum tuning
  momentumXpDivisor: num(process.env.INTELLIGENCE_MOMENTUM_XP_DIVISOR, 260),
  momentumSlopeFactor: num(process.env.INTELLIGENCE_MOMENTUM_SLOPE_FACTOR, 0.78),
  momentumStreakFactor: num(process.env.INTELLIGENCE_MOMENTUM_STREAK_FACTOR, 0.36),
  minMomentum: num(process.env.INTELLIGENCE_MIN_MOMENTUM, -20),
  maxMomentum: num(process.env.INTELLIGENCE_MAX_MOMENTUM, 20),

  // consistency tuning
  consistencySlopeMultiplier: num(process.env.INTELLIGENCE_CONSISTENCY_SLOPE_MULTIPLIER, 18),
  consistencyStreakMultiplier: num(process.env.INTELLIGENCE_CONSISTENCY_STREAK_MULTIPLIER, 6),
  consistencyWeakMultiplier: num(process.env.INTELLIGENCE_CONSISTENCY_WEAK_MULTIPLIER, 3),
};
