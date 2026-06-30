// src/services/assessment.ts

import { prisma } from '@/lib/prisma';
import { careerMatchingEngine } from '@/services/career-matching';
import { enhanceAndCombineScores } from '@/ai/scoringEngine';
import { generateQuestionsWithAI } from '@/ai/questionGenerator';
import { aiMemoryService } from '@/services/aiMemory';
// All MongoClient calls replaced with Prisma ORM
// DB_NAME removed - Prisma handles database selection via connection string

export class AssessmentService {
  /**
   * Generate dynamic assessment questions based on careers in dataset
   */
  async generateDynamicQuestions() {
    try {
      console.log('[AssessmentService] generateDynamicQuestions: starting');
      
      // Get all careers with their skills and interests via Prisma
      const careers = await prisma.career.findMany({});
      const [skillMappings, interestMappings] = await Promise.all([
        prisma.careerSkillMapping.findMany({}),
        prisma.careerInterestMapping.findMany({}),
      ]);

      console.log(`[AssessmentService] generateDynamicQuestions: Found ${careers.length} careers, ${skillMappings.length} skill mappings, ${interestMappings.length} interest mappings`);

      // Extract unique skills, interests, and categories
      const uniqueSkills = [...new Set(
        skillMappings.flatMap((sm: any) => {
          const skill = sm.skill?.trim();
          return skill ? [skill] : [];
        })
      )];
      const uniqueInterests = [...new Set(
        interestMappings.flatMap((im: any) => {
          const interest = im.interest?.trim();
          return interest ? [interest] : [];
        })
      )];
      const uniqueCategories = [...new Set(
        careers.flatMap((c: any) => c.category ? [c.category] : [])
      )];

      console.log(`[AssessmentService] generateDynamicQuestions: Found ${uniqueSkills.length} unique skills, ${uniqueInterests.length} unique interests, ${uniqueCategories.length} categories`);

      // Shuffle function for variety
      const shuffle = (arr: any[]) => {
        const shuffled = [...arr];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
      };

      // Build dynamic question set across multiple categories (dataset-driven)
      const questions: any[] = [];

      const addDataSourced = (id: string, type: string, question: string, category: string, options: string[]) => {
        questions.push({ id, type, question, category, options, dataSourced: true });
      };

      // Interests
      addDataSourced('q_interest_1', 'interest', 'Which career area excites you the most?', 'interests', uniqueCategories.slice(0, 4));

      // Strengths / Skills
      addDataSourced('q_skills_1', 'strengths', 'Which of these skills describes you best?', 'strengths', uniqueSkills.slice(0, 4));

      // Personality / Work-style
      questions.push({ id: 'q_personality_1', type: 'personality', question: 'Do you prefer structured tasks or open-ended challenges?', category: 'personality', options: ['Structured', 'Open-ended', 'Depends', 'Both'], dataSourced: false });

      // Communication
      questions.push({ id: 'q_communication_1', type: 'mcq', question: 'How comfortable are you with public speaking and presentations?', category: 'communication', options: ['Very comfortable', 'Somewhat comfortable', 'Prefer not to', 'Prefer written communication'], dataSourced: false });

      // Analytical thinking
      questions.push({ id: 'q_analytical_1', type: 'mcq', question: 'When solving a problem you usually...', category: 'analytical', options: ['Break it down and analyze', 'Brainstorm creative ideas', 'Ask the team', 'Try a quick hack'], dataSourced: false });

      // Leadership
      questions.push({ id: 'q_leadership_1', type: 'mcq', question: 'Do you enjoy leading projects or prefer individual contribution?', category: 'leadership', options: ['Lead projects', 'Individual contributor', 'Occasionally lead', 'Prefer mentoring'], dataSourced: false });

      // Discipline / Physical preference
      questions.push({ id: 'q_discipline_1', type: 'mcq', question: 'How do you rate your comfort with discipline and routine?', category: 'discipline', options: ['Highly disciplined', 'Generally routine', 'Adaptive', 'Prefer flexibility'], dataSourced: false });

      // Creativity
      questions.push({ id: 'q_creativity_1', type: 'mcq', question: 'Which activity energizes you?', category: 'creativity', options: ['Designing', 'Building systems', 'Writing', 'Analyzing data'], dataSourced: false });

      // Public service / Teaching / Physical
      questions.push({ id: 'q_public_service_1', type: 'mcq', question: 'Are you motivated by public impact and serving communities?', category: 'public_service', options: ['Very motivated', 'Somewhat', 'Neutral', 'Not much'], dataSourced: false });
      questions.push({ id: 'q_teaching_1', type: 'mcq', question: 'Do you enjoy explaining concepts and mentoring others?', category: 'teaching', options: ['Love it', 'Sometimes', 'Rarely', 'Not at all'], dataSourced: false });
      questions.push({ id: 'q_physical_1', type: 'mcq', question: 'Do you prefer physically active roles over desk jobs?', category: 'physical', options: ['Prefer active', 'No preference', 'Prefer desk', 'Depends on role'], dataSourced: false });
      questions.push({
        id: 'q2_skills',
        type: 'interest',
        question: 'Which of these technical areas interest you?',
        category: 'Skill Interest',
        options: shuffle(uniqueSkills).slice(0, 4),
        dataSourced: true,
      });

      questions.push({
        id: 'q3_work_env',
        type: 'mcq',
        question: 'Which work environment do you prefer?',
        category: 'Work Style',
        options: [
          'Fast-paced and innovative',
          'Structured and organized',
          'Collaborative teams',
          'Independent work',
        ],
        dataSourced: false,
      });

      questions.push({
        id: 'q4_education',
        type: 'mcq',
        question: 'What is your highest level of education or target?',
        category: 'Education',
        options: ['High School', "Diploma/Bachelor's", "Master's Degree", 'PhD/Advanced'],
        dataSourced: false,
      });

      questions.push({
        id: 'q5_experience',
        type: 'interest',
        question: 'What best describes your current experience?',
        category: 'Experience',
        options: ['Fresher - No experience', 'Junior - 1-2 years', 'Mid-level - 3-5 years', 'Senior - 5+ years'],
        dataSourced: false,
      });

      questions.push({
        id: 'q6_problem_solving',
        type: 'scenario',
        question: 'When facing a complex problem, you tend to:',
        category: 'Problem Solving',
        options: [
          'Analyze data and patterns',
          'Brainstorm creative solutions',
          'Collaborate with team',
          'Use proven methodologies',
        ],
        dataSourced: false,
      });

      questions.push({
        id: 'q7_interests',
        type: 'interest',
        question: 'Which of these areas interest you most?',
        category: 'Domain Interest',
        options: shuffle(uniqueInterests).slice(0, 4),
        dataSourced: true,
      });

      questions.push({
        id: 'q8_learning_style',
        type: 'mcq',
        question: "What's your preferred learning approach?",
        category: 'Learning Style',
        options: ['Hands-on projects', 'Structured courses', 'Self-paced learning', 'Mentorship'],
        dataSourced: false,
      });

      questions.push({
        id: 'q9_workplace_values',
        type: 'mcq',
        question: "What's most important in a workplace?",
        category: 'Workplace Values',
        options: ['Growth opportunities', 'Team culture', 'Compensation', 'Meaningful work'],
        dataSourced: false,
      });

      questions.push({
        id: 'q10_coding_comfort',
        type: 'interest',
        question: 'How comfortable are you with coding/technical skills?',
        category: 'Skill Level',
        options: ['Expert', 'Intermediate', 'Beginner', 'Want to learn'],
        dataSourced: false,
      });
      console.log(`[AssessmentService] generateDynamicQuestions: Generated ${questions.length} questions`);
      return questions;
    } catch (error) {
      console.error('[AssessmentService] Error generating dynamic questions:', error);
      console.warn('[AssessmentService] Falling back to static questions');
      // Fallback to static questions if dynamic generation fails
      return this.getStaticFallbackQuestions();
    }
  }

  /**
   * Provide next adaptive questions based on current answers.
   * This is deterministic and driven by simple heuristics from answers.
   */
  async getNextQuestions(currentAnswers: Record<string, string>, limit = 3) {
    console.log(`[AssessmentService] getNextQuestions: Starting with ${Object.keys(currentAnswers).length} answers`);
    
    // Determine domain signals from answers
    const text = Object.values(currentAnswers).join(' ').toLowerCase();

    const domainPriorities: string[] = [];
    if (text.match(/defence|army|navy|air|military|paramilitary|soldier/)) {
      domainPriorities.push('leadership', 'discipline', 'physical');
    }
    if (text.match(/teaching|teacher|tutor|mentor|educat/)) {
      domainPriorities.push('teaching', 'communication');
    }
    if (text.match(/doctor|medical|nurse|clinic|hospital/)) {
      domainPriorities.push('discipline', 'analytical', 'physical');
    }
    if (text.match(/ai|data|engineer|developer|program|python|javascript|ml|machine learning/)) {
      domainPriorities.push('analytical', 'strengths', 'creativity');
    }
    if (text.match(/creative|design|ui|ux|artist|graphic/)) {
      domainPriorities.push('creativity', 'communication');
    }
    if (text.match(/commerce|finance|account|ca|chartered/)) {
      domainPriorities.push('analytical', 'discipline');
    }
    if (text.match(/public|government|upsc|civil service/)) {
      domainPriorities.push('public_service', 'leadership', 'communication');
    }

    // fallback priorities
    domainPriorities.push('interests', 'strengths', 'personality');
    console.log(`[AssessmentService] getNextQuestions: Domain priorities - ${domainPriorities.join(', ')}`);

    const pool = await this.generateDynamicQuestions();
    console.log(`[AssessmentService] getNextQuestions: Pool size: ${pool.length}`);

    // Select questions matching priority order
    const selected: any[] = [];
    const used = new Set<string>();

    for (const cat of domainPriorities) {
      for (const q of pool) {
        if (selected.length >= limit) break;
        if (used.has(q.id)) continue;
        const qCategory = (q.category || '').toLowerCase();
        if (qCategory === cat || q.type === cat || q.id.toLowerCase().includes(cat)) {
          selected.push(q);
          used.add(q.id);
        }
      }
      if (selected.length >= limit) break;
    }

    // If still under limit, add random remaining questions
    for (const q of pool) {
      if (selected.length >= limit) break;
      if (!used.has(q.id)) {
        selected.push(q);
        used.add(q.id);
      }
    }

    console.log(`[AssessmentService] getNextQuestions: Selected ${selected.length} questions before AI enhancement`);

    // Try to enhance phrasing with AI (non-authoritative rewrite)
    try {
      const enhanced = await generateQuestionsWithAI(selected as any);
      if (enhanced && enhanced.length >= selected.length * 0.8) {
        console.log(`[AssessmentService] getNextQuestions: Returning ${enhanced.length} AI-enhanced questions`);
        return enhanced.slice(0, limit);
      } else {
        console.warn(`[AssessmentService] getNextQuestions: AI enhancement returned insufficient questions (${enhanced?.length} vs ${selected.length})`);
      }
    } catch (e) {
      console.warn(`[AssessmentService] getNextQuestions: AI enhancement error: ${(e as any)?.message}`);
      // ignore AI failures — return deterministic questions
    }

    console.log(`[AssessmentService] getNextQuestions: Returning ${selected.slice(0, limit).length} deterministic questions`);
    return selected.slice(0, limit);
  }

  /**
   * Static fallback questions in case database is unavailable
   */
  getStaticFallbackQuestions() {
    return [
      {
        id: 'q1_interest',
        type: 'interest',
        question: 'What excites you the most?',
        category: 'Interest',
        options: ['Solving complex problems', 'Creating visual designs', 'Helping people', 'Analyzing data'],
      },
      {
        id: 'q2_env',
        type: 'mcq',
        question: 'Which environment do you thrive in?',
        category: 'Work Style',
        options: ['Structured and organized', 'Creative and flexible', 'Fast-paced and dynamic', 'Collaborative teams'],
      },
      {
        id: 'q3_scenario',
        type: 'scenario',
        question: 'Your team faces a critical deadline. What do you do?',
        category: 'Decision',
        options: [
          'Create a detailed plan and execute',
          'Brainstorm creative solutions',
          'Rally the team and delegate',
          'Analyze bottlenecks and optimize'
        ],
      },
      {
        id: 'q4_education',
        type: 'mcq',
        question: 'What is your highest level of education or target?',
        category: 'Education',
        options: ['High School', "Diploma/Bachelor's", "Master's Degree", 'PhD/Advanced'],
      },
      {
        id: 'q5_experience',
        type: 'interest',
        question: 'What best describes your current work experience?',
        category: 'Experience',
        options: ['Fresher - No experience', 'Junior - 1-2 years', 'Mid-level - 3-5 years', 'Senior - 5+ years'],
      },
    ];
  }

  async getQuestions() {
    // Try to generate dynamic questions from dataset
    console.log('[AssessmentService] getQuestions: Starting');
    const dynamicQuestions = await this.generateDynamicQuestions();
    console.log(`[AssessmentService] getQuestions: Got ${dynamicQuestions.length} dynamic questions`);

    // Enhance phrasing with GPT-driven question generator (non-blocking fallback)
    try {
      console.log('[AssessmentService] getQuestions: Attempting AI enhancement');
      const enhanced = await generateQuestionsWithAI(dynamicQuestions as any);
      if (enhanced && enhanced.length >= dynamicQuestions.length * 0.8) {
        // Only use AI-enhanced questions if we got at least 80% of the original questions
        console.log(`[AssessmentService] getQuestions: AI enhancement successful, returning ${enhanced.length} questions`);
        return enhanced;
      } else {
        console.warn(`[AssessmentService] getQuestions: AI enhancement returned insufficient questions (${enhanced?.length} vs ${dynamicQuestions.length}), using original`);
      }
    } catch (err) {
      console.warn('[AssessmentService] getQuestions: AI enhancement failed (non-blocking)', (err as any)?.message);
      // fall back to dataset-generated questions
    }

    console.log(`[AssessmentService] getQuestions: Returning ${dynamicQuestions.length} dynamic questions without AI enhancement`);
    return dynamicQuestions;
  }

  async getQuestionsByCategory(category: string) {
    const questions = await this.generateDynamicQuestions();
    return questions.filter((q: any) => q.category === category || q.category?.toLowerCase() === category.toLowerCase());
  }

  async submitAssessment(userId: string, answers: Record<string, string>) {
    console.log(`[AssessmentService] submitAssessment: Starting for user ${userId}`);
    const assessmentAnswers = this.extractAnswersForMatching(answers);

    let matches: Array<{ careerTitle: string; matchScore: number }> = [];
    try {
      const matchPromise = careerMatchingEngine.analyzeAssessment(userId, assessmentAnswers)
        .catch((error) => {
          console.error('[AssessmentService] Career matching failed (caught):', error);
          return [];
        });
      matches = await Promise.race([
        matchPromise,
        new Promise<typeof matches>((resolve) => setTimeout(() => resolve([]), 7000)),
      ]);
      if (!Array.isArray(matches)) {
        matches = [];
      }
      if (matches.length === 0) {
        console.warn('[AssessmentService] submitAssessment: Career matching did not complete within timeout or returned no results');
      } else {
        console.log(`[AssessmentService] submitAssessment: Career matching found ${matches.length} matches`);
      }
    } catch (error) {
      console.error('[AssessmentService] Career matching failed:', error);
      matches = [];
    }

    // Enhance local matches with a lightweight GPT layer for explanations and small adjustments
    const enhancementPromise = enhanceAndCombineScores(assessmentAnswers, matches as any[])
      .catch((e) => {
        console.warn('[AssessmentService] Scoring enhancement failed (non-blocking):', (e as any)?.message || e);
        return null;
      });

    const combined = await Promise.race([
      enhancementPromise,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000)),
    ]);

    const result = this.buildAssessmentSummary(answers, matches, assessmentAnswers);
    if (combined) {
      (result as any).combinedMatches = combined;
    }

    // Persist assessment result via Prisma
    let assessmentResult = null;
    try {
      const created = await prisma.assessmentResult.create({
        data: {
          userId,
          answers: JSON.stringify(answers),
          suggestedCareers: result.suggestedCareers,
          scores: JSON.stringify(result.scores),
          strengths: result.strengths,
          weaknesses: result.weaknesses,
        },
      });
      assessmentResult = created as any;
      console.log(`[AssessmentService] submitAssessment: Result persisted with ID ${created.id}`);
    } catch (err: any) {
      console.warn('[AssessmentService] Assessment persistence failed (non-blocking):', err?.message || err);
      // Non-blocking - still return result even if persistence failed
      assessmentResult = null;
    }

    // Return both persisted record (if available) and deterministic combinedMatches/summary
    // Persist AI memory profile and recommendation history (best-effort, non-blocking)
    try {
      const scoresValues = Object.values(result.scores || {}).flatMap((v: any) => {
        const n = Number(v || 0);
        return !Number.isNaN(n) ? [n] : [];
      });
      const composite = scoresValues.length ? scoresValues.reduce((a: number, b: number) => a + b, 0) / scoresValues.length : 0;
      const profileData = { summary: result, updatedAt: new Date().toISOString() };

      await aiMemoryService.saveProfile(userId, profileData, composite, 0).catch(() => null);

      // record recommended careers
      await Promise.all(
        (result.suggestedCareers || []).map(async (career: string) => {
          const raw = (result.scores && result.scores[career]) || undefined;
          const score = typeof raw === 'number' ? raw : raw ? Number(raw) : undefined;
          await aiMemoryService.recordRecommendation(userId, { career }, 'assessment', score, 'assessment').catch(() => null);
        })
      );
    } catch (e) {
      // swallow errors to avoid blocking assessment flow
      console.warn('[AssessmentService] Non-blocking AI memory persistence failed:', (e as any)?.message || e);
    }

    return {
      assessmentResult,
      combinedMatches: combined || null,
      summary: result,
    };
  }

  async saveAssessmentSession(userId: string, answers: Record<string, string>) {
    console.log(`[AssessmentService] saveAssessmentSession: Starting for user ${userId}`);
    const assessmentAnswers = this.extractAnswersForMatching(answers);

    let matches: Array<{
      careerTitle: string;
      matchScore: number;
      confidenceLevel?: string;
      skillGaps?: string[];
      reasons?: string[];
    }> = [];

    try {
      matches = await careerMatchingEngine.analyzeAssessment(userId, assessmentAnswers);
      console.log(`[AssessmentService] saveAssessmentSession: Found ${matches.length} career matches`);
    } catch (error) {
      console.error('[AssessmentService] Career matching failed during save session:', error);
    }

    const analysis = {
      ...this.buildAssessmentSummary(answers, matches, assessmentAnswers),
      extractedProfile: assessmentAnswers,
      rankedCareers: matches.slice(0, 5).map((match) => ({
        career: match.careerTitle,
        match: Math.round(match.matchScore * 100),
        confidenceLevel: match.confidenceLevel,
        skillsNeeded: match.skillGaps?.slice(0, 5) || [],
        reasons: match.reasons || [],
      })),
      totalAnswers: Object.keys(answers).length,
      generatedAt: new Date().toISOString(),
    };
    
    // Attach combinedMatches to analysis when available (non-blocking)
    try {
      const combined = await enhanceAndCombineScores(assessmentAnswers, matches as any[]).catch(() => null);
      if (combined) (analysis as any).combinedMatches = combined;
    } catch (e) {
      console.warn('[AssessmentService] Non-blocking AI enhancement failed:', (e as any)?.message || e);
    }
    
    const selectedOptions = Object.values(answers).map((value) => String(value));

    try {
      const created = await prisma.assessmentSession.create({
        data: {
          userId,
          answers: JSON.stringify(answers),
          selectedOptions,
          analysis: JSON.stringify(analysis),
          completedAt: new Date(),
        },
      });

      console.log(`[AssessmentService] saveAssessmentSession: Session persisted with ID ${created.id}`);
      return {
        id: created.id,
        completedAt: created.completedAt,
        selectedOptions,
        analysis,
      };
    } catch (err: any) {
      console.error('[AssessmentService] Failed to save session via Prisma:', err?.message || err);
      throw err;
    }
  }

  async getAssessmentHistory(userId: string) {
    const sessions = await prisma.assessmentSession.findMany({
      where: { userId },
      orderBy: { completedAt: 'desc' },
    });

    return sessions.map((session) => ({
      id: session.id,
      completedAt: session.completedAt,
      answers: this.safeJsonParse<Record<string, string>>(session.answers, {}),
      selectedOptions: session.selectedOptions,
      analysis: this.safeJsonParse(session.analysis, {}),
    }));
  }

  async getLatestAssessment(userId: string) {
    const latest = await prisma.assessmentSession.findFirst({
      where: { userId },
      orderBy: { completedAt: 'desc' },
    });

    if (!latest) {
      return null;
    }

    return {
      id: latest.id,
      completedAt: latest.completedAt,
      answers: this.safeJsonParse<Record<string, string>>(latest.answers, {}),
      selectedOptions: latest.selectedOptions,
      analysis: this.safeJsonParse(latest.analysis, {}),
    };
  }

  async getAssessmentResult(userId: string, resultId: string) {
    const result = await prisma.assessmentResult.findFirst({
      where: {
        id: resultId,
        userId,
      },
    });

    return result;
  }

  async createAssessment(payload: {
    title: string;
    description?: string | null;
    questions: { questionText: string; options: string[]; category?: string }[];
  }) {
    const { title, description, questions } = payload;

    const assessment = await prisma.assessment.create({
      data: {
        title,
        description: description ?? null,
      },
    });

    // create questions linked to assessment
    await Promise.all(
      questions.map((q) =>
        prisma.assessmentQuestion.create({
          data: {
            assessmentId: assessment.id,
            questionText: q.questionText,
            options: q.options,
            category: q.category ?? '',
          },
        })
      )
    );

    // return assessment with its questions
    const created = await prisma.assessment.findUnique({
      where: { id: assessment.id },
      include: { questions: true },
    });

    return created;
  }

  private safeJsonParse<T>(value: string, fallback: T): T {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }

  private buildAssessmentSummary(
    answers: Record<string, string>,
    matches: Array<{ careerTitle: string; matchScore: number }>,
    assessmentAnswers: {
      skills: string[];
      interests: string[];
      education: string;
      experience: string;
      personality: string[];
      workStyle: string[];
      careerGoals: string[];
    }
  ) {
    const suggestedCareers = matches.length > 0
      ? matches.slice(0, 5).map((match) => match.careerTitle)
      : ['Career exploration in progress'];

    const scores = matches.reduce<Record<string, number>>((acc, match) => {
      acc[match.careerTitle] = Math.round(match.matchScore * 100);
      return acc;
    }, {});

    const strengths = [
      ...assessmentAnswers.skills.slice(0, 2).map((skill) => this.toTitleCase(skill)),
      ...assessmentAnswers.personality.slice(0, 2).map((trait) => this.toTitleCase(trait)),
      ...assessmentAnswers.interests.slice(0, 1).map((interest) => this.toTitleCase(interest)),
    ].filter(Boolean);

    const weaknesses = this.inferGrowthAreas(answers, assessmentAnswers);

    return {
      suggestedCareers,
      scores,
      strengths: strengths.length > 0 ? strengths.slice(0, 3) : ['Foundational skills developing'],
      weaknesses,
    };
  }

  private inferGrowthAreas(
    answers: Record<string, string>,
    assessmentAnswers: {
      skills: string[];
      interests: string[];
      education: string;
      experience: string;
      personality: string[];
      workStyle: string[];
      careerGoals: string[];
    }
  ): string[] {
    const growthAreas = new Set<string>();

    if (!assessmentAnswers.skills.length) growthAreas.add('Technical skills clarity');
    if (!assessmentAnswers.interests.length) growthAreas.add('Career interest exploration');
    if (!assessmentAnswers.education) growthAreas.add('Education path planning');
    if (!assessmentAnswers.experience) growthAreas.add('Hands-on project experience');

    const answerText = Object.values(answers).join(' ').toLowerCase();
    if (answerText.includes('new - i want to learn') || answerText.includes('beginner')) {
      growthAreas.add('Core technical foundations');
    }
    if (answerText.includes('team') || answerText.includes('collabor')) {
      growthAreas.add('Leadership and stakeholder communication');
    }

    if (growthAreas.size === 0) {
      growthAreas.add('Advanced specialization depth');
    }

    return Array.from(growthAreas).slice(0, 3);
  }

  private toTitleCase(value: string): string {
    return value
      .split(/[^a-zA-Z0-9+]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  private extractAnswersForMatching(answers: Record<string, string>) {
    const skills = new Set<string>();
    const interests = new Set<string>();
    const personality = new Set<string>();
    const workStyle = new Set<string>();
    const careerGoals = new Set<string>();
    let education = '';
    let experience = '';

    const skillKeywords = [
      'python', 'javascript', 'react', 'node', 'java', 'kotlin', 'c++', 'rust',
      'machine learning', 'deep learning', 'data analysis', 'statistics', 'sql',
      'cybersecurity', 'devops', 'cloud', 'docker', 'kubernetes', 'testing',
    ];

    const interestKeywords = [
      'artificial intelligence', 'ai', 'web development', 'cybersecurity', 'data science',
      'ui/ux', 'product design', 'marketing', 'finance', 'operations', 'strategy',
      'research', 'backend', 'frontend', 'full-stack', 'devops',
    ];

    Object.values(answers).forEach((value) => {
      const lowerValue = String(value).toLowerCase();

      for (const keyword of skillKeywords) {
        if (lowerValue.includes(keyword)) skills.add(keyword);
      }

      for (const keyword of interestKeywords) {
        if (lowerValue.includes(keyword)) interests.add(keyword);
      }

      if (lowerValue.includes('high school')) education = 'high school';
      if (lowerValue.includes('diploma') || lowerValue.includes("bachelor")) education = "bachelor";
      if (lowerValue.includes('master')) education = "master";
      if (lowerValue.includes('phd')) education = 'phd';

      if (lowerValue.includes('fresher')) experience = 'fresher';
      if (lowerValue.includes('junior') || lowerValue.includes('1-2 years')) experience = 'junior';
      if (lowerValue.includes('mid-level') || lowerValue.includes('3-5 years')) experience = 'mid';
      if (lowerValue.includes('senior') || lowerValue.includes('5+ years')) experience = 'senior';

      if (lowerValue.includes('analytical') || lowerValue.includes('analyze') || lowerValue.includes('systematic')) personality.add('analytical');
      if (lowerValue.includes('creative') || lowerValue.includes('design') || lowerValue.includes('innovation')) personality.add('creative');
      if (lowerValue.includes('team') || lowerValue.includes('collaborative') || lowerValue.includes('inclusive')) personality.add('collaborative');
      if (lowerValue.includes('lead') || lowerValue.includes('coaching') || lowerValue.includes('decisive')) personality.add('leadership');
      if (lowerValue.includes('detail') || lowerValue.includes('quality')) personality.add('detail-oriented');

      if (lowerValue.includes('remote') || lowerValue.includes('hybrid') || lowerValue.includes('office')) {
        workStyle.add(lowerValue);
      }

      if (
        lowerValue.includes('career advancement') ||
        lowerValue.includes('mastery') ||
        lowerValue.includes('financial') ||
        lowerValue.includes('impact')
      ) {
        careerGoals.add(lowerValue);
      }
    });

    return {
      skills: Array.from(skills),
      interests: Array.from(interests),
      education,
      experience,
      personality: Array.from(personality),
      workStyle: Array.from(workStyle),
      careerGoals: Array.from(careerGoals),
    };
  }
}

export const assessmentService = new AssessmentService();
