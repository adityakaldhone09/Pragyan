import { routeAI } from './aiRouter';
import safeParseAIResponse from './safeParser';
import { CareerEnhancementArraySchema } from './schemas';
import crypto from 'crypto';
import { hasGeminiKey, hasGroqKey } from '@/config/env';

const CACHE_TTL = 60 * 60 * 12; // 12 hours

export async function generateCareerEnhancements(profile: any, matches: any[]) {
  try {
    if (!matches || matches.length === 0) return [];

    const careers = matches.map((m) => ({ careerId: m.careerId, career: m.career || m.careerTitle }));

    const instruction = `Produce a JSON array of objects keyed by careerId. For each career, provide: careerId, explanation (1-3 sentences describing why this career matches the user), learningSuggestions (array of 3 short suggestions), roadmapSummary (short paragraph), preparationTips (3 short actionable tips). Return ONLY valid JSON.`;

    const payload = `${instruction}\n\nProfile:\n${JSON.stringify(profile, null, 2)}\n\nCareers:\n${JSON.stringify(careers, null, 2)}`;

    // Try Redis cache if available
    try {
      const hash = crypto.createHash('sha256').update(payload).digest('hex');
      const cacheKey = `ai:careerEnhance:${hash}`;
      const redis = require('@/lib/redis').redisClient;
      if (redis && redis.isReady && redis.isReady()) {
        const cached = await redis.get(cacheKey);
        if (cached) {
          try { return JSON.parse(cached); } catch (e) { /* fallthrough */ }
        }
      }
    } catch (e) {
      // ignore cache errors
    }

    // If Gemini key is not available, produce deterministic local enhancements
    let parsed: any = [];
    if (!hasGeminiKey && !hasGroqKey) {
      parsed = matches.map((m) => ({
        careerId: m.careerId || (m.career && m.career._id) || null,
        explanation: `Based on your profile, ${m.careerTitle || (m.career && m.career.title) || 'this role'} aligns with your skills and interests.`,
        learningSuggestions: [
          'Build foundational projects related to the role',
          'Take a focused course to strengthen core skills',
          'Contribute to open-source or real projects for hands-on experience',
        ],
        roadmapSummary: m.roadmapId ? `Follow the roadmap ${String(m.roadmapId)} for progressive learning.` : 'Start with basics, then move to applied projects and advanced topics.',
        preparationTips: ['Practice relevant interview questions', 'Prepare a showcase project', 'Network with professionals in the field'],
      }));
    } else {
      const aiResponse = await routeAI('career_match', { prompt: payload, input: { profile, careers }, format: 'json' });
      try {
        const raw = JSON.parse(aiResponse.value);
        const looksLikeQuestionStub = Array.isArray(raw) && raw.length > 0 && raw[0] && !raw[0].careerId && raw[0].question;

        if (looksLikeQuestionStub) {
          parsed = matches.map((m) => ({
            careerId: m.careerId || (m.career && m.career._id) || null,
            explanation: `Based on your profile, ${m.careerTitle || (m.career && m.career.title) || 'this role'} aligns with your skills and interests.`,
            learningSuggestions: [
              'Build foundational projects related to the role',
              'Take a focused course to strengthen core skills',
              'Contribute to open-source or real projects for hands-on experience',
            ],
            roadmapSummary: m.roadmapId ? `Follow the roadmap ${String(m.roadmapId)} for progressive learning.` : 'Start with basics, then move to applied projects and advanced topics.',
            preparationTips: ['Practice relevant interview questions', 'Prepare a showcase project', 'Network with professionals in the field'],
          }));
        } else {
          parsed = safeParseAIResponse(raw, CareerEnhancementArraySchema);
        }
      } catch (parseErr) {
        console.warn('AI response validation failed, falling back to local enhancements:', parseErr);
        parsed = matches.map((m) => ({
          careerId: m.careerId || (m.career && m.career._id) || null,
          explanation: `Based on your profile, ${m.careerTitle || (m.career && m.career.title) || 'this role'} aligns with your skills and interests.`,
          learningSuggestions: [
            'Build foundational projects related to the role',
            'Take a focused course to strengthen core skills',
            'Contribute to open-source or real projects for hands-on experience',
          ],
          roadmapSummary: m.roadmapId ? `Follow the roadmap ${String(m.roadmapId)} for progressive learning.` : 'Start with basics, then move to applied projects and advanced topics.',
          preparationTips: ['Practice relevant interview questions', 'Prepare a showcase project', 'Network with professionals in the field'],
        }));
      }
    }

    // Store in cache
    try {
      const hash = crypto.createHash('sha256').update(payload).digest('hex');
      const cacheKey = `ai:careerEnhance:${hash}`;
      const redis = require('@/lib/redis').redisClient;
      if (redis && redis.isReady && redis.isReady()) {
        try { await redis.set(cacheKey, JSON.stringify(parsed), CACHE_TTL); } catch {}
      }
    } catch {}

    return parsed;
  } catch (err) {
    console.warn('generateCareerEnhancements failed:', err);
    return [];
  }
}

export default { generateCareerEnhancements };
