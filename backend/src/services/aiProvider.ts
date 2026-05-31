import { config } from '@/config/env';

import { AIProviderAdapter, AIProviderOptions } from './AIProviderBase';
import { GeminiProvider } from './GeminiProvider';
import { GroqProvider } from './GroqProvider';
import { LocalAIProvider } from './LocalAIProvider';
import aiTelemetry from '@/lib/aiTelemetry';

type ProviderMode = 'local' | 'gemini' | 'groq';

class AIProviderFacade implements AIProviderAdapter {
  private provider: AIProviderAdapter;
  private mode: ProviderMode;

  constructor() {
    this.mode = this.resolveMode();
    this.provider = this.createProvider(this.mode);
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
    if (mode === 'groq') return new GroqProvider();
    return new GeminiProvider();
  }

  private getFallbackProviders(): AIProviderAdapter[] {
    return [new GroqProvider(), new LocalAIProvider()];
  }

  setProvider(provider: AIProviderAdapter): void {
    this.provider = provider;
    this.mode = provider.getProviderName() === 'local'
      ? 'local'
      : provider.getProviderName() === 'groq'
        ? 'groq'
        : 'gemini';
  }

  getProviderName(): string {
    return this.provider.getProviderName();
  }

  getModel(): string {
    return this.provider.getModel();
  }

  getRuntime() {
    return {
      provider: this.getProviderName(),
      model: this.getModel(),
      configuredMode: this.mode,
    };
  }

  async generateText(prompt: string, opts?: AIProviderOptions): Promise<string> {
    const primary = this.provider.getProviderName();
    const start = Date.now();
    try {
      const result = await this.provider.generateText(prompt, opts);
      aiTelemetry.recordCall(primary, 0, Date.now() - start, this.getModel());
      return result;
    } catch (error: any) {
      aiTelemetry.recordFailure(primary, error?.message || String(error), this.getModel());
      for (const fallback of this.getFallbackProviders()) {
        if (fallback.getProviderName() === this.provider.getProviderName()) {
          continue;
        }
        try {
          const fbName = fallback.getProviderName();
          const fbStart = Date.now();
          const result = await fallback.generateText(prompt, opts);
          aiTelemetry.recordFallback(primary, this.getModel());
          aiTelemetry.recordCall(fbName, 0, Date.now() - fbStart, fallback.getModel());
          return result;
        } catch (fallbackError: any) {
          aiTelemetry.recordFailure(fallback.getProviderName(), fallbackError?.message || String(fallbackError), fallback.getModel());
          continue;
        }
      }

      throw error;
    }
  }

  async generateJsonRaw(prompt: string, opts?: AIProviderOptions): Promise<string> {
    const primary = this.provider.getProviderName();
    const start = Date.now();
    try {
      const result = await this.provider.generateJsonRaw(prompt, opts);
      aiTelemetry.recordCall(primary, 0, Date.now() - start, this.getModel());
      return result;
    } catch (error: any) {
      aiTelemetry.recordFailure(primary, error?.message || String(error), this.getModel());
      for (const fallback of this.getFallbackProviders()) {
        if (fallback.getProviderName() === this.provider.getProviderName()) {
          continue;
        }
        try {
          const fbName = fallback.getProviderName();
          const fbStart = Date.now();
          const result = await fallback.generateJsonRaw(prompt, opts);
          aiTelemetry.recordFallback(primary, this.getModel());
          aiTelemetry.recordCall(fbName, 0, Date.now() - fbStart, fallback.getModel());
          return result;
        } catch (fallbackError: any) {
          aiTelemetry.recordFailure(fallback.getProviderName(), fallbackError?.message || String(fallbackError), fallback.getModel());
          continue;
        }
      }

      throw error;
    }
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

