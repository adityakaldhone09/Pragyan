import { GoogleGenerativeAI } from '@google/generative-ai';

import { config } from '@/config/env';

import { AIProviderBase, AIProviderOptions, AIProviderResult } from './AIProviderBase';

const DEFAULT_MODEL = 'gemini-3.1-flash-lite';

export class GeminiProvider extends AIProviderBase {
  private client: GoogleGenerativeAI | null = null;
  private model: string;

  constructor(model?: string) {
    super();
    const apiKey = config.gemini.apiKey || process.env.GEMINI_API_KEY || null;
    if (apiKey) {
      this.client = new GoogleGenerativeAI(apiKey);
    }
    this.model = model || config.gemini.model || DEFAULT_MODEL;
  }

  getProviderName(): string {
    return 'gemini';
  }

  getModel(): string {
    return this.model;
  }

  private getClient(): GoogleGenerativeAI {
    if (!this.client) {
      throw new Error('GEMINI_API_KEY is not set');
    }

    return this.client;
  }

  private async callModel(
    prompt: string,
    systemInstruction: string,
    opts?: AIProviderOptions,
    responseMimeType?: 'application/json'
  ): Promise<AIProviderResult<string>> {
    const client = this.getClient();
    const model = client.getGenerativeModel({
      model: this.model,
      systemInstruction,
    } as any);

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: opts?.temperature ?? 0.2,
        maxOutputTokens: opts?.maxTokens ?? 900,
        ...(responseMimeType ? { responseMimeType } : {}),
      },
    } as any);

    const response = await result.response;
    const text = typeof response.text === 'function'
      ? response.text()
      : String(response?.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();

    const tokensUsed = Number(response?.usageMetadata?.totalTokenCount || 0) || undefined;

    return {
      value: String(text || '').trim(),
      tokensUsed,
    };
  }

  protected doGenerateText(prompt: string, opts?: AIProviderOptions): Promise<AIProviderResult<string>> {
    return this.callModel(
      prompt,
      'You are an assistant for Pragyan. Provide concise, actionable responses.',
      opts
    );
  }

  protected doGenerateJsonRaw(prompt: string, opts?: AIProviderOptions): Promise<AIProviderResult<string>> {
    return this.callModel(
      prompt,
      'Return valid JSON only. Do not include markdown.',
      opts,
      'application/json'
    );
  }
}
