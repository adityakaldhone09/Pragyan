import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';

import { config } from '@/config/env';
import { SecureGeminiService } from '@/security/ai/aiFirewall';

import { AIProviderBase, AIProviderOptions, AIProviderResult } from './AIProviderBase';

const DEFAULT_MODEL = 'gemini-3.1-flash-lite';

export class GeminiProvider extends AIProviderBase {
  private client: GoogleGenerativeAI | null = null;
  private model: string;
  private secureGemini = new SecureGeminiService();

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
    const firewall = this.secureGemini.inspectPrompt(prompt);
    if (firewall.blocked) {
      return {
        value: firewall.safeResponse || '',
        tokensUsed: 0,
      };
    }

    const client = this.getClient();
    const safePrompt = this.secureGemini.preparePrompt(prompt);
    const model = client.getGenerativeModel({
      model: this.model,
      systemInstruction: this.secureGemini.systemInstruction(systemInstruction),
    } as any);

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: safePrompt }] }],
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      ],
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
      value: this.secureGemini.validateResponse(String(text || '').trim()),
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
