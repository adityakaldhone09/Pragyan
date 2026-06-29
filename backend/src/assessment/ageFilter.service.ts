import { PsychometricQuestion } from './psychometricQuestionBank';

export interface AgeRule {
  min: number;
  max: number;
}

export const ageRules: Record<string, AgeRule> = {
  defence: {
    min: 17,
    max: 24,
  },
  nda: {
    min: 16,
    max: 21,
  },
  government_exam: {
    min: 18,
    max: 32,
  },
};

export class AgeFilterService {
  ageFromRange(answer: string) {
    const ageMap: Record<string, number> = {
      '15 - 18': 17,
      '19 - 24': 22,
      '25 - 30': 27,
      '31+': 35,
    };
    return ageMap[answer];
  }

  isEligibleForRule(age: number | undefined, ruleName: keyof typeof ageRules) {
    if (typeof age !== 'number') {
      return false;
    }
    const rule = ageRules[ruleName];
    return age >= rule.min && age <= rule.max;
  }

  allowsQuestion(question: PsychometricQuestion, age?: number) {
    if (typeof age !== 'number') {
      return question.id === 'age_question' || (!question.minAge && !question.maxAge);
    }
    if (typeof question.minAge === 'number' && age < question.minAge) {
      return false;
    }
    if (typeof question.maxAge === 'number' && age > question.maxAge) {
      return false;
    }
    return true;
  }

  filterQuestions<T extends PsychometricQuestion>(questions: T[], age?: number) {
    return questions.filter((question) => this.allowsQuestion(question, age));
  }
}

export const ageFilterService = new AgeFilterService();
