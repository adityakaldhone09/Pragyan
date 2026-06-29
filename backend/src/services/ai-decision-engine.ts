import { prisma } from '@/lib/prisma';
import { aiMemoryService } from '@/services/aiMemory';
import { aiRecommendationService } from '@/services/ai-recommendation';

export class AIDecisionEngine {
  /**
   * Evaluate adaptive recommendations for a user by combining base recommendation
   * scores with memory signals: learning velocity, personality, roadmap mutations, and XP.
   */
  async evaluateRecommendations(userId: string) {
    // fetch base career candidates
    const base = await aiRecommendationService.getCareerRecommendations(userId).catch(() => []);

    // fetch memory signals
    const [vels, personality, roadmapMutations, user] = await Promise.all([
      aiMemoryService.getLearningVelocities(userId).catch(() => []),
      aiMemoryService.getPersonality(userId).catch(() => null),
      prisma.roadmapMutation.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 20 }).catch(() => []),
      prisma.user.findUnique({ where: { id: userId } }).catch(() => null),
    ]);

    // compute velocity metric (simple average of provided metrics.windowScore if present)
    const velocityVals = (vels || []).flatMap((v: any) => {
      const score = (v.metrics && v.metrics.score) ? Number(v.metrics.score) : 0;
      return !Number.isNaN(score) ? [score] : [];
    });
    const avgVelocity = velocityVals.length ? velocityVals.reduce((a: number, b: number) => a + b, 0) / velocityVals.length : 0;

    // personality traits
    const traits = Array.isArray((personality as any)?.profile?.traits) ? (personality as any).profile.traits : [];

    // roadmap mutation set for quick lookup
    const unlockedSet = new Set<string>((roadmapMutations || []).flatMap((m: any) => m.mutation?.unlocked || []));

    // user xp
    const xp = (user && (user.xp || 0)) || 0;

    // scoring weights
    const velocityWeight = 0.12; // up to ~12%
    const personalityWeight = 0.10;
    const xpWeight = 0.08;
    const roadmapWeight = 0.12;

    // fetch user feedback history and build a simple feedback map
    const feedbackList = await prisma.recommendationHistory.findMany({ where: { userId, source: 'feedback' }, orderBy: { createdAt: 'desc' }, take: 200 }).catch(() => []);
    const feedbackMap = new Map<string, { score: number; count: number }>();
    (feedbackList || []).forEach((f: any) => {
      try {
        const rec = f.recommendation as any;
        const key = String(rec?.target?.career || rec?.target || JSON.stringify(rec?.target || {}));
        const ft = String(rec?.feedbackType || '').toLowerCase();
        let delta = 0;
        if (ft === 'helpful' || ft === 'liked') delta = 0.12;
        if (ft === 'not_interested' || ft === 'dismiss') delta = -0.18;
        if (ft === 'too_difficult') delta = -0.08;
        if (ft === 'prefer_creative') delta = 0.06;
        const cur = feedbackMap.get(key) || { score: 0, count: 0 };
        cur.score += delta;
        cur.count += 1;
        feedbackMap.set(key, cur);
      } catch (e) {
        // ignore
      }
    });

    const evaluated = (base || []).map((item: any) => {
      const career = item.career || item.careerTitle || item.title || String(item);
      const baseScore = Number(item.score || item.matchScore || 0);

      // velocity boost scales with avgVelocity (normalized)
      const velocityBoost = Math.tanh(avgVelocity / 10) * velocityWeight;

      // personality matching (naive keyword match)
      let personalityBoost = 0;
      if (traits.includes('analytical') && /data|ai|ml|analytics|engineer/i.test(career)) personalityBoost += personalityWeight * 0.9;
      if (traits.includes('creative') && /design|ux|ui|creative/i.test(career)) personalityBoost += personalityWeight * 0.9;
      if (traits.includes('leadership') && /manager|lead|director|product|project/i.test(career)) personalityBoost += personalityWeight * 0.9;

      // xp factor
      const xpFactor = Math.min(1, xp / 2000) * xpWeight;

      // roadmap unlock boost
      const roadmapBoost = unlockedSet.has(career) ? roadmapWeight : 0;

      // feedback adjustment
      const feedbackKey = String(career);
      const feedbackEntry = feedbackMap.get(feedbackKey);
      const feedbackBoost = feedbackEntry ? feedbackEntry.score : 0;

      const multiplier = 1 + velocityBoost + personalityBoost + xpFactor + roadmapBoost + feedbackBoost;
      const adaptiveScore = Math.round((baseScore * multiplier) * 100) / 100;

      const reasons: string[] = [];
      if (velocityBoost > 0.01) reasons.push('learning velocity trending up');
      if (personalityBoost > 0.01) reasons.push('personality fit');
      if (xpFactor > 0.01) reasons.push('xp progress');
      if (roadmapBoost > 0) reasons.push('roadmap unlocked');

      return { career, baseScore, adaptiveScore, reasons, details: { velocityBoost, personalityBoost, xpFactor, roadmapBoost } };
    });

    // sort by adaptiveScore desc
    const sorted = evaluated.sort((a: any, b: any) => b.adaptiveScore - a.adaptiveScore);

    // record top recommendations to memory (best-effort)
    try {
      await Promise.all(
        sorted.slice(0, 3).map((s) =>
          aiMemoryService.recordRecommendation(userId, { career: s.career, adaptiveScore: s.adaptiveScore, reasons: s.reasons }, 'adaptive-decision', s.adaptiveScore, 'adaptive-decision').catch(() => null)
        )
      );
    } catch (e) {
      // swallow
    }

    const result = { evaluated: sorted, meta: { avgVelocity, xp, traitCount: traits.length } };

    // Persist a decision snapshot for longitudinal analysis (non-blocking)
    try {
      const { decisionSnapshotService } = await import('@/services/decisionSnapshot');
      void decisionSnapshotService.createSnapshot(userId, result);
    } catch (e) {
      // ignore persistence failures
    }

    return result;
  }
}

export const aiDecisionEngine = new AIDecisionEngine();
