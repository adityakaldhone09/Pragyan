import { CareerAdjustmentArraySchema } from './schemas';
import safeParseAIResponse from './safeParser';
import { routeAI } from './aiRouter';
import crypto from 'crypto';

const ADJUSTMENTS_TTL = 60 * 60 * 6; // 6 hours

/**
 * Combine local rule-based scores with a lightweight GPT enhancement layer.
 * Local engine provides the authoritative numeric scores; GPT provides explanations
 * and optional minor adjustments (confidence modifiers). We keep GPT's influence small.
 */
export async function enhanceAndCombineScores(assessmentProfile: any, localMatches: any[]) {
  // Local scores (0..1) from careerMatchingEngine
  const local = localMatches.map((m: any) => ({
    careerId: m.careerId,
    careerTitle: m.careerTitle || m.career || 'Career',
    localScore: Number(m.matchScore || 0),
    reasons: m.reasons || [],
    skillGaps: m.skillGaps || m.missingSkills || [],
  }));

  // Ask GPT to provide short confidence adjustments and human reasons
  try {
    const prompt = `For the following careers and a user profile, provide a JSON array with elements: { careerId, adjustment: number between -0.1 and 0.1, reason: short string (10-30 words) }.
Profile: ${JSON.stringify(assessmentProfile)}
Careers: ${JSON.stringify(local.map((l) => ({ id: l.careerId, title: l.careerTitle })))}`;

    // caching / dedupe via Redis
    try {
      const hash = crypto.createHash('sha256').update(prompt).digest('hex');
      const cacheKey = `ai:adjustments:${hash}`;
      const redis = require('@/lib/redis').redisClient;
      if (redis && redis.isReady && redis.isReady()) {
        const cached = await redis.get(cacheKey);
        if (cached) {
          try { const parsed = JSON.parse(cached); /* use cached as aiResponse */
            const aiResponse = parsed;
            // proceed with merge below
            const adjustMap = new Map<string, { adjustment: number; reason: string }>();
            aiResponse.forEach((item: any) => {
              if (!item || !item.careerId) return;
              const adj = Number(item.adjustment) || 0;
              adjustMap.set(String(item.careerId), { adjustment: Math.max(-0.1, Math.min(0.1, adj)), reason: String(item.reason || '') });
            });

            return local.map((l) => {
              const adj = adjustMap.get(String(l.careerId)) || { adjustment: 0, reason: '' };
              const combined = Math.max(0, Math.min(1, l.localScore + adj.adjustment));
              return {
                careerId: l.careerId,
                career: l.careerTitle,
                match: Math.round(combined * 100),
                reasons: [ ...l.reasons.slice(0,2), adj.reason ].filter(Boolean),
                requiredSkills: l.skillGaps?.length ? l.skillGaps : [],
              };
            }).sort((a: any, b: any) => b.match - a.match);
          } catch (e) { /* continue to regenerate */ }
        }

        const lockKey = `${cacheKey}:lock`;
        const gotLock = await redis.acquireLock(lockKey, 15_000);
        if (!gotLock) {
          const waited = await redis.waitForKey(cacheKey, 15_000);
          if (waited) {
            try {
              const parsed = JSON.parse(waited);
              const adjustMap = new Map<string, { adjustment: number; reason: string }>();
              parsed.forEach((item: any) => {
                if (!item || !item.careerId) return;
                const adj = Number(item.adjustment) || 0;
                adjustMap.set(String(item.careerId), { adjustment: Math.max(-0.1, Math.min(0.1, adj)), reason: String(item.reason || '') });
              });

              return local.map((l) => {
                const adj = adjustMap.get(String(l.careerId)) || { adjustment: 0, reason: '' };
                const combined = Math.max(0, Math.min(1, l.localScore + adj.adjustment));
                return {
                  careerId: l.careerId,
                  career: l.careerTitle,
                  match: Math.round(combined * 100),
                  reasons: [ ...l.reasons.slice(0,2), adj.reason ].filter(Boolean),
                  requiredSkills: l.skillGaps?.length ? l.skillGaps : [],
                };
              }).sort((a: any, b: any) => b.match - a.match);
            } catch {}
          }
        }
      }
    } catch (e) {
      // cache step failed — continue to call AI
    }

    const result = await routeAI('career_match', { prompt, input: assessmentProfile, format: 'json' });
    const parsed = safeParseAIResponse(JSON.parse(result.value), CareerAdjustmentArraySchema);

    try {
      const hash = crypto.createHash('sha256').update(prompt).digest('hex');
      const cacheKey = `ai:adjustments:${hash}`;
      const redis = require('@/lib/redis').redisClient;
      if (redis && redis.isReady && redis.isReady()) {
        try { await redis.set(cacheKey, JSON.stringify(parsed), ADJUSTMENTS_TTL); } catch {}
        try { await redis.releaseLock(`${cacheKey}:lock`); } catch {}
      }
    } catch {}


    if (Array.isArray(parsed) && parsed.length) {
      // Build map of adjustments
      const adjustMap = new Map<string, { adjustment: number; reason: string }>();
      parsed.forEach((item: any) => {
        if (!item || !item.careerId) return;
        const adj = Number(item.adjustment) || 0;
        adjustMap.set(String(item.careerId), { adjustment: Math.max(-0.1, Math.min(0.1, adj)), reason: String(item.reason || '') });
      });

      // Combine
      return local.map((l) => {
        const adj = adjustMap.get(String(l.careerId)) || { adjustment: 0, reason: '' };
        const combined = Math.max(0, Math.min(1, l.localScore + adj.adjustment));
        return {
          careerId: l.careerId,
          career: l.careerTitle,
          match: Math.round(combined * 100),
          reasons: [ ...l.reasons.slice(0,2), adj.reason ].filter(Boolean),
          requiredSkills: l.skillGaps?.length ? l.skillGaps : [],
        };
      }).sort((a: any, b: any) => b.match - a.match);
    }
  } catch (err) {
    // ignore AI failures and fallback to local-only
  }

  // Fallback: return local-only formatted results
  return local
    .map((l) => ({ careerId: l.careerId, career: l.careerTitle, match: Math.round(l.localScore * 100), reasons: l.reasons, requiredSkills: l.skillGaps }))
    .sort((a: any, b: any) => b.match - a.match);
}

export default { enhanceAndCombineScores };
