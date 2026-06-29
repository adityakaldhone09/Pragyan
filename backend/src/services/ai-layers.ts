import { aiProvider } from '@/services/aiProvider';

type JsonOpts = { timeoutMs?: number; taskType?: string; userId?: string; input?: unknown; promptVersion?: string };

export const aiLayers = {
  // Creative / long-form generation (e.g., mentor replies, descriptions)
  async generateCreative(prompt: string, opts: { timeoutMs?: number } = {}) {
    return aiProvider.generateText(prompt, { timeoutMs: opts.timeoutMs ?? 20000, taskType: 'mentor_chat' });
  },

  // Structured JSON output with fallback handling for parsable responses
  async generateStructuredJson(prompt: string, opts: JsonOpts = {}) {
    // Keep low timeout for structured responses; provider facade will handle fallbacks
    return aiProvider.generateJsonRaw(prompt, {
      timeoutMs: opts.timeoutMs ?? 12000,
      taskType: opts.taskType || 'summary',
      userId: opts.userId,
      input: opts.input,
      promptVersion: opts.promptVersion,
    });
  },

  // Short explanations / reasons
  async explain(prompt: string, opts: { timeoutMs?: number } = {}) {
    return aiProvider.generateText(prompt, { timeoutMs: opts.timeoutMs ?? 8000, taskType: 'summary' });
  },
};

export default aiLayers;
