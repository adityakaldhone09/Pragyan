import { GoogleGenerativeAI } from '@google/generative-ai';

import { config } from '@/config/env';

import aiTelemetry from '@/lib/aiTelemetry';

export interface AIProviderHealthResult {
  status: 'healthy' | 'unhealthy';
  model: string;
  latency: number;
  error?: string;
}

export interface AIHealthSnapshot {
  gemini: AIProviderHealthResult;
  groq: AIProviderHealthResult;
  telemetry: {
    calls: number;
    failures: number;
    fallbackCount: number;
    fallbackRate: number;
  };
  checkedAt: string;
  overallStatus: 'healthy' | 'degraded';
}

const HEALTH_PROMPT = 'Reply with OK only.';

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error || 'Unknown error');
}

function withTimeout<T>(promise: Promise<T>, timeoutMs = 8000, timeoutLabel = 'AI health check timed out') {
  let timeoutHandle: NodeJS.Timeout | undefined;

  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutHandle = setTimeout(() => reject(new Error(timeoutLabel)), timeoutMs);
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

async function probeGemini(): Promise<AIProviderHealthResult> {
  const model = config.gemini.model;
  const start = Date.now();

  if (!config.gemini.apiKey) {
    return {
      status: 'unhealthy',
      model,
      latency: Date.now() - start,
      error: 'GEMINI_API_KEY is not set',
    };
  }

  try {
    const client = new GoogleGenerativeAI(config.gemini.apiKey);
    const generativeModel = client.getGenerativeModel({ model } as any);
    const result = await withTimeout(
      generativeModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: HEALTH_PROMPT }] }],
        generationConfig: { temperature: 0, maxOutputTokens: 8 },
      } as any)
    );

    const response = await result.response;
    const text = typeof response.text === 'function'
      ? response.text()
      : String(response?.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();

    if (!String(text || '').trim()) {
      return {
        status: 'unhealthy',
        model,
        latency: Date.now() - start,
        error: 'Gemini returned an empty response',
      };
    }

    return {
      status: 'healthy',
      model,
      latency: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      model,
      latency: Date.now() - start,
      error: formatError(error),
    };
  }
}

async function probeGroq(): Promise<AIProviderHealthResult> {
  const model = config.groq.model;
  const start = Date.now();

  if (!config.groq.apiKey) {
    return {
      status: 'unhealthy',
      model,
      latency: Date.now() - start,
      error: 'GROQ_API_KEY is not set',
    };
  }

  try {
    const response = await withTimeout(
      fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.groq.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: 'Reply with OK only.' },
            { role: 'user', content: HEALTH_PROMPT },
          ],
          temperature: 0,
          max_tokens: 8,
        }),
      })
    );

    if (!response.ok) {
      const bodyText = await response.text();
      throw new Error(`Groq request failed: ${response.status} ${response.statusText} ${bodyText}`);
    }

    const payload: any = await response.json();
    const text = String(payload?.choices?.[0]?.message?.content || '').trim();

    if (!text) {
      return {
        status: 'unhealthy',
        model,
        latency: Date.now() - start,
        error: 'Groq returned an empty response',
      };
    }

    return {
      status: 'healthy',
      model,
      latency: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      model,
      latency: Date.now() - start,
      error: formatError(error),
    };
  }
}

export async function getAIHealthSnapshot(): Promise<AIHealthSnapshot> {
  const [gemini, groq] = await Promise.all([probeGemini(), probeGroq()]);
  const telemetry = aiTelemetry.getTelemetry();
  const fallbackRate = telemetry.calls > 0 ? Math.round((telemetry.fallbackCount / telemetry.calls) * 100) : 0;

  return {
    gemini,
    groq,
    telemetry: {
      calls: telemetry.calls,
      failures: telemetry.failures,
      fallbackCount: telemetry.fallbackCount,
      fallbackRate,
    },
    checkedAt: new Date().toISOString(),
    overallStatus: gemini.status === 'healthy' && groq.status === 'healthy' ? 'healthy' : 'degraded',
  };
}
