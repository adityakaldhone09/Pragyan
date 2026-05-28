import { IntelligencePayload, PlacementProbability, OpportunityForecast, ConsistencyRisk, MomentumSignal, ReadinessForecast } from './intelligence.types';
import { INTELLIGENCE_CONFIG } from './intelligence.config';

function clamp(v: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, v));
}

export class IntelligenceService {
  buildForecastSignals(snapshot: any): IntelligencePayload {
    const readiness = snapshot?.placementReadiness?.score ?? snapshot?.currentJourney?.placementReadiness?.score ?? 0;
    const trend = snapshot?.trend ?? [];
    const streak = snapshot?.streak ?? snapshot?.currentJourney?.streak ?? 0;
    const weakCount = snapshot?.weakSkills?.length ?? snapshot?.currentJourney?.weakSkills?.length ?? 0;
    const eligibleJobs = snapshot?.eligibleJobs?.filter((j: any) => j.eligible).length ?? snapshot?.currentJourney?.eligibleJobs?.filter((j: any) => j.eligible).length ?? 0;

    // readiness history and slope
    const recent = trend.slice(-7).map((p: any) => p.readinessScore);
    const deltas = recent.slice(1).map((v: number, i: number) => v - recent[i]);
    const avgDelta = deltas.length ? deltas.reduce((s: number, v: number) => s + v, 0) / deltas.length : 0;

    const slopeFactor = clamp(Math.round(avgDelta * INTELLIGENCE_CONFIG.slopeMultiplier), -INTELLIGENCE_CONFIG.maxSlopeImpact, INTELLIGENCE_CONFIG.maxSlopeImpact);
    const consistencyPenalty = streak < INTELLIGENCE_CONFIG.streakLowThreshold ? -INTELLIGENCE_CONFIG.streakPenalty : 0;
    const weakPenalty = -Math.min(INTELLIGENCE_CONFIG.maxWeakPenalty, weakCount * INTELLIGENCE_CONFIG.weakSkillPenaltyPerSkill);
    const jobsBoost = Math.min(INTELLIGENCE_CONFIG.maxJobsBoost, eligibleJobs * INTELLIGENCE_CONFIG.jobsBoostPerRole);

    const placementProbRaw = readiness + slopeFactor + jobsBoost + consistencyPenalty + weakPenalty;
    const placementProbability: PlacementProbability = {
      probability: clamp(Math.round(placementProbRaw)),
      confidence:
        Math.abs(avgDelta) < INTELLIGENCE_CONFIG.confidenceHighDelta && streak >= INTELLIGENCE_CONFIG.streakHighThreshold
          ? 'HIGH'
          : Math.abs(avgDelta) < INTELLIGENCE_CONFIG.confidenceMediumDelta
          ? 'MEDIUM'
          : 'LOW',
      explanation: `Computed from readiness=${readiness} slope=${avgDelta.toFixed(2)} streak=${streak} eligibleJobs=${eligibleJobs}`,
    };

    // Opportunity forecast
    const opportunityScore = Math.max(0, Math.round((placementProbability.probability / 100) * (eligibleJobs + Math.max(0, Math.round(avgDelta)))));
    const opportunityForecast: OpportunityForecast = {
      expectedJobs: opportunityScore,
      timelineDays: INTELLIGENCE_CONFIG.opportunityHorizonDays,
      note: `${eligibleJobs} current eligible roles used as base`,
    };

    // Consistency risk
    const consistencyNumeric = clamp(
      Math.round(
        Math.max(0, -avgDelta) * INTELLIGENCE_CONFIG.consistencySlopeMultiplier +
          Math.max(0, INTELLIGENCE_CONFIG.streakLowThreshold - streak) * INTELLIGENCE_CONFIG.consistencyStreakMultiplier +
          weakCount * INTELLIGENCE_CONFIG.consistencyWeakMultiplier
      ),
      0,
      100
    );
    const consistencyRisk: ConsistencyRisk = {
      risk: consistencyNumeric > 60 ? 'HIGH' : consistencyNumeric > 30 ? 'MEDIUM' : 'LOW',
      score: consistencyNumeric,
      reason: `Recent slope ${avgDelta.toFixed(2)}, streak ${streak}, weakSkills ${weakCount}`,
    };

    // Momentum signals (very lightweight: derive top skill signals from snapshot.skillRadarData if present)
    const radar = snapshot?.skillRadar || snapshot?.skillRadarData || [];
    const momentumSignals: MomentumSignal[] = (radar && radar.length ? radar : []).slice(0, 5).map((r: any) => ({
      skill: r.skill || 'Unknown',
      momentum: r.score >= 75 ? 'ACCELERATING' : r.score >= 50 ? 'GROWING' : r.score >= 30 ? 'FLAT' : 'DECLINING',
      score: clamp(Math.round(r.score || 0)),
      explanation: r.explanation || '',
    }));

    // Readiness forecast (project 14 days using avgDelta + small momentum)
    const momentum = clamp(
      Math.round(avgDelta * INTELLIGENCE_CONFIG.momentumSlopeFactor + (streak * INTELLIGENCE_CONFIG.momentumStreakFactor) + ((snapshot?.xp ?? snapshot?.currentJourney?.xp ?? 0) / INTELLIGENCE_CONFIG.momentumXpDivisor)),
      INTELLIGENCE_CONFIG.minMomentum,
      INTELLIGENCE_CONFIG.maxMomentum
    );
    const horizon = Array.from({ length: 14 }, (_, i) => clamp(Math.round(readiness + momentum * (i + 1)), 0, 100));
    const daysTo85Index = horizon.findIndex((v) => v >= 85);
    const readinessForecast: ReadinessForecast = {
      currentReadiness: readiness,
      projected14d: horizon[horizon.length - 1] ?? readiness,
      daysTo85: daysTo85Index >= 0 ? daysTo85Index + 1 : null,
      dailyMomentum: momentum,
    };

    return {
      placementProbability,
      opportunityForecast,
      consistencyRisk,
      momentumSignals,
      readinessForecast,
    };
  }

  buildDebugForecastSignals(snapshot: any) {
    const readiness = snapshot?.placementReadiness?.score ?? snapshot?.currentJourney?.placementReadiness?.score ?? 0;
    const trend = snapshot?.trend ?? [];
    const streak = snapshot?.streak ?? snapshot?.currentJourney?.streak ?? 0;
    const weakSkills = snapshot?.weakSkills ?? snapshot?.currentJourney?.weakSkills ?? [];
    const weakCount = weakSkills.length;
    const eligibleJobsList = snapshot?.eligibleJobs ?? snapshot?.currentJourney?.eligibleJobs ?? [];
    const eligibleJobs = eligibleJobsList.filter((j: any) => j.eligible).length;

    const recent = trend.slice(-7).map((p: any) => p.readinessScore);
    const deltas = recent.slice(1).map((v: number, i: number) => v - recent[i]);
    const avgDelta = deltas.length ? deltas.reduce((s: number, v: number) => s + v, 0) / deltas.length : 0;

    const slopeFactor = clamp(Math.round(avgDelta * INTELLIGENCE_CONFIG.slopeMultiplier), -INTELLIGENCE_CONFIG.maxSlopeImpact, INTELLIGENCE_CONFIG.maxSlopeImpact);
    const consistencyPenalty = streak < INTELLIGENCE_CONFIG.streakLowThreshold ? -INTELLIGENCE_CONFIG.streakPenalty : 0;
    const weakPenalty = -Math.min(INTELLIGENCE_CONFIG.maxWeakPenalty, weakCount * INTELLIGENCE_CONFIG.weakSkillPenaltyPerSkill);
    const jobsBoost = Math.min(INTELLIGENCE_CONFIG.maxJobsBoost, eligibleJobs * INTELLIGENCE_CONFIG.jobsBoostPerRole);

    const placementProbRaw = readiness + slopeFactor + jobsBoost + consistencyPenalty + weakPenalty;
    const placementProbability = {
      probability: clamp(Math.round(placementProbRaw)),
      confidence:
        Math.abs(avgDelta) < INTELLIGENCE_CONFIG.confidenceHighDelta && streak >= INTELLIGENCE_CONFIG.streakHighThreshold
          ? 'HIGH'
          : Math.abs(avgDelta) < INTELLIGENCE_CONFIG.confidenceMediumDelta
          ? 'MEDIUM'
          : 'LOW',
      explanation: `Computed from readiness=${readiness} slope=${avgDelta.toFixed(2)} streak=${streak} eligibleJobs=${eligibleJobs}`,
    };

    const opportunityScore = Math.max(0, Math.round((placementProbability.probability / 100) * (eligibleJobs + Math.max(0, Math.round(avgDelta)))));
    const opportunityForecast = {
      expectedJobs: opportunityScore,
      timelineDays: INTELLIGENCE_CONFIG.opportunityHorizonDays,
      note: `${eligibleJobs} current eligible roles used as base`,
    };

    const consistencyNumeric = clamp(
      Math.round(
        Math.max(0, -avgDelta) * INTELLIGENCE_CONFIG.consistencySlopeMultiplier +
          Math.max(0, INTELLIGENCE_CONFIG.streakLowThreshold - streak) * INTELLIGENCE_CONFIG.consistencyStreakMultiplier +
          weakCount * INTELLIGENCE_CONFIG.consistencyWeakMultiplier
      ),
      0,
      100
    );
    const consistencyRisk = {
      risk: consistencyNumeric > 60 ? 'HIGH' : consistencyNumeric > 30 ? 'MEDIUM' : 'LOW',
      score: consistencyNumeric,
      reason: `Recent slope ${avgDelta.toFixed(2)}, streak ${streak}, weakSkills ${weakCount}`,
    };

    const radar = snapshot?.skillRadar || snapshot?.skillRadarData || [];
    const momentumSignals = (radar && radar.length ? radar : []).slice(0, 5).map((r: any) => ({
      skill: r.skill || 'Unknown',
      momentum: r.score >= 75 ? 'ACCELERATING' : r.score >= 50 ? 'GROWING' : r.score >= 30 ? 'FLAT' : 'DECLINING',
      score: clamp(Math.round(r.score || 0)),
      explanation: r.explanation || '',
    }));

    const momentum = clamp(
      Math.round(avgDelta * INTELLIGENCE_CONFIG.momentumSlopeFactor + (streak * INTELLIGENCE_CONFIG.momentumStreakFactor) + ((snapshot?.xp ?? snapshot?.currentJourney?.xp ?? 0) / INTELLIGENCE_CONFIG.momentumXpDivisor)),
      INTELLIGENCE_CONFIG.minMomentum,
      INTELLIGENCE_CONFIG.maxMomentum
    );
    const horizon = Array.from({ length: 14 }, (_, i) => clamp(Math.round(readiness + momentum * (i + 1)), 0, 100));
    const daysTo85Index = horizon.findIndex((v) => v >= 85);
    const readinessForecast = {
      currentReadiness: readiness,
      projected14d: horizon[horizon.length - 1] ?? readiness,
      daysTo85: daysTo85Index >= 0 ? daysTo85Index + 1 : null,
      dailyMomentum: momentum,
    };

    const configUsed = { ...INTELLIGENCE_CONFIG };

    const explanations = [
      placementProbability.explanation,
      consistencyRisk.reason,
      `weakSkills=${weakSkills.join(',') || 'none'}`,
    ];

    return {
      inputs: {
        readiness,
        recentReadiness: recent,
        avgDelta,
        streak,
        weakSkills,
        eligibleJobsList,
      },
      derivedSignals: {
        placementProbability,
        opportunityForecast,
        consistencyRisk,
        momentumSignals,
        readinessForecast,
      },
      explanations,
      configUsed,
    };
  }
}

export const intelligenceService = new IntelligenceService();
