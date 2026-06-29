export type PromptInjectionType = 'PROMPT_INJECTION';

export type PromptInjectionResult = {
  blocked: boolean;
  type?: PromptInjectionType;
  message?: string;
  matchedPattern?: string;
};

const ATTACK_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions?/i,
  /forget\s+(your|the)\s+(rules|instructions|system\s+prompt)/i,
  /reveal\s+(the\s+)?(system|developer)\s+(prompt|instructions?)/i,
  /show\s+(me\s+)?(your\s+)?(system|developer)\s+(prompt|instructions?)/i,
  /developer\s+mode/i,
  /jailbreak/i,
  /act\s+as\s+(an?\s+)?admin/i,
  /bypass\s+(safety|policy|guardrails?|rules)/i,
  /show\s+(api\s+keys?|secrets?|tokens?)/i,
  /print\s+(environment\s+variables|env|process\.env)/i,
  /exfiltrate|credential\s+dump|secret\s+dump/i,
];

export function detectPromptInjection(input: string): PromptInjectionResult {
  const normalized = input.replace(/\s+/g, ' ').trim();

  for (const pattern of ATTACK_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        blocked: true,
        type: 'PROMPT_INJECTION',
        message: 'Unsafe AI request detected',
        matchedPattern: pattern.source,
      };
    }
  }

  return { blocked: false };
}
