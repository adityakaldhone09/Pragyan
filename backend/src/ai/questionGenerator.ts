import { QuestionArraySchema } from './schemas';
import safeParseAIResponse from './safeParser';
import { routeAI } from './aiRouter';
import crypto from 'crypto';

const QUESTIONS_TTL_SECONDS = 60 * 60 * 12; // 12 hours

export interface RawQuestion {
  id: string;
  type?: string;
  question: string;
  category?: string;
  options?: string[];
  dataSourced?: boolean;
}

export interface GeneratedQuestion extends RawQuestion {
  hint?: string;
}

/**
 * Use GPT to refine and rephrase dataset-driven questions into polished user-facing prompts.
 * Falls back to the original question when the LLM fails or returns invalid JSON.
 */
export async function generateQuestionsWithAI(questions: RawQuestion[]): Promise<GeneratedQuestion[]> {
  if (!questions || !questions.length) return [];

  const prompts = questions.map((q) => ({ id: q.id, question: q.question, options: q.options || [] }));

  const instruction = `You are a user-experience coach for an AI career platform. For each input item, return a JSON array of objects with the following keys: id, question, options (array), hint (short 6-12 words). Return only valid JSON. Preserve ids. If you cannot improve, return the original text. Keep phrasing concise and friendly.`;

  const payload = `${instruction}\n\nInput:\n${JSON.stringify(prompts)}`;

  try {
    // Attempt to use Redis cache + dedupe
    const hash = crypto.createHash('sha256').update(payload).digest('hex');
    const cacheKey = `ai:questions:${hash}`;
    const redis = require('@/lib/redis').redisClient;
    if (redis && redis.isReady && redis.isReady()) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        try { const parsed = JSON.parse(cached); return parsed as GeneratedQuestion[]; } catch (e) { /* continue */ }
      }

      const lockKey = `${cacheKey}:lock`;
      const gotLock = await redis.acquireLock(lockKey, 15000);
      if (!gotLock) {
        const waited = await redis.waitForKey(cacheKey, 15000);
        if (waited) { try { return JSON.parse(waited) as GeneratedQuestion[]; } catch {} }
      }

      const aiResponse = await routeAI('summary', { prompt: payload, format: 'json' });
      const structured = safeParseAIResponse(JSON.parse(aiResponse.value), QuestionArraySchema);

      const mapped = structured.map((item: any) => ({
        id: item.id || 'unknown',
        question: item.question || questions.find((q) => q.id === item.id)?.question || '',
        category: item.category || questions.find((q) => q.id === item.id)?.category,
        options: Array.isArray(item.options) && item.options.length ? item.options : questions.find((q) => q.id === item.id)?.options || [],
        type: questions.find((q) => q.id === item.id)?.type,
        dataSourced: questions.find((q) => q.id === item.id)?.dataSourced,
        hint: typeof item.hint === 'string' ? item.hint : undefined,
      } as GeneratedQuestion));

      try { await redis.set(cacheKey, JSON.stringify(mapped), QUESTIONS_TTL_SECONDS); } catch (e) { }
      try { await redis.releaseLock(lockKey); } catch (e) { }

      return mapped;
    }
  } catch (err) {
    // Redis/cache failure — continue to call AI without cache
    console.warn('questionGenerator cache error', err);
  }

  // If cache path not used or AI fails, call AI directly and map results
  try {
    const aiResponse = await routeAI('summary', { prompt: payload, format: 'json' });
    const structured = safeParseAIResponse(JSON.parse(aiResponse.value), QuestionArraySchema);

    return structured.map((item: any) => ({
      id: item.id || 'unknown',
      question: item.question || questions.find((q) => q.id === item.id)?.question || '',
      category: item.category || questions.find((q) => q.id === item.id)?.category,
      options: Array.isArray(item.options) && item.options.length ? item.options : questions.find((q) => q.id === item.id)?.options || [],
      type: questions.find((q) => q.id === item.id)?.type,
      dataSourced: questions.find((q) => q.id === item.id)?.dataSourced,
      hint: typeof item.hint === 'string' ? item.hint : undefined,
    } as GeneratedQuestion));
  } catch (err) {
    // LLM failed; fall through to return originals
  }

  // Fallback: return original questions with small hint defaults
  return questions.map((q) => ({ ...q, hint: 'Choose the option that fits you best' } as GeneratedQuestion));

}

export default { generateQuestionsWithAI };
