import { config } from '@/config/env';
import { GroqProvider } from '@/services/GroqProvider';

export type GroqTaskType =
  | 'mentor_chat'
  | 'resume_analysis'
  | 'skill_gap_analysis'
  | 'roadmap'
  | 'summary';

export type GroqModelKind = 'reasoning' | 'chat' | 'fast';

export interface GroqRequestOptions {
  maxTokens?: number;
  temperature?: number;
  format?: 'text' | 'json';
}

export interface GroqExecutionResult {
  value: string;
  cacheHit: false;
  provider: 'groq';
  model: string;
}

function getModelChain(taskType: GroqTaskType): string[] {
  const reasoning = config.groq.reasoningModel || 'openai/gpt-oss-120b';
  const chat = config.groq.chatModel || 'llama-3.3-70b-versatile';
  const fast = config.groq.fastModel || 'llama-3.1-8b-instant';

  switch (taskType) {
    case 'mentor_chat':
      return [chat, fast, reasoning];
    case 'summary':
      return [fast, chat, reasoning];
    default:
      return [reasoning, chat, fast];
  }
}

class GroqService {
  async generate(taskType: GroqTaskType, prompt: string, options: GroqRequestOptions = {}): Promise<GroqExecutionResult> {
    const models = getModelChain(taskType);
    let lastError: unknown = null;

    for (const model of models) {
      const provider = new GroqProvider(model);
      const start = Date.now();

      try {
        const value = options.format === 'json'
          ? await provider.generateJsonRaw(prompt, { maxTokens: options.maxTokens, temperature: options.temperature })
          : await provider.generateText(prompt, { maxTokens: options.maxTokens, temperature: options.temperature });

        console.log('[AI ROUTER]', `Task: ${taskType}`, `Model: ${model}`, `Latency: ${Date.now() - start}ms`, '[CACHE] Groq cache N/A');
        return {
          value,
          cacheHit: false,
          provider: 'groq',
          model,
        };
      } catch (error) {
        lastError = error;
        console.warn('[AI ROUTER]', `Task: ${taskType}`, `Model: ${model}`, 'failed, trying fallback model');
      }
    }

    throw lastError instanceof Error ? lastError : new Error('Groq request failed');
  }
}

export const groqService = new GroqService();

export default groqService;
