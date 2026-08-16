import { prisma } from '@/lib/prisma';
import redisClient from '@/lib/redis';
import { callLLM, parseLLMJson } from './hybridAssessment/llmClient';
import { parseJsonAsync } from '@/utils/jsonWorker';
import { publishTelemetryEvent, TelemetryEvent } from '@/lib/aiTelemetry';

const SESSION_TTL_SECONDS = 60 * 60 * 3; // 3 hours
const MIN_QUESTIONS = 6;
const MAX_QUESTIONS = 12;
const TARGET_CONFIDENCE = 0.88;

type FallbackQuestion = Phase4Question & { correctAnswer: string };

const FALLBACK_QUESTION_BANK: FallbackQuestion[] = [
  {
    questionId: 'fallback_web_http_001',
    questionText: 'Which HTTP status code best represents a successful resource creation from a POST request?',
    questionType: 'MCQ',
    options: ['200 OK', '201 Created', '204 No Content', '400 Bad Request'],
    correctAnswer: '201 Created',
    topic: 'HTTP APIs',
    domain: 'Web Development',
    difficulty: 'Foundation',
  },
  {
    questionId: 'fallback_web_react_001',
    questionText: 'In React, which hook is most appropriate for running side effects after a component renders?',
    questionType: 'MCQ',
    options: ['useMemo', 'useEffect', 'useRef', 'useReducer'],
    correctAnswer: 'useEffect',
    topic: 'React Hooks',
    domain: 'Web Development',
    difficulty: 'Foundation',
  },
  {
    questionId: 'fallback_backend_db_001',
    questionText: 'What is the main reason to add an index to a frequently queried database column?',
    questionType: 'MCQ',
    options: ['To encrypt the column', 'To speed up reads for matching queries', 'To prevent all duplicate values', 'To reduce network latency'],
    correctAnswer: 'To speed up reads for matching queries',
    topic: 'Database Indexing',
    domain: 'Backend Development',
    difficulty: 'Intermediate',
  },
  {
    questionId: 'fallback_programming_ds_001',
    questionText: 'Which data structure is usually the best fit for fast key-based lookups?',
    questionType: 'MCQ',
    options: ['Array', 'Stack', 'Hash map', 'Queue'],
    correctAnswer: 'Hash map',
    topic: 'Data Structures',
    domain: 'Software Development',
    difficulty: 'Foundation',
  },
  {
    questionId: 'fallback_ai_overfit_001',
    questionText: 'A model performs very well on training data but poorly on unseen data. What is the most likely issue?',
    questionType: 'MCQ',
    options: ['Underfitting', 'Overfitting', 'Data normalization', 'Batching'],
    correctAnswer: 'Overfitting',
    topic: 'Model Generalization',
    domain: 'AI/ML',
    difficulty: 'Foundation',
  },
  {
    questionId: 'fallback_data_sql_001',
    questionText: 'Which SQL clause is used to filter grouped aggregate results?',
    questionType: 'MCQ',
    options: ['WHERE', 'HAVING', 'ORDER BY', 'LIMIT'],
    correctAnswer: 'HAVING',
    topic: 'SQL Aggregation',
    domain: 'Data Science',
    difficulty: 'Intermediate',
  },
  {
    questionId: 'fallback_security_owasp_001',
    questionText: 'Which practice best helps prevent SQL injection in application code?',
    questionType: 'MCQ',
    options: ['Parameterized queries', 'Client-side validation only', 'Longer passwords', 'Minified JavaScript'],
    correctAnswer: 'Parameterized queries',
    topic: 'Application Security',
    domain: 'Cyber Security',
    difficulty: 'Foundation',
  },
  {
    questionId: 'fallback_cloud_container_001',
    questionText: 'What is the primary purpose of a Docker image?',
    questionType: 'MCQ',
    options: ['To store only runtime logs', 'To package an app and its dependencies', 'To replace source control', 'To allocate a public IP address'],
    correctAnswer: 'To package an app and its dependencies',
    topic: 'Containers',
    domain: 'Cloud',
    difficulty: 'Foundation',
  },
  {
    questionId: 'fallback_devops_ci_001',
    questionText: 'What does a CI pipeline typically do after code is pushed?',
    questionType: 'MCQ',
    options: ['Runs automated checks and builds', 'Deletes old branches automatically', 'Changes production passwords', 'Writes user documentation'],
    correctAnswer: 'Runs automated checks and builds',
    topic: 'Continuous Integration',
    domain: 'DevOps',
    difficulty: 'Foundation',
  },
];

const FALLBACK_CORRECT_ANSWERS = new Map(
  FALLBACK_QUESTION_BANK.map((question) => [question.questionId, question.correctAnswer])
);

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Phase4Question {
  questionId: string;
  questionText: string;
  questionType: 'MCQ' | 'Scenario' | 'Conceptual' | 'Practical' | 'Experience';
  options: string[];
  topic: string;
  domain: string;
  difficulty: 'Foundation' | 'Intermediate' | 'Advanced' | 'Expert';
  codeSnippet?: string;
}

export interface Phase4Evaluation {
  topic: string;
  isCorrect: boolean;
  explanation: string;
  skillLevel: string;
}

export interface Phase4Session {
  sessionId: string;
  userId: string;
  domains: string[];
  cognitiveProfile: Record<string, any>;
  profileContext: Record<string, any>;
  history: Array<{
    question: Phase4Question;
    userAnswer: string;
    isCorrect: boolean;
    evaluatedTopic: string;
  }>;
  domainScores: Record<string, number>;
  skillScores: Record<string, number>;
  technicalConfidence: number;
  detectedStrengths: string[];
  detectedWeaknesses: string[];
  knowledgeGaps: string[];
  currentDomain: string;
  currentDifficulty: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Phase4StateMachineResponse {
  technicalConfidence: number;
  reasoningToast: string;
  isCompleted: boolean;
  evaluation: Phase4Evaluation | null;
  nextQuestion: Phase4Question | null;
  finalSummary: {
    domainReadiness: Record<string, number>;
    technicalStrengths: string[];
    technicalWeaknesses: string[];
    knowledgeGaps: string[];
    skillScores: Record<string, number>;
    recommendedSpecialization: string;
    readinessForPhase5: boolean;
  } | null;
}

// ── Phase 4 System Prompt ─────────────────────────────────────────────────────

const PHASE4_SYSTEM_PROMPT = `
You are the Pragyan AI Phase 4 Technical Assessment Engine.

OBJECTIVE:
Evaluate the user's technical foundation within their selected domains and identify:
- Technical Strengths
- Technical Weaknesses
- Practical Experience
- Conceptual Understanding
- Real-world Application Skills
- Knowledge Gaps
- Readiness for Advanced Specialization (Phase 5)

INPUTS YOU RECEIVE:
- User Profile: Education, experience level, career goal
- Selected Domains: From Phase 2 (e.g., "AI/ML", "Cyber Security", "Backend Development")
- Cognitive Profile: From Phase 3 (analytical, logic, communication, problem-solving skills)
- Previous Technical Answers: User's response history

DIFFICULTY LEVELS:
You MUST adapt question difficulty based on user responses:
1. Foundation - Basic concepts, definitions, working principles
2. Intermediate - Applied knowledge, common patterns, tools
3. Advanced - Architecture, tradeoffs, best practices, debugging
4. Expert - Complex scenarios, optimization, production-ready solutions

QUESTION TYPES YOU CAN USE:
1. MCQ - Multiple choice conceptual or factual questions
2. Scenario - Real-world problem-solving situations
3. Conceptual - Explain architecture, working principles, design patterns
4. Practical - Code understanding, algorithm selection, output prediction
5. Experience - Questions about their projects (if they have any)

DOMAIN-SPECIFIC RULES:
AI/ML Domain: Focus on Python, NumPy, Pandas, Statistics, ML algorithms, Deep Learning, Transformers, MLOps
Cyber Security: Focus on Networking, Linux, Web Security, OWASP, Cryptography, Penetration Testing, SOC
Web Development: Focus on HTML/CSS/JS, React, Node.js, APIs, Authentication, Database Design
Cloud: Focus on AWS/Azure/GCP, Docker, Kubernetes, CI/CD, Monitoring, IAM
Data Science: Focus on SQL, Python, Statistics, Visualization, Feature Engineering, Pipelines
DevOps: Focus on Git, Docker, Kubernetes, Jenkins, GitHub Actions, Infrastructure as Code

ADAPTIVE RULES:
- Start at Foundation level for first question in each domain
- Increase difficulty when user shows confidence (2+ correct in a row)
- Simplify when user struggles (2+ incorrect in a row)
- Skip technologies user explicitly stated they don't know
- Ask 2-3 questions per selected domain
- Stop early if confidence >= ${TARGET_CONFIDENCE} after ${MIN_QUESTIONS}+ questions
- Force completion at ${MAX_QUESTIONS} questions
- Never ask unrelated domain questions
- Focus on information gain, not question count

CONFIDENCE CALCULATION:
- Start at 0.40
- +0.08 for each correct answer
- -0.05 for each incorrect answer
- Cap between 0.20 and 0.95

RESPONSE FORMAT (JSON only):
{
  "technicalConfidence": number (0.0 to 1.0),
  "reasoningToast": string (encouraging message about assessment progress),
  "isCompleted": boolean,
  "evaluation": {
    "topic": string,
    "isCorrect": boolean,
    "explanation": string (why answer is correct/incorrect),
    "skillLevel": string (e.g., "Foundation", "Intermediate")
  } | null,
  "nextQuestion": {
    "questionId": string (unique, e.g., "py_basics_001"),
    "questionText": string (clear, concise question),
    "questionType": "MCQ" | "Scenario" | "Conceptual" | "Practical" | "Experience",
    "options": string[] (exactly 4 plausible options),
    "topic": string (specific topic like "Python Basics", "React Hooks"),
    "domain": string (one of user's selected domains),
    "difficulty": "Foundation" | "Intermediate" | "Advanced" | "Expert",
    "codeSnippet": string | null (optional code block for context)
  } | null,
  "finalSummary": {
    "domainReadiness": { [domain: string]: number },
    "technicalStrengths": string[],
    "technicalWeaknesses": string[],
    "knowledgeGaps": string[] (specific missing concepts),
    "skillScores": { [skill: string]: number },
    "recommendedSpecialization": string,
    "readinessForPhase5": boolean
  } | null
}

QUALITY REQUIREMENTS:
- Questions must be technically accurate for the domain
- Options must be plausible distractors (not obviously wrong)
- Code snippets must be syntactically correct
- Explanations must be educational and encouraging
- Never repeat questions
- Knowledge gaps must be specific (e.g., "React useEffect hook" not "React basics")
`.trim();

// ── Service Class ─────────────────────────────────────────────────────────────

export class Phase4TechnicalAssessmentService {
  private getSessionKey(sessionId: string) {
    return `phase4:session:${sessionId}`;
  }

  private async saveSession(session: Phase4Session) {
    await redisClient.set(this.getSessionKey(session.sessionId), JSON.stringify(session), SESSION_TTL_SECONDS);
  }

  private async loadSession(sessionId: string): Promise<Phase4Session | null> {
    const raw = await redisClient.get(this.getSessionKey(sessionId));
    return raw ? JSON.parse(raw) : null;
  }

  async startAssessment(input: {
    userId: string;
    domains: string[];
    cognitiveProfile: Record<string, any>;
    profileContext: Record<string, any>;
  }) {
    const sessionId = `p4_${input.userId}_${Date.now()}`;
    const now = new Date().toISOString();

    const session: Phase4Session = {
      sessionId,
      userId: input.userId,
      domains: input.domains,
      cognitiveProfile: input.cognitiveProfile,
      profileContext: input.profileContext,
      history: [],
      domainScores: {},
      skillScores: {},
      technicalConfidence: 0.40,
      detectedStrengths: [],
      detectedWeaknesses: [],
      knowledgeGaps: [],
      currentDomain: input.domains[0] || 'General',
      currentDifficulty: 'Foundation',
      isCompleted: false,
      createdAt: now,
      updatedAt: now,
    };

    // Get first question from LLM
    const response = await this.runAdaptiveTurn(session);
    await this.saveSession(session);

    publishTelemetryEvent(TelemetryEvent.ASSESSMENT_STARTED, {
      sessionId,
      userId: input.userId,
      phase: 4,
      domains: input.domains,
    });

    return {
      sessionId: session.sessionId,
      question: response.nextQuestion!,
      confidence: session.technicalConfidence,
      progress: { answered: 0, totalRelevant: MIN_QUESTIONS },
    };
  }

  async answerQuestion(input: { sessionId: string; questionId: string; answer: string }) {
    const session = await this.loadSession(input.sessionId);
    if (!session) throw new Error('Session not found or expired');
    if (session.isCompleted) throw new Error('Assessment already completed');

    const response = await this.runAdaptiveTurn(session, input.answer);

    session.updatedAt = new Date().toISOString();
    await this.saveSession(session);

    const shouldSubmit = session.isCompleted ||
      (session.history.length >= MIN_QUESTIONS && session.technicalConfidence >= TARGET_CONFIDENCE);

    return {
      confidence: session.technicalConfidence,
      progress: { answered: session.history.length, totalRelevant: MIN_QUESTIONS },
      nextQuestion: response.nextQuestion,
      shouldSubmit,
      reasoningToast: response.reasoningToast,
    };
  }

  async submitAssessment(input: { sessionId: string; userId: string }) {
    const session = await this.loadSession(input.sessionId);
    if (!session) throw new Error('Session not found');

    if (!session.isCompleted) {
      const forceCompleteResponse = await this.runAdaptiveTurn(session, undefined, true);
      session.isCompleted = true;
      if (forceCompleteResponse.finalSummary) {
        // Apply final summary to session
        session.detectedStrengths = forceCompleteResponse.finalSummary.technicalStrengths;
        session.detectedWeaknesses = forceCompleteResponse.finalSummary.technicalWeaknesses;
        session.knowledgeGaps = forceCompleteResponse.finalSummary.knowledgeGaps;
        session.domainScores = forceCompleteResponse.finalSummary.domainReadiness;
        session.skillScores = forceCompleteResponse.finalSummary.skillScores;
      }
      await this.saveSession(session);
    }

    // Persist to database
    const resultId = `p4_result_${input.userId}_${Date.now()}`;
    await prisma.assessmentSession.create({
      data: {
        userId: input.userId,
        phase: 4,
        answers: JSON.stringify(session.history.map(h => ({ question: h.question.questionText, answer: h.userAnswer }))),
        selectedOptions: session.history.map(h => h.userAnswer),
        analysis: JSON.stringify({
          sessionId: session.sessionId,
          domains: session.domains,
          technicalConfidence: session.technicalConfidence,
          domainScores: session.domainScores,
          skillScores: session.skillScores,
          strengths: session.detectedStrengths,
          weaknesses: session.detectedWeaknesses,
          knowledgeGaps: session.knowledgeGaps,
          totalQuestions: session.history.length,
          cognitiveProfile: session.cognitiveProfile,
        }),
        completedAt: new Date(),
      },
    });

    publishTelemetryEvent(TelemetryEvent.ASSESSMENT_COMPLETED, {
      sessionId: session.sessionId,
      userId: input.userId,
      phase: 4,
      totalQuestions: session.history.length,
      confidence: session.technicalConfidence,
    });

    return {
      resultId,
      sessionId: session.sessionId,
      confidence: session.technicalConfidence,
      summary: {
        domainReadiness: session.domainScores,
        technicalStrengths: session.detectedStrengths,
        technicalWeaknesses: session.detectedWeaknesses,
        knowledgeGaps: session.knowledgeGaps,
        skillScores: session.skillScores,
      },
    };
  }

  private async runAdaptiveTurn(
    session: Phase4Session,
    userAnswer?: string,
    forceComplete = false
  ): Promise<Phase4StateMachineResponse> {
    const questionCount = session.history.length;
    const shouldForceComplete = forceComplete || questionCount >= MAX_QUESTIONS;

    const userPrompt = this.buildUserPrompt(session, userAnswer, questionCount, shouldForceComplete);

    const llmStart = Date.now();
    let llmLatencyMs = 0;
    let response: Phase4StateMachineResponse;
    try {
      const raw = await callLLM({
        systemPrompt: PHASE4_SYSTEM_PROMPT,
        userPrompt,
        temperature: 0.5,
      });
      llmLatencyMs = Date.now() - llmStart;

      response = await this.parseResponse(raw);
      this.validateResponse(response, shouldForceComplete);
    } catch (error) {
      llmLatencyMs = Date.now() - llmStart;
      console.warn('[Phase 4] LLM turn failed; using deterministic fallback:', (error as any)?.message || error);
      response = this.buildFallbackResponse(session, userAnswer, shouldForceComplete);

      publishTelemetryEvent(TelemetryEvent.AI_FALLBACK_USED, {
        sessionId: session.sessionId,
        userId: session.userId,
        phase: 4,
        reason: (error as any)?.message || String(error),
      });
    }

    if (shouldForceComplete && !response.isCompleted) {
      response = this.forceCompletion(session, response);
    }

    publishTelemetryEvent(TelemetryEvent.LLM_LATENCY_LOG, {
      sessionId: session.sessionId,
      userId: session.userId,
      phase: 4,
      questionCount,
      llmLatencyMs,
      isCompleted: response.isCompleted,
    });

    this.applyResponseToSession(session, response, userAnswer);

    return response;
  }

  private buildFallbackResponse(
    session: Phase4Session,
    userAnswer?: string,
    forceComplete = false
  ): Phase4StateMachineResponse {
    const evaluation = userAnswer && session.history.length > 0
      ? this.evaluateFallbackAnswer(session.history[session.history.length - 1].question, userAnswer)
      : null;

    const answeredCount = userAnswer ? session.history.length : Math.max(0, session.history.length - 1);
    const nextConfidence = evaluation
      ? session.technicalConfidence + (evaluation.isCorrect ? 0.08 : -0.05)
      : session.technicalConfidence;
    const technicalConfidence = Math.max(0.20, Math.min(0.95, nextConfidence));
    const isCompleted = forceComplete || (Boolean(userAnswer) && answeredCount >= MIN_QUESTIONS);

    if (isCompleted) {
      return {
        technicalConfidence,
        reasoningToast: 'Technical profile captured. Preparing your specialization recommendations.',
        isCompleted: true,
        evaluation,
        nextQuestion: null,
        finalSummary: this.buildFallbackSummary(session, evaluation),
      };
    }

    return {
      technicalConfidence,
      reasoningToast: evaluation
        ? evaluation.isCorrect
          ? 'Good answer. Increasing the challenge slightly.'
          : 'Useful signal. The next question will keep checking the foundations.'
        : 'Starting with a focused foundation question for your selected domain.',
      isCompleted: false,
      evaluation,
      nextQuestion: this.selectFallbackQuestion(session),
      finalSummary: null,
    };
  }

  private evaluateFallbackAnswer(question: Phase4Question, userAnswer: string): Phase4Evaluation {
    const expected = FALLBACK_CORRECT_ANSWERS.get(question.questionId);
    const normalizedAnswer = userAnswer.trim().toLowerCase();
    const normalizedExpected = expected?.trim().toLowerCase();
    const isCorrect = normalizedExpected ? normalizedAnswer === normalizedExpected : normalizedAnswer.length > 0;

    return {
      topic: question.topic,
      isCorrect,
      explanation: expected
        ? isCorrect
          ? `Correct. ${expected} is the best answer for ${question.topic}.`
          : `The best answer is ${expected}. Review ${question.topic} before moving deeper.`
        : 'Answer recorded using local fallback evaluation.',
      skillLevel: question.difficulty,
    };
  }

  private selectFallbackQuestion(session: Phase4Session): Phase4Question {
    const askedIds = new Set(session.history.map((item) => item.question.questionId));
    const preferredDomains = session.domains.map((domain) => this.normalizeDomain(domain));
    const domainMatch = FALLBACK_QUESTION_BANK.find((question) =>
      !askedIds.has(question.questionId) &&
      preferredDomains.some((domain) => this.normalizeDomain(question.domain).includes(domain) || domain.includes(this.normalizeDomain(question.domain)))
    );
    const next = domainMatch || FALLBACK_QUESTION_BANK.find((question) => !askedIds.has(question.questionId)) || FALLBACK_QUESTION_BANK[0];
    const { correctAnswer: _correctAnswer, ...question } = next;
    return {
      ...question,
      domain: session.domains.find((domain) => this.domainsOverlap(domain, question.domain)) || question.domain,
    };
  }

  private buildFallbackSummary(
    session: Phase4Session,
    latestEvaluation: Phase4Evaluation | null
  ): Phase4StateMachineResponse['finalSummary'] {
    const evaluatedHistory = session.history.map((item, index) => {
      if (index === session.history.length - 1 && latestEvaluation) {
        return { ...item, isCorrect: latestEvaluation.isCorrect, evaluatedTopic: latestEvaluation.topic };
      }
      return item;
    });

    const strengths = Array.from(new Set(
      evaluatedHistory.filter((item) => item.isCorrect).map((item) => item.evaluatedTopic || item.question.topic)
    ));
    const weaknesses = Array.from(new Set(
      evaluatedHistory.filter((item) => !item.isCorrect).map((item) => item.evaluatedTopic || item.question.topic)
    ));
    const domainReadiness: Record<string, number> = {};

    session.domains.forEach((domain) => {
      const domainQuestions = evaluatedHistory.filter((item) => this.domainsOverlap(domain, item.question.domain));
      const correct = domainQuestions.filter((item) => item.isCorrect).length;
      domainReadiness[domain] = domainQuestions.length > 0 ? Math.round((correct / domainQuestions.length) * 100) : 50;
    });

    const skillScores = Object.fromEntries(
      evaluatedHistory.map((item) => [
        item.evaluatedTopic || item.question.topic,
        item.isCorrect ? 75 : 40,
      ])
    );

    return {
      domainReadiness,
      technicalStrengths: strengths.length ? strengths : ['Technical fundamentals'],
      technicalWeaknesses: weaknesses,
      knowledgeGaps: weaknesses,
      skillScores,
      recommendedSpecialization: session.domains[0] || 'Software Development',
      readinessForPhase5: session.technicalConfidence >= 0.55,
    };
  }

  private domainsOverlap(left: string, right: string): boolean {
    const normalizedLeft = this.normalizeDomain(left);
    const normalizedRight = this.normalizeDomain(right);
    return normalizedLeft.includes(normalizedRight) || normalizedRight.includes(normalizedLeft);
  }

  private normalizeDomain(domain: string): string {
    const normalized = domain.toLowerCase();
    if (normalized.includes('web') || normalized.includes('frontend') || normalized.includes('front end') || normalized.includes('full stack')) return 'web development';
    if (normalized.includes('backend') || normalized.includes('back end') || normalized.includes('api')) return 'backend development';
    if (normalized.includes('ai') || normalized.includes('ml') || normalized.includes('machine learning')) return 'ai/ml';
    if (normalized.includes('data')) return 'data science';
    if (normalized.includes('security') || normalized.includes('cyber')) return 'cyber security';
    if (normalized.includes('cloud')) return 'cloud';
    if (normalized.includes('devops')) return 'devops';
    return normalized.trim();
  }

  private buildUserPrompt(
    session: Phase4Session,
    userAnswer?: string,
    questionCount?: number,
    forceComplete?: boolean
  ): string {
    const previousQuestion = session.history.length > 0 ? session.history[session.history.length - 1].question : null;

    return `
USER PROFILE:
- Education: ${session.profileContext.education || 'Not specified'}
- Experience Level: ${session.profileContext.experienceLevel || 'Beginner'}
- Career Goal: ${session.profileContext.careerGoal || 'Not specified'}
- Current Year: ${session.profileContext.currentYear || 'Not specified'}

SELECTED DOMAINS (FROM PHASE 2):
${session.domains.join(', ')}

COGNITIVE PROFILE (FROM PHASE 3):
${JSON.stringify(session.cognitiveProfile, null, 2)}

CURRENT ASSESSMENT STATE:
- Questions Asked: ${questionCount ?? session.history.length}
- Technical Confidence: ${session.technicalConfidence.toFixed(2)}
- Current Domain: ${session.currentDomain}
- Current Difficulty: ${session.currentDifficulty}
- Detected Strengths: ${session.detectedStrengths.join(', ') || 'None yet'}
- Detected Weaknesses: ${session.detectedWeaknesses.join(', ') || 'None yet'}

PREVIOUS QUESTIONS & ANSWERS:
${this.formatHistory(session.history) || '(This is the first question)'}

${previousQuestion && userAnswer
  ? `PREVIOUS QUESTION:\n${JSON.stringify(previousQuestion, null, 2)}\n\nUSER ANSWER:\n${userAnswer}`
  : 'This is the first question. Start with the first selected domain at Foundation level. Set evaluation to null.'
}

${forceComplete
  ? `HARD CAP REACHED: ${MAX_QUESTIONS} questions completed. You MUST set "isCompleted": true and provide "finalSummary" with specific "knowledgeGaps".`
  : `Continue adaptive questioning. Check if confidence >= ${TARGET_CONFIDENCE} and questions >= ${MIN_QUESTIONS} to complete early.`
}
`.trim();
  }

  private formatHistory(history: Phase4Session['history']): string {
    return history.map((item, i) =>
      `${i + 1}. [${item.question.domain} - ${item.question.difficulty}] ${item.question.topic}\n   Q: ${item.question.questionText}\n   A: ${item.userAnswer} -> ${item.isCorrect ? '✓ Correct' : '✗ Incorrect'}`
    ).join('\n\n');
  }

  private async parseResponse(raw: string): Promise<Phase4StateMachineResponse> {
    try {
      return await parseJsonAsync<Phase4StateMachineResponse>(raw);
    } catch (error) {
      publishTelemetryEvent(TelemetryEvent.LLM_PARSE_ERROR, {
        reason: error instanceof Error ? error.message : String(error),
        parser: 'worker',
        phase: 4,
      });
      return parseLLMJson<Phase4StateMachineResponse>(raw);
    }
  }

  private validateResponse(response: Phase4StateMachineResponse, forceComplete: boolean): void {
    if (typeof response.isCompleted !== 'boolean') throw new Error('Missing isCompleted');
    if (typeof response.technicalConfidence !== 'number') throw new Error('Missing technicalConfidence');
    if (forceComplete && !response.isCompleted) return;
    if (!response.isCompleted && !response.nextQuestion) throw new Error('Missing nextQuestion');
    if (response.isCompleted && !response.finalSummary) throw new Error('Missing finalSummary');
    if (response.nextQuestion) {
      const opts = response.nextQuestion.options;
      if (!Array.isArray(opts) || opts.length !== 4) throw new Error('nextQuestion.options must have exactly 4 items');
    }
  }

  private forceCompletion(session: Phase4Session, response: Phase4StateMachineResponse): Phase4StateMachineResponse {
    const strengths = Array.from(new Set(
      session.history.filter(h => h.isCorrect).map(h => h.question.topic)
    ));
    const weaknesses = Array.from(new Set(
      session.history.filter(h => !h.isCorrect).map(h => h.question.topic)
    ));
    const domainReadiness: Record<string, number> = {};
    session.domains.forEach(d => {
      const domainQuestions = session.history.filter(h => h.question.domain === d);
      const correct = domainQuestions.filter(h => h.isCorrect).length;
      domainReadiness[d] = domainQuestions.length > 0 ? Math.round((correct / domainQuestions.length) * 100) : 50;
    });

    return {
      ...response,
      isCompleted: true,
      nextQuestion: null,
      finalSummary: {
        domainReadiness,
        technicalStrengths: strengths,
        technicalWeaknesses: weaknesses,
        knowledgeGaps: weaknesses,
        skillScores: {},
        recommendedSpecialization: session.domains[0] || 'General',
        readinessForPhase5: session.technicalConfidence >= 0.70,
      },
    };
  }

  private applyResponseToSession(
    session: Phase4Session,
    response: Phase4StateMachineResponse,
    userAnswer?: string
  ): void {
    session.technicalConfidence = Math.max(0.20, Math.min(0.95, response.technicalConfidence));

    if (response.evaluation && session.history.length > 0) {
      const lastQuestion = session.history[session.history.length - 1].question;
      session.history[session.history.length - 1] = {
        question: lastQuestion,
        userAnswer: userAnswer || '',
        isCorrect: response.evaluation.isCorrect,
        evaluatedTopic: response.evaluation.topic,
      };

      if (response.evaluation.isCorrect) {
        if (!session.detectedStrengths.includes(response.evaluation.topic)) {
          session.detectedStrengths.push(response.evaluation.topic);
        }
      } else {
        if (!session.detectedWeaknesses.includes(response.evaluation.topic)) {
          session.detectedWeaknesses.push(response.evaluation.topic);
        }
        if (!session.knowledgeGaps.includes(response.evaluation.topic)) {
          session.knowledgeGaps.push(response.evaluation.topic);
        }
      }
    }

    if (response.isCompleted) {
      session.isCompleted = true;
      if (response.finalSummary) {
        session.detectedStrengths = response.finalSummary.technicalStrengths;
        session.detectedWeaknesses = response.finalSummary.technicalWeaknesses;
        session.knowledgeGaps = response.finalSummary.knowledgeGaps;
        session.domainScores = response.finalSummary.domainReadiness;
        session.skillScores = response.finalSummary.skillScores;
      }
      return;
    }

    if (response.nextQuestion) {
      session.currentDomain = response.nextQuestion.domain;
      session.currentDifficulty = response.nextQuestion.difficulty;
      session.history.push({
        question: response.nextQuestion,
        userAnswer: '',
        isCorrect: false,
        evaluatedTopic: response.nextQuestion.topic,
      });
    }
  }
}

export const phase4TechnicalAssessmentService = new Phase4TechnicalAssessmentService();
