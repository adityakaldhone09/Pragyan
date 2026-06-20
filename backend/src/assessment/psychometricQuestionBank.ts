import { QuestionDimension } from './questionDimensions';

export type TraitKey =
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

export type CareerKey =
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

export interface WeightedImpact {
  traits?: Partial<Record<TraitKey, number>>;
  careers?: Partial<Record<CareerKey, number>>;
}

export interface PsychometricOption {
  value: string;
  impact: WeightedImpact;
}

export interface PsychometricQuestion {
  id: string;
  text: string;
  category: string;
  dimension: QuestionDimension;
  stage: string;
  type: 'single-choice' | 'likert';
  topic: string;
  why: string;
  options: PsychometricOption[];
  minAge?: number;
  maxAge?: number;
  discriminationCareers?: CareerKey[];
  isPrecisionQuestion?: boolean;
}

export const INITIAL_CAREER_SCORES: Record<CareerKey, number> = {
  softwareEngineer: 50,
  dataScientist: 50,
  cyberSecurity: 50,
  productManager: 50,
  marketingManager: 50,
  upscOfficer: 50,
  sscOfficer: 50,
  bankingOfficer: 50,
  railwayOfficer: 50,
  statePscOfficer: 50,
  armyOfficer: 50,
  navyOfficer: 50,
  airForceOfficer: 50,
  freelanceDeveloper: 50,
  businessFounder: 50,
  researchScholar: 50,
};

export const INITIAL_TRAITS: Record<TraitKey, number> = {
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

export const CAREER_LABELS: Record<CareerKey, string> = {
  softwareEngineer: 'Software Engineering',
  dataScientist: 'AI/ML and Data Science',
  cyberSecurity: 'Cyber Security',
  productManager: 'Product Management',
  marketingManager: 'Marketing and Growth',
  upscOfficer: 'UPSC Civil Services',
  sscOfficer: 'SSC Government Services',
  bankingOfficer: 'Banking and Finance',
  railwayOfficer: 'Railway Services',
  statePscOfficer: 'State PSC Services',
  armyOfficer: 'Army Officer',
  navyOfficer: 'Navy Officer',
  airForceOfficer: 'Air Force Officer',
  freelanceDeveloper: 'Independent Technical Freelancing',
  businessFounder: 'Business and Startup Founder',
  researchScholar: 'Research and Higher Studies',
};

export const AGE_QUESTION: PsychometricQuestion = {
  id: 'age_question',
  text: 'What is your age range?',
  category: 'Age',
  dimension: QuestionDimension.INTEREST,
  stage: 'Age',
  type: 'single-choice',
  topic: 'eligibility',
  why: 'We use age only to filter eligibility-sensitive paths and choose age-appropriate depth.',
  options: [
    { value: '15 - 18', impact: { careers: { armyOfficer: 4, navyOfficer: 4, airForceOfficer: 4 }, traits: { discipline: 1 } } },
    { value: '19 - 24', impact: { careers: { softwareEngineer: 3, dataScientist: 3, cyberSecurity: 3 }, traits: { coding: 1 } } },
    { value: '25 - 30', impact: { careers: { productManager: 3, businessFounder: 3, softwareEngineer: 2 }, traits: { leadership: 1 } } },
    { value: '31+', impact: { careers: { productManager: 4, businessFounder: 4, marketingManager: 3 }, traits: { leadership: 2 } } },
  ],
};

export const PSYCHOMETRIC_QUESTION_BANK: PsychometricQuestion[] = [
  {
    id: 'systems_signal_01',
    text: 'A campus app slows down during exam result day. Which first move feels most natural?',
    category: 'Cognitive Assessment',
    dimension: QuestionDimension.COGNITIVE,
    stage: 'Cognitive',
    type: 'single-choice',
    topic: 'systems-debugging',
    why: 'We are observing how you frame ambiguous technical failures.',
    discriminationCareers: ['softwareEngineer', 'cyberSecurity', 'dataScientist'],
    options: [
      { value: 'Trace request flow, logs, and bottlenecks before changing code', impact: { traits: { logic: 5, analytical: 4, coding: 2 }, careers: { softwareEngineer: 12, cyberSecurity: 4 } } },
      { value: 'Analyze traffic patterns and predict where load will spike next', impact: { traits: { analytical: 5, math: 3 }, careers: { dataScientist: 12, softwareEngineer: 4 } } },
      { value: 'Check whether unusual traffic indicates abuse or credential attacks', impact: { traits: { analytical: 4, discipline: 3 }, careers: { cyberSecurity: 12, softwareEngineer: 2 } } },
      { value: 'Coordinate teams and decide what users should see during downtime', impact: { traits: { communication: 4, leadership: 4 }, careers: { productManager: 11 } } },
    ],
  },
  {
    id: 'product_signal_01',
    text: 'A feature is technically impressive but only a few users adopt it. What do you investigate first?',
    category: 'Behavioral Assessment',
    dimension: QuestionDimension.WORK_STYLE,
    stage: 'Behavioral',
    type: 'single-choice',
    topic: 'product-adoption',
    why: 'We are checking whether your instinct goes toward users, metrics, systems, or messaging.',
    discriminationCareers: ['productManager', 'marketingManager', 'softwareEngineer'],
    options: [
      { value: 'Interview users and map where the workflow breaks', impact: { traits: { communication: 5, design: 4 }, careers: { productManager: 12 } } },
      { value: 'Inspect analytics funnels and segment adoption by cohort', impact: { traits: { analytical: 5, math: 2 }, careers: { dataScientist: 7, productManager: 6 } } },
      { value: 'Refactor the feature so the core action is faster and clearer', impact: { traits: { coding: 4, logic: 3 }, careers: { softwareEngineer: 9, freelanceDeveloper: 4 } } },
      { value: 'Reposition the value proposition and run a targeted campaign', impact: { traits: { creativity: 5, sales: 3 }, careers: { marketingManager: 12 } } },
    ],
  },
  {
    id: 'security_signal_01',
    text: 'During a hackathon, your team finds a login flow that behaves oddly with malformed inputs. What do you do?',
    category: 'Technical Assessment',
    dimension: QuestionDimension.TECHNICAL,
    stage: 'Technical',
    type: 'single-choice',
    topic: 'secure-inputs',
    why: 'We are measuring security mindset without asking directly for a career preference.',
    discriminationCareers: ['cyberSecurity', 'softwareEngineer'],
    options: [
      { value: 'Build a small proof, document impact, and report it responsibly', impact: { traits: { discipline: 5, analytical: 4 }, careers: { cyberSecurity: 14 } } },
      { value: 'Patch validation and add regression tests around edge cases', impact: { traits: { coding: 5, logic: 4 }, careers: { softwareEngineer: 11, cyberSecurity: 4 } } },
      { value: 'Estimate how many users could be affected from logs', impact: { traits: { analytical: 5, math: 2 }, careers: { dataScientist: 8, cyberSecurity: 4 } } },
      { value: 'Pause release and align stakeholders on risk and communication', impact: { traits: { leadership: 4, communication: 4 }, careers: { productManager: 8, cyberSecurity: 3 } } },
    ],
  },
  {
    id: 'learning_signal_01',
    text: 'You have two weeks to learn a new framework for a project. Which plan would you actually follow?',
    category: 'Learning Style',
    dimension: QuestionDimension.LEARNING_STYLE,
    stage: 'Learning Style',
    type: 'single-choice',
    topic: 'learning-strategy',
    why: 'We are identifying how you convert unfamiliar material into usable skill.',
    options: [
      { value: 'Build a tiny working clone, then read docs where I get stuck', impact: { traits: { coding: 5, entrepreneurship: 2 }, careers: { softwareEngineer: 8, freelanceDeveloper: 7 } } },
      { value: 'Study concepts, compare tradeoffs, and create notes before coding', impact: { traits: { research: 5, analytical: 3 }, careers: { researchScholar: 9, dataScientist: 5 } } },
      { value: 'Find mentor feedback quickly and iterate from review comments', impact: { traits: { communication: 4, leadership: 2 }, careers: { productManager: 6, marketingManager: 3 } } },
      { value: 'Use official tutorials, checklists, and daily practice blocks', impact: { traits: { discipline: 5, logic: 2 }, careers: { sscOfficer: 5, bankingOfficer: 5, softwareEngineer: 3 } } },
    ],
  },
  {
    id: 'stress_signal_01',
    text: 'A production issue appears 30 minutes before a demo. What behavior describes you best?',
    category: 'Stress Response',
    dimension: QuestionDimension.STRESS_RESPONSE,
    stage: 'Stress Response',
    type: 'single-choice',
    topic: 'incident-pressure',
    why: 'We are learning how your judgment changes under time pressure.',
    options: [
      { value: 'Stabilize the smallest failing path and communicate the known limits', impact: { traits: { discipline: 4, communication: 3, logic: 3 }, careers: { softwareEngineer: 8, productManager: 5 } } },
      { value: 'Search logs for anomaly patterns and isolate the triggering condition', impact: { traits: { analytical: 5, logic: 4 }, careers: { cyberSecurity: 8, dataScientist: 6 } } },
      { value: 'Re-plan the demo around the strongest working outcome', impact: { traits: { leadership: 4, creativity: 3 }, careers: { productManager: 9, marketingManager: 5 } } },
      { value: 'Follow a calm checklist and avoid improvising under pressure', impact: { traits: { discipline: 6, service: 2 }, careers: { bankingOfficer: 5, armyOfficer: 3, navyOfficer: 3, airForceOfficer: 3 } } },
    ],
  },
  {
    id: 'data_signal_01',
    text: 'A placement cell gives you messy student outcome data. Which problem do you want to solve first?',
    category: 'Cognitive Assessment',
    dimension: QuestionDimension.COGNITIVE,
    stage: 'Cognitive',
    type: 'single-choice',
    topic: 'messy-data',
    why: 'We are separating pattern discovery from implementation and policy instincts.',
    discriminationCareers: ['dataScientist', 'softwareEngineer', 'upscOfficer'],
    options: [
      { value: 'Find predictors that explain why similar students get different outcomes', impact: { traits: { analytical: 5, math: 4, research: 2 }, careers: { dataScientist: 14 } } },
      { value: 'Design a reliable dashboard pipeline that departments can use daily', impact: { traits: { coding: 4, logic: 4 }, careers: { softwareEngineer: 10, dataScientist: 4 } } },
      { value: 'Identify fairness gaps and propose process changes', impact: { traits: { service: 5, communication: 3 }, careers: { upscOfficer: 7, productManager: 5 } } },
      { value: 'Package insights into a persuasive campaign for student participation', impact: { traits: { creativity: 4, sales: 3 }, careers: { marketingManager: 8 } } },
    ],
  },
  {
    id: 'motivation_signal_01',
    text: 'When a project becomes difficult, which reward keeps you engaged longest?',
    category: 'Motivation',
    dimension: QuestionDimension.MOTIVATION,
    stage: 'Behavioral',
    type: 'single-choice',
    topic: 'intrinsic-drive',
    why: 'We are mapping durable motivation instead of surface-level likes.',
    options: [
      { value: 'Seeing a complex mechanism finally work end-to-end', impact: { traits: { coding: 4, logic: 4 }, careers: { softwareEngineer: 10, freelanceDeveloper: 4 } } },
      { value: 'Discovering a non-obvious explanation from evidence', impact: { traits: { analytical: 5, research: 4 }, careers: { dataScientist: 9, researchScholar: 8 } } },
      { value: 'Helping people make a clearer decision because of my work', impact: { traits: { communication: 4, service: 3 }, careers: { productManager: 8, upscOfficer: 5 } } },
      { value: 'Winning trust, influence, or adoption in a competitive environment', impact: { traits: { sales: 4, leadership: 3 }, careers: { marketingManager: 9, businessFounder: 7 } } },
    ],
  },
  {
    id: 'risk_signal_01',
    text: 'You can choose one final-year project. Which risk profile do you accept?',
    category: 'Risk Tolerance',
    dimension: QuestionDimension.RISK_TOLERANCE,
    stage: 'Behavioral',
    type: 'single-choice',
    topic: 'project-risk',
    why: 'We are estimating independence and risk appetite for career fit.',
    options: [
      { value: 'A technically hard system with clear evaluation criteria', impact: { traits: { coding: 5, discipline: 2 }, careers: { softwareEngineer: 10 } } },
      { value: 'A research idea that may fail but could produce original results', impact: { traits: { research: 6, analytical: 3 }, careers: { researchScholar: 12, dataScientist: 4 } } },
      { value: 'A market-facing prototype where user adoption decides success', impact: { traits: { entrepreneurship: 5, sales: 3 }, careers: { businessFounder: 11, productManager: 5 } } },
      { value: 'A structured exam-aligned project with predictable preparation value', impact: { traits: { discipline: 5, service: 2 }, careers: { sscOfficer: 7, bankingOfficer: 6, statePscOfficer: 5 } } },
    ],
  },
  {
    id: 'team_signal_01',
    text: 'Your team disagrees on architecture two days before submission. What role do you naturally take?',
    category: 'Personality',
    dimension: QuestionDimension.PERSONALITY,
    stage: 'Behavioral',
    type: 'single-choice',
    topic: 'team-conflict',
    why: 'We are identifying collaboration behavior through a realistic constraint.',
    options: [
      { value: 'Compare options with tradeoffs and push the simplest reliable design', impact: { traits: { logic: 5, communication: 3 }, careers: { softwareEngineer: 8, productManager: 4 } } },
      { value: 'Prototype both risky parts and let evidence decide', impact: { traits: { coding: 4, analytical: 4 }, careers: { softwareEngineer: 8, dataScientist: 4 } } },
      { value: 'Align people around responsibilities, timeline, and decision rules', impact: { traits: { leadership: 5, communication: 4 }, careers: { productManager: 10, businessFounder: 6 } } },
      { value: 'Check compliance, documentation, and hidden failure modes', impact: { traits: { discipline: 5, analytical: 3 }, careers: { cyberSecurity: 8, bankingOfficer: 4 } } },
    ],
  },
  {
    id: 'career_disambiguation_software_cyber_ai',
    text: 'A smart campus system must be shipped this semester. Which responsibility would you choose under real deadlines?',
    category: 'Career Disambiguation',
    dimension: QuestionDimension.CAREER_DISAMBIGUATION,
    stage: 'Career Disambiguation',
    type: 'single-choice',
    topic: 'software-cyber-ai',
    why: 'Your current signals are close, so this question separates adjacent technical paths.',
    discriminationCareers: ['softwareEngineer', 'cyberSecurity', 'dataScientist'],
    options: [
      { value: 'Design APIs, data models, and deployment so the system survives usage spikes', impact: { traits: { coding: 5, logic: 4 }, careers: { softwareEngineer: 15, cyberSecurity: -2 } } },
      { value: 'Threat-model login, permissions, and abuse cases before launch', impact: { traits: { analytical: 4, discipline: 4 }, careers: { cyberSecurity: 15, softwareEngineer: -2 } } },
      { value: 'Build a model that predicts demand and flags unusual behavior', impact: { traits: { math: 5, analytical: 4 }, careers: { dataScientist: 15 } } },
      { value: 'Prioritize scope, adoption metrics, and rollout communication', impact: { traits: { leadership: 4, communication: 4 }, careers: { productManager: 12 } } },
    ],
  },
  {
    id: 'public_service_signal_01',
    text: 'A district has funds for only one digital initiative. What analysis do you prepare?',
    category: 'Career Disambiguation',
    dimension: QuestionDimension.CAREER_DISAMBIGUATION,
    stage: 'Career Disambiguation',
    type: 'single-choice',
    topic: 'public-service',
    why: 'We are differentiating governance, finance, product, and analytics instincts.',
    discriminationCareers: ['upscOfficer', 'bankingOfficer', 'productManager'],
    options: [
      { value: 'Equity impact, citizen access, and long-term public value', impact: { traits: { service: 6, leadership: 3 }, careers: { upscOfficer: 12, statePscOfficer: 10 } } },
      { value: 'Cost, repayment feasibility, auditability, and financial risk', impact: { traits: { finance: 6, analytical: 3 }, careers: { bankingOfficer: 12 } } },
      { value: 'User journey, adoption barriers, and measurable rollout milestones', impact: { traits: { communication: 4, design: 3 }, careers: { productManager: 10 } } },
      { value: 'Operational rules, exam-style compliance, and process reliability', impact: { traits: { discipline: 5, service: 3 }, careers: { sscOfficer: 8, railwayOfficer: 6 } } },
    ],
  },
  {
    id: 'defence_signal_01',
    text: 'A high-pressure field exercise has incomplete information and strict command structure. What is your strongest contribution?',
    category: 'Career Disambiguation',
    dimension: QuestionDimension.CAREER_DISAMBIGUATION,
    stage: 'Career Disambiguation',
    type: 'single-choice',
    topic: 'defence-readiness',
    why: 'We include defence only when age and response patterns make it plausible.',
    minAge: 16,
    maxAge: 24,
    discriminationCareers: ['armyOfficer', 'navyOfficer', 'airForceOfficer'],
    options: [
      { value: 'Lead ground coordination while keeping the team calm and moving', impact: { traits: { physical: 4, leadership: 4, discipline: 3 }, careers: { armyOfficer: 14 } } },
      { value: 'Track systems, navigation constraints, and procedural precision', impact: { traits: { discipline: 5, analytical: 3 }, careers: { navyOfficer: 12 } } },
      { value: 'Make fast technical judgments using instruments and spatial reasoning', impact: { traits: { analytical: 5, logic: 3 }, careers: { airForceOfficer: 13 } } },
      { value: 'Prefer a civilian role with structured service and public impact', impact: { traits: { service: 4, discipline: 3 }, careers: { upscOfficer: 6, statePscOfficer: 6 } } },
    ],
  },
  {
    id: 'independent_work_signal_01',
    text: 'A client gives a vague requirement and a short budget. What would make you effective?',
    category: 'Work Style',
    dimension: QuestionDimension.WORK_STYLE,
    stage: 'Behavioral',
    type: 'single-choice',
    topic: 'client-ambiguity',
    why: 'We are checking fit for independent work, business ownership, and delivery discipline.',
    options: [
      { value: 'Convert ambiguity into milestones, demos, and payment checkpoints', impact: { traits: { entrepreneurship: 5, communication: 4 }, careers: { freelanceDeveloper: 10, businessFounder: 5 } } },
      { value: 'Ship the core technical workflow first and negotiate scope later', impact: { traits: { coding: 5, logic: 3 }, careers: { freelanceDeveloper: 9, softwareEngineer: 5 } } },
      { value: 'Clarify market value, pricing, and repeatable service packaging', impact: { traits: { sales: 4, entrepreneurship: 5 }, careers: { businessFounder: 11, marketingManager: 5 } } },
      { value: 'Avoid vague work unless expectations are documented clearly', impact: { traits: { discipline: 4, finance: 2 }, careers: { bankingOfficer: 4, sscOfficer: 4 } } },
    ],
  },
  {
    id: 'research_signal_01',
    text: 'Your model performs well, but you do not know why. What is your next move?',
    category: 'Technical Assessment',
    dimension: QuestionDimension.TECHNICAL,
    stage: 'Technical',
    type: 'single-choice',
    topic: 'model-interpretability',
    why: 'We are separating engineering execution, research curiosity, and product judgment.',
    discriminationCareers: ['dataScientist', 'researchScholar', 'softwareEngineer'],
    options: [
      { value: 'Run ablations, inspect errors, and explain the learned behavior', impact: { traits: { research: 5, analytical: 5 }, careers: { dataScientist: 12, researchScholar: 8 } } },
      { value: 'Package it behind a stable API with monitoring and rollback', impact: { traits: { coding: 5, discipline: 3 }, careers: { softwareEngineer: 10, dataScientist: 3 } } },
      { value: 'Check bias, misuse risk, and policy implications before release', impact: { traits: { service: 4, analytical: 3 }, careers: { upscOfficer: 6, productManager: 5 } } },
      { value: 'Turn results into a paper-style claim with limitations', impact: { traits: { research: 6, communication: 2 }, careers: { researchScholar: 13 } } },
    ],
  },
  {
    id: 'finance_signal_01',
    text: 'A student startup asks whether it should take a loan, bootstrap, or seek investors. What do you examine?',
    category: 'Cognitive Assessment',
    dimension: QuestionDimension.COGNITIVE,
    stage: 'Cognitive',
    type: 'single-choice',
    topic: 'financial-decision',
    why: 'We are measuring numerical judgment, business thinking, and advisory style.',
    discriminationCareers: ['bankingOfficer', 'businessFounder', 'productManager'],
    options: [
      { value: 'Cash flow, repayment capacity, collateral risk, and downside cases', impact: { traits: { finance: 6, analytical: 4 }, careers: { bankingOfficer: 13 } } },
      { value: 'Market speed, ownership dilution, and growth experiments', impact: { traits: { entrepreneurship: 5, sales: 3 }, careers: { businessFounder: 12 } } },
      { value: 'User demand evidence and whether funding changes product priorities', impact: { traits: { leadership: 3, communication: 3 }, careers: { productManager: 9, businessFounder: 4 } } },
      { value: 'Regulatory rules, documentation, and process compliance', impact: { traits: { discipline: 5, finance: 3 }, careers: { bankingOfficer: 8, sscOfficer: 4 } } },
    ],
  },
];

export const ALL_ASSESSMENT_QUESTIONS = [AGE_QUESTION, ...PSYCHOMETRIC_QUESTION_BANK];

export function getQuestionById(questionId: string, generatedQuestions: PsychometricQuestion[] = []) {
  return [...ALL_ASSESSMENT_QUESTIONS, ...generatedQuestions].find((question) => question.id === questionId) || null;
}
