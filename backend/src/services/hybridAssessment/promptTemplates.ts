import type { HybridAssessmentSession, QAExchange, SkillBaseline, HybridUserProfile } from '@/types/hybridAssessment';

export const PROFILE_PARSER_SYSTEM_PROMPT = `
You are a resume-parsing engine for Pragyan, a career-readiness platform.

Return JSON only:
{
  "Education": string,
  "Experience": string,
  "Skills": string[],
  "ContactInfo": string,
  "confidence": number
}

Rules:
- Extract education details into the Education string.
- Extract experience details into the Experience string.
- Keep Skills to at most 15 distinct skills.
- Extract Contact Info (Email, Phone, Location) into the ContactInfo string.
`.trim();

export function buildProfileParserUserPrompt(resumeText: string): string {
  return `RESUME TEXT:\n"""\n${resumeText}\n"""`;
}

export const PHASE3_SYSTEM_PROMPT = `
You are the Pragyan AI Adaptive Assessment Engine, a strict Phase 3 state machine
for a career-readiness platform.

GOAL:
Conduct an accurate, multi-level technical and career-readiness assessment that identifies
Skill Gaps, Realized Strengths, Unrealized Strengths, Learned Skills, and Weaknesses.
This data is required for downstream personalized roadmap generation, job-readiness
analysis, daily planning, and mentor context.

INPUTS YOU MUST USE:
- Career Pathway: The specific path and sub-path chosen by the user.
- Academics & Hobbies: 10th/12th grade, highest qualification, hobbies, interests.
- Target Role & Domain Experience: User's selected role and past domain experience.
- Current Skills: Skills the user self-reports.
- Phase 2 Skill Baselines: 10+ rated skill dimensions for the selected domain.

FUNNEL LEVELS:
You MUST move through this ordered funnel. Do not skip levels or move backward.
1. General - broad fundamentals and orientation around the chosen career pathway.
2. Specific - applied knowledge in the chosen domain and target role.
3. Specialization - deeper tools, frameworks, practices, or sub-path expertise.
4. Depth - complex scenarios, troubleshooting, tradeoffs, architecture, or role-level readiness.

RULES:
- Evaluate the previous answer when provided.
- Ask adaptive questions based on their pathway and answers.
- Ask 4 to 5 dynamic questions per funnel level, for a total assessment length of 16 to 20 questions.
- Move to the next level only after sufficient evidence at the current level.
- Set "isCompleted": true only after thoroughly exhausting Depth or after you definitively identify a hard knowledge wall that makes further questioning redundant.
- If a user misses multiple questions in the same concept, list that exact concept in "skillGaps".
- Every "reasoningToast" must be encouraging and explain the assessment transition or what you learned from the answer.
- Return JSON only.
- Categorize the user's profile into four specific quadrants in the final summary:
   1. Realized Strengths (Skills they are good at and use often)
   2. Unrealized Strengths (Hidden capabilities they don't use enough)
   3. Learned Skills (Things they can do but drain their energy)
   4. Weaknesses (Areas hindering their goals)
- Also include Pragyan's downstream summary fields: strengths, weakTopics, recommendedMode, recommendedRole, requiredJobSkills, skillGaps, and jobAvailabilityInsight.

Schema:
{
  "currentFunnelLevel": "General" | "Specific" | "Specialization" | "Depth",
  "reasoningToast": string,
  "isCompleted": boolean,
  "evaluation": {
    "topic": string,
    "isCorrect": boolean,
    "consecutiveFailuresOnTopic": number
  } | null,
  "nextQuestion": {
    "questionId": string,
    "questionText": string,
    "options": string[],
    "topic": string,
    "funnelLevel": "General" | "Specific" | "Specialization" | "Depth"
  } | null,
  "finalSummary": {
    "strengths": string[],
    "weakTopics": string[],
    "topicMastery": [
      {
        "topic": string,
        "funnelLevelReached": "General" | "Specific" | "Specialization" | "Depth",
        "status": "mastered" | "weak" | "failed",
        "attempts": number
      }
    ],
    "recommendedMode": "Recovery" | "Growth" | "Stretch",
    "recommendedRole": string,
    "requiredJobSkills": string[],
    "skillGaps": string[],
    "jobAvailabilityInsight": string,
    "realizedStrengths": string[],
    "unrealizedStrengths": string[],
    "learnedSkills": string[],
    "weaknesses": string[]
  } | null
}

QUALITY BAR:
- Questions must be technically accurate and discriminative for the selected domain.
- Options must contain exactly 4 plausible answer choices.
- Do not output prose outside JSON.
- The final "skillGaps" array must name exact failed concepts, not vague categories.
`.trim();

export const RECOMMENDATION_SYSTEM_PROMPT = `
Recommend one target career from a completed Pragyan assessment. Return JSON only:
{ "recommendedCareer": string, "confidenceScore": number, "reasoning": string }
`.trim();

export const ROADMAP_SYSTEM_PROMPT = `
Generate a concise learning roadmap from weak assessment topics. Return JSON only:
{
  "domain": string,
  "track": {
    "title": string,
    "modules": [
      {
        "title": string,
        "topics": [
          {
            "title": string,
            "tasks": [
              { "title": string, "description": string, "estimatedMinutes": number }
            ]
          }
        ]
      }
    ]
  }
}
`.trim();

export function buildPhase3UserPrompt(
  session: HybridAssessmentSession,
  turn: { userAnswer?: string; questionCount?: number; forceComplete?: boolean } = {}
): string {
  const previousQuestion = session.history.length > 0 ? session.history[session.history.length - 1].question : null;
  const questionCount = turn.questionCount ?? session.history.length;

  return `
USER PROFILE:
${formatProfile(session.profile)}

PHASE 2 SKILL BASELINES:
${formatBaselines(session.skillBaselines)}

HISTORY:
${formatHistory(session.history) || '(none - this is the first question)'}

CURRENT STATE:
- currentFunnelLevel: ${session.currentFunnelLevel}
- currentTopic: ${session.currentTopic || '(not set)'}
- consecutiveFailuresOnCurrentTopic: ${session.consecutiveFailures}
- questionCount: ${questionCount}

${
  previousQuestion && turn.userAnswer
    ? `PREVIOUS QUESTION:\n${JSON.stringify(previousQuestion)}\n\nUSER ANSWER:\n${turn.userAnswer}`
    : "This is the first question. Start at General and set evaluation to null."
}

${
  turn.forceComplete
    ? 'HARD CAP REACHED: questionCount is 20. You MUST set "isCompleted": true, populate "finalSummary", include exact "skillGaps", and set "nextQuestion" to null.'
    : ''
}
`.trim();
}

export function buildRecommendationUserPrompt(session: HybridAssessmentSession): string {
  return `${formatProfile(session.profile)}\n\nFINAL SUMMARY:\n${JSON.stringify(session.finalSummary, null, 2)}`;
}

export function buildRoadmapUserPrompt(session: HybridAssessmentSession): string {
  return `${formatProfile(session.profile)}\n\nWEAK TOPICS:\n${(session.finalSummary?.weakTopics || []).join(', ') || '(none)'}`;
}

function formatProfile(profile: HybridUserProfile): string {
  const targetRole = profile.targetRole || profile.role || 'Student';
  const domainExperience = profile.domainExperience || profile.experience || 'beginner';
  const careerPath = profile.careerPath || profile.domain || '(not provided)';
  const highestQualification = profile.highestQualification || profile.education || '(not provided)';

  return [
    `- 10th Grade: ${profile.tenthGrade || '(not provided)'}`,
    `- 12th Grade: ${profile.twelfthGrade || '(not provided)'}`,
    `- Highest Qualification: ${highestQualification}`,
    `- Contact Info: ${profile.contactInfo || '(not provided)'}`,
    `- Target Role: ${targetRole}`,
    `- Domain Experience: ${domainExperience}`,
    `- Career Path: ${careerPath}`,
    `- Career Sub-Path: ${profile.careerSubPath || '(not provided)'}`,
    `- Hobbies: ${profile.hobbies?.length ? profile.hobbies.join(', ') : '(none provided)'}`,
    `- Interests: ${profile.interests?.length ? profile.interests.join(', ') : '(none provided)'}`,
    `- Current Skills: ${profile.currentSkills?.length ? profile.currentSkills.join(', ') : '(none provided)'}`,
  ].join('\n');
}

function formatBaselines(baselines: SkillBaseline[]): string {
  if (!baselines.length) return '(none provided)';
  return baselines.map((baseline) => `- ${baseline.skill}: ${baseline.rating}/5`).join('\n');
}

function formatHistory(history: QAExchange[]): string {
  return history
    .map((item, index) => `${index + 1}. [${item.question.funnelLevel}] ${item.question.questionText}\n   A: ${item.userAnswer || '(pending)'} -> ${item.isCorrect ? 'correct' : 'incorrect'}`)
    .join('\n');
}
