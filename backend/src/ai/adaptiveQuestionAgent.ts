import { generateContent } from './GeminiProvider';
import { QuestionDimension } from '@/assessment/questionDimensions';
import {
  CAREER_LABELS,
  CareerKey,
  PSYCHOMETRIC_QUESTION_BANK,
  PsychometricQuestion,
} from '@/assessment/psychometricQuestionBank';

interface RawGeneratedOption {
  text?: unknown;
  value?: unknown;
  impact?: {
    careers?: Record<string, unknown>;
  };
}

interface RawGeneratedQuestion {
  id?: unknown;
  question?: unknown;
  category?: unknown;
  dimension?: unknown;
  metadata?: {
    stage?: unknown;
    displayType?: unknown;
    rationale?: unknown;
  };
  options?: RawGeneratedOption[];
}

const CAREER_KEY_ALIASES: Record<string, CareerKey> = {
  software: 'softwareEngineer',
  softwareengineering: 'softwareEngineer',
  backendengineering: 'softwareEngineer',
  cyber: 'cyberSecurity',
  cybersecurity: 'cyberSecurity',
  security: 'cyberSecurity',
  ai: 'dataScientist',
  aiml: 'dataScientist',
  ml: 'dataScientist',
  datascience: 'dataScientist',
  product: 'productManager',
  productmanagement: 'productManager',
  marketing: 'marketingManager',
  growth: 'marketingManager',
  banking: 'bankingOfficer',
  finance: 'bankingOfficer',
  research: 'researchScholar',
  startup: 'businessFounder',
  business: 'businessFounder',
};

function extractJson(raw: string) {
  const trimmed = raw.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return trimmed;
  }
  const match = trimmed.match(/\{[\s\S]*\}/);
  return match?.[0] || trimmed;
}

function normalizeCareerKey(key: string): CareerKey | null {
  const normalized = key.replace(/[^a-zA-Z]/g, '').toLowerCase();
  return CAREER_KEY_ALIASES[normalized] || null;
}

function toGeneratedQuestion(raw: RawGeneratedQuestion, careers: CareerKey[], fallbackTopic: string): PsychometricQuestion | null {
  if (typeof raw.question !== 'string' || !Array.isArray(raw.options) || raw.options.length !== 4) {
    return null;
  }

  const options = raw.options.map((option) => {
    const careerImpact = Object.entries(option.impact?.careers || {}).reduce<Partial<Record<CareerKey, number>>>((acc, [key, value]) => {
      const career = normalizeCareerKey(key);
      if (career && typeof value === 'number') {
        acc[career] = Math.max(-12, Math.min(14, value));
      }
      return acc;
    }, {});

    return {
      value: typeof option.value === 'string' ? option.value : typeof option.text === 'string' ? option.text : '',
      impact: { careers: careerImpact },
    };
  });

  if (options.some((option) => !option.value)) {
    return null;
  }

  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : `ai_precision_${Date.now()}`,
    text: raw.question,
    category: typeof raw.category === 'string' ? raw.category : 'AI Precision Question',
    dimension: QuestionDimension.CAREER_DISAMBIGUATION,
    stage: typeof raw.metadata?.stage === 'string' ? raw.metadata.stage : 'AI Precision Question',
    type: 'single-choice',
    topic: fallbackTopic,
    why:
      typeof raw.metadata?.rationale === 'string'
        ? raw.metadata.rationale
        : 'Your top career signals are tightly clustered, so this question targets the remaining ambiguity.',
    options,
    discriminationCareers: careers,
    isPrecisionQuestion: true,
  };
}

export class AdaptiveQuestionAgent {
  async generatePrecisionQuestion(targetCareers: CareerKey[], excludedDimensions: string[]): Promise<PsychometricQuestion> {
    const labels = targetCareers.map((career) => CAREER_LABELS[career]).join(', ');
    const topic = `ai-precision-${targetCareers.join('-')}`;
    const prompt = `
You are an expert Psychometrician and Senior Computer Science Professor specializing in career
assessment diagnostics for engineering students. Generate exactly ONE highly discriminative,
scenario-based multiple-choice question to differentiate between competing career paths.

Competing target careers: ${labels}
Excluded dimensions/topics: ${excludedDimensions.join(', ') || 'none'}

Generate an engineering-level scenario appropriate for a B.Tech student.
Rules:
- non repetitive
- not generic
- strong career signal
- exactly 4 options
- behavioral evidence, not direct career preference
- technical depth
- no repeated excluded category/topic

Return ONLY a strictly compliant JSON object:
{
  "id": "dynamic_precision_gen",
  "question": "",
  "category": "career_disambiguation",
  "dimension": "career_disambiguation",
  "metadata": {
    "stage": "AI Precision Question",
    "displayType": "Dynamic Precision Path",
    "rationale": ""
  },
  "options": [
    { "id": "opt_a", "text": "", "value": "", "impact": { "careers": {} } },
    { "id": "opt_b", "text": "", "value": "", "impact": { "careers": {} } },
    { "id": "opt_c", "text": "", "value": "", "impact": { "careers": {} } },
    { "id": "opt_d", "text": "", "value": "", "impact": { "careers": {} } }
  ]
}

Use career impact keys from: software, softwareEngineering, cyberSecurity, aiMl, dataScience,
product, marketing, banking, research, startup.
`.trim();

    try {
      const response = await generateContent(prompt);
      const parsed = JSON.parse(extractJson(response)) as RawGeneratedQuestion;
      const generated = toGeneratedQuestion(parsed, targetCareers, topic);
      if (!generated) {
        throw new Error('Invalid precision question structure generated by Gemini.');
      }
      return generated;
    } catch (error) {
      console.warn('[AdaptiveQuestionAgent] Fallback executed due to error:', error);
      return this.getLocalFallbackQuestion(targetCareers, excludedDimensions);
    }
  }

  private getLocalFallbackQuestion(targetCareers: CareerKey[], excludedDimensions: string[]): PsychometricQuestion {
    const fallback = PSYCHOMETRIC_QUESTION_BANK.find((question) => {
      const isCareerDisambiguation = question.dimension === QuestionDimension.CAREER_DISAMBIGUATION;
      const avoidsRecentContext = !excludedDimensions.includes(question.dimension) && !excludedDimensions.includes(question.topic);
      const overlapsTarget = (question.discriminationCareers || []).some((career) => targetCareers.includes(career));
      return isCareerDisambiguation && avoidsRecentContext && overlapsTarget;
    });

    if (fallback) {
      return fallback;
    }

    return {
      id: 'fallback_baseline_security_dev',
      text:
        'Your team must ship a critical feature patch immediately, but the regression suite flags an edge-case memory leak under unusual load. What is your move?',
      category: 'career_disambiguation',
      dimension: QuestionDimension.CAREER_DISAMBIGUATION,
      stage: 'Career Disambiguation',
      type: 'single-choice',
      topic: 'fallback-security-dev',
      why: 'Understanding development, security, and analytical tradeoffs under deployment pressure.',
      options: [
        {
          value: 'Isolate the vulnerability vector and halt deployment until safety checks are complete',
          impact: { careers: { cyberSecurity: 12, softwareEngineer: -3 }, traits: { discipline: 4, analytical: 4 } },
        },
        {
          value: 'Ship a bounded patch with throttling and monitoring while planning a deeper fix',
          impact: { careers: { softwareEngineer: 10, cyberSecurity: 2 }, traits: { coding: 4, logic: 3 } },
        },
        {
          value: 'Stream runtime signals into a profiling model to understand abnormal resource patterns',
          impact: { careers: { dataScientist: 12, softwareEngineer: 4 }, traits: { analytical: 5, math: 3 } },
        },
        {
          value: 'Rollback to the last stable baseline and execute full stress testing before release',
          impact: { careers: { cyberSecurity: 6, softwareEngineer: 4 }, traits: { discipline: 5, logic: 2 } },
        },
      ],
      discriminationCareers: ['softwareEngineer', 'cyberSecurity', 'dataScientist'],
      isPrecisionQuestion: true,
    };
  }
}

export const adaptiveQuestionAgent = new AdaptiveQuestionAgent();

export async function generateAdaptivePrecisionQuestion(careers: CareerKey[], recentTopics: string[]) {
  return adaptiveQuestionAgent.generatePrecisionQuestion(careers, recentTopics);
}
