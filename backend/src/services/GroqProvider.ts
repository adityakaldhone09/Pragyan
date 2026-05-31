import { config } from '@/config/env';

import { AIProviderBase, AIProviderOptions, AIProviderResult } from './AIProviderBase';

const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

export class GroqProvider extends AIProviderBase {
  private apiKey: string | null;
  private model: string;

  constructor() {
    super();
    this.apiKey = config.groq.apiKey || process.env.GROQ_API_KEY || null;
    this.model = config.groq.model || DEFAULT_MODEL;
  }

  getProviderName(): string {
    return 'groq';
  }

  getModel(): string {
    return this.model;
  }

  private getApiKey(): string {
    if (!this.apiKey) {
      throw new Error('GROQ_API_KEY is not set');
    }

    return this.apiKey;
  }

  private async callModel(prompt: string, systemMessage: string, opts?: AIProviderOptions): Promise<AIProviderResult<string>> {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.getApiKey()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: prompt },
        ],
        temperature: opts?.temperature ?? 0.2,
        max_tokens: opts?.maxTokens ?? 900,
      }),
    });

    if (!response.ok) {
      const bodyText = await response.text();
      const error = new Error(`Groq request failed: ${response.status} ${response.statusText} ${bodyText}`) as any;
      error.status = response.status;
      throw error;
    }

    const payload: any = await response.json();
    const text = String(payload?.choices?.[0]?.message?.content || '').trim();
    const tokensUsed = Number(payload?.usage?.total_tokens || 0) || undefined;

    return { value: text, tokensUsed };
  }

  protected doGenerateText(prompt: string, opts?: AIProviderOptions): Promise<AIProviderResult<string>> {
    return this.callModel(prompt, 'You are an assistant for Pragyan. Provide concise, actionable responses.', opts);
  }

  protected doGenerateJsonRaw(prompt: string, opts?: AIProviderOptions): Promise<AIProviderResult<string>> {
    return this.callModel(prompt, 'Return valid JSON only. Do not include markdown.', opts);
  }
}
