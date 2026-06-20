import type { ParsedProfilePayload } from '@/types/hybridAssessment';
import { callLLM, parseLLMJson } from './llmClient';
import { PROFILE_PARSER_SYSTEM_PROMPT, buildProfileParserUserPrompt } from './promptTemplates';

export async function parseResumeToProfile(resumeText: string): Promise<ParsedProfilePayload> {
  if (!resumeText || resumeText.trim().length < 20) {
    return { Education: '', Experience: '', Skills: [], ContactInfo: '', confidence: 0.3 };
  }

  const raw = await callLLM({
    systemPrompt: PROFILE_PARSER_SYSTEM_PROMPT,
    userPrompt: buildProfileParserUserPrompt(resumeText),
    temperature: 0.2,
  });

  return sanitizePayload(parseLLMJson<ParsedProfilePayload>(raw));
}

function sanitizePayload(payload: ParsedProfilePayload): ParsedProfilePayload {
  return {
    Education: payload.Education || '',
    Experience: payload.Experience || '',
    Skills: Array.isArray(payload.Skills) ? payload.Skills.slice(0, 15) : [],
    ContactInfo: payload.ContactInfo || '',
    confidence: typeof payload.confidence === 'number' ? Math.min(1, Math.max(0, payload.confidence)) : 0.8,
  };
}
