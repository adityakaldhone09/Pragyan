import { careerCatalogAliases as careerIntelligenceAliases, careerCatalog as careerIntelligenceCatalog, CareerRoleProfile, calculatePlacementReadiness } from '@/data/careerCatalog';
import { routeAI } from '@/ai/aiRouter';

export interface CareerIntelligenceInput {
  category?: string;
  interest?: string;
  interests?: string[];
  skills?: string[];
  qualification?: string;
  preferredSubjects?: string[];
  subjects?: string[];
  personality?: string[];
  personalityTraits?: string[];
  goal?: string;
  careerGoals?: string[];
  age?: number;
  stream?: string;
  enhanceWithAI?: boolean;
  roadmapProgress?: number;
  projectCompletion?: number;
  quizPerformance?: number;
}

export interface CareerIntelligenceRole {
  role: string;
  confidence: number;
  reason: string;
  requiredSkills: string[];
  salaryRange: string;
  roadmapDuration: string;
  difficulty: CareerRoleProfile['difficulty'];
  relatedAlternatives: string[];
  dashboardType: string;
  roadmapTemplate: string;
  futureGrowthOpportunities: string[];
  roadmapHints: string[];
  placementReadinessScore: number;
  readinessBreakdown: {
    skillCoverage: number;
    roadmapProgress: number;
    projectCompletion: number;
    interviewReadiness: number;
    recommendedAction: string;
  };
}

export interface CareerIntelligenceResult {
  recommendedRoles: CareerIntelligenceRole[];
  placementReadinessScore: number;
  futureGrowthOpportunities: string[];
}

type CareerIntelligenceRoleEnhancement = Partial<CareerIntelligenceRole> & { role?: string };

const normalize = (value: string) => String(value || '').trim().toLowerCase();

export class CareerIntelligenceService {
  private static readonly categoryAliases: Record<string, CareerRoleProfile['category']> = {
    government: 'government',
    'government job': 'government',
    govt: 'government',
    private: 'private',
    'private job': 'private',
    'higher studies': 'higher_studies',
    'higher_studies': 'higher_studies',
  };

  generateCareerIntelligence(input: CareerIntelligenceInput): CareerIntelligenceResult {
    const category = this.resolveCategory(input.category);
    const normalizedInterests = this.collectTokens([input.interest, ...(input.interests || [])])
      .map((item) => careerIntelligenceAliases[item] ? normalize(careerIntelligenceAliases[item]) : item);
    const normalizedSkills = this.collectTokens(input.skills || []);
    const normalizedSubjects = this.collectTokens([input.qualification || '', ...(input.preferredSubjects || []), ...(input.subjects || []), input.stream || '']);
    const normalizedPersonality = this.collectTokens([...(input.personality || []), ...(input.personalityTraits || []), ...(input.careerGoals || []), input.goal || '']);
    const normalizedGoalSignals = this.collectTokens([input.goal || '']);
    const age = typeof input.age === 'number' ? input.age : undefined;

    const scored = careerIntelligenceCatalog
      .filter((role) => !category || role.category === category)
      .map((role) => this.scoreRole(role, {
        normalizedInterests,
        normalizedSkills,
        normalizedSubjects,
        normalizedPersonality,
        normalizedGoalSignals,
        age,
        roadmapProgress: input.roadmapProgress,
        projectCompletion: input.projectCompletion,
        quizPerformance: input.quizPerformance,
      }))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5)
      .map((item) => ({
        ...item,
        confidence: Math.max(0, Math.min(100, item.confidence)),
      }));

    const placementReadinessScore = scored.length
      ? Math.round(scored.reduce((sum, item) => sum + item.placementReadinessScore, 0) / scored.length)
      : 0;

    const futureGrowthOpportunities = Array.from(
      new Set(scored.flatMap((item) => item.futureGrowthOpportunities).filter(Boolean))
    ).slice(0, 10);

    return {
      recommendedRoles: scored,
      placementReadinessScore,
      futureGrowthOpportunities,
    };
  }

  async generateCareerIntelligenceResponse(input: CareerIntelligenceInput, userId?: string): Promise<CareerIntelligenceResult> {
    const base = this.generateCareerIntelligence(input);

    if (!input.enhanceWithAI) {
      return base;
    }

    const promptVersion = 'career-intelligence-v1';
    const normalizedInput = this.normalizeInputForCache(input);

    try {
      const result = await routeAI('decision_intelligence', {
        prompt: this.buildCareerIntelligencePrompt(input, base),
        input: {
          input: normalizedInput,
          base,
        },
        userId,
        promptVersion,
        format: 'json',
      });

      const parsed = JSON.parse(result.value) as { recommendedRoles?: CareerIntelligenceRoleEnhancement[]; placementReadinessScore?: number; futureGrowthOpportunities?: string[] };
      return this.mergeEnhancedResult(base, parsed);
    } catch {
      return this.enhanceCareerIntelligenceResponse(input, base);
    }
  }

  private async enhanceCareerIntelligenceResponse(
    input: CareerIntelligenceInput,
    base: CareerIntelligenceResult
  ): Promise<CareerIntelligenceResult> {
    try {
      const prompt = this.buildCareerIntelligencePrompt(input, base);
      const raw = await routeAI('decision_intelligence', {
        prompt,
        input: this.normalizeInputForCache(input),
        format: 'json',
      });
      const parsed = JSON.parse(raw.value) as { recommendedRoles?: CareerIntelligenceRoleEnhancement[]; placementReadinessScore?: number; futureGrowthOpportunities?: string[] };
      return this.mergeEnhancedResult(base, parsed);
    } catch {
      return base;
    }
  }

  buildCareerIntelligencePrompt(input: CareerIntelligenceInput, base: CareerIntelligenceResult): string {
    return [
      'You are the Career Intelligence Engine of Pragyan.',
      'Your job is to enhance role descriptions and metadata, not to choose the careers.',
      'Do not generate random roles.',
      'Do not change the order of roles or remove any role from the list.',
      'Keep confidence between 0 and 100.',
      'Return structured JSON only.',
      'Suggested fields per role: role, confidence, reason, requiredSkills, salaryRange, roadmapDuration, difficulty, relatedAlternatives, roadmapHints, placementReadinessScore, futureGrowthOpportunities, dashboardType, roadmapTemplate.',
      'Use the backend-provided roles as the source of truth.',
      'You may improve reasons, salary ranges, roadmap hints, and growth opportunities, but never invent an unrelated role.',
      'Input assessment answers:',
      JSON.stringify(input),
      'Backend-selected roles to enhance:',
      JSON.stringify(base),
    ].join('\n\n');
  }

  private normalizeInputForCache(input: CareerIntelligenceInput) {
    return {
      category: input.category || '',
      interest: input.interest || '',
      interests: [...(input.interests || [])].sort(),
      skills: [...(input.skills || [])].sort(),
      qualification: input.qualification || '',
      preferredSubjects: [...(input.preferredSubjects || [])].sort(),
      subjects: [...(input.subjects || [])].sort(),
      personality: [...(input.personality || [])].sort(),
      personalityTraits: [...(input.personalityTraits || [])].sort(),
      goal: input.goal || '',
      careerGoals: [...(input.careerGoals || [])].sort(),
      age: typeof input.age === 'number' ? input.age : null,
      stream: input.stream || '',
      roadmapProgress: typeof input.roadmapProgress === 'number' ? input.roadmapProgress : null,
      projectCompletion: typeof input.projectCompletion === 'number' ? input.projectCompletion : null,
      quizPerformance: typeof input.quizPerformance === 'number' ? input.quizPerformance : null,
      enhanceWithAI: Boolean(input.enhanceWithAI),
    };
  }

  private resolveCategory(category?: string): CareerRoleProfile['category'] | undefined {
    const normalized = normalize(category || '');
    if (!normalized) return undefined;
    return CareerIntelligenceService.categoryAliases[normalized];
  }

  private scoreRole(
    role: CareerRoleProfile,
    context: {
      normalizedInterests: string[];
      normalizedSkills: string[];
      normalizedSubjects: string[];
      normalizedPersonality: string[];
      normalizedGoalSignals: string[];
      age?: number;
      roadmapProgress?: number;
      projectCompletion?: number;
      quizPerformance?: number;
    }
  ): CareerIntelligenceRole {
    const interestHits = this.matchCount(role.keywords, context.normalizedInterests);
    const skillHits = this.matchCount(role.requiredSkills, context.normalizedSkills);
    const subjectHits = this.matchCount(role.preferredSubjects || [], context.normalizedSubjects);
    const personalityHits = this.matchCount(this.personalityKeywords(role), context.normalizedPersonality);

    const eligibilityScore = this.eligibilityScore(role, context.age, context.normalizedSubjects);
    const score = (
      interestHits * 0.35 +
      skillHits * 0.3 +
      subjectHits * 0.15 +
      personalityHits * 0.1 +
      eligibilityScore * 0.1
    );

    const goalBoost = this.goalBoost(role, context.normalizedGoalSignals);

    const confidence = Math.round((score + goalBoost) * 100);
    const readinessContext = calculatePlacementReadiness(role, {
      skillCoverage: Math.round((skillHits / Math.max(1, role.requiredSkills.length)) * 100),
      roadmapProgress: typeof context.roadmapProgress === 'number' ? context.roadmapProgress : Math.round((skillHits / Math.max(1, role.requiredSkills.length)) * 100),
      projectCompletion: typeof context.projectCompletion === 'number' ? context.projectCompletion : Math.round(Math.max(30, skillHits * 15)),
      quizPerformance: typeof context.quizPerformance === 'number' ? context.quizPerformance : Math.round(Math.max(35, (subjectHits + personalityHits) * 20)),
    });

    return {
      role: role.role,
      confidence,
      reason: this.buildReason(role, context, { interestHits, skillHits, subjectHits, personalityHits, eligibilityScore }),
      requiredSkills: role.requiredSkills,
      salaryRange: role.salaryRange,
      roadmapDuration: `${role.roadmapDays} Days`,
      difficulty: role.difficulty,
      relatedAlternatives: role.relatedAlternatives,
      dashboardType: role.dashboardType,
      roadmapTemplate: role.roadmapTemplate,
      futureGrowthOpportunities: role.futureGrowthOpportunities,
      roadmapHints: this.buildRoadmapHints(role),
      placementReadinessScore: readinessContext.readinessScore,
      readinessBreakdown: readinessContext,
    };
  }

  private goalBoost(role: CareerRoleProfile, goalSignals: string[]): number {
    if (!goalSignals.length) return 0;

    const goalText = goalSignals.join(' ');
    const softwareSignals = ['software', 'tech', 'technology', 'developer', 'engineering', 'salary'];
    const managementSignals = ['management', 'leadership', 'business'];
    const defenceSignals = ['defence', 'army', 'navy', 'air', 'military'];

    const has = (signals: string[]) => signals.some((signal) => goalText.includes(signal));

    if (role.role === 'Full Stack Developer' && has(softwareSignals)) return 0.16;
    if (role.role === 'Software Engineer' && has(softwareSignals)) return 0.12;
    if (role.role === 'Frontend Developer' && has(softwareSignals)) return 0.08;
    if (role.role === 'MBA' && has(managementSignals)) return 0.12;
    if (role.role === 'NDA' && has(defenceSignals)) return 0.18;

    return 0;
  }

  private eligibilityScore(role: CareerRoleProfile, age?: number, subjects: string[] = []): number {
    if (!role.eligibility) return 0.7;

    const qualification = role.eligibility.qualification?.length ? 0.8 : 1;
    const stream = role.eligibility.stream?.length ? (role.eligibility.stream.some((item) => subjects.some((subject) => subject.includes(normalize(item)) || normalize(item).includes(subject))) ? 1 : 0.5) : 1;
    const ageScore = typeof age === 'number'
      ? (role.eligibility.minAge && age < role.eligibility.minAge ? 0 : role.eligibility.maxAge && age > role.eligibility.maxAge ? 0 : 1)
      : 0.8;

    return Math.max(0, Math.min(1, (qualification + stream + ageScore) / 3));
  }

  private buildReason(
    role: CareerRoleProfile,
    _context: { normalizedInterests: string[]; normalizedSkills: string[]; normalizedSubjects: string[]; normalizedPersonality: string[] },
    scores: { interestHits: number; skillHits: number; subjectHits: number; personalityHits: number; eligibilityScore: number }
  ): string {
    const reasons: string[] = [];

    if (scores.interestHits > 0) {
          reasons.push(`Your interest in ${role.category.replace(/_/g, ' ')} aligns with this role.`);
    }

    if (scores.skillHits > 0) {
      reasons.push(`Your current skills overlap with ${role.requiredSkills.slice(0, 2).join(' and ')}.`);
    }

    if (scores.subjectHits > 0) {
      reasons.push(`Your preferred subjects support this path.`);
    }

    if (scores.personalityHits > 0) {
      reasons.push(`Your personality traits fit the role expectations.`);
    }

    if (scores.eligibilityScore < 0.5) {
      reasons.push('Eligibility is possible but may require additional preparation or qualification alignment.');
    }

    if (!reasons.length) {
      reasons.push(`This is a realistic career path based on the assessment profile and role metadata.`);
    }

    return reasons.slice(0, 2).join(' ');
  }

  private buildRoadmapHints(role: CareerRoleProfile): string[] {
    return [
      `Start with ${role.requiredSkills[0] || 'foundational skills'}`,
      `Aim for a ${role.roadmapTemplate} roadmap`,
      `Target ${role.difficulty.toLowerCase()} difficulty progression`,
      ...(role.recommendedProjects?.length ? [`Build ${role.recommendedProjects[0]}`] : []),
    ];
  }

  private mergeEnhancedResult(
    base: CareerIntelligenceResult,
    enhanced: { recommendedRoles?: CareerIntelligenceRoleEnhancement[]; placementReadinessScore?: number; futureGrowthOpportunities?: string[] }
  ): CareerIntelligenceResult {
    const byRole = new Map((enhanced.recommendedRoles || []).filter((item) => item.role).map((item) => [item.role as string, item]));

    const recommendedRoles = base.recommendedRoles.map((role) => {
      const enhancement = byRole.get(role.role);
      if (!enhancement) return role;

      return {
        ...role,
        ...enhancement,
        role: role.role,
        confidence: typeof enhancement.confidence === 'number' ? Math.max(0, Math.min(100, enhancement.confidence)) : role.confidence,
        placementReadinessScore: typeof enhancement.placementReadinessScore === 'number'
          ? Math.max(0, Math.min(100, enhancement.placementReadinessScore))
          : role.placementReadinessScore,
      };
    });

    const futureGrowthOpportunities = enhanced.futureGrowthOpportunities?.length
      ? Array.from(new Set(enhanced.futureGrowthOpportunities)).slice(0, 10)
      : base.futureGrowthOpportunities;

    const placementReadinessScore = typeof enhanced.placementReadinessScore === 'number'
      ? Math.max(0, Math.min(100, enhanced.placementReadinessScore))
      : base.placementReadinessScore;

    return {
      recommendedRoles,
      placementReadinessScore,
      futureGrowthOpportunities,
    };
  }

  private matchCount(haystack: string[] = [], needles: string[] = []): number {
    if (!haystack.length || !needles.length) return 0;
    const normalizedHaystack = haystack.map(normalize);
    const normalizedNeedles = needles.map(normalize);
    return normalizedNeedles.filter((needle) => normalizedHaystack.some((value) => value.includes(needle) || needle.includes(value))).length;
  }

  private collectTokens(values: Array<string | undefined>): string[] {
    return values
      .flatMap((value) => String(value || '')
        .split(/[^a-z0-9+]+/i)
        .map((token) => token.trim())
        .filter(Boolean))
      .map(normalize)
      .filter(Boolean);
  }
  
  private personalityKeywords(role: CareerRoleProfile): string[] {
    const map: Record<string, string[]> = {
      government: ['discipline', 'leadership', 'service', 'public', 'administration'],
      private: ['problem solving', 'logical thinking', 'innovation', 'analysis', 'building'],
      higher_studies: ['research', 'learning', 'analysis', 'curiosity', 'academic'],
    };

    return map[role.category] || [];
  }
}

export const careerIntelligenceService = new CareerIntelligenceService();
