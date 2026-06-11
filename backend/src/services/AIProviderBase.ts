import { setTimeout as delay } from 'timers/promises';

import { recordCall, recordFailure, recordFallback } from '@/lib/aiTelemetry';

export interface AIProviderOptions {
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
  taskType?: string;
  userId?: string;
  input?: unknown;
  promptVersion?: string;
  format?: 'text' | 'json';
}

export interface AIProviderResult<T> {
  value: T;
  tokensUsed?: number;
}

export interface AIProviderRuntime {
  provider: string;
  model: string;
}

export interface AIProviderAdapter {
  getProviderName(): string;
  getModel(): string;
  generateText(prompt: string, opts?: AIProviderOptions): Promise<string>;
  generateJsonRaw(prompt: string, opts?: AIProviderOptions): Promise<string>;
  getRuntime?(): AIProviderRuntime;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs?: number, timeoutMessage = 'AI request timed out') {
  if (!timeoutMs || timeoutMs <= 0) {
    return promise;
  }

  let timeoutHandle: NodeJS.Timeout | undefined;

  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutHandle = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
    timeoutHandle.unref?.();
  });

  return Promise.race([
    promise.finally(() => {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
    }),
    timeoutPromise,
  ]);
}

function sleep(ms: number) {
  return delay(ms);
}

export abstract class AIProviderBase implements AIProviderAdapter {
  protected maxRetries = 3;
  protected baseDelay = 300;
  private cooldownUntil = 0;
  private cooldownMs = 15 * 60 * 1000;

  abstract getProviderName(): string;
  abstract getModel(): string;

  protected abstract doGenerateText(prompt: string, opts?: AIProviderOptions): Promise<AIProviderResult<string>>;
  protected abstract doGenerateJsonRaw(prompt: string, opts?: AIProviderOptions): Promise<AIProviderResult<string>>;

  protected isQuotaOrAuthError(err: any): boolean {
    const code = String(err?.code || '').toLowerCase();
    const type = String(err?.type || '').toLowerCase();
    const message = String(err?.message || '').toLowerCase();

    return (
      err?.status === 401 ||
      err?.status === 403 ||
      code === 'insufficient_quota' ||
      code === 'invalid_api_key' ||
      type === 'insufficient_quota' ||
      type === 'invalid_api_key' ||
      message.includes('exceeded your current quota') ||
      message.includes('invalid api key')
    );
  }

  protected shouldRetryError(err: any): boolean {
    return !this.isQuotaOrAuthError(err) && (
      err?.status === 408 ||
      err?.status === 409 ||
      err?.status === 425 ||
      err?.status === 429 ||
      err?.status >= 500 ||
      /rate limit|timeout|temporarily unavailable|network|service unavailable/i.test(err?.message || '')
    );
  }

  protected shouldRetryValidationError(_err: any): boolean {
    return true;
  }

  protected isInCooldown(): boolean {
    return Date.now() < this.cooldownUntil;
  }

  protected markCooldown(): void {
    this.cooldownUntil = Date.now() + this.cooldownMs;
  }

  private async runWithRetry<T>(operation: () => Promise<AIProviderResult<T>>, timeoutMs?: number): Promise<T> {
    if (this.isInCooldown()) {
      throw new Error('AI provider temporarily unavailable; using fallback path.');
    }

    let attempt = 0;
    const start = Date.now();

    while (attempt <= this.maxRetries) {
      try {
        const result = await withTimeout(operation(), timeoutMs);
        recordCall(this.getProviderName(), result.tokensUsed ?? 0, Date.now() - start, this.getModel());
        return result.value;
      } catch (err: any) {
        attempt += 1;

        if (this.isQuotaOrAuthError(err)) {
          this.markCooldown();
          recordFailure(this.getProviderName(), err?.message || String(err), this.getModel());
          throw err;
        }

        if (!this.shouldRetryError(err) || attempt > this.maxRetries) {
          recordFailure(this.getProviderName(), err?.message || String(err), this.getModel());
          throw err;
        }

        recordFailure(this.getProviderName(), err?.message || String(err), this.getModel());

        let delayMs = this.baseDelay * Math.pow(2, attempt - 1);
        delayMs = Math.round(delayMs + Math.random() * 100);

        if (err?.status === 429 || /rate limit/i.test(err?.message || '')) {
          delayMs *= 2;
        }

        await sleep(delayMs);
      }
    }

    throw new Error('Exceeded retry attempts');
  }

  async generateText(prompt: string, opts?: AIProviderOptions): Promise<string> {
    return this.runWithRetry(() => this.doGenerateText(prompt, opts), opts?.timeoutMs);
  }

  async generateJsonRaw(prompt: string, opts?: AIProviderOptions): Promise<string> {
    return this.runWithRetry(() => this.doGenerateJsonRaw(prompt, opts), opts?.timeoutMs);
  }

  async generateJsonValidated<T>(
    prompt: string,
    validateFn: (raw: unknown) => T,
    opts?: AIProviderOptions
  ): Promise<T> {
    let attempt = 0;

    while (attempt <= this.maxRetries) {
      try {
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
      } catch (err: any) {
        attempt += 1;

        if (this.isQuotaOrAuthError(err)) {
          this.markCooldown();
          recordFailure(this.getProviderName(), err?.message || String(err), this.getModel());
          throw err;
        }

        if (!this.shouldRetryValidationError(err) || attempt > this.maxRetries) {
          recordFallback(this.getProviderName(), this.getModel());
          throw err;
        }

        recordFailure(this.getProviderName(), '', this.getModel());

        const delayMs = this.baseDelay * Math.pow(2, attempt - 1) + Math.random() * 100;
        await sleep(Math.round(delayMs));
      }
    }

    throw new Error('generateJsonValidated: exceeded retries');
  }

  getRuntime(): AIProviderRuntime {
    return {
      provider: this.getProviderName(),
      model: this.getModel(),
    };
  }
}
