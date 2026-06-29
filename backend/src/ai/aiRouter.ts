import { buildAssessmentPrompt, buildMentorPrompt, buildResumeAnalysisPrompt, buildRoadmapPrompt, buildSummaryPrompt } from './promptBuilder';
import { geminiService, type GeminiTaskType } from './gemini.service';
import { groqService, type GroqTaskType } from './groq.service';
import { SAFE_AI_SECURITY_RESPONSE, inspectPromptSafety, sanitizePromptForAI, validateAIResponse } from '@/security/ai/aiFirewall';
import { logAIProviderAttack } from '@/security/ai/aiAudit';

export type AIRequestTask =
  | GeminiTaskType
  | GroqTaskType;

export interface AIRequestPayload {
  prompt?: string;
  input?: unknown;
  userId?: string;
  promptVersion?: string;
  format?: 'text' | 'json';
  maxTokens?: number;
  temperature?: number;
}

export interface AIRouteResult {
  value: string;
  provider: 'gemini' | 'groq';
  model: string;
  cacheHit: boolean;
}

function resolvePrompt(taskType: AIRequestTask, payload: AIRequestPayload): string {
  if (payload.prompt) {
    return payload.prompt;
  }

  switch (taskType) {
    case 'assessment':
    case 'career_match':
    case 'decision_intelligence':
    case 'personality_analysis':
      return buildAssessmentPrompt(payload.input as any);
    case 'mentor_chat':
      return buildMentorPrompt(payload.input as any);
    case 'resume_analysis':
    case 'skill_gap_analysis':
      return buildResumeAnalysisPrompt(payload.input as any);
    case 'roadmap':
      return buildRoadmapPrompt(payload.input as any);
    case 'summary':
    default:
      return buildSummaryPrompt({
        topic: taskType,
        content: payload.input ?? {},
      });
  }
}

function isGeminiTask(taskType: AIRequestTask): taskType is GeminiTaskType {
  return ['assessment', 'career_match', 'decision_intelligence', 'personality_analysis'].includes(taskType);
}

function isGroqTask(taskType: AIRequestTask): taskType is GroqTaskType {
  return ['mentor_chat', 'resume_analysis', 'skill_gap_analysis', 'roadmap', 'summary'].includes(taskType);
}

export async function routeAI(taskType: AIRequestTask, payload: AIRequestPayload = {}): Promise<AIRouteResult> {
  const prompt = sanitizePromptForAI(resolvePrompt(taskType, payload));
  const inspection = inspectPromptSafety(prompt);

  if (inspection.blocked) {
    logAIProviderAttack({
      type: inspection.type,
      matchedPattern: inspection.matchedPattern,
      taskType,
    });

    return {
      value: SAFE_AI_SECURITY_RESPONSE,
      provider: 'gemini',
      model: 'security-firewall',
      cacheHit: false,
    };
  }

  if (isGeminiTask(taskType)) {
    const result = await geminiService.generate(taskType, prompt, {
      userId: payload.userId,
      input: payload.input,
      promptVersion: payload.promptVersion,
      format: payload.format,
      maxTokens: payload.maxTokens,
      temperature: payload.temperature,
    });

    return { ...result, value: validateAIResponse(result.value) };
  }

  if (isGroqTask(taskType)) {
    const result = await groqService.generate(taskType, prompt, {
      format: payload.format,
      maxTokens: payload.maxTokens,
      temperature: payload.temperature,
    });

    return { ...result, value: validateAIResponse(result.value) };
  }

  const result = await groqService.generate('summary', prompt, {
    format: payload.format,
    maxTokens: payload.maxTokens,
    temperature: payload.temperature,
  });

  return { ...result, value: validateAIResponse(result.value) };
}

export default {
  routeAI,
};
