jest.mock('@google/generative-ai');
jest.mock('@/config/env', () => ({
  config: {
    gemini: {
      apiKey: 'gemini-key',
      model: 'gemini-2.5-flash',
    },
    groq: {
      apiKey: 'groq-key',
      model: 'llama-3.3-70b-versatile',
    },
  },
}));
jest.mock('@/lib/aiTelemetry', () => ({
  __esModule: true,
  default: { getTelemetry: () => ({ calls: 10, failures: 1, fallbackCount: 2 }) },
  getTelemetry: () => ({ calls: 10, failures: 1, fallbackCount: 2 }),
}));

const geminiMock = require('@google/generative-ai').__mock;

describe('aiHealth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it('returns healthy status for both providers', async () => {
    geminiMock.generateContentMock.mockResolvedValueOnce({
      response: Promise.resolve({
        text: () => 'OK',
        usageMetadata: { totalTokenCount: 2 },
      }),
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'OK' } }],
      }),
    });

    const { getAIHealthSnapshot } = require('@/services/aiHealth');
    const snapshot = await getAIHealthSnapshot();

    expect(snapshot.gemini.status).toBe('healthy');
    expect(snapshot.gemini.model).toBe('gemini-2.5-flash');
    expect(snapshot.groq.status).toBe('healthy');
    expect(snapshot.groq.model).toBe('llama-3.3-70b-versatile');
    expect(snapshot.telemetry.fallbackRate).toBe(20);
    expect(snapshot.overallStatus).toBe('healthy');
  });

  it('marks degraded when groq fails', async () => {
    geminiMock.generateContentMock.mockResolvedValueOnce({
      response: Promise.resolve({
        text: () => 'OK',
        usageMetadata: { totalTokenCount: 2 },
      }),
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      text: async () => '{"error":"invalid_api_key"}',
    });

    const { getAIHealthSnapshot } = require('@/services/aiHealth');
    const snapshot = await getAIHealthSnapshot();

    expect(snapshot.gemini.status).toBe('healthy');
    expect(snapshot.groq.status).toBe('unhealthy');
    expect(snapshot.groq.error).toContain('401 Unauthorized');
    expect(snapshot.telemetry.fallbackCount).toBe(2);
    expect(snapshot.overallStatus).toBe('degraded');
  });
});
