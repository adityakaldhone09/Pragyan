import {
  CareerKey,
  INITIAL_CAREER_SCORES,
  INITIAL_TRAITS,
  PsychometricQuestion,
  TraitKey,
} from './psychometricQuestionBank';

export type CareerConfidenceMatrix = Record<CareerKey, number>;
export type TraitVector = Record<TraitKey, number>;

export interface ConfidenceUpdateResult {
  careerScores: CareerConfidenceMatrix;
  traits: TraitVector;
  selectedOptionFound: boolean;
}

const CAREER_MIN = 0;
const CAREER_MAX = 100;

function clamp(value: number, min = CAREER_MIN, max = CAREER_MAX) {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : 0));
}

function addToRecord<T extends string>(record: Record<T, number>, updates: Partial<Record<T, number>>, min?: number, max?: number) {
  (Object.keys(updates) as T[]).forEach((key) => {
    const next = (record[key] || 0) + (updates[key] || 0);
    record[key] = typeof min === 'number' && typeof max === 'number' ? clamp(next, min, max) : next;
  });
}

export class ConfidenceMatrixService {
  createInitialCareerScores(): CareerConfidenceMatrix {
    return { ...INITIAL_CAREER_SCORES };
  }

  createInitialTraits(): TraitVector {
    return { ...INITIAL_TRAITS };
  }

  applyAnswer(input: {
    question: PsychometricQuestion;
    answer: string;
    careerScores: CareerConfidenceMatrix;
    traits: TraitVector;
  }): ConfidenceUpdateResult {
    const careerScores = { ...input.careerScores };
    const traits = { ...input.traits };
    const selected = input.question.options.find((option) => option.value === input.answer);

    if (!selected) {
      return { careerScores, traits, selectedOptionFound: false };
    }

    addToRecord(traits, selected.impact.traits || {});
    addToRecord(careerScores, selected.impact.careers || {}, CAREER_MIN, CAREER_MAX);

    return { careerScores, traits, selectedOptionFound: true };
  }

  applySemanticBoost(
    careerScores: CareerConfidenceMatrix,
    semanticScores: Partial<Record<CareerKey, number>>,
    maxBoost = 8
  ): CareerConfidenceMatrix {
    const next = { ...careerScores };
    (Object.keys(semanticScores) as CareerKey[]).forEach((career) => {
      next[career] = clamp(next[career] + (semanticScores[career] || 0) * maxBoost);
    });
    return next;
  }

  rankCareers(careerScores: CareerConfidenceMatrix) {
    return (Object.entries(careerScores) as Array<[CareerKey, number]>).sort((left, right) => right[1] - left[1]);
  }

  calculateCertainty(careerScores: CareerConfidenceMatrix, answeredCount: number, targetQuestionCount: number) {
    const ranked = this.rankCareers(careerScores);
    const top = ranked[0]?.[1] || 0;
    const second = ranked[1]?.[1] || 0;
    const margin = Math.max(0, top - second);
    const marginCertainty = Math.min(1, margin / 22);
    const progressCertainty = Math.min(1, answeredCount / targetQuestionCount);
    return Math.max(0.05, Math.min(0.98, progressCertainty * 0.6 + marginCertainty * 0.4));
  }

  isHighUncertainty(careerScores: CareerConfidenceMatrix) {
    const ranked = this.rankCareers(careerScores);
    if (ranked.length < 3) {
      return false;
    }
    return ranked[0][1] - ranked[2][1] <= 8 && ranked[0][1] >= 58;
  }
}

export const confidenceMatrixService = new ConfidenceMatrixService();
