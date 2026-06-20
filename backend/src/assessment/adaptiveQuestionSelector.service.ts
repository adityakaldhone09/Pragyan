import { QuestionDimension } from './questionDimensions';
import {
  CareerKey,
  PSYCHOMETRIC_QUESTION_BANK,
  PsychometricQuestion,
} from './psychometricQuestionBank';
import { ageFilterService } from './ageFilter.service';
import { CareerConfidenceMatrix, confidenceMatrixService } from './confidenceMatrix.service';
import { embeddingMatcherService } from './embeddingMatcher.service';

export interface QuestionSelectionInput {
  careerScores: CareerConfidenceMatrix;
  askedQuestionIds: string[];
  recentDimensions: QuestionDimension[];
  recentTopics: string[];
  userAge?: number;
  generatedQuestions?: PsychometricQuestion[];
}

const TARGET_QUESTION_COUNT = 20;

function careerSpread(question: PsychometricQuestion, topCareers: CareerKey[]) {
  const impacts = question.options.map((option) =>
    topCareers.reduce((sum, career) => sum + Math.abs(option.impact.careers?.[career] || 0), 0)
  );
  return Math.max(...impacts, 0) - Math.min(...impacts, 0);
}

function discriminationFit(question: PsychometricQuestion, topCareers: CareerKey[]) {
  const explicit = question.discriminationCareers || [];
  const overlap = explicit.filter((career) => topCareers.includes(career)).length;
  return overlap * 16 + careerSpread(question, topCareers);
}

export class AdaptiveQuestionSelectorService {
  readonly targetQuestionCount = TARGET_QUESTION_COUNT;

  selectNextQuestion(input: QuestionSelectionInput): PsychometricQuestion | null {
    const ranked = confidenceMatrixService.rankCareers(input.careerScores);
    const topCareers = ranked.slice(0, 4).map(([career]) => career);
    const allCandidates = [...(input.generatedQuestions || []), ...PSYCHOMETRIC_QUESTION_BANK];

    const candidates = allCandidates.filter((question) => {
      if (input.askedQuestionIds.includes(question.id)) {
        return false;
      }
      if (!ageFilterService.allowsQuestion(question, input.userAge)) {
        return false;
      }
      if (input.recentDimensions.slice(-3).includes(question.dimension)) {
        return false;
      }
      if (input.recentTopics.slice(-3).includes(question.topic)) {
        return false;
      }
      return true;
    });

    const relaxedCandidates = candidates.length
      ? candidates
      : allCandidates.filter(
          (question) => !input.askedQuestionIds.includes(question.id) && ageFilterService.allowsQuestion(question, input.userAge)
        );
    const vectorPreferredQuestionId = embeddingMatcherService.getHighestInformationGainQuestion(
      input.careerScores,
      input.askedQuestionIds,
      relaxedCandidates
    );

    const scored = relaxedCandidates
      .map((question) => ({
        question,
        score:
          discriminationFit(question, topCareers) +
          this.stagePriority(question, input.askedQuestionIds.length) +
          (question.isPrecisionQuestion ? 14 : 0) +
          (question.id === vectorPreferredQuestionId ? 18 : 0),
      }))
      .sort((left, right) => right.score - left.score);

    return scored[0]?.question || null;
  }

  private stagePriority(question: PsychometricQuestion, askedCount: number) {
    const earlyStages = ['Interest', 'Cognitive', 'Behavioral'];
    if (askedCount < 6 && earlyStages.includes(question.stage)) {
      return 8;
    }
    if (askedCount >= 6 && question.stage === 'Technical') {
      return 7;
    }
    if (askedCount >= 10 && ['Learning Style', 'Stress Response', 'Career Disambiguation'].includes(question.stage)) {
      return 9;
    }
    return 0;
  }
}

export const adaptiveQuestionSelectorService = new AdaptiveQuestionSelectorService();
