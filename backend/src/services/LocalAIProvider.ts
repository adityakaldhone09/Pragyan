import { AIProviderBase, AIProviderOptions, AIProviderResult } from './AIProviderBase';
import { generateLocalJson, generateLocalText } from './local-ai-engine';

export class LocalAIProvider extends AIProviderBase {
  getProviderName(): string {
    return 'local';
  }

  getModel(): string {
    return 'local-fallback';
  }

  protected shouldRetryError(): boolean {
    return false;
  }

  protected shouldRetryValidationError(): boolean {
    return false;
  }

  protected doGenerateText(_prompt: string, _opts?: AIProviderOptions): Promise<AIProviderResult<string>> {
    return Promise.resolve({ value: generateLocalText(_prompt), tokensUsed: 0 });
  }

  protected doGenerateJsonRaw(_prompt: string, _opts?: AIProviderOptions): Promise<AIProviderResult<string>> {
    return Promise.resolve({ value: JSON.stringify(generateLocalJson(_prompt)), tokensUsed: 0 });
  }
}
