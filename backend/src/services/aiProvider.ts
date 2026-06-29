import { config } from '@/config/env';
import { routeAI } from '@/ai/aiRouter';
import { GeminiProvider } from './GeminiProvider';
import { GroqProvider } from './GroqProvider';
import { LocalAIProvider } from './LocalAIProvider';
import { AIProviderAdapter, AIProviderOptions } from './AIProviderBase';

type ProviderMode = 'local' | 'gemini' | 'groq';

class AIProviderFacade implements AIProviderAdapter {
  private provider: AIProviderAdapter;
  private mode: ProviderMode;
  private lastRuntime: { provider: string; model: string };

  constructor() {
    this.mode = this.resolveMode();
    this.provider = this.createProvider(this.mode);
    this.lastRuntime = this.provider.getRuntime ? this.provider.getRuntime() : { provider: this.mode, model: 'unknown' };
  }

  private resolveMode(): ProviderMode {
    const configured = String(config.ai.provider || process.env.AI_PROVIDER || '').toLowerCase();
    if (configured === 'local' || configured === 'groq' || configured === 'gemini') {
      return configured;
    }
    return 'gemini';
  }

  private createProvider(mode: ProviderMode): AIProviderAdapter {
    if (mode === 'local') return new LocalAIProvider();
    if (mode === 'groq') return new GroqProvider(config.groq.reasoningModel);
    return new GeminiProvider(config.gemini.model);
  }

  setProvider(provider: AIProviderAdapter): void {
    this.provider = provider;
    this.mode = provider.getProviderName() === 'local'
      ? 'local'
      : provider.getProviderName() === 'groq'
        ? 'groq'
        : 'gemini';
    this.lastRuntime = provider.getRuntime ? provider.getRuntime() : { provider: this.mode, model: provider.getModel() };
  }

  getProviderName(): string {
    return this.lastRuntime.provider;
  }

  getModel(): string {
    return this.lastRuntime.model;
  }

  getRuntime() {
    return {
      provider: this.lastRuntime.provider,
      model: this.lastRuntime.model,
      configuredMode: this.mode,
    };
  }

  async generateText(prompt: string, opts?: AIProviderOptions): Promise<string> {
    if (this.mode === 'local') {
      const result = await this.provider.generateText(prompt, opts);
      this.lastRuntime = this.provider.getRuntime ? this.provider.getRuntime() : { provider: this.mode, model: this.provider.getModel() };
      return result;
    }

    const taskType = opts?.taskType || 'summary';
    const result = await routeAI(taskType as any, {
      prompt,
      input: opts?.input,
      userId: opts?.userId,
      promptVersion: opts?.promptVersion,
      format: 'text',
      maxTokens: opts?.maxTokens,
      temperature: opts?.temperature,
    });
    this.lastRuntime = { provider: result.provider, model: result.model };
    return result.value;
  }

  async generateJsonRaw(prompt: string, opts?: AIProviderOptions): Promise<string> {
    if (this.mode === 'local') {
      const result = await this.provider.generateJsonRaw(prompt, opts);
      this.lastRuntime = this.provider.getRuntime ? this.provider.getRuntime() : { provider: this.mode, model: this.provider.getModel() };
      return result;
    }

    const taskType = opts?.taskType || 'summary';
    const result = await routeAI(taskType as any, {
      prompt,
      input: opts?.input,
      userId: opts?.userId,
      promptVersion: opts?.promptVersion,
      format: 'json',
      maxTokens: opts?.maxTokens,
      temperature: opts?.temperature,
    });
    this.lastRuntime = { provider: result.provider, model: result.model };
    return result.value;
  }

  async generateJsonValidated<T>(prompt: string, validateFn: (raw: unknown) => T, opts?: AIProviderOptions): Promise<T> {
    const raw = await this.generateJsonRaw(prompt, opts);
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}|\[[\s\S]*\]/m);
      if (!match) {
        throw new Error('Failed to parse JSON from model output');
      }
      parsed = JSON.parse(match[0]);
    }

    return validateFn(parsed);
  }
}

export const aiProvider = new AIProviderFacade();

export default aiProvider;
