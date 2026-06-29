import { CareerKey, PSYCHOMETRIC_QUESTION_BANK, PsychometricQuestion, TraitKey } from './psychometricQuestionBank';
import { QuestionDimension } from './questionDimensions';

export interface CareerSemanticProfile {
  title: string;
  category?: string | null;
  requiredSkills: string[];
  personalityTraits: string[];
}

const SEMANTIC_AXES = [
  ['api', 'backend', 'system', 'scale', 'deployment', 'code', 'architecture', 'software'],
  ['model', 'data', 'statistics', 'prediction', 'machine', 'ai', 'pattern', 'analytics'],
  ['security', 'threat', 'vulnerability', 'abuse', 'risk', 'permission', 'attack'],
  ['user', 'product', 'roadmap', 'stakeholder', 'adoption', 'workflow', 'priority'],
  ['market', 'growth', 'brand', 'sales', 'campaign', 'customer', 'positioning'],
  ['public', 'policy', 'governance', 'citizen', 'service', 'district', 'society'],
  ['finance', 'bank', 'loan', 'audit', 'cash', 'valuation', 'repayment'],
  ['defence', 'field', 'command', 'fitness', 'navigation', 'discipline', 'military'],
  ['research', 'paper', 'experiment', 'hypothesis', 'explain', 'innovation'],
  ['business', 'startup', 'client', 'pricing', 'founder', 'independent', 'entrepreneur'],
];

const TRAIT_WORDS: Record<TraitKey, string[]> = {
  analytical: ['analysis', 'evidence', 'pattern'],
  logic: ['logic', 'algorithm', 'debug'],
  math: ['statistics', 'quantitative', 'model'],
  coding: ['code', 'api', 'software'],
  communication: ['stakeholder', 'communication', 'user'],
  leadership: ['lead', 'priority', 'decision'],
  creativity: ['creative', 'campaign', 'design'],
  discipline: ['discipline', 'checklist', 'process'],
  service: ['public', 'service', 'citizen'],
  entrepreneurship: ['startup', 'client', 'business'],
  research: ['research', 'experiment', 'paper'],
  physical: ['field', 'fitness', 'defence'],
  finance: ['finance', 'bank', 'cash'],
  sales: ['sales', 'growth', 'market'],
  design: ['design', 'workflow', 'experience'],
};

const CAREER_PROTOTYPES: Record<CareerKey, string> = {
  softwareEngineer: 'software backend APIs scalable systems deployment architecture code debugging',
  dataScientist: 'data science AI machine learning statistics prediction patterns experiments',
  cyberSecurity: 'cyber security threat modeling vulnerability abuse detection permissions risk',
  productManager: 'product users roadmap adoption stakeholders prioritization workflow',
  marketingManager: 'marketing growth brand sales campaign customer positioning',
  upscOfficer: 'public policy governance citizen service district societal impact',
  sscOfficer: 'government service process discipline operations public administration',
  bankingOfficer: 'banking finance loan audit cash repayment risk compliance',
  railwayOfficer: 'railway operations discipline public service process reliability',
  statePscOfficer: 'state public service governance citizen policy administration',
  armyOfficer: 'army defence command field leadership discipline physical training',
  navyOfficer: 'navy defence navigation systems discipline field operations',
  airForceOfficer: 'air force defence instruments spatial reasoning technical command',
  freelanceDeveloper: 'freelance client software delivery scope pricing independent code',
  businessFounder: 'startup founder market business pricing customers risk growth',
  researchScholar: 'research experiments papers hypothesis innovation deep study',
};

function vectorize(text: string) {
  const normalized = text.toLowerCase();
  return SEMANTIC_AXES.map((axis) => axis.reduce((sum, word) => sum + (normalized.includes(word) ? 1 : 0), 0));
}

function cosineSimilarity(left: number[], right: number[]) {
  const dot = left.reduce((sum, value, index) => sum + value * (right[index] || 0), 0);
  const leftNorm = Math.sqrt(left.reduce((sum, value) => sum + value * value, 0));
  const rightNorm = Math.sqrt(right.reduce((sum, value) => sum + value * value, 0));
  if (!leftNorm || !rightNorm) {
    return 0;
  }
  return dot / (leftNorm * rightNorm);
}

export class EmbeddingMatcherService {
  private calculateCosineSimilarity(vecA: number[], vecB: number[]) {
    return cosineSimilarity(vecA, vecB);
  }

  private convertMatrixToVector(profile: Partial<Record<CareerKey, number>>, keysOrder: CareerKey[]) {
    return keysOrder.map((key) => profile[key] || 0);
  }

  private buildQuestionTargetProfile(question: PsychometricQuestion): Partial<Record<CareerKey, number>> {
    return question.options.reduce<Partial<Record<CareerKey, number>>>((profile, option) => {
      (Object.entries(option.impact.careers || {}) as Array<[CareerKey, number]>).forEach(([career, weight]) => {
        profile[career] = Math.max(profile[career] || 0, Math.abs(weight));
      });
      return profile;
    }, {});
  }

  getHighestInformationGainQuestion(
    currentMatrix: Partial<Record<CareerKey, number>>,
    excludedQuestionIds: string[],
    questionPool = PSYCHOMETRIC_QUESTION_BANK
  ): string {
    const careerKeysOrder: CareerKey[] = [
      'softwareEngineer',
      'cyberSecurity',
      'dataScientist',
      'productManager',
      'bankingOfficer',
      'businessFounder',
      'researchScholar',
    ];
    const userVector = this.convertMatrixToVector(currentMatrix, careerKeysOrder);
    const candidates = questionPool.filter(
      (question) =>
        !excludedQuestionIds.includes(question.id) &&
        question.dimension === QuestionDimension.CAREER_DISAMBIGUATION
    );

    let bestQuestionId = '';
    let closestTargetDistance = Infinity;

    for (const question of candidates) {
      const questionVector = this.convertMatrixToVector(this.buildQuestionTargetProfile(question), careerKeysOrder);
      const similarity = this.calculateCosineSimilarity(userVector, questionVector);
      const distanceToIdealDisambiguator = Math.abs(0.7 - similarity);

      if (distanceToIdealDisambiguator < closestTargetDistance) {
        closestTargetDistance = distanceToIdealDisambiguator;
        bestQuestionId = question.id;
      }
    }

    return bestQuestionId;
  }

  buildTraitNarrative(traits: Record<TraitKey, number>, answers: string[]) {
    const topTraits = (Object.entries(traits) as Array<[TraitKey, number]>)
      .sort((left, right) => right[1] - left[1])
      .slice(0, 6)
      .flatMap(([trait]) => TRAIT_WORDS[trait]);

    return [...answers, ...topTraits].join(' ');
  }

  scoreCareerProfile(userNarrative: string, profile: CareerSemanticProfile) {
    const careerNarrative = [profile.title, profile.category || '', ...profile.requiredSkills, ...profile.personalityTraits].join(' ');
    return cosineSimilarity(vectorize(userNarrative), vectorize(careerNarrative));
  }

  inferCareerBoosts(userNarrative: string): Partial<Record<CareerKey, number>> {
    const userVector = vectorize(userNarrative);
    return (Object.entries(CAREER_PROTOTYPES) as Array<[CareerKey, string]>).reduce<Partial<Record<CareerKey, number>>>(
      (acc, [career, text]) => {
        acc[career] = cosineSimilarity(userVector, vectorize(text));
        return acc;
      },
      {}
    );
  }
}

export const embeddingMatcherService = new EmbeddingMatcherService();
export { cosineSimilarity };
