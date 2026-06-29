import type { HybridAssessmentSession, QAExchange, StateMachineResponse } from '@/types/hybridAssessment';
import { callLLM, parseLLMJson } from './llmClient';
import { PHASE3_SYSTEM_PROMPT, buildPhase3UserPrompt } from './promptTemplates';
import { saveUserAnswer } from './userAnswerService';
import { parseJsonAsync } from '@/utils/jsonWorker';
import { publishTelemetryEvent, TelemetryEvent } from '@/lib/aiTelemetry';

const funnelOrder = ['General', 'Specific', 'Specialization', 'Depth'] as const;
export const MAX_QUESTIONS = 20;

export async function runAdaptiveTurn(session: HybridAssessmentSession, userAnswer?: string): Promise<StateMachineResponse> {
  const questionCount = session.history.length;
  const forceComplete = questionCount >= MAX_QUESTIONS;
  const llmStart = Date.now();
  const raw = await callLLM({
    systemPrompt: PHASE3_SYSTEM_PROMPT,
    userPrompt: buildPhase3UserPrompt(session, { userAnswer, questionCount, forceComplete }),
    temperature: 0.5,
  });
  const llmLatencyMs = Date.now() - llmStart;

  let response = await parseStateMachineResponse(raw);
  validateStateMachineResponse(response, forceComplete);
  if (forceComplete && !response.isCompleted) {
    response = forceCompletion(session, response, userAnswer);
  }

  publishTelemetryEvent(TelemetryEvent.LLM_LATENCY_LOG, {
    sessionId: session.id,
    userId: session.userId,
    questionCount,
    llmLatencyMs,
    funnelLevel: response.currentFunnelLevel,
    isCompleted: response.isCompleted,
  });

  if (!response.isCompleted && response.nextQuestion) {
    publishTelemetryEvent(TelemetryEvent.ASSESSMENT_QUESTION_GENERATED, {
      sessionId: session.id,
      userId: session.userId,
      questionId: response.nextQuestion.questionId,
      topic: response.nextQuestion.topic,
      funnelLevel: response.nextQuestion.funnelLevel,
      questionNumber: questionCount + 1,
    });
  }

  if (response.isCompleted) {
    publishTelemetryEvent(TelemetryEvent.ASSESSMENT_COMPLETED, {
      sessionId: session.id,
      userId: session.userId,
      totalQuestions: questionCount,
      recommendedMode: response.finalSummary?.recommendedMode,
      recommendedRole: response.finalSummary?.recommendedRole,
      skillGapCount: response.finalSummary?.skillGaps?.length ?? 0,
    });
  }

  applyResponseToSession(session, response, userAnswer);

  if (response.evaluation && userAnswer !== undefined) {
    const evaluatedQuestion = findEvaluatedQuestion(session, response.evaluation.topic);
    if (evaluatedQuestion) {
      await saveUserAnswer({
        userId: session.userId,
        sessionId: session.id,
        phase: 3,
        questionId: evaluatedQuestion.questionId,
        questionText: evaluatedQuestion.questionText,
        questionType: 'SINGLE_CHOICE',
        topic: evaluatedQuestion.topic,
        funnelLevel: evaluatedQuestion.funnelLevel,
        options: evaluatedQuestion.options || [],
        selectedAnswer: [userAnswer],
      });

      publishTelemetryEvent(TelemetryEvent.ASSESSMENT_ANSWER_SUBMITTED, {
        sessionId: session.id,
        userId: session.userId,
        questionId: evaluatedQuestion.questionId,
        topic: evaluatedQuestion.topic,
        funnelLevel: evaluatedQuestion.funnelLevel,
        isCorrect: response.evaluation.isCorrect,
        consecutiveFailures: response.evaluation.consecutiveFailuresOnTopic,
      });
    }
  }

  return response;
}

export function initSession(
  sessionId: string,
  userId: string,
  profile: HybridAssessmentSession['profile'],
  skillBaselines: HybridAssessmentSession['skillBaselines']
): HybridAssessmentSession {
  const now = new Date().toISOString();
  return {
    id: sessionId,
    userId,
    profile,
    skillBaselines,
    history: [],
    currentFunnelLevel: 'General',
    currentTopic: '',
    consecutiveFailures: 0,
    isCompleted: false,
    createdAt: now,
    updatedAt: now,
  };
}

async function parseStateMachineResponse(raw: string): Promise<StateMachineResponse> {
  try {
    return await parseJsonAsync<StateMachineResponse>(raw);
  } catch (error) {
    publishTelemetryEvent(TelemetryEvent.LLM_PARSE_ERROR, {
      reason: error instanceof Error ? error.message : String(error),
      parser: 'worker',
    });
    return parseLLMJson<StateMachineResponse>(raw);
  }
}

function validateStateMachineResponse(response: StateMachineResponse, forceComplete: boolean): void {
  if (typeof response.isCompleted !== 'boolean') throw new Error("StateMachineResponse missing 'isCompleted'");
  if (!funnelOrder.includes(response.currentFunnelLevel)) throw new Error("StateMachineResponse has invalid 'currentFunnelLevel'");
  if (forceComplete && !response.isCompleted) return;
  if (!response.isCompleted && !response.nextQuestion) throw new Error("StateMachineResponse missing 'nextQuestion'");
  if (!response.isCompleted && response.nextQuestion) {
    const options = response.nextQuestion.options;
    if (!Array.isArray(options) || options.length !== 4 || options.some((option) => typeof option !== 'string')) {
      publishTelemetryEvent(TelemetryEvent.LLM_PARSE_ERROR, {
        reason: 'nextQuestion.options must contain exactly 4 strings',
        received: Array.isArray(options) ? options.length : typeof options,
        questionText: response.nextQuestion.questionText,
      });
      throw new Error("StateMachineResponse has invalid 'nextQuestion.options'");
    }
  }
  if (response.isCompleted && !response.finalSummary) throw new Error("StateMachineResponse missing 'finalSummary'");
}

function forceCompletion(
  session: HybridAssessmentSession,
  response: StateMachineResponse,
  userAnswer?: string
): StateMachineResponse {
  const history = [...session.history];
  if (response.evaluation && history.length > 0) {
    const lastQuestion = history[history.length - 1].question;
    history[history.length - 1] = {
      question: lastQuestion,
      userAnswer: userAnswer ?? '',
      isCorrect: response.evaluation.isCorrect,
      evaluatedTopic: response.evaluation.topic,
    };
  }

  const strengths = Array.from(new Set(history.filter((item) => item.isCorrect).map((item) => item.question.topic)));
  const weakTopics = Array.from(new Set(history.filter((item) => !item.isCorrect).map((item) => item.question.topic)));
  const recommendedMode = weakTopics.length > strengths.length ? 'Recovery' : strengths.some((topic) => {
    const lastForTopic = [...history].reverse().find((item) => item.question.topic === topic);
    return lastForTopic?.question.funnelLevel === 'Depth';
  }) ? 'Stretch' : 'Growth';

  return {
    currentFunnelLevel: response.currentFunnelLevel || session.currentFunnelLevel,
    reasoningToast: response.reasoningToast || "You've reached the question limit, so Pragyan is wrapping up your results now.",
    isCompleted: true,
    evaluation: response.evaluation,
    nextQuestion: null,
    finalSummary: {
      strengths,
      weakTopics,
      topicMastery: Array.from(new Set(history.map((item) => item.question.topic))).map((topic) => {
        const entries = history.filter((item) => item.question.topic === topic);
        const lastEntry = entries[entries.length - 1];
        const allCorrect = entries.every((item) => item.isCorrect);
        return {
          topic,
          funnelLevelReached: lastEntry.question.funnelLevel,
          status: allCorrect ? 'mastered' : entries.some((item) => item.isCorrect) ? 'weak' : 'failed',
          attempts: entries.length,
        };
      }),
      recommendedMode,
      recommendedRole: response.finalSummary?.recommendedRole || session.profile.role || 'General Career Track',
      requiredJobSkills: response.finalSummary?.requiredJobSkills || session.profile.currentSkills || [],
      skillGaps: response.finalSummary?.skillGaps || weakTopics,
      jobAvailabilityInsight:
        response.finalSummary?.jobAvailabilityInsight ||
        'The assessment reached its question limit before a full market read, so treat this as a first-pass direction to refine with your roadmap.',
      realizedStrengths: response.finalSummary?.realizedStrengths || strengths,
      unrealizedStrengths: response.finalSummary?.unrealizedStrengths || [],
      learnedSkills: response.finalSummary?.learnedSkills || [],
      weaknesses: response.finalSummary?.weaknesses || weakTopics,
    },
  };
}

function applyResponseToSession(session: HybridAssessmentSession, response: StateMachineResponse, userAnswer?: string): void {
  if (response.evaluation && session.history.length > 0) {
    const lastQuestion = session.history[session.history.length - 1].question;
    const exchange: QAExchange = {
      question: lastQuestion,
      userAnswer: userAnswer ?? '',
      isCorrect: response.evaluation.isCorrect,
      evaluatedTopic: response.evaluation.topic,
    };

    session.history[session.history.length - 1] = exchange;
    session.consecutiveFailures = response.evaluation.consecutiveFailuresOnTopic;
  }

  session.currentFunnelLevel = response.currentFunnelLevel;
  session.updatedAt = new Date().toISOString();

  if (response.isCompleted) {
    session.isCompleted = true;
    session.finalSummary = response.finalSummary ?? undefined;
    return;
  }

  if (response.nextQuestion) {
    session.currentTopic = response.nextQuestion.topic;
    session.history.push({
      question: response.nextQuestion,
      userAnswer: '',
      isCorrect: false,
      evaluatedTopic: response.nextQuestion.topic,
    });
  }
}

function findEvaluatedQuestion(session: HybridAssessmentSession, topic: string) {
  const matchingEntry = [...session.history]
    .reverse()
    .find((item) => item.evaluatedTopic === topic && item.userAnswer);

  return matchingEntry?.question ?? null;
}
