/**
 * Lightweight LLM client scaffold for the attached assessment engine files.
 * It falls back gracefully when no external AI provider is configured.
 */

import { callLLM as callProviderLLM } from '@/services/hybridAssessment/llmClient';

export interface LLMCallParams {
  systemPrompt: string;
  userPrompt: string;
  temperature: number;
}

export async function callLLM(params: LLMCallParams): Promise<string> {
  try {
    return await callProviderLLM(params);
  } catch (error) {
    console.warn(
      '[assessment/llmClient] Provider LLM failed; using mocked fallback:',
      error instanceof Error ? error.message : String(error)
    );
  }

  const prompt = `${params.systemPrompt}\n\n${params.userPrompt}`.toLowerCase();

  if (prompt.includes('skills discovery')) {
    return JSON.stringify({
      realizedStrengths: ['Communication', 'Teamwork'],
      unrealizedStrengths: ['Leadership', 'Strategic Thinking'],
      learnedSkills: ['Python', 'Data Analysis'],
      weaknesses: ['Public Speaking', 'Time Management'],
    });
  }

  if (prompt.includes('recommend one target career')) {
    return JSON.stringify({
      recommendedCareer: 'Software Engineer',
      confidenceScore: 90,
      reasoning: 'Based on the assessment summary and the user profile.',
    });
  }

  if (prompt.includes('generate a concise learning roadmap')) {
    return JSON.stringify({
      domain: 'Software Development',
      track: {
        title: 'Software Engineer Roadmap',
        modules: [
          {
            title: 'Core Programming',
            topics: [
              {
                title: 'Data Structures',
                tasks: [{ title: 'Learn arrays', description: 'Study array operations', estimatedMinutes: 60 }],
              },
            ],
          },
        ],
      },
    });
  }

  return JSON.stringify({
    questionText: 'What is the capital of France?',
    options: ['Berlin', 'Madrid', 'Paris', 'Rome'],
    correctOptionIndex: 2,
    explanation: 'Paris is the capital of France.',
    topic: 'General Knowledge',
  });
}

export async function parseLLMJson<T>(jsonString: string): Promise<T> {
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    throw new Error(`Failed to parse LLM JSON response: ${error instanceof Error ? error.message : String(error)}`);
  }
}
