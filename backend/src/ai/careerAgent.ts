import { generateContent } from './GeminiProvider';

export interface LLMCareerRecommendationInput {
  interests: string[];
  strengths: string[];
  weaknesses: string[];
  skills: string[];
  quizScore: number;
  learningHours: number;
}

export interface LLMCareerRecommendation {
  topCareers: Array<{
    career: string;
    confidence: number;
    reason: string;
    requiredSkills: string[];
    missingSkills: string[];
    roadmap: string[];
  }>;
  summary: string;
  provider: string;
  fallbackUsed: boolean;
}

const DEFAULT_CAREERS = ['Software Developer', 'Data Analyst', 'Product Designer'];

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value
        .flatMap((item) => {
          const normalized = String(item || '').trim();
          return normalized ? [normalized] : [];
        })
        .slice(0, 12)
    : [];
}

function clampConfidence(value: unknown, fallback: number) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.max(1, Math.min(100, Math.round(numeric)));
}

function buildFallbackRecommendation(input: LLMCareerRecommendationInput): LLMCareerRecommendation {
  const career = input.interests[0] || DEFAULT_CAREERS[0];
  const strengths = input.strengths.length ? input.strengths : ['problem solving'];
  const missingSkills = input.weaknesses.length ? input.weaknesses : ['portfolio depth', 'interview practice'];

  return {
    topCareers: [
      {
        career,
        confidence: clampConfidence(input.quizScore, 72),
        reason: `This path fits your current signals around ${strengths.slice(0, 3).join(', ')} and gives you a clear way to improve weaker areas.`,
        requiredSkills: [...new Set([...input.skills, ...strengths])].slice(0, 6),
        missingSkills: missingSkills.slice(0, 5),
        roadmap: [
          `Strengthen fundamentals for ${career}`,
          `Build one focused project that proves ${strengths[0]}`,
          `Practice interview and portfolio storytelling around your assessment result`,
        ],
      },
    ],
    summary: 'Generated from the deterministic assessment result using local fallback reasoning.',
    provider: 'local-fallback',
    fallbackUsed: true,
  };
}

function normalizeRecommendation(raw: unknown, input: LLMCareerRecommendationInput): LLMCareerRecommendation {
  const fallback = buildFallbackRecommendation(input);
  const source = raw && typeof raw === 'object' ? raw as any : {};
  const careers: any[] = Array.isArray(source.topCareers) ? source.topCareers : [];
  const normalizedCareers = careers
    .map((career: any, index: number) => ({
      career: String(career?.career || input.interests[index] || DEFAULT_CAREERS[index] || DEFAULT_CAREERS[0]),
      confidence: clampConfidence(career?.confidence, Math.max(60, fallback.topCareers[0].confidence - index * 6)),
      reason: String(career?.reason || fallback.topCareers[0].reason),
      requiredSkills: asStringArray(career?.requiredSkills).length
        ? asStringArray(career?.requiredSkills)
        : fallback.topCareers[0].requiredSkills,
      missingSkills: asStringArray(career?.missingSkills).length
        ? asStringArray(career?.missingSkills)
        : fallback.topCareers[0].missingSkills,
      roadmap: asStringArray(career?.roadmap).length
        ? asStringArray(career?.roadmap)
        : fallback.topCareers[0].roadmap,
    }))
    .filter((career) => career.career)
    .slice(0, 3);

  return {
    topCareers: normalizedCareers.length ? normalizedCareers : fallback.topCareers,
    summary: String(source.summary || fallback.summary),
    provider: String(source.provider || 'gemini'),
    fallbackUsed: Boolean(source.fallbackUsed || false),
  };
}

export async function getLLMCareerRecommendation(
  input: LLMCareerRecommendationInput
): Promise<LLMCareerRecommendation> {
  const prompt = [
    'You are Pragyan careerAgent.ts. Use Gemini LLM reasoning to explain career fit.',
    'The deterministic assessment has already produced the evidence. Recommend careers from the provided suggested careers when possible.',
    'Return valid JSON only with this exact shape:',
    '{ "topCareers": [{ "career": string, "confidence": number, "reason": string, "requiredSkills": string[], "missingSkills": string[], "roadmap": string[] }], "summary": string }',
    'Keep confidence between 1 and 100. Include 1 to 3 career recommendations. Roadmap should have 3 to 5 short steps.',
    `Suggested careers/interests: ${input.interests.join(', ') || 'none'}`,
    `Strengths: ${input.strengths.join(', ') || 'none'}`,
    `Weaknesses: ${input.weaknesses.join(', ') || 'none'}`,
    `Known skills: ${input.skills.join(', ') || 'none'}`,
    `Assessment confidence/quiz score: ${input.quizScore}`,
    `Available learning hours per day: ${input.learningHours}`,
  ].join('\n\n');

  try {
    const raw = await generateContent(prompt);
    const parsed = JSON.parse(raw);
    return normalizeRecommendation(parsed, input);
  } catch (error) {
    console.error('[careerAgent] Gemini reasoning failed; using fallback:', (error as any)?.message || error);
    return buildFallbackRecommendation(input);
  }
}
