import { prisma } from '@/lib/prisma';
import { careerMatchingEngine, type AssessmentAnswers } from '@/services/career-matching';
import safeParseAIResponse from '@/ai/safeParser';
import { ExplainSchema, RoadmapSectionResponseSchema } from '@/ai/schemas';
import { routeAI } from '@/ai/aiRouter';

export interface RecommendationRequestProfile {
  skills?: string[];
  interests?: string[];
  personality?: string[];
  education?: string;
  experience?: string;
  workStyle?: string[];
  learningPreferences?: string[];
}

export interface RankedCareer {
  careerId: string;
  career: string;
  match: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  salaryEstimate?: string;
  category?: string;
  reasons: string[];
  requiredSkills: string[];
  missingSkills: string[];
}

export interface RecommendedSkill {
  skill: string;
  confidence: number;
  reason: string;
}

export interface RecommendedRoadmap {
  id: string;
  title: string;
  category: string;
  level: string;
  matchScore: number;
  reason: string;
  tags: string[];
}

export interface RoadmapDomainSection {
  id: string;
  title: string;
  summary: string;
  priority: number;
  focusPoints: string[];
  category?: string;
  roadmaps: RecommendedRoadmap[];
}

export interface RecommendationResponse {
  topCareer: RankedCareer | null;
  careerMatches: RankedCareer[];
  skillRecommendations: RecommendedSkill[];
  roadmapRecommendations: RecommendedRoadmap[];
}

export class RecommendationEngineService {
  // Simple in-memory cache for career explanations to reduce LLM calls
  private explanationCache: Map<string, { explanation: string; parsed?: any; updatedAt: number }> = new Map();
  private explanationTTL = 1000 * 60 * 60 * 24; // 24 hours
  async generateRecommendations(
    userId: string,
    profile?: RecommendationRequestProfile
  ): Promise<RecommendationResponse> {
    const effectiveProfile = profile && this.hasSignal(profile)
      ? this.normalizeProfile(profile)
      : await this.loadProfileFromLatestAssessment(userId);

    let matches: any[] = [];
    try {
      matches = await careerMatchingEngine.analyzeAssessment(userId, effectiveProfile);
    } catch (error) {
      console.error('Error in analyzeAssessment:', error);
    }

    const storedMatches = await careerMatchingEngine.getUserCareerMatches(userId);
    const rankedMatches = this.mapCareerMatches(storedMatches, matches);

    const skillRecommendations = this.buildSkillRecommendations(rankedMatches, effectiveProfile.skills || []);
    const roadmapRecommendations = await this.buildRoadmapRecommendations(rankedMatches, skillRecommendations);

    return {
      topCareer: rankedMatches[0] || null,
      careerMatches: rankedMatches,
      skillRecommendations,
      roadmapRecommendations,
    };
  }

  async getTopCareer(userId: string): Promise<RankedCareer | null> {
    const recommendation = await this.generateRecommendations(userId);
    return recommendation.topCareer;
  }

  async getRecommendedSkills(userId: string): Promise<RecommendedSkill[]> {
    const recommendation = await this.generateRecommendations(userId);
    return recommendation.skillRecommendations;
  }

  async getRecommendedRoadmaps(userId: string): Promise<RecommendedRoadmap[]> {
    const recommendation = await this.generateRecommendations(userId);
    return recommendation.roadmapRecommendations;
  }

  async getRoadmapDomainSections(userId: string): Promise<RoadmapDomainSection[]> {
    const profile = await this.loadProfileFromLatestAssessment(userId);
    const roadmapCatalog = await prisma.roadmap.findMany({
      take: 60,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        category: true,
        description: true,
        level: true,
        tags: true,
        estimatedHours: true,
      },
    });

    if (!roadmapCatalog.length) {
      return [];
    }

    const serializedRoadmaps = roadmapCatalog.map((roadmap) => ({
      id: roadmap.id,
      title: roadmap.title,
      category: roadmap.category,
      description: roadmap.description,
      level: roadmap.level,
      estimatedHours: roadmap.estimatedHours,
      tags: roadmap.tags || [],
    }));

    const prompt = [
      'You are Pragyan AI roadmap organizer.',
      'Group the stored roadmaps into 4 to 6 domain sections for a career-learning dashboard.',
      'Use only the roadmap IDs from the catalog.',
      'Return JSON with the structure: { sections: [{ id, title, summary, priority, focusPoints, roadmapIds }] }',
      `User skills: ${(profile.skills || []).join(', ') || 'None'}`,
      `User interests: ${(profile.interests || []).join(', ') || 'None'}`,
      `User personality: ${(profile.personality || []).join(', ') || 'None'}`,
      `Roadmap catalog: ${JSON.stringify(serializedRoadmaps)}`,
    ].join('\n\n');

    try {
      const result = await routeAI('summary', {
        prompt,
        input: {
          skills: profile.skills || [],
          interests: profile.interests || [],
          personality: profile.personality || [],
          roadmaps: serializedRoadmaps,
        },
        format: 'json',
      });
      const parsed = safeParseAIResponse(JSON.parse(result.value), RoadmapSectionResponseSchema);

      return this.mapRoadmapSections(parsed.sections, roadmapCatalog);
    } catch (error) {
      console.warn('AI roadmap section generation failed; using deterministic fallback:', error);
      return this.buildRoadmapSectionFallback(roadmapCatalog);
    }
  }

  async getLegacyCareerList(userId: string): Promise<Array<{ career: string; score: number; reason: string }>> {
    const recommendation = await this.generateRecommendations(userId);
    return recommendation.careerMatches.map((item) => ({
      career: item.career,
      score: item.match,
      reason: item.reasons[0] || `Recommended based on your skill and interest alignment for ${item.career}.`,
    }));
  }

  async getLegacyJobs(userId: string): Promise<Array<{
    id: string;
    title: string;
    company: string;
    location: string;
    matchScore: number;
  }>> {
    const recommendation = await this.generateRecommendations(userId);
    return recommendation.careerMatches.slice(0, 6).map((item, index) => ({
      id: `${item.careerId}-${index}`,
      title: item.career,
      company: item.category || 'Career Opportunity',
      location: item.salaryEstimate || 'Salary estimate available in details',
      matchScore: item.match,
    }));
  }

  async explainCareer(userId: string, careerId: string): Promise<{ explanation: string } | null> {
    // Load career and user profile
    const career = await prisma.career.findUnique({ where: { id: careerId }, include: { skillMappings: true } });
    if (!career) return null;

    // Check Redis cache first (fall back to in-memory cache)
    const cacheKey = `explain:${careerId}:${userId}`;
    try {
      const redis = (await import('@/lib/redis')).redisClient;
      const cachedRaw = await redis.get(cacheKey);
      if (cachedRaw) {
        try {
          const parsed = JSON.parse(cachedRaw);
          return { explanation: parsed.summary || parsed.explanation || '', parsed } as any;
        } catch (e) {
          // continue to regenerate
        }
      }
      // also check in-memory fallback cache
      const memCached = this.explanationCache.get(`${userId}:${careerId}`);
      if (memCached && Date.now() - memCached.updatedAt < this.explanationTTL) {
        if (memCached.parsed) return { explanation: memCached.explanation, parsed: memCached.parsed } as any;
      }
    } catch (err) {
      // ignore cache errors and continue
      console.warn('Redis cache check failed, continuing with fallback', err);
    }

    const profile = await this.loadProfileFromLatestAssessment(userId);

    // Build prompt
    const promptParts: string[] = [];
    promptParts.push(`Career: ${career.title}`);
    if (career.description) promptParts.push(`Description: ${career.description}`);
    if (career.category) promptParts.push(`Category: ${career.category}`);
    promptParts.push(`User profile summary:`);
    promptParts.push(`Skills: ${(profile.skills || []).join(', ') || 'None'}`);
    promptParts.push(`Interests: ${(profile.interests || []).join(', ') || 'None'}`);
    promptParts.push(`Personality: ${(profile.personality || []).join(', ') || 'None'}`);
    promptParts.push(`Education: ${profile.education || 'Not specified'}`);
    promptParts.push(`Experience: ${profile.experience || 'Not specified'}`);

    promptParts.push(`
  As an AI career coach, provide a JSON object with the following keys:
   - summary: a concise explanation (3-5 sentences) why this career could be a fit for the user.
   - skillGaps: an array of the top 5 skill gaps (short strings).
   - roadmap: an array of 6 objects for each week: { week: 1..6, items: ["item1","item2"] }.
   - nextActions: an array of 3 suggested next actions (short strings).
   - targetLevel: one of "junior", "mid", or "senior".

  Return ONLY valid JSON. If you must include text, embed it in the JSON fields. Ensure the JSON is parseable.`);

    const prompt = promptParts.join('\n');

    try {
      // Deduplicate using Redis lock: if another process is generating the same explanation, wait for cache
      const redis = (await import('@/lib/redis')).redisClient;
      const lockKey = `${cacheKey}:lock`;
      const gotLock = await redis.acquireLock(lockKey, 20_000);

      if (!gotLock) {
        // wait for cache to appear (another worker will generate)
        const waited = await redis.waitForKey(cacheKey, 20_000);
        if (waited) {
          try { const parsed = JSON.parse(waited); return { explanation: parsed.summary || parsed.explanation || '', parsed } as any; } catch (e) { /* continue */ }
        }
      }

      const result = await routeAI('skill_gap_analysis', {
        prompt,
        input: {
          career: career.title,
          profile,
        },
        format: 'json',
      });
      const structured = safeParseAIResponse(JSON.parse(result.value), ExplainSchema);

      const explanation = typeof structured?.summary === 'string'
        ? structured.summary
        : 'AI-generated career guidance is available in structured format.';

      try {
        // cache to Redis
        await redis.set(cacheKey, JSON.stringify(structured), 60 * 60 * 24); // 24h
        // also set in-memory cache
        try { this.explanationCache.set(`${userId}:${careerId}`, { explanation, parsed: structured, updatedAt: Date.now() }); } catch {}
      } catch (err) {
        console.warn('Failed to write explanation cache to Redis', err);
      } finally {
        // release lock if we acquired it
        try { await redis.releaseLock(lockKey); } catch (e) { /* ignore */ }
      }

      return { explanation, parsed: structured } as any;
    } catch (err) {
      console.error('AI explainCareer error:', err);
      // track fallback via telemetry
      try { (await import('@/lib/aiTelemetry')).recordFallback(); } catch {}
      const fallback = `The ${career.title} role typically requires specialized skills. Based on your profile, focus on core technical skills and projects to demonstrate capability.`;

      // Attempt to build heuristic structured object when AI call fails
      try {
        const profileSkills = new Set((profile.skills || []).map((s) => String(s).toLowerCase()));
        const mappedSkills: string[] = (career.skillMappings || []).map((m: any) => String(m.skill));
        const skillGaps = mappedSkills.filter((s) => !profileSkills.has(String(s).toLowerCase())).slice(0, 5);

        const roadmap: Array<{ week: number; items: string[] }> = [];
        for (let i = 1; i <= 6; i++) {
          const items: string[] = [];
          if (skillGaps[i - 1]) items.push(`Learn ${skillGaps[i - 1]}`);
          if (i <= 2) items.push('Foundational exercises and tutorials');
          if (i === 3) items.push('Build a small project to apply skills');
          if (i >= 4) items.push('Advanced practice and portfolio work');
          roadmap.push({ week: i, items });
        }

        const nextActions = [
          `Enroll in a short course on ${skillGaps[0] || 'core skills'}`,
          'Build a small project and document it in your portfolio',
          'Practice interview-style questions and system design basics',
        ];

        let targetLevel = 'junior';
        try {
          const years = parseInt(String(profile.experience || '').match(/\d+/g)?.[0] || '0', 10);
          if (!isNaN(years) && years >= 5) targetLevel = 'senior';
          else if (!isNaN(years) && years >= 2) targetLevel = 'mid';
        } catch (e) {
          targetLevel = 'junior';
        }

        const structured = {
          summary: fallback,
          skillGaps: skillGaps.length ? skillGaps : ['Fundamentals of the field'],
          roadmap,
          nextActions,
          targetLevel,
        };

        try {
          const cacheKey = `${userId}:${careerId}`;
          this.explanationCache.set(cacheKey, { explanation: fallback, parsed: structured, updatedAt: Date.now() });
        } catch (e) {
          // ignore
        }

        return { explanation: fallback, parsed: structured } as any;
      } catch (e) {
        return { explanation: fallback };
      }
    }
  }

  private hasSignal(profile: RecommendationRequestProfile): boolean {
    return Boolean(
      (profile.skills && profile.skills.length) ||
      (profile.interests && profile.interests.length) ||
      (profile.personality && profile.personality.length) ||
      profile.education ||
      profile.experience
    );
  }

  private normalizeTokenList(items?: string[]): string[] {
    return (items || []).flatMap((item) => {
      const normalized = item.toLowerCase().trim();
      return normalized ? [normalized] : [];
    });
  }

  private normalizeProfile(profile: RecommendationRequestProfile): AssessmentAnswers {
    return {
      skills: this.normalizeTokenList(profile.skills),
      interests: this.normalizeTokenList(profile.interests),
      personality: this.normalizeTokenList(profile.personality),
      education: (profile.education || '').toLowerCase().trim(),
      experience: (profile.experience || '').toLowerCase().trim(),
      workStyle: this.normalizeTokenList(profile.workStyle),
      careerGoals: this.normalizeTokenList(profile.learningPreferences),
    };
  }

  private async loadProfileFromLatestAssessment(userId: string): Promise<AssessmentAnswers> {
    const latest = await prisma.assessmentSession.findFirst({
      where: { userId },
      orderBy: { completedAt: 'desc' },
    });

    if (!latest) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      return {
        skills: user?.skills || [],
        interests: user?.interests || [],
        personality: user?.preferences || [],
        education: user?.education || '',
        experience: user?.experience || user?.experienceType || '',
      };
    }

    const parsed = this.safeJsonParse<Record<string, any>>(latest.analysis, {});
    const extracted = parsed?.extractedProfile || {};

    return {
      skills: Array.isArray(extracted.skills) ? extracted.skills : [],
      interests: Array.isArray(extracted.interests) ? extracted.interests : [],
      personality: Array.isArray(extracted.personality) ? extracted.personality : [],
      education: typeof extracted.education === 'string' ? extracted.education : '',
      experience: typeof extracted.experience === 'string' ? extracted.experience : '',
      workStyle: Array.isArray(extracted.workStyle) ? extracted.workStyle : [],
      careerGoals: Array.isArray(extracted.careerGoals) ? extracted.careerGoals : [],
    };
  }

  private mapCareerMatches(storedMatches: any[], freshMatches: any[]): RankedCareer[] {
    const source = storedMatches.length > 0
      ? storedMatches
      : freshMatches.map((item) => ({
          careerId: item.careerId,
          matchScore: item.matchScore,
          confidenceLevel: item.confidenceLevel,
          career: {
            id: item.careerId,
            title: item.careerTitle,
            averageSalary: null,
            category: null,
          },
          reasons: item.reasons,
          requiredSkills: item.requiredSkills,
          skillGaps: item.skillGaps,
        }));

    return source
      .map((item: any) => ({
        careerId: String(item.careerId || item?.career?.id || ''),
        career: String(item?.career?.title || item.careerTitle || 'Career Match'),
        match: Math.round(Number(item.matchScore || 0) * 100),
        confidenceLevel: (item.confidenceLevel || 'medium') as 'high' | 'medium' | 'low',
        salaryEstimate: item?.career?.averageSalary || undefined,
        category: item?.career?.category || undefined,
        reasons: Array.isArray(item.reasons) ? item.reasons : [],
        requiredSkills: Array.isArray(item.requiredSkills) ? item.requiredSkills : [],
        missingSkills: Array.isArray(item.skillGaps) ? item.skillGaps : [],
      }))
      .sort((a, b) => b.match - a.match)
      .slice(0, 5);
  }

  private buildSkillRecommendations(
    careerMatches: RankedCareer[],
    userSkills: string[]
  ): RecommendedSkill[] {
    const normalizedUserSkills = new Set(userSkills.map((item) => item.toLowerCase().trim()));
    const skillScores = new Map<string, { score: number; reasons: string[] }>();

    careerMatches.forEach((match) => {
      match.missingSkills.forEach((skill) => {
        const normalized = skill.toLowerCase().trim();
        if (!normalized || normalizedUserSkills.has(normalized)) return;

        const current = skillScores.get(normalized) || { score: 0, reasons: [] };
        current.score += Math.max(10, Math.round(match.match * 0.4));
        current.reasons.push(`Important for ${match.career} (${match.match}% match).`);
        skillScores.set(normalized, current);
      });
    });

    return Array.from(skillScores.entries())
      .sort((a, b) => b[1].score - a[1].score)
      .slice(0, 10)
      .map(([skill, meta], index) => ({
        skill: this.toTitle(skill),
        confidence: Math.max(55, Math.min(98, meta.score - index * 2)),
        reason: meta.reasons[0] || 'Recommended to improve your top career matches.',
      }));
  }

  private async buildRoadmapRecommendations(
    careerMatches: RankedCareer[],
    skillRecommendations: RecommendedSkill[]
  ): Promise<RecommendedRoadmap[]> {
    if (!careerMatches.length) {
      return [];
    }

    const keywords = new Set<string>();

    careerMatches.slice(0, 3).forEach((match) => {
      match.career
        .toLowerCase()
        .split(/[^a-z0-9+]+/)
        .filter((token) => token.length > 2)
        .forEach((token) => keywords.add(token));
      match.missingSkills.slice(0, 4).forEach((skill) => keywords.add(skill.toLowerCase()));
    });

    skillRecommendations.slice(0, 6).forEach((skill) => {
      keywords.add(skill.skill.toLowerCase());
    });

    const roadmapPool = await prisma.roadmap.findMany({
      take: 200,
      orderBy: { updatedAt: 'desc' },
    });

    const scored = roadmapPool
      .flatMap((roadmap) => {
        const haystack = [
          roadmap.title,
          roadmap.category,
          roadmap.description,
          ...(roadmap.tags || []),
        ]
          .join(' ')
          .toLowerCase();

        let score = 0;
        for (const keyword of keywords) {
          if (!keyword) continue;
          if (haystack.includes(keyword)) score += 10;
        }

        return score > 0 ? [{ roadmap, score }] : [];
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((item) => ({
        id: item.roadmap.id,
        title: item.roadmap.title,
        category: item.roadmap.category,
        level: item.roadmap.level,
        matchScore: Math.max(50, Math.min(98, item.score)),
        reason: `Aligned with your top career goals and skill-gap priorities.`,
        tags: item.roadmap.tags || [],
      }));

    return scored;
  }

  private mapRoadmapSections(
    sections: Array<{
      id: string;
      title: string;
      summary: string;
      priority: number;
      focusPoints: string[];
      roadmapIds: string[];
    }>,
    roadmapCatalog: Array<{
      id: string;
      title: string;
      category: string;
      description: string;
      level: string;
      tags: string[];
      estimatedHours?: number;
    }>
  ): RoadmapDomainSection[] {
    const catalogMap = new Map(roadmapCatalog.map((roadmap) => [roadmap.id, roadmap] as const));

    const mappedSections = sections.reduce<RoadmapDomainSection[]>((accumulator, section) => {
      const roadmaps = section.roadmapIds
        .map((roadmapId) => catalogMap.get(roadmapId))
        .filter((roadmap): roadmap is (typeof roadmapCatalog)[number] => Boolean(roadmap))
        .map((roadmap) => ({
          id: roadmap.id,
          title: roadmap.title,
          category: roadmap.category,
          level: roadmap.level,
          matchScore: Math.max(50, Math.min(98, 100 - section.priority * 4)),
          reason: section.summary,
          tags: roadmap.tags || [],
          description: roadmap.description,
          estimatedHours: roadmap.estimatedHours,
        }));

      if (!roadmaps.length) {
        return accumulator;
      }

      accumulator.push({
        id: section.id,
        title: section.title,
        summary: section.summary,
        priority: section.priority,
        focusPoints: section.focusPoints,
        category: roadmaps[0].category,
        roadmaps,
      });

      return accumulator;
    }, []);

    return mappedSections.sort((a, b) => a.priority - b.priority);
  }

  private buildRoadmapSectionFallback(
    roadmapCatalog: Array<{
      id: string;
      title: string;
      category: string;
      description: string;
      level: string;
      tags: string[];
      estimatedHours?: number;
    }>
  ): RoadmapDomainSection[] {
    const grouped = new Map<string, typeof roadmapCatalog>();

    roadmapCatalog.forEach((roadmap) => {
      const key = roadmap.category || 'General';
      const existing = grouped.get(key) || [];
      existing.push(roadmap);
      grouped.set(key, existing);
    });

    return Array.from(grouped.entries())
      .slice(0, 6)
      .flatMap(([category, roadmaps], index) => {
        const mappedRoadmaps = roadmaps.slice(0, 4).map((roadmap) => ({
          id: roadmap.id,
          title: roadmap.title,
          category: roadmap.category,
          level: roadmap.level,
          matchScore: 75,
          reason: `Grouped under the ${category} domain based on stored roadmap data.`,
          tags: roadmap.tags || [],
          description: roadmap.description,
          estimatedHours: roadmap.estimatedHours,
        }));

        return mappedRoadmaps.length > 0 ? [{
          id: `${category.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'general'}-${index}`,
          title: category,
          summary: `Practical roadmap picks for the ${category} domain, organized from the current database catalog.`,
          priority: index + 1,
          focusPoints: ['Core fundamentals', 'Hands-on projects', 'Interview readiness'],
          category,
          roadmaps: mappedRoadmaps,
        }] : [];
      });
  }

  private safeJsonParse<T>(value: string, fallback: T): T {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }

  private toTitle(value: string): string {
    return value
      .split(/[^a-zA-Z0-9+]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
}

export const recommendationEngineService = new RecommendationEngineService();
