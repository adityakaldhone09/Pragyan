import { config } from '@/config/env';
import { GeminiProvider } from '@/services/GeminiProvider';
import { GroqProvider } from '@/services/GroqProvider';
import { getOrCreateCache } from './cache.service';

export type GeminiTaskType =
  | 'assessment'
  | 'career_match'
  | 'decision_intelligence'
  | 'personality_analysis';

const CACHEABLE_TASKS = new Set<GeminiTaskType>([
  'assessment',
  'career_match',
  'decision_intelligence',
  'personality_analysis',
]);

export interface GeminiRequestOptions {
  userId?: string;
  input?: unknown;
  promptVersion?: string;
  maxTokens?: number;
  temperature?: number;
  format?: 'text' | 'json';
}

export interface GeminiExecutionResult {
  value: string;
  cacheHit: boolean;
  provider: 'gemini' | 'groq';
  model: string;
}

class GeminiService {
  private async fallbackToGroqReasoning(
    taskType: GeminiTaskType,
    prompt: string,
    options: GeminiRequestOptions
  ): Promise<GeminiExecutionResult> {
    const model = config.groq.reasoningModel || config.groq.model || 'openai/gpt-oss-120b';
    const provider = new GroqProvider(model);

    const value = options.format === 'json'
      ? await provider.generateJsonRaw(prompt, { maxTokens: options.maxTokens, temperature: options.temperature })
      : await provider.generateText(prompt, { maxTokens: options.maxTokens, temperature: options.temperature });

    console.warn('[AI ROUTER]', `Task: ${taskType}`, `Model: ${config.gemini.model || 'gemini-3.1-flash-lite'}`, 'failed; using Groq reasoning fallback', `FallbackModel: ${model}`);

    return {
      value,
      cacheHit: false,
      provider: 'groq',
      model,
    };
  }

  async generate(taskType: GeminiTaskType, prompt: string, options: GeminiRequestOptions = {}): Promise<GeminiExecutionResult> {
    const model = config.gemini.model || 'gemini-3.1-flash-lite';
    const provider = new GeminiProvider(model);
    const promptVersion = options.promptVersion || `${taskType}-v1`;
    const canCache = CACHEABLE_TASKS.has(taskType) && Boolean(options.userId);

    const runner = async () => {
      if (options.format === 'json') {
        return provider.generateJsonRaw(prompt, { maxTokens: options.maxTokens, temperature: options.temperature });
      }

      return provider.generateText(prompt, { maxTokens: options.maxTokens, temperature: options.temperature });
    };

    try {
      if (!canCache) {
        const value = await runner();
        console.log('[AI ROUTER]', `Task: ${taskType}`, `Model: ${model}`, '[CACHE] Gemini cache SKIP');
        return { value, cacheHit: false, provider: 'gemini', model };
      }

      const cached = await getOrCreateCache({
        userId: options.userId as string,
        kind: taskType,
        promptVersion,
        model,
        input: {
          prompt,
          input: options.input,
          format: options.format || 'text',
        },
        ttlSeconds: 60 * 60 * 24 * 30,
        generate: runner,
      });

      console.log('[AI ROUTER]', `Task: ${taskType}`, `Model: ${model}`, cached.cacheHit ? '[CACHE] Gemini cache HIT' : '[CACHE] Gemini cache MISS');

      return {
        value: cached.response,
        cacheHit: cached.cacheHit,
        provider: 'gemini',
        model,
      };
    } catch (error) {
      console.warn('[AI ROUTER]', `Task: ${taskType}`, `Model: ${model}`, 'failed; falling back to Groq reasoning');
      return this.fallbackToGroqReasoning(taskType, prompt, options);
    }
  }
}

export const geminiService = new GeminiService();

export default geminiService;
