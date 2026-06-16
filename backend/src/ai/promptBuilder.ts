type Primitive = string | number | boolean | null | undefined;

function normalizeText(value: unknown): string {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ');
}

function cleanList(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return Array.from(
    new Set(
      values.flatMap((value) => {
        const normalized = normalizeText(value).trim();
        return normalized ? [normalized] : [];
      })
    )
  ).sort((left, right) => left.localeCompare(right));
}

export function compactProfile(profile: Record<string, unknown> = {}) {
  return {
    skills: cleanList(profile.skills),
    interests: cleanList(profile.interests),
    education: normalizeText(profile.education),
    careerGoal: normalizeText(profile.careerGoal || profile.goal),
    experience: normalizeText(profile.experience || profile.experienceLevel || profile.level),
    personality: cleanList(profile.personality || profile.personalityTraits),
  };
}

function buildPrompt(title: string, rules: string[], payload: Record<string, unknown>) {
  return [
    title,
    ...rules,
    '',
    'Input:',
    JSON.stringify(payload, null, 2),
  ].join('\n');
}

export function buildAssessmentPrompt(data: {
  topMatches?: unknown[];
  confidence?: number;
  strengths?: string[];
  weaknesses?: string[];
  targetCareer?: string;
}) {
  return buildPrompt(
    'You are an AI explainer for Pragyan career assessment.',
    [
      'Important: you are NOT allowed to choose or change careers.',
      'Recommendation ranking is already decided by the deterministic engine.',
      'Return JSON with keys: summary, insights (string[]), skillGapAnalysis (string[]), interviewPlan (string[]).',
    ],
    {
      topMatches: data.topMatches || [],
      confidence: Number(data.confidence || 0),
      strengths: cleanList(data.strengths),
      weaknesses: cleanList(data.weaknesses),
      targetCareer: normalizeText(data.targetCareer),
    }
  );
}

export function buildRoadmapPrompt(data: {
  targetCareer: string;
  skillGaps?: string[];
  timelineWeeks?: number;
  profileSummary?: string;
}) {
  return buildPrompt(
    'You are a roadmap assistant for Pragyan.',
    [
      'Do not select careers or alter ranking.',
      'Only generate a learning roadmap for the already-selected target role.',
      'Return concise markdown with week-by-week milestones, projects, and interview prep checkpoints.',
    ],
    {
      targetCareer: normalizeText(data.targetCareer),
      skillGaps: cleanList(data.skillGaps),
      timelineWeeks: Number(data.timelineWeeks || 12),
      profileSummary: normalizeText(data.profileSummary),
    }
  );
}

export function buildMentorPrompt(data: {
  message: string;
  context?: Record<string, unknown>;
  history?: Array<{ role?: string; content?: string }>;
}) {
  const historyText = Array.isArray(data.history)
    ? data.history
        .slice(-6)
        .map((entry) => `${entry?.role === 'assistant' ? 'Assistant' : 'User'}: ${normalizeText(entry?.content)}`)
        .join('\n')
    : '';

  return buildPrompt(
    'You are Pragyan, an AI career mentor.',
    [
      'Answer in concise markdown with practical bullet points when helpful.',
      'Use career guidance, roadmap help, resume help, and interview preparation as your primary domains.',
      'If the request needs backend data you do not have, be transparent and suggest the closest available Pragyan feature.',
      'Return a helpful response only.',
    ],
    {
      message: normalizeText(data.message),
      context: compactProfile(data.context || {}),
      history: historyText,
    }
  );
}

export function buildResumeAnalysisPrompt(data: {
  profile?: Record<string, unknown>;
  targetRole?: string;
  notes?: Primitive[];
}) {
  return buildPrompt(
    'You are a resume and profile analysis assistant for Pragyan.',
    [
      'Only use the compact profile fields.',
      'Do not invent experience that is not provided.',
      'Return actionable analysis with concise recommendations.',
    ],
    {
      profile: compactProfile(data.profile || {}),
      targetRole: normalizeText(data.targetRole),
      notes: (data.notes || []).map((item) => normalizeText(item)),
    }
  );
}

export function buildSummaryPrompt(data: {
  topic: string;
  content: unknown;
}) {
  return buildPrompt(
    'You are a concise summarization assistant for Pragyan.',
    [
      'Summarize only what is present in the input.',
      'Keep the output short, practical, and easy to scan.',
    ],
    {
      topic: normalizeText(data.topic),
      content: data.content,
    }
  );
}

export default {
  buildAssessmentPrompt,
  buildMentorPrompt,
  buildRoadmapPrompt,
  buildResumeAnalysisPrompt,
  buildSummaryPrompt,
  compactProfile,
};
