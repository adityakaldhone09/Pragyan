import { prisma } from '@/lib/prisma';
import redisClient from '@/lib/redis';
import { callLLM, parseLLMJson } from './hybridAssessment/llmClient';
import { parseJsonAsync } from '@/utils/jsonWorker';
import { publishTelemetryEvent, TelemetryEvent } from '@/lib/aiTelemetry';
import { recommendationEngineService } from './recommendation-engine';
import { csvCareerDatasetService } from './csv-career-dataset';

const SESSION_TTL_SECONDS = 60 * 60 * 3; // 3 hours
const MIN_QUESTIONS = 4;
const MAX_QUESTIONS = 8;
const TARGET_CONFIDENCE = 0.85;


// â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface Phase5PredictedRole {
  roleTitle: string;
  matchScore: number;
  requiredSkills: string[];
  matchedSkills: string[];
  missingSkills: string[];
  domain: string;
}

export interface Phase5Question {
  questionId: string;
  questionText: string;
  questionType: 'MCQ' | 'Scenario' | 'Project-Based' | 'Experience' | 'Technical-Deep-Dive';
  options: string[];
  targetRole: string;
  topic: string;
  difficulty: 'Entry' | 'Mid' | 'Senior' | 'Expert';
  context?: string;
}

export interface Phase5Evaluation {
  topic: string;
  isCorrect: boolean;
  explanation: string;
  roleRelevance: string;
  competencyLevel: string;
}

export interface Phase5Session {
  sessionId: string;
  userId: string;
  predictedRoles: Phase5PredictedRole[];
  primaryRole: string;
  secondaryRoles: string[];
  history: Array<{
    question: Phase5Question;
    userAnswer: string;
    isCorrect: boolean;
    evaluatedTopic: string;
    roleAlignment: number;
  }>;
  roleReadiness: Record<string, number>;
  specializationConfidence: number;
  industryReadiness: number;
  detectedStrengths: string[];
  detectedWeaknesses: string[];
  missingCompetencies: string[];
  projectValidation: boolean;
  currentDifficulty: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Phase5StateMachineResponse {
  specializationConfidence: number;
  reasoningToast: string;
  isCompleted: boolean;
  evaluation: Phase5Evaluation | null;
  nextQuestion: Phase5Question | null;
  finalSummary: {
    recommendedRole: string;
    roleReadiness: number;
    alternativeRoles: Array<{ role: string; readiness: number }>;
    specializationStrengths: string[];
    specializationWeaknesses: string[];
    missingCompetencies: string[];
    industryReadiness: number;
    recommendedActions: string[];
    readinessForPhase6: boolean;
  } | null;
}

// â”€â”€ Phase 5 System Prompt â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const PHASE5_SYSTEM_PROMPT = `
You are the Pragyan AI Phase 5 Specialization Detection Engine.

OBJECTIVE:
Identify the user's optimal career specialization and evaluate readiness for that specific role.

This is NOT a general technical assessment. You must:
1. Use predicted career roles to ask ROLE-SPECIFIC questions
2. Evaluate SPECIALIZATION readiness, not just technical knowledge
3. Validate PRACTICAL experience and PROJECT understanding
4. Assess INDUSTRY readiness and professional maturity
5. Determine if the user is ready for the predicted role

INPUTS YOU RECEIVE:
- User Profile: Education, experience, career goal
- Phase 2: Selected domains and interests
- Phase 3: Cognitive profile (analytical, logic, communication)
- Phase 4: Technical competency scores and domain readiness
- Predicted Career Roles: Top 3-5 roles with match scores
- Career Skills Database: Required skills for each role
- Previous Assessment History

PREDICTED ROLES FORMAT:
Each role includes:
- roleTitle: Specific job title (e.g., "Machine Learning Engineer", "SOC Analyst")
- matchScore: Confidence (0-100)
- requiredSkills: Skills needed for the role
- matchedSkills: Skills user already has
- missingSkills: Gaps to address

QUESTION GENERATION RULES:
1. PRIMARY ROLE FOCUS: Ask 60% of questions about the top predicted role
2. SECONDARY ROLES: Ask 40% about alternative roles for comparison
3. ROLE-SPECIFIC ONLY: Every question must be directly relevant to a predicted role
4. PROJECT-BASED VALIDATION: If user has projects, ask about architecture, decisions, challenges
5. EXPERIENCE VALIDATION: Ask scenario-based questions requiring practical knowledge
6. NO GENERIC QUESTIONS: Don't ask "What is Python?" - ask "How would you deploy a Python ML model in production?"

QUESTION TYPES:
1. MCQ - Role-specific technical questions with realistic options
2. Scenario - "You're a [Role] facing [Problem]. How do you solve it?"
3. Project-Based - "In your [Project], why did you choose [Technology]?"
4. Experience - "Have you worked with [Tool/Process] used by [Role]?"
5. Technical-Deep-Dive - Architecture, scalability, trade-offs specific to the role

ADAPTIVE DIFFICULTY:
Adjust based on:
- Phase 4 technical confidence
- User's experience level (fresher/1-3yr/3-5yr/5+yr)
- Previous answer quality
- Education level

Entry: Conceptual understanding, basic tools
Mid: Applied knowledge, common patterns, debugging
Senior: Architecture decisions, trade-offs, optimization
Expert: System design, mentoring, strategic thinking

ROLE-SPECIFIC EXAMPLES:

If Primary Role = "Machine Learning Engineer":
- Ask about: Model training, feature engineering, MLOps, deployment, monitoring
- Scenario: "Your model shows high variance. Walk through your debugging process."
- Project: "Why did you choose [algorithm] over alternatives?"
- Experience: "Have you worked with Kubernetes for model serving?"

If Primary Role = "SOC Analyst":
- Ask about: SIEM tools, log analysis, incident response, threat hunting
- Scenario: "You detect unusual outbound traffic at 2 AM. What's your response?"
- Project: "Describe your incident response playbook."
- Experience: "Have you worked with Splunk, ELK, or similar SIEM?"

If Primary Role = "Backend Developer":
- Ask about: APIs, databases, caching, scaling, security
- Scenario: "Your API is timing out under load. How do you investigate and fix?"
- Project: "Why did you choose [database] for your project?"
- Experience: "Have you implemented rate limiting or circuit breakers?"

CONFIDENCE SCORING:
Start: 0.40
Correct answer: +0.12
Incorrect answer: -0.08
Excellent explanation: +0.05 bonus
No experience with critical tool: -0.10
Cap: 0.20 to 0.95

COMPLETION CRITERIA:
Stop when:
- Confidence >= ${TARGET_CONFIDENCE} AND questions >= ${MIN_QUESTIONS}
- OR questions >= ${MAX_QUESTIONS}
- OR user clearly unqualified for all predicted roles (confidence < 0.30 after 6 questions)

RESPONSE FORMAT (JSON):
{
  "specializationConfidence": number (0.0-1.0),
  "reasoningToast": string (encouraging feedback about progress),
  "isCompleted": boolean,
  "evaluation": {
    "topic": string (e.g., "MLOps Deployment"),
    "isCorrect": boolean,
    "explanation": string (why answer is correct/incorrect),
    "roleRelevance": string (how this relates to the target role),
    "competencyLevel": string (e.g., "Mid-level understanding")
  } | null,
  "nextQuestion": {
    "questionId": string (unique, e.g., "ml_eng_deploy_001"),
    "questionText": string (clear, role-specific question),
    "questionType": "MCQ" | "Scenario" | "Project-Based" | "Experience" | "Technical-Deep-Dive",
    "options": string[] (4 realistic options for MCQ, or Yes/No/Partial for experience),
    "targetRole": string (which predicted role this question targets),
    "topic": string (specific area like "Model Deployment", "Threat Detection"),
    "difficulty": "Entry" | "Mid" | "Senior" | "Expert",
    "context": string | null (optional background for scenario questions)
  } | null,
  "finalSummary": {
    "recommendedRole": string (best-fit role based on assessment),
    "roleReadiness": number (0-100, how ready for that role),
    "alternativeRoles": [{ "role": string, "readiness": number }],
    "specializationStrengths": string[] (specific competencies validated),
    "specializationWeaknesses": string[] (areas needing improvement),
    "missingCompetencies": string[] (critical gaps for the role),
    "industryReadiness": number (0-100, professional maturity),
    "recommendedActions": string[] (next steps to improve readiness),
    "readinessForPhase6": boolean (ready for confidence validation)
  } | null
}

QUALITY REQUIREMENTS:
- Questions must be SPECIFIC to predicted roles, never generic
- Options must be realistic (not obviously wrong)
- Explanations must be educational and role-relevant
- Never repeat questions
- Missing competencies must be ACTIONABLE (e.g., "Learn Kubernetes basics", not "Improve DevOps")
- Reasoning toast should encourage and guide ("Great! Your understanding of MLOps is solid. Let's validate your deployment experience.")
`.trim();

// â”€â”€ Service Class â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export class Phase5SpecializationDetectionService {
  private getSessionKey(sessionId: string) {
    return `phase5:session:${sessionId}`;
  }

  private async saveSession(session: Phase5Session) {
    await redisClient.set(this.getSessionKey(session.sessionId), JSON.stringify(session), SESSION_TTL_SECONDS);
  }

  private async loadSession(sessionId: string): Promise<Phase5Session | null> {
    const raw = await redisClient.get(this.getSessionKey(sessionId));
    return raw ? JSON.parse(raw) : null;
  }

  async startAssessment(input: {
    userId: string;
    profileContext: Record<string, any>;
    phase2Domains: string[];
    phase3CognitiveProfile: Record<string, any>;
    phase4TechnicalProfile: Record<string, any>;
  }) {
    const sessionId = `p5_${input.userId}_${Date.now()}`;
    const now = new Date().toISOString();

    // â”€â”€ Step 1: Predict Career Roles using existing recommendation engine â”€â”€â”€â”€â”€â”€â”€
    const predictedRoles = await this.predictCareerRoles(input.userId, {
      domains: input.phase2Domains,
      technicalProfile: input.phase4TechnicalProfile,
      cognitiveProfile: input.phase3CognitiveProfile,
      profileContext: input.profileContext,
    });

    if (predictedRoles.length === 0) {
      throw new Error('Unable to predict career roles. Please complete previous phases.');
    }

    const primaryRole = predictedRoles[0].roleTitle;
    const secondaryRoles = predictedRoles.slice(1, 3).map(r => r.roleTitle);

    const session: Phase5Session = {
      sessionId,
      userId: input.userId,
      predictedRoles,
      primaryRole,
      secondaryRoles,
      history: [],
      roleReadiness: {},
      specializationConfidence: 0.40,
      industryReadiness: 50,
      detectedStrengths: [],
      detectedWeaknesses: [],
      missingCompetencies: [],
      projectValidation: false,
      currentDifficulty: 'Entry',
      isCompleted: false,
      createdAt: now,
      updatedAt: now,
    };

    // Get first question from LLM
    const response = await this.runAdaptiveTurn(session, input.profileContext, input.phase2Domains, input.phase3CognitiveProfile, input.phase4TechnicalProfile);
    await this.saveSession(session);

    publishTelemetryEvent(TelemetryEvent.ASSESSMENT_STARTED, {
      sessionId,
      userId: input.userId,
      phase: 5,
      predictedRoles: predictedRoles.map(r => r.roleTitle),
    });

    return {
      sessionId: session.sessionId,
      predictedRoles: session.predictedRoles,
      primaryRole: session.primaryRole,
      question: response.nextQuestion!,
      confidence: session.specializationConfidence,
      progress: { answered: 0, totalRelevant: MIN_QUESTIONS },
    };
  }

  async answerQuestion(input: { sessionId: string; questionId: string; answer: string }) {
    const session = await this.loadSession(input.sessionId);
    if (!session) throw new Error('Session not found or expired');
    if (session.isCompleted) throw new Error('Assessment already completed');

    // Load context for LLM
    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    const phase2 = await prisma.assessmentSession.findFirst({
      where: { userId: session.userId, phase: 2 },
      orderBy: { completedAt: 'desc' },
    });
    const phase3 = await prisma.assessmentSession.findFirst({
      where: { userId: session.userId, phase: 3 },
      orderBy: { completedAt: 'desc' },
    });
    const phase4 = await prisma.assessmentSession.findFirst({
      where: { userId: session.userId, phase: 4 },
      orderBy: { completedAt: 'desc' },
    });

    const profileContext = user ? {
      education: user.education,
      experienceLevel: user.experienceType,
      careerGoal: user.careerGoal,
    } : {};

    const phase2Domains = phase2 ? (JSON.parse(phase2.analysis).preferredDomains || []) : [];
    const phase3Cognitive = phase3 ? (JSON.parse(phase3.analysis).traits || {}) : {};
    const phase4Technical = phase4 ? (JSON.parse(phase4.analysis) || {}) : {};

    const response = await this.runAdaptiveTurn(session, profileContext, phase2Domains, phase3Cognitive, phase4Technical, input.answer);

    session.updatedAt = new Date().toISOString();
    await this.saveSession(session);

    const shouldSubmit = session.isCompleted ||
      (session.history.length >= MIN_QUESTIONS && session.specializationConfidence >= TARGET_CONFIDENCE);

    return {
      confidence: session.specializationConfidence,
      progress: { answered: session.history.length, totalRelevant: MIN_QUESTIONS },
      nextQuestion: response.nextQuestion,
      shouldSubmit,
      reasoningToast: response.reasoningToast,
      evaluation: response.evaluation,
    };
  }

  async submitAssessment(input: { sessionId: string; userId: string }) {
    const session = await this.loadSession(input.sessionId);
    if (!session) throw new Error('Session not found');

    if (!session.isCompleted) {
      const user = await prisma.user.findUnique({ where: { id: session.userId } });
      const forceCompleteResponse = await this.runAdaptiveTurn(session, { education: user?.education }, [], {}, {}, undefined, true);
      session.isCompleted = true;
      if (forceCompleteResponse.finalSummary) {
        session.detectedStrengths = forceCompleteResponse.finalSummary.specializationStrengths;
        session.detectedWeaknesses = forceCompleteResponse.finalSummary.specializationWeaknesses;
        session.missingCompetencies = forceCompleteResponse.finalSummary.missingCompetencies;
        session.industryReadiness = forceCompleteResponse.finalSummary.industryReadiness;
      }
      await this.saveSession(session);
    }

    // Persist to database
    await prisma.assessmentSession.create({
      data: {
        userId: input.userId,
        phase: 5,
        answers: JSON.stringify(session.history.map(h => ({ question: h.question.questionText, answer: h.userAnswer }))),
        selectedOptions: session.history.map(h => h.userAnswer),
        analysis: JSON.stringify({
          sessionId: session.sessionId,
          predictedRoles: session.predictedRoles,
          primaryRole: session.primaryRole,
          roleReadiness: session.roleReadiness,
          specializationConfidence: session.specializationConfidence,
          industryReadiness: session.industryReadiness,
          detectedStrengths: session.detectedStrengths,
          detectedWeaknesses: session.detectedWeaknesses,
          missingCompetencies: session.missingCompetencies,
          totalQuestions: session.history.length,
        }),
        completedAt: new Date(),
      },
    });

    publishTelemetryEvent(TelemetryEvent.ASSESSMENT_COMPLETED, {
      sessionId: session.sessionId,
      userId: input.userId,
      phase: 5,
      totalQuestions: session.history.length,
      confidence: session.specializationConfidence,
    });

    return {
      sessionId: session.sessionId,
      confidence: session.specializationConfidence,
      summary: {
        recommendedRole: session.primaryRole,
        roleReadiness: Math.round(session.specializationConfidence * 100),
        alternativeRoles: session.secondaryRoles.map(role => ({
          role,
          readiness: Math.round((session.roleReadiness[role] || 0.5) * 100),
        })),
        specializationStrengths: session.detectedStrengths,
        specializationWeaknesses: session.detectedWeaknesses,
        missingCompetencies: session.missingCompetencies,
        industryReadiness: session.industryReadiness,
      },
    };
  }

  private async predictCareerRoles(
    userId: string,
    context: {
      domains: string[];
      technicalProfile: Record<string, any>;
      cognitiveProfile: Record<string, any>;
      profileContext: Record<string, any>;
    }
  ): Promise<Phase5PredictedRole[]> {
    // Use existing recommendation engine
    const recommendations = await recommendationEngineService.generateRecommendations(userId, {
      skills: context.technicalProfile.technicalStrengths || [],
      interests: context.domains,
      education: context.profileContext.education,
      experience: context.profileContext.experienceLevel,
    });

    const topCareers = recommendations.careerMatches.slice(0, 5);

    return topCareers.map(career => {
      const careerTitle = career.career;
      const careerSkills = csvCareerDatasetService.getCareerSkills(careerTitle);
      const userSkills = context.technicalProfile.technicalStrengths || [];
      const matchedSkills = userSkills.filter((s: string) =>
        careerSkills.some(cs => cs.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(cs.toLowerCase()))
      );
      const missingSkills = careerSkills.filter(cs =>
        !userSkills.some((us: string) => us.toLowerCase().includes(cs.toLowerCase()) || cs.toLowerCase().includes(us.toLowerCase()))
      ).slice(0, 5);

      return {
        roleTitle: careerTitle,
        matchScore: Math.round(career.match),
        requiredSkills: careerSkills.slice(0, 10),
        matchedSkills,
        missingSkills,
        domain: context.domains[0] || 'General',
      };
    });
  }

  private async runAdaptiveTurn(
    session: Phase5Session,
    profileContext: Record<string, any>,
    phase2Domains: string[],
    phase3Cognitive: Record<string, any>,
    phase4Technical: Record<string, any>,
    userAnswer?: string,
    forceComplete = false
  ): Promise<Phase5StateMachineResponse> {
    const questionCount = session.history.length;
    const shouldForceComplete = forceComplete || questionCount >= MAX_QUESTIONS;

    const userPrompt = this.buildUserPrompt(session, profileContext, phase2Domains, phase3Cognitive, phase4Technical, userAnswer, shouldForceComplete);

    const llmStart = Date.now();
    const raw = await callLLM({
      systemPrompt: PHASE5_SYSTEM_PROMPT,
      userPrompt,
      temperature: 0.5,
    });
    const llmLatencyMs = Date.now() - llmStart;

    let response = await this.parseResponse(raw);
    this.validateResponse(response, shouldForceComplete);

    if (shouldForceComplete && !response.isCompleted) {
      response = this.forceCompletion(session, response);
    }

    publishTelemetryEvent(TelemetryEvent.LLM_LATENCY_LOG, {
      sessionId: session.sessionId,
      userId: session.userId,
      phase: 5,
      questionCount,
      llmLatencyMs,
      isCompleted: response.isCompleted,
    });

    this.applyResponseToSession(session, response, userAnswer);

    return response;
  }

  private buildUserPrompt(
    session: Phase5Session,
    profileContext: Record<string, any>,
    phase2Domains: string[],
    phase3Cognitive: Record<string, any>,
    phase4Technical: Record<string, any>,
    userAnswer?: string,
    forceComplete?: boolean
  ): string {
    const previousQuestion = session.history.length > 0 ? session.history[session.history.length - 1].question : null;

    return `
USER PROFILE:
- Education: ${profileContext.education || 'Not specified'}
- Experience Level: ${profileContext.experienceLevel || 'Fresher'}
- Career Goal: ${profileContext.careerGoal || 'Not specified'}

PHASE 2 - SELECTED DOMAINS:
${phase2Domains.join(', ') || 'General'}

PHASE 3 - COGNITIVE PROFILE:
${JSON.stringify(phase3Cognitive, null, 2)}

PHASE 4 - TECHNICAL PROFILE:
${JSON.stringify(phase4Technical, null, 2)}

PREDICTED CAREER ROLES (Top 5):
${session.predictedRoles.map((r, i) => `
${i + 1}. ${r.roleTitle} (Match: ${r.matchScore}%)
   Required Skills: ${r.requiredSkills.slice(0, 5).join(', ')}
   User Has: ${r.matchedSkills.join(', ') || 'None identified'}
   Missing: ${r.missingSkills.slice(0, 3).join(', ') || 'None'}
`).join('\n')}

PRIMARY ROLE TO ASSESS: ${session.primaryRole}
SECONDARY ROLES: ${session.secondaryRoles.join(', ')}

CURRENT ASSESSMENT STATE:
- Questions Asked: ${session.history.length}
- Specialization Confidence: ${session.specializationConfidence.toFixed(2)}
- Current Difficulty: ${session.currentDifficulty}
- Detected Strengths: ${session.detectedStrengths.join(', ') || 'None yet'}
- Detected Weaknesses: ${session.detectedWeaknesses.join(', ') || 'None yet'}

PREVIOUS QUESTIONS & ANSWERS:
${this.formatHistory(session.history) || '(This is the first question)'}

${previousQuestion && userAnswer
  ? `PREVIOUS QUESTION:\n${JSON.stringify(previousQuestion, null, 2)}\n\nUSER ANSWER:\n${userAnswer}`
  : 'This is the first question. Start with an Entry-level question about the PRIMARY ROLE. Set evaluation to null.'
}

${forceComplete
  ? `HARD CAP REACHED: ${MAX_QUESTIONS} questions completed. You MUST set "isCompleted": true and provide "finalSummary".`
  : `Continue role-specific questioning. Check if confidence >= ${TARGET_CONFIDENCE} and questions >= ${MIN_QUESTIONS} to complete early.`
}
`.trim();
  }

  private formatHistory(history: Phase5Session['history']): string {
    return history.map((item, i) =>
      `${i + 1}. [${item.question.targetRole} - ${item.question.difficulty}] ${item.question.topic}\n   Q: ${item.question.questionText}\n   A: ${item.userAnswer} -> ${item.isCorrect ? 'âœ“ Correct' : 'âœ— Incorrect'} (Alignment: ${Math.round(item.roleAlignment * 100)}%)`
    ).join('\n\n');
  }

  private async parseResponse(raw: string): Promise<Phase5StateMachineResponse> {
    try {
      return await parseJsonAsync<Phase5StateMachineResponse>(raw);
    } catch (error) {
      publishTelemetryEvent(TelemetryEvent.LLM_PARSE_ERROR, {
        reason: error instanceof Error ? error.message : String(error),
        parser: 'worker',
        phase: 5,
      });
      return parseLLMJson<Phase5StateMachineResponse>(raw);
    }
  }

  private validateResponse(response: Phase5StateMachineResponse, forceComplete: boolean): void {
    if (typeof response.isCompleted !== 'boolean') throw new Error('Missing isCompleted');
    if (typeof response.specializationConfidence !== 'number') throw new Error('Missing specializationConfidence');
    if (forceComplete && !response.isCompleted) return;
    if (!response.isCompleted && !response.nextQuestion) throw new Error('Missing nextQuestion');
    if (response.isCompleted && !response.finalSummary) throw new Error('Missing finalSummary');
    if (response.nextQuestion) {
      const opts = response.nextQuestion.options;
      if (!Array.isArray(opts) || opts.length < 2) throw new Error('nextQuestion.options must have at least 2 items');
    }
  }

  private forceCompletion(session: Phase5Session, response: Phase5StateMachineResponse): Phase5StateMachineResponse {
    return {
      ...response,
      isCompleted: true,
      nextQuestion: null,
      finalSummary: {
        recommendedRole: session.primaryRole,
        roleReadiness: Math.round(session.specializationConfidence * 100),
        alternativeRoles: session.secondaryRoles.map(role => ({
          role,
          readiness: Math.round((session.roleReadiness[role] || 0.5) * 100),
        })),
        specializationStrengths: session.detectedStrengths,
        specializationWeaknesses: session.detectedWeaknesses,
        missingCompetencies: session.missingCompetencies.length > 0 ? session.missingCompetencies : ['Continue building projects', 'Gain more hands-on experience'],
        industryReadiness: session.industryReadiness,
        recommendedActions: ['Complete Phase 6 for confidence validation', 'Build projects in recommended role area'],
        readinessForPhase6: session.specializationConfidence >= 0.65,
      },
    };
  }

  private applyResponseToSession(
    session: Phase5Session,
    response: Phase5StateMachineResponse,
    userAnswer?: string
  ): void {
    session.specializationConfidence = Math.max(0.20, Math.min(0.95, response.specializationConfidence));

    if (response.evaluation && session.history.length > 0) {
      const lastQuestion = session.history[session.history.length - 1].question;
      const roleAlignment = response.evaluation.isCorrect ? 0.8 : 0.4;
      
      session.history[session.history.length - 1] = {
        question: lastQuestion,
        userAnswer: userAnswer || '',
        isCorrect: response.evaluation.isCorrect,
        evaluatedTopic: response.evaluation.topic,
        roleAlignment,
      };

      session.roleReadiness[lastQuestion.targetRole] = (session.roleReadiness[lastQuestion.targetRole] || 0.5) + (response.evaluation.isCorrect ? 0.1 : -0.05);

      if (response.evaluation.isCorrect) {
        if (!session.detectedStrengths.includes(response.evaluation.topic)) {
          session.detectedStrengths.push(response.evaluation.topic);
        }
      } else {
        if (!session.detectedWeaknesses.includes(response.evaluation.topic)) {
          session.detectedWeaknesses.push(response.evaluation.topic);
        }
        if (!session.missingCompetencies.includes(response.evaluation.topic)) {
          session.missingCompetencies.push(response.evaluation.topic);
        }
      }
    }

    if (response.isCompleted) {
      session.isCompleted = true;
      if (response.finalSummary) {
        session.detectedStrengths = response.finalSummary.specializationStrengths;
        session.detectedWeaknesses = response.finalSummary.specializationWeaknesses;
        session.missingCompetencies = response.finalSummary.missingCompetencies;
        session.industryReadiness = response.finalSummary.industryReadiness;
      }
      return;
    }

    if (response.nextQuestion) {
      session.currentDifficulty = response.nextQuestion.difficulty;
      session.history.push({
        question: response.nextQuestion,
        userAnswer: '',
        isCorrect: false,
        evaluatedTopic: response.nextQuestion.topic,
        roleAlignment: 0,
      });
    }
  }
}

export const phase5SpecializationDetectionService = new Phase5SpecializationDetectionService();
