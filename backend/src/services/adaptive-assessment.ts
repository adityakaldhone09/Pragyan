import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import redisClient from '@/lib/redis';

const SESSION_TTL_SECONDS = 60 * 60 * 2;

type TraitKey =
  | 'analytical'
  | 'logic'
  | 'math'
  | 'coding'
  | 'communication'
  | 'leadership'
  | 'creativity'
  | 'discipline'
  | 'service'
  | 'entrepreneurship'
  | 'research'
  | 'physical'
  | 'finance'
  | 'sales'
  | 'design';

type CareerKey =
  | 'softwareEngineer'
  | 'dataScientist'
  | 'cyberSecurity'
  | 'productManager'
  | 'marketingManager'
  | 'upscOfficer'
  | 'sscOfficer'
  | 'bankingOfficer'
  | 'railwayOfficer'
  | 'statePscOfficer'
  | 'armyOfficer'
  | 'navyOfficer'
  | 'airForceOfficer'
  | 'freelanceDeveloper'
  | 'businessFounder'
  | 'researchScholar';

interface WeightedImpact {
  traits?: Partial<Record<TraitKey, number>>;
  careers?: Partial<Record<CareerKey, number>>;
}

interface AssessmentOption {
  value: string;
  impact?: WeightedImpact;
  nextQuestionId?: string;
}

export interface AdaptiveQuestion {
  id: string;
  text: string;
  category: string;
  type: 'single-choice' | 'likert';
  options: AssessmentOption[];
}

interface AdaptiveSession {
  sessionId: string;
  userId?: string;
  answers: Record<string, string>;
  askedQuestionIds: string[];
  relevantQuestionIds: string[];
  pendingQuestionId: string | null;
  currentPath: string[];
  careerScores: Record<CareerKey, number>;
  traits: Record<TraitKey, number>;
  confidence: number;
  createdAt: string;
  updatedAt: string;
}

interface MatchResult {
  careerId: string;
  career: string;
  category: string;
  match: number;
  reasons: string[];
  salaryRange: string;
  demandForecast: number;
  growthRate: number;
  skillGaps: string[];
}

const INITIAL_CAREER_SCORES: Record<CareerKey, number> = {
  softwareEngineer: 0,
  dataScientist: 0,
  cyberSecurity: 0,
  productManager: 0,
  marketingManager: 0,
  upscOfficer: 0,
  sscOfficer: 0,
  bankingOfficer: 0,
  railwayOfficer: 0,
  statePscOfficer: 0,
  armyOfficer: 0,
  navyOfficer: 0,
  airForceOfficer: 0,
  freelanceDeveloper: 0,
  businessFounder: 0,
  researchScholar: 0,
};

const INITIAL_TRAITS: Record<TraitKey, number> = {
  analytical: 0,
  logic: 0,
  math: 0,
  coding: 0,
  communication: 0,
  leadership: 0,
  creativity: 0,
  discipline: 0,
  service: 0,
  entrepreneurship: 0,
  research: 0,
  physical: 0,
  finance: 0,
  sales: 0,
  design: 0,
};

const LIKERT_OPTIONS: AssessmentOption[] = [
  {
    value: 'Strongly Agree',
    impact: { traits: { analytical: 4, logic: 4 }, careers: { softwareEngineer: 10, dataScientist: 8, cyberSecurity: 7 } },
  },
  {
    value: 'Agree',
    impact: { traits: { analytical: 3, logic: 3 }, careers: { softwareEngineer: 7, dataScientist: 6, cyberSecurity: 5 } },
  },
  {
    value: 'Neutral',
    impact: { traits: { analytical: 2, logic: 2 }, careers: { softwareEngineer: 3, dataScientist: 3, cyberSecurity: 3 } },
  },
  {
    value: 'Disagree',
    impact: { traits: { analytical: 0, logic: 0 } },
  },
];

const QUESTION_BANK: Record<string, AdaptiveQuestion> = {
  root_career_path: {
    id: 'root_career_path',
    text: 'What type of career path are you interested in?',
    category: 'Root',
    type: 'single-choice',
    options: [
      { value: 'Government Job', nextQuestionId: 'gov_track' },
      { value: 'Private Job', nextQuestionId: 'private_domain' },
      { value: 'Defence', nextQuestionId: 'defence_track' },
      { value: 'Freelancing', nextQuestionId: 'freelance_track' },
      { value: 'Business / Entrepreneurship', nextQuestionId: 'business_track' },
      { value: 'Higher Studies', nextQuestionId: 'higher_studies_track' },
      { value: 'Undecided', nextQuestionId: 'undecided_track' },
    ],
  },
  gov_track: {
    id: 'gov_track',
    text: 'Which government exam path appeals to you most?',
    category: 'Government',
    type: 'single-choice',
    options: [
      { value: 'UPSC', nextQuestionId: 'gov_service_motivation', impact: { careers: { upscOfficer: 10 }, traits: { service: 5, leadership: 4 } } },
      { value: 'SSC', nextQuestionId: 'gov_service_motivation', impact: { careers: { sscOfficer: 10 }, traits: { discipline: 5, service: 4 } } },
      { value: 'Banking', nextQuestionId: 'banking_quant', impact: { careers: { bankingOfficer: 10 }, traits: { finance: 6, analytical: 4 } } },
      { value: 'Railway', nextQuestionId: 'gov_service_motivation', impact: { careers: { railwayOfficer: 10 }, traits: { discipline: 5, service: 3 } } },
      { value: 'State PSC', nextQuestionId: 'gov_service_motivation', impact: { careers: { statePscOfficer: 10 }, traits: { service: 4, leadership: 3 } } },
    ],
  },
  private_domain: {
    id: 'private_domain',
    text: 'Which private sector domain is your primary preference?',
    category: 'Private',
    type: 'single-choice',
    options: [
      { value: 'Tech', nextQuestionId: 'tech_track' },
      { value: 'Non-Tech', nextQuestionId: 'non_tech_track' },
      { value: 'Sales', nextQuestionId: 'sales_strength', impact: { careers: { marketingManager: 6 }, traits: { sales: 6, communication: 4 } } },
      { value: 'Marketing', nextQuestionId: 'marketing_strength', impact: { careers: { marketingManager: 8 }, traits: { creativity: 4, communication: 5 } } },
      { value: 'HR', nextQuestionId: 'hr_empathy', impact: { careers: { productManager: 4 }, traits: { communication: 5, leadership: 4 } } },
      { value: 'Finance', nextQuestionId: 'finance_strength', impact: { traits: { finance: 7, analytical: 4 } } },
      { value: 'Retail', nextQuestionId: 'sales_strength', impact: { traits: { sales: 5, communication: 3 } } },
      { value: 'Customer Support', nextQuestionId: 'support_problem_solving', impact: { traits: { communication: 6, logic: 3 } } },
    ],
  },
  tech_track: {
    id: 'tech_track',
    text: 'Which tech track fits your interest most?',
    category: 'Private-Tech',
    type: 'single-choice',
    options: [
      { value: 'Software Development', nextQuestionId: 'coding_experience', impact: { careers: { softwareEngineer: 10 }, traits: { coding: 6, logic: 4 } } },
      { value: 'AI/ML', nextQuestionId: 'ml_interest', impact: { careers: { dataScientist: 10 }, traits: { math: 6, analytical: 6, coding: 4 } } },
      { value: 'Cyber Security', nextQuestionId: 'security_mindset', impact: { careers: { cyberSecurity: 10 }, traits: { analytical: 5, logic: 5, discipline: 3 } } },
      { value: 'Cloud Computing', nextQuestionId: 'cloud_interest', impact: { careers: { softwareEngineer: 5 }, traits: { analytical: 4, coding: 3 } } },
      { value: 'Data Science', nextQuestionId: 'ml_interest', impact: { careers: { dataScientist: 9 }, traits: { math: 6, analytical: 6 } } },
      { value: 'UI/UX Design', nextQuestionId: 'design_empathy', impact: { traits: { creativity: 8, design: 8, communication: 3 } } },
    ],
  },
  defence_track: {
    id: 'defence_track',
    text: 'Which defence opportunity do you want to target?',
    category: 'Defence',
    type: 'single-choice',
    options: [
      { value: 'Army', nextQuestionId: 'defence_physical', impact: { careers: { armyOfficer: 10 }, traits: { physical: 7, discipline: 5, leadership: 4 } } },
      { value: 'Navy', nextQuestionId: 'defence_physical', impact: { careers: { navyOfficer: 10 }, traits: { physical: 6, discipline: 5 } } },
      { value: 'Air Force', nextQuestionId: 'defence_physical', impact: { careers: { airForceOfficer: 10 }, traits: { analytical: 4, discipline: 5, physical: 5 } } },
      { value: 'NDA', nextQuestionId: 'defence_written', impact: { careers: { armyOfficer: 6, navyOfficer: 6, airForceOfficer: 6 }, traits: { discipline: 5, leadership: 4 } } },
      { value: 'CDS', nextQuestionId: 'defence_written', impact: { careers: { armyOfficer: 7, navyOfficer: 7, airForceOfficer: 7 }, traits: { leadership: 4, service: 4 } } },
      { value: 'AFCAT', nextQuestionId: 'defence_written', impact: { careers: { airForceOfficer: 9 }, traits: { analytical: 4, discipline: 4 } } },
    ],
  },
  freelance_track: {
    id: 'freelance_track',
    text: 'Which freelancing path feels most natural for you?',
    category: 'Freelancing',
    type: 'single-choice',
    options: [
      { value: 'Tech Freelancing', nextQuestionId: 'coding_experience', impact: { careers: { freelanceDeveloper: 10 }, traits: { coding: 6, entrepreneurship: 5 } } },
      { value: 'Design Freelancing', nextQuestionId: 'design_empathy', impact: { traits: { design: 8, creativity: 6, entrepreneurship: 4 } } },
      { value: 'Content/Marketing Freelancing', nextQuestionId: 'marketing_strength', impact: { careers: { marketingManager: 6 }, traits: { communication: 7, creativity: 5, entrepreneurship: 4 } } },
      { value: 'Consulting/Coaching', nextQuestionId: 'hr_empathy', impact: { careers: { productManager: 5 }, traits: { communication: 7, leadership: 5 } } },
    ],
  },
  business_track: {
    id: 'business_track',
    text: 'Which business direction are you aiming for?',
    category: 'Business',
    type: 'single-choice',
    options: [
      { value: 'Startup Founder', nextQuestionId: 'business_risk', impact: { careers: { businessFounder: 10, productManager: 5 }, traits: { entrepreneurship: 8, leadership: 5 } } },
      { value: 'E-commerce', nextQuestionId: 'business_risk', impact: { careers: { businessFounder: 8, marketingManager: 5 }, traits: { entrepreneurship: 7, sales: 4 } } },
      { value: 'Digital Business', nextQuestionId: 'business_risk', impact: { careers: { businessFounder: 8, marketingManager: 5 }, traits: { entrepreneurship: 7, creativity: 4 } } },
      { value: 'Traditional Business', nextQuestionId: 'business_risk', impact: { careers: { businessFounder: 7 }, traits: { entrepreneurship: 7, finance: 4 } } },
    ],
  },
  higher_studies_track: {
    id: 'higher_studies_track',
    text: 'What higher study path do you want to pursue?',
    category: 'Higher-Studies',
    type: 'single-choice',
    options: [
      { value: 'Engineering', nextQuestionId: 'research_interest', impact: { careers: { softwareEngineer: 7, dataScientist: 5 }, traits: { analytical: 5, coding: 4 } } },
      { value: 'MBA', nextQuestionId: 'leadership_interest', impact: { careers: { productManager: 8, marketingManager: 7 }, traits: { leadership: 6, communication: 5 } } },
      { value: 'Medical', nextQuestionId: 'gov_service_motivation', impact: { traits: { service: 7, discipline: 6, research: 4 } } },
      { value: 'Research', nextQuestionId: 'research_interest', impact: { careers: { researchScholar: 10, dataScientist: 5 }, traits: { research: 8, analytical: 6 } } },
      { value: 'Foreign Education', nextQuestionId: 'global_adaptability', impact: { careers: { researchScholar: 5, productManager: 4 }, traits: { communication: 5, research: 4 } } },
    ],
  },
  undecided_track: {
    id: 'undecided_track',
    text: 'Which area are you most curious to explore first?',
    category: 'Undecided',
    type: 'single-choice',
    options: [
      { value: 'Public service impact', nextQuestionId: 'gov_track', impact: { traits: { service: 6 } } },
      { value: 'Technology and innovation', nextQuestionId: 'tech_track', impact: { traits: { analytical: 4, coding: 3 } } },
      { value: 'Leadership and business', nextQuestionId: 'business_track', impact: { traits: { leadership: 4, entrepreneurship: 4 } } },
      { value: 'Creative and independent work', nextQuestionId: 'freelance_track', impact: { traits: { creativity: 4, design: 4 } } },
    ],
  },
  gov_service_motivation: {
    id: 'gov_service_motivation',
    text: 'I am motivated by public service and long-term societal impact.',
    category: 'Government-Fit',
    type: 'likert',
    options: LIKERT_OPTIONS,
  },
  banking_quant: {
    id: 'banking_quant',
    text: 'I enjoy quantitative aptitude and numerical reasoning problems.',
    category: 'Banking-Fit',
    type: 'likert',
    options: LIKERT_OPTIONS.map((option) => ({
      ...option,
      impact: {
        traits: { ...option.impact?.traits, math: (option.impact?.traits?.math || 0) + 3, finance: 3 },
        careers: { ...option.impact?.careers, bankingOfficer: (option.impact?.careers?.bankingOfficer || 0) + 5 },
      },
    })),
  },
  coding_experience: {
    id: 'coding_experience',
    text: 'How would you rate your coding experience with Python, JavaScript, or similar languages?',
    category: 'Tech-Fit',
    type: 'single-choice',
    options: [
      { value: 'Advanced', nextQuestionId: 'logic_problem_solving', impact: { traits: { coding: 8, logic: 5 }, careers: { softwareEngineer: 10, dataScientist: 7, freelanceDeveloper: 8 } } },
      { value: 'Intermediate', nextQuestionId: 'logic_problem_solving', impact: { traits: { coding: 6, logic: 4 }, careers: { softwareEngineer: 7, dataScientist: 5, freelanceDeveloper: 6 } } },
      { value: 'Beginner', nextQuestionId: 'logic_problem_solving', impact: { traits: { coding: 3, logic: 3 }, careers: { softwareEngineer: 4, dataScientist: 3, freelanceDeveloper: 4 } } },
      { value: 'No experience yet', nextQuestionId: 'logic_problem_solving', impact: { traits: { coding: 1 } } },
    ],
  },
  ml_interest: {
    id: 'ml_interest',
    text: 'How interested are you in machine learning models and applied AI projects?',
    category: 'AI-ML-Fit',
    type: 'likert',
    options: LIKERT_OPTIONS.map((option) => ({
      ...option,
      impact: {
        traits: { ...option.impact?.traits, math: (option.impact?.traits?.math || 0) + 2, coding: 2, research: 2 },
        careers: { ...option.impact?.careers, dataScientist: (option.impact?.careers?.dataScientist || 0) + 6, softwareEngineer: (option.impact?.careers?.softwareEngineer || 0) + 3 },
      },
    })),
  },
  security_mindset: {
    id: 'security_mindset',
    text: 'I like identifying vulnerabilities and protecting systems proactively.',
    category: 'Cyber-Fit',
    type: 'likert',
    options: LIKERT_OPTIONS.map((option) => ({
      ...option,
      impact: {
        traits: { ...option.impact?.traits, discipline: (option.impact?.traits?.discipline || 0) + 3 },
        careers: { ...option.impact?.careers, cyberSecurity: (option.impact?.careers?.cyberSecurity || 0) + 6 },
      },
    })),
  },
  cloud_interest: {
    id: 'cloud_interest',
    text: 'I am interested in scalable systems, deployment, and cloud infrastructure.',
    category: 'Cloud-Fit',
    type: 'likert',
    options: LIKERT_OPTIONS,
  },
  logic_problem_solving: {
    id: 'logic_problem_solving',
    text: 'Do you enjoy solving logical and algorithmic problems?',
    category: 'Core-Signal',
    type: 'likert',
    options: LIKERT_OPTIONS,
  },
  design_empathy: {
    id: 'design_empathy',
    text: 'I enjoy understanding user behavior and designing intuitive experiences.',
    category: 'Design-Fit',
    type: 'likert',
    options: LIKERT_OPTIONS.map((option) => ({
      ...option,
      impact: {
        traits: { ...option.impact?.traits, design: (option.impact?.traits?.design || 0) + 4, creativity: (option.impact?.traits?.creativity || 0) + 3 },
      },
    })),
  },
  defence_physical: {
    id: 'defence_physical',
    text: 'I am ready for physically demanding training and disciplined routines.',
    category: 'Defence-Fit',
    type: 'likert',
    options: LIKERT_OPTIONS.map((option) => ({
      ...option,
      impact: {
        traits: { ...option.impact?.traits, physical: (option.impact?.traits?.physical || 0) + 5, discipline: (option.impact?.traits?.discipline || 0) + 4 },
        careers: {
          ...option.impact?.careers,
          armyOfficer: (option.impact?.careers?.armyOfficer || 0) + 4,
          navyOfficer: (option.impact?.careers?.navyOfficer || 0) + 4,
          airForceOfficer: (option.impact?.careers?.airForceOfficer || 0) + 4,
        },
      },
    })),
  },
  defence_written: {
    id: 'defence_written',
    text: 'I am comfortable with competitive exam preparation for defence selection.',
    category: 'Defence-Fit',
    type: 'likert',
    options: LIKERT_OPTIONS,
  },
  sales_strength: {
    id: 'sales_strength',
    text: 'I enjoy persuasion, negotiation, and meeting revenue targets.',
    category: 'Sales-Fit',
    type: 'likert',
    options: LIKERT_OPTIONS.map((option) => ({
      ...option,
      impact: {
        traits: { ...option.impact?.traits, sales: (option.impact?.traits?.sales || 0) + 4, communication: (option.impact?.traits?.communication || 0) + 4 },
        careers: { ...option.impact?.careers, marketingManager: (option.impact?.careers?.marketingManager || 0) + 6 },
      },
    })),
  },
  marketing_strength: {
    id: 'marketing_strength',
    text: 'I like storytelling, brand building, and consumer psychology.',
    category: 'Marketing-Fit',
    type: 'likert',
    options: LIKERT_OPTIONS.map((option) => ({
      ...option,
      impact: {
        traits: { ...option.impact?.traits, creativity: (option.impact?.traits?.creativity || 0) + 4, communication: (option.impact?.traits?.communication || 0) + 4 },
        careers: { ...option.impact?.careers, marketingManager: (option.impact?.careers?.marketingManager || 0) + 7 },
      },
    })),
  },
  hr_empathy: {
    id: 'hr_empathy',
    text: 'I enjoy mentoring people and resolving team conflicts effectively.',
    category: 'People-Fit',
    type: 'likert',
    options: LIKERT_OPTIONS.map((option) => ({
      ...option,
      impact: {
        traits: { ...option.impact?.traits, communication: (option.impact?.traits?.communication || 0) + 5, leadership: (option.impact?.traits?.leadership || 0) + 3 },
        careers: { ...option.impact?.careers, productManager: (option.impact?.careers?.productManager || 0) + 4 },
      },
    })),
  },
  finance_strength: {
    id: 'finance_strength',
    text: 'I enjoy financial analysis, valuation, and number-driven decisions.',
    category: 'Finance-Fit',
    type: 'likert',
    options: LIKERT_OPTIONS.map((option) => ({
      ...option,
      impact: {
        traits: { ...option.impact?.traits, finance: (option.impact?.traits?.finance || 0) + 5, math: (option.impact?.traits?.math || 0) + 3 },
      },
    })),
  },
  support_problem_solving: {
    id: 'support_problem_solving',
    text: 'I can stay calm while solving customer problems under pressure.',
    category: 'Support-Fit',
    type: 'likert',
    options: LIKERT_OPTIONS,
  },
  business_risk: {
    id: 'business_risk',
    text: 'I am willing to take calculated risks and iterate on business ideas.',
    category: 'Business-Fit',
    type: 'likert',
    options: LIKERT_OPTIONS.map((option) => ({
      ...option,
      impact: {
        traits: { ...option.impact?.traits, entrepreneurship: (option.impact?.traits?.entrepreneurship || 0) + 5, leadership: (option.impact?.traits?.leadership || 0) + 3 },
        careers: { ...option.impact?.careers, businessFounder: (option.impact?.careers?.businessFounder || 0) + 7 },
      },
    })),
  },
  research_interest: {
    id: 'research_interest',
    text: 'I enjoy deep research, reading papers, and long-form problem exploration.',
    category: 'Research-Fit',
    type: 'likert',
    options: LIKERT_OPTIONS.map((option) => ({
      ...option,
      impact: {
        traits: { ...option.impact?.traits, research: (option.impact?.traits?.research || 0) + 6 },
        careers: { ...option.impact?.careers, researchScholar: (option.impact?.careers?.researchScholar || 0) + 8, dataScientist: (option.impact?.careers?.dataScientist || 0) + 3 },
      },
    })),
  },
  leadership_interest: {
    id: 'leadership_interest',
    text: 'I prefer leading cross-functional teams and making strategy decisions.',
    category: 'Leadership-Fit',
    type: 'likert',
    options: LIKERT_OPTIONS.map((option) => ({
      ...option,
      impact: {
        traits: { ...option.impact?.traits, leadership: (option.impact?.traits?.leadership || 0) + 6, communication: (option.impact?.traits?.communication || 0) + 4 },
        careers: { ...option.impact?.careers, productManager: (option.impact?.careers?.productManager || 0) + 8, businessFounder: (option.impact?.careers?.businessFounder || 0) + 3 },
      },
    })),
  },
  global_adaptability: {
    id: 'global_adaptability',
    text: 'I can adapt quickly to new cultures, systems, and learning environments.',
    category: 'Global-Readiness',
    type: 'likert',
    options: LIKERT_OPTIONS,
  },
};

const BRANCH_TARGET_QUESTION_COUNT: Record<string, number> = {
  Government: 6,
  'Private Job': 7,
  Defence: 6,
  Freelancing: 6,
  'Business / Entrepreneurship': 6,
  'Higher Studies': 6,
  Undecided: 7,
};

const ROOT_ORDER_BY_PATH: Record<string, string[]> = {
  'Government Job': ['gov_track', 'gov_service_motivation'],
  'Private Job': ['private_domain', 'tech_track', 'coding_experience', 'logic_problem_solving'],
  Defence: ['defence_track', 'defence_physical', 'defence_written'],
  Freelancing: ['freelance_track', 'coding_experience', 'design_empathy'],
  'Business / Entrepreneurship': ['business_track', 'business_risk', 'leadership_interest'],
  'Higher Studies': ['higher_studies_track', 'research_interest', 'leadership_interest'],
  Undecided: ['undecided_track', 'private_domain', 'logic_problem_solving'],
};

function safeNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizedVector(values: number[]) {
  const magnitude = Math.sqrt(values.reduce((acc, val) => acc + val * val, 0));
  if (!magnitude) {
    return values.map(() => 0);
  }
  return values.map((value) => value / magnitude);
}

function cosineSimilarity(left: number[], right: number[]) {
  const nLeft = normalizedVector(left);
  const nRight = normalizedVector(right);
  const dot = nLeft.reduce((acc, value, index) => acc + value * (nRight[index] || 0), 0);
  return Math.max(0, Math.min(1, dot));
}

export class AdaptiveAssessmentService {
  private getSessionKey(sessionId: string) {
    return `adaptive:assessment:session:${sessionId}`;
  }

  private async saveSession(session: AdaptiveSession) {
    await redisClient.set(this.getSessionKey(session.sessionId), JSON.stringify(session), SESSION_TTL_SECONDS);
  }

  private async loadSession(sessionId: string): Promise<AdaptiveSession | null> {
    const raw = await redisClient.get(this.getSessionKey(sessionId));
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as AdaptiveSession;
    } catch {
      return null;
    }
  }

  private resolveRootQuestion() {
    return this.toClientQuestion(QUESTION_BANK.root_career_path);
  }

  private toClientQuestion(question: AdaptiveQuestion) {
    return {
      id: question.id,
      question: question.text,
      category: question.category,
      type: question.type,
      options: question.options.map((option) => option.value),
    };
  }

  private applyOptionImpact(session: AdaptiveSession, questionId: string, answer: string) {
    const question = QUESTION_BANK[questionId];
    if (!question) {
      return;
    }

    const selected = question.options.find((option) => option.value === answer);
    if (!selected) {
      return;
    }

    const traits = selected.impact?.traits || {};
    const careers = selected.impact?.careers || {};

    (Object.keys(traits) as TraitKey[]).forEach((trait) => {
      session.traits[trait] = safeNumber(session.traits[trait]) + safeNumber(traits[trait]);
    });

    (Object.keys(careers) as CareerKey[]).forEach((career) => {
      session.careerScores[career] = safeNumber(session.careerScores[career]) + safeNumber(careers[career]);
    });
  }

  private inferNextQuestionId(session: AdaptiveSession, questionId: string, answer: string) {
    const question = QUESTION_BANK[questionId];
    if (!question) {
      return null;
    }

    const selected = question.options.find((option) => option.value === answer);
    if (selected?.nextQuestionId) {
      return selected.nextQuestionId;
    }

    const rootAnswer = session.answers.root_career_path;
    const preferredOrder = rootAnswer ? ROOT_ORDER_BY_PATH[rootAnswer] || [] : [];

    for (const qId of preferredOrder) {
      if (!session.askedQuestionIds.includes(qId) && QUESTION_BANK[qId]) {
        return qId;
      }
    }

    const fallbackCandidates = Object.keys(QUESTION_BANK).filter(
      (id) => id !== 'root_career_path' && !session.askedQuestionIds.includes(id)
    );

    return fallbackCandidates[0] || null;
  }

  private calculateConfidence(session: AdaptiveSession) {
    const root = session.answers.root_career_path || 'Undecided';
    const target = BRANCH_TARGET_QUESTION_COUNT[root] || 6;
    const answeredRelevant = session.relevantQuestionIds.filter((id) => id in session.answers).length;
    const confidence = target ? answeredRelevant / target : 0;
    return Math.max(0, Math.min(1, confidence));
  }

  async startAssessment(userId?: string) {
    const sessionId = randomUUID();
    const rootQuestion = this.resolveRootQuestion();

    const session: AdaptiveSession = {
      sessionId,
      userId,
      answers: {},
      askedQuestionIds: ['root_career_path'],
      relevantQuestionIds: ['root_career_path'],
      pendingQuestionId: 'root_career_path',
      currentPath: [],
      careerScores: { ...INITIAL_CAREER_SCORES },
      traits: { ...INITIAL_TRAITS },
      confidence: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.saveSession(session);

    return {
      sessionId,
      question: rootQuestion,
      confidence: 0,
      progress: { answered: 0, totalRelevant: BRANCH_TARGET_QUESTION_COUNT.Undecided },
    };
  }

  async answerQuestion(input: { sessionId: string; questionId: string; answer: string; userId?: string }) {
    const session = await this.loadSession(input.sessionId);
    if (!session) {
      throw new Error('Assessment session not found or expired.');
    }

    if (input.userId && !session.userId) {
      session.userId = input.userId;
    }

    const question = QUESTION_BANK[input.questionId];
    if (!question) {
      throw new Error('Question is not recognized by the adaptive engine.');
    }

    session.answers[input.questionId] = input.answer;
    session.currentPath.push(`${input.questionId}:${input.answer}`);
    session.pendingQuestionId = null;

    this.applyOptionImpact(session, input.questionId, input.answer);

    if (!session.askedQuestionIds.includes(input.questionId)) {
      session.askedQuestionIds.push(input.questionId);
    }

    const nextQuestionId = this.inferNextQuestionId(session, input.questionId, input.answer);

    if (nextQuestionId) {
      if (!session.askedQuestionIds.includes(nextQuestionId)) {
        session.askedQuestionIds.push(nextQuestionId);
      }
      if (!session.relevantQuestionIds.includes(nextQuestionId)) {
        session.relevantQuestionIds.push(nextQuestionId);
      }
      session.pendingQuestionId = nextQuestionId;
    }

    session.confidence = this.calculateConfidence(session);
    session.updatedAt = new Date().toISOString();

    await this.saveSession(session);

    return {
      sessionId: session.sessionId,
      confidence: Math.round(session.confidence * 100) / 100,
      nextQuestion: nextQuestionId ? this.toClientQuestion(QUESTION_BANK[nextQuestionId]) : null,
      shouldSubmit: !nextQuestionId || session.confidence >= 0.92,
      progress: {
        answered: Object.keys(session.answers).length,
        totalRelevant: session.relevantQuestionIds.length,
      },
    };
  }

  async getNextQuestion(sessionId: string) {
    const session = await this.loadSession(sessionId);
    if (!session) {
      throw new Error('Assessment session not found or expired.');
    }

    if (!session.pendingQuestionId) {
      return {
        sessionId,
        confidence: Math.round(session.confidence * 100) / 100,
        nextQuestion: null,
        shouldSubmit: true,
      };
    }

    const question = QUESTION_BANK[session.pendingQuestionId];
    if (!question) {
      return {
        sessionId,
        confidence: Math.round(session.confidence * 100) / 100,
        nextQuestion: null,
        shouldSubmit: true,
      };
    }

    return {
      sessionId,
      confidence: Math.round(session.confidence * 100) / 100,
      nextQuestion: this.toClientQuestion(question),
      shouldSubmit: false,
      progress: {
        answered: Object.keys(session.answers).length,
        totalRelevant: session.relevantQuestionIds.length,
      },
    };
  }

  private titleToCareerSignal(title: string): Partial<Record<CareerKey, number>> {
    const normalized = title.toLowerCase();

    if (normalized.includes('software') || normalized.includes('developer') || normalized.includes('engineer')) {
      return { softwareEngineer: 1 };
    }
    if (normalized.includes('data scientist') || normalized.includes('machine learning') || normalized.includes('ai')) {
      return { dataScientist: 1 };
    }
    if (normalized.includes('security') || normalized.includes('cyber')) {
      return { cyberSecurity: 1 };
    }
    if (normalized.includes('product manager')) {
      return { productManager: 1 };
    }
    if (normalized.includes('marketing')) {
      return { marketingManager: 1 };
    }
    if (normalized.includes('upsc')) {
      return { upscOfficer: 1 };
    }
    if (normalized.includes('ssc')) {
      return { sscOfficer: 1 };
    }
    if (normalized.includes('bank')) {
      return { bankingOfficer: 1 };
    }
    if (normalized.includes('railway')) {
      return { railwayOfficer: 1 };
    }
    if (normalized.includes('psc')) {
      return { statePscOfficer: 1 };
    }
    if (normalized.includes('army')) {
      return { armyOfficer: 1 };
    }
    if (normalized.includes('navy')) {
      return { navyOfficer: 1 };
    }
    if (normalized.includes('air force')) {
      return { airForceOfficer: 1 };
    }
    if (normalized.includes('freelance')) {
      return { freelanceDeveloper: 1 };
    }
    if (normalized.includes('founder') || normalized.includes('entrepreneur')) {
      return { businessFounder: 1 };
    }
    if (normalized.includes('research')) {
      return { researchScholar: 1 };
    }

    return {};
  }

  private buildUserVector(session: AdaptiveSession): number[] {
    return [
      session.traits.analytical,
      session.traits.logic,
      session.traits.math,
      session.traits.coding,
      session.traits.communication,
      session.traits.leadership,
      session.traits.creativity,
      session.traits.discipline,
      session.traits.service,
      session.traits.entrepreneurship,
      session.traits.research,
      session.traits.physical,
      session.traits.finance,
      session.traits.sales,
      session.traits.design,
    ];
  }

  private buildCareerVector(input: {
    title: string;
    requiredSkills: string[];
    personalityTraits: string[];
    category?: string | null;
    futureDemand?: number | null;
    growthRate?: number | null;
  }): number[] {
    const text = [input.title, input.category || '', ...input.requiredSkills, ...input.personalityTraits].join(' ').toLowerCase();

    const hasAny = (keywords: string[]) => Number(keywords.some((keyword) => text.includes(keyword)));

    return [
      hasAny(['analysis', 'data', 'research', 'model']),
      hasAny(['logic', 'algorithm', 'problem']),
      hasAny(['math', 'quant', 'statistics']),
      hasAny(['code', 'developer', 'programming', 'engineering']),
      hasAny(['communication', 'stakeholder', 'presentation']),
      hasAny(['lead', 'management', 'strategy']),
      hasAny(['creative', 'design', 'ux', 'brand']),
      hasAny(['discipline', 'routine', 'protocol']),
      hasAny(['service', 'public', 'policy', 'governance']),
      hasAny(['startup', 'business', 'entrepreneur']),
      hasAny(['research', 'paper', 'innovation']),
      hasAny(['fitness', 'field', 'defence', 'military']),
      hasAny(['finance', 'banking', 'valuation']),
      hasAny(['sales', 'growth', 'customer']),
      hasAny(['design', 'ui', 'ux', 'visual']),
    ];
  }

  private toMatchPercentage(cosine: number, weightedCareerBoost: number, futureDemand = 50, growthRate = 25) {
    const normalizedDemand = Math.max(0, Math.min(1, futureDemand / 100));
    const normalizedGrowth = Math.max(0, Math.min(1, growthRate / 100));
    const mixed = cosine * 0.62 + weightedCareerBoost * 0.26 + normalizedDemand * 0.07 + normalizedGrowth * 0.05;
    return Math.round(Math.max(0, Math.min(1, mixed)) * 100);
  }

  private buildReasons(career: string, session: AdaptiveSession): string[] {
    const reasons: string[] = [];

    if (session.traits.analytical >= 8) {
      reasons.push('Strong analytical thinking was consistently observed across adaptive questions.');
    }
    if (session.traits.logic >= 8) {
      reasons.push('Your responses showed high logical problem-solving preference.');
    }
    if (session.traits.coding >= 8) {
      reasons.push('You demonstrated high technical and programming readiness.');
    }
    if (session.traits.communication >= 8) {
      reasons.push('Communication and collaboration traits are strong for role effectiveness.');
    }

    if (!reasons.length) {
      reasons.push(`This match is based on your selected path and weighted relevance for ${career}.`);
    }

    return reasons.slice(0, 3);
  }

  private skillGapFromMappings(userAnswers: string[], requiredSkills: string[]) {
    const answerText = userAnswers.join(' ').toLowerCase();
    return requiredSkills.filter((skill) => !answerText.includes(skill.toLowerCase())).slice(0, 5);
  }

  async submitAssessment(input: { sessionId: string; userId?: string }) {
    const session = await this.loadSession(input.sessionId);
    if (!session) {
      throw new Error('Assessment session not found or expired.');
    }

    if (input.userId && !session.userId) {
      session.userId = input.userId;
    }

    const userId = session.userId || input.userId;
    if (!userId) {
      throw new Error('Authenticated user is required to submit assessment results.');
    }

    const careers = await prisma.career.findMany({
      include: {
        skillMappings: true,
        interestMappings: true,
      },
      take: 120,
    });

    const userVector = this.buildUserVector(session);
    const userAnswers = Object.values(session.answers);

    const matches: MatchResult[] = careers.map((career) => {
      const requiredSkills = career.skillMappings.map((skill) => skill.skill);
      const personalityTraits = career.interestMappings.map((interest) => interest.interest);
      const careerVector = this.buildCareerVector({
        title: career.title,
        requiredSkills,
        personalityTraits,
        category: career.category,
        futureDemand: career.jobMarketDemand,
        growthRate: 30,
      });

      const cosine = cosineSimilarity(userVector, careerVector);

      const mappedSignals = this.titleToCareerSignal(career.title);
      const weightedBoostRaw = Object.entries(mappedSignals).reduce((acc, [key, weight]) => {
        return acc + safeNumber(session.careerScores[key as CareerKey]) * safeNumber(weight);
      }, 0);
      const weightedBoost = Math.max(0, Math.min(1, weightedBoostRaw / 100));

      const match = this.toMatchPercentage(cosine, weightedBoost, career.jobMarketDemand || 55, 30);

      return {
        careerId: career.id,
        career: career.title,
        category: career.category || 'General',
        match,
        reasons: this.buildReasons(career.title, session),
        salaryRange: career.averageSalary || 'Competitive based on market segment',
        demandForecast: safeNumber(career.jobMarketDemand, 55),
        growthRate: 30,
        skillGaps: this.skillGapFromMappings(userAnswers, requiredSkills),
      };
    });

    const ranked = matches.sort((left, right) => right.match - left.match).slice(0, 8);
    const topThree = ranked.slice(0, 3);

    const summary = {
      topMatch: topThree[0] || null,
      secondaryMatches: topThree.slice(1),
      confidence: Math.round(this.calculateConfidence(session) * 100),
      suggestedCareers: ranked.slice(0, 5).map((match) => match.career),
      scores: ranked.slice(0, 5).reduce<Record<string, number>>((acc, match) => {
        acc[match.career] = match.match;
        return acc;
      }, {}),
      strengths: Object.entries(session.traits)
        .sort((left, right) => right[1] - left[1])
        .slice(0, 4)
        .map(([trait]) => trait),
      weaknesses: Object.entries(session.traits)
        .sort((left, right) => left[1] - right[1])
        .slice(0, 3)
        .map(([trait]) => trait),
      learningRoadmap: {
        week1: ['Core foundations and baseline skill assessment'],
        week2: ['Targeted practice on top role requirements'],
        week3: ['Portfolio/project aligned with target role'],
        week4: ['Interview and application readiness sprint'],
      },
    };

    const persistedResult = await prisma.assessmentResult.create({
      data: {
        userId,
        answers: JSON.stringify(session.answers),
        suggestedCareers: summary.suggestedCareers,
        scores: JSON.stringify(summary.scores),
        strengths: summary.strengths,
        weaknesses: summary.weaknesses,
      },
    });

    await prisma.assessmentSession.create({
      data: {
        userId,
        answers: JSON.stringify(session.answers),
        selectedOptions: Object.values(session.answers),
        analysis: JSON.stringify({
          sessionId: session.sessionId,
          confidence: summary.confidence,
          path: session.currentPath,
          rankedMatches: ranked,
          summary,
        }),
        completedAt: new Date(),
      },
    });

    const answerRecords = Object.entries(session.answers).map(([questionId, answer]) => {
      const questionText = QUESTION_BANK[questionId]?.text || questionId;
      return prisma.assessmentAnswer.create({
        data: {
          userId,
          question: questionText,
          answer,
          category: QUESTION_BANK[questionId]?.category || 'Adaptive',
        },
      });
    });

    await Promise.all([
      Promise.all(answerRecords),
      Promise.all(
        ranked.slice(0, 3).map((match) =>
          prisma.recommendationHistory.create({
            data: {
              userId,
              recommendation: match as unknown as object,
              reason: match.reasons.join(' '),
              score: match.match,
              source: 'adaptive-assessment',
            },
          })
        )
      ),
    ]);

    await redisClient.del(this.getSessionKey(session.sessionId));

    return {
      resultId: persistedResult.id,
      sessionId: session.sessionId,
      confidence: summary.confidence,
      topMatches: topThree,
      allMatches: ranked,
      summary,
      persisted: persistedResult,
    };
  }

  async getResultById(userId: string, resultId: string) {
    const result = await prisma.assessmentResult.findFirst({
      where: { id: resultId, userId },
    });

    if (!result) {
      return null;
    }

    let parsedScores: Record<string, number> = {};
    try {
      parsedScores = JSON.parse(result.scores || '{}') as Record<string, number>;
    } catch {
      parsedScores = {};
    }

    const ranked = Object.entries(parsedScores)
      .map(([career, match]) => ({ career, match }))
      .sort((left, right) => right.match - left.match);

    return {
      id: result.id,
      suggestedCareers: result.suggestedCareers,
      scores: parsedScores,
      strengths: result.strengths,
      weaknesses: result.weaknesses,
      topMatches: ranked.slice(0, 3),
      confidence: Math.min(99, 55 + ranked.length * 8),
      createdAt: result.createdAt,
    };
  }

  async getCareers() {
    const careers = await prisma.career.findMany({
      include: {
        skillMappings: true,
        interestMappings: true,
      },
      orderBy: { jobMarketDemand: 'desc' },
    });

    return careers.map((career) => ({
      id: career.id,
      title: career.title,
      category: career.category || 'General',
      requiredSkills: career.skillMappings.map((mapping) => mapping.skill),
      personalityTraits: career.interestMappings.map((mapping) => mapping.interest),
      salaryRange: career.averageSalary || 'Competitive market salary',
      growthRate: 30,
      futureDemand: career.jobMarketDemand || 55,
      roadmap: `Targeted roadmap for ${career.title}`,
    }));
  }

  async getCareerById(careerId: string) {
    const career = await prisma.career.findUnique({
      where: { id: careerId },
      include: {
        skillMappings: true,
        interestMappings: true,
      },
    });

    if (!career) {
      return null;
    }

    return {
      id: career.id,
      title: career.title,
      category: career.category || 'General',
      requiredSkills: career.skillMappings.map((mapping) => mapping.skill),
      personalityTraits: career.interestMappings.map((mapping) => mapping.interest),
      salaryRange: career.averageSalary || 'Competitive market salary',
      growthRate: 30,
      futureDemand: career.jobMarketDemand || 55,
      roadmap: `Targeted roadmap for ${career.title}`,
    };
  }
}

export const adaptiveAssessmentService = new AdaptiveAssessmentService();
