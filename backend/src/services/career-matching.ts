import { MongoClient } from 'mongodb';
import { prisma } from '@/lib/prisma';
import { getMongoUrl } from '@/config/mongo';

export interface AssessmentAnswers {
  skills?: string[];
  interests?: string[];
  education?: string;
  experience?: string;
  personality?: string[];
  workStyle?: string[];
  careerGoals?: string[];
}

export interface CareerMatchResult {
  careerId: string;
  careerTitle: string;
  matchScore: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  requiredSkills: string[];
  recommendedSkills: string[];
  skillGaps: string[];
  personalityMatch: number;
  educationMatch: number;
  experienceMatch: number;
  // Domain-specific scores
  disciplineScore?: number;
  communicationScore?: number;
  leadershipScore?: number;
  creativityScore?: number;
  analyticalScore?: number;
  reasons: string[];
}

class CareerMatchingEngine {
  private mongoUrl: string;

  constructor() {
    this.mongoUrl = getMongoUrl();
  }

  /**
   * Analyze user assessment answers and generate career recommendations
   */
  async analyzeAssessment(userId: string, answers: AssessmentAnswers): Promise<CareerMatchResult[]> {
    const client = new MongoClient(this.mongoUrl);

    try {
      await client.connect();
      const db = client.db('Pragyan');

      // Get all careers from database
      const careers = await db.collection('Career').find({}).toArray();

      if (careers.length === 0) {
        console.warn('No careers found in database. Please run import script.');
        return [];
      }

      const matchResults = await Promise.all(
        careers.map((career) => this.scoreCareerMatch(career, answers, db, userId))
      );

      const matches: CareerMatchResult[] = [];

      for (const match of matchResults) {
        if (match.matchScore > 0.3) {
          matches.push(match);
        } else if (match.matchScore > 0) {
          // Include low-scoring matches if we have no good matches yet
          if (matches.length === 0) {
            matches.push(match);
          }
        }
      }

      // Sort by match score descending
      matches.sort((a, b) => b.matchScore - a.matchScore);

      // Save top 5 matches to database
      await this.saveCareerMatches(userId, matches.slice(0, 5));

      return matches.slice(0, 5);
    } finally {
      await client.close();
    }
  }

  /**
   * Score how well a career matches user profile
   */
  private async scoreCareerMatch(
    career: any,
    answers: AssessmentAnswers,
    db: any,
    _userId: string
  ): Promise<CareerMatchResult> {
    const userSkills = (answers.skills || []).map(s => s.toLowerCase());
    const userInterests = (answers.interests || []).map(i => i.toLowerCase());
    const userPersonalityTokens = [
      ...(answers.personality || []),
      ...(answers.workStyle || []),
      ...(answers.careerGoals || []),
    ]
      .flatMap((item) => item.toLowerCase().split(/[^a-z0-9+]+/).flatMap((token) => token ? [token] : []));

    // Get career skills and interests
    const skillMappings = await db
      .collection('CareerSkillMapping')
      .find({ careerId: career._id })
      .toArray();

    const interestMappings = await db
      .collection('CareerInterestMapping')
      .find({ careerId: career._id })
      .toArray();

    const careerSkills = skillMappings.map((sm: any) => sm.skill.toLowerCase());
    const careerInterests = interestMappings.map((im: any) => im.interest.toLowerCase());

    // Calculate skill match
    const skillMatches = userSkills.filter(skill =>
      careerSkills.some((cs: string) => cs.includes(skill) || skill.includes(cs))
    );
    const skillScore = careerSkills.length > 0 ? skillMatches.length / careerSkills.length : 0;

    // Calculate interest match
    const interestMatches = userInterests.filter(interest =>
      careerInterests.some((ci: string) => ci.includes(interest) || interest.includes(ci))
    );
    const interestScore = careerInterests.length > 0 ? interestMatches.length / careerInterests.length : 0;

    // Calculate education match
    const educationMatch = this.calculateEducationMatch(answers.education || '');

    // Calculate experience match for display context (not part of final score formula)
    const experienceMatch = this.calculateExperienceMatch(answers.experience || '', career.yearsExperience || 0);

    // Calculate personality/work-style alignment
    const personalityMatch = this.calculatePersonalityMatch(
      userPersonalityTokens,
      career,
      careerSkills,
      careerInterests
    );

    // Domain-specific heuristics
    const disciplineScore = this.calculateDisciplineScore(this.textFromCareer(career));
    const communicationScore = this.calculateCommunicationScore(this.textFromCareer(career));
    const leadershipScore = this.calculateLeadershipScore(this.textFromCareer(career));
    const creativityScore = this.calculateCreativityScore(this.textFromCareer(career));
    const analyticalScore = this.calculateAnalyticalScore(this.textFromCareer(career));

    // Weighted scoring (rule-based + dataset matching)
    const weights = {
      skills: 0.4,
      interests: 0.3,
      personality: 0.2,
      education: 0.1,
    };

    const matchScore =
      skillScore * weights.skills +
      interestScore * weights.interests +
      personalityMatch * weights.personality +
      educationMatch * weights.education;

    const confidenceLevel = this.getConfidenceLevel(matchScore);

    // Identify skill gaps
    const skillGaps = careerSkills.filter(
      (cs: string) => !userSkills.some(us => cs.includes(us) || us.includes(cs))
    );

    // Generate reasons
    const reasons = this.generateReasons(
      skillScore,
      interestScore,
      personalityMatch,
      skillMatches,
      interestMatches,
      career.title
    );

    return {
      careerId: career._id.toString(),
      careerTitle: career.title,
      matchScore: Math.round(matchScore * 100) / 100,
      confidenceLevel,
      requiredSkills: careerSkills,
      recommendedSkills: skillMatches,
      skillGaps: skillGaps.slice(0, 5),
      personalityMatch,
      educationMatch,
      experienceMatch,
      disciplineScore: Math.round((disciplineScore || 0) * 100) / 100,
      communicationScore: Math.round((communicationScore || 0) * 100) / 100,
      leadershipScore: Math.round((leadershipScore || 0) * 100) / 100,
      creativityScore: Math.round((creativityScore || 0) * 100) / 100,
      analyticalScore: Math.round((analyticalScore || 0) * 100) / 100,
      reasons,
    };
  }

  // Helper calculation functions for domain-specific scores
  private calculateDisciplineScore(careerText: string): number {
    const keywords = ['discipline', 'routine', 'rigor', 'organized', 'structured', 'procedure', 'protocol'];
    return this.fractionMatch(keywords, careerText);
  }

  private calculateCommunicationScore(careerText: string): number {
    const keywords = ['communication', 'present', 'report', 'stakeholder', 'liaison', 'persuasive', 'writing', 'speaking'];
    return this.fractionMatch(keywords, careerText);
  }

  private calculateLeadershipScore(careerText: string): number {
    const keywords = ['lead', 'manage', 'ownership', 'team', 'supervise', 'strategy', 'director'];
    return this.fractionMatch(keywords, careerText);
  }

  private calculateCreativityScore(careerText: string): number {
    const keywords = ['design', 'creative', 'innovation', 'ux', 'art', 'visual', 'product design', 'ideation'];
    return this.fractionMatch(keywords, careerText);
  }

  private calculateAnalyticalScore(careerText: string): number {
    const keywords = ['analysis', 'data', 'model', 'statistics', 'research', 'analytics', 'evaluate'];
    return this.fractionMatch(keywords, careerText);
  }
  // Utilities as private class methods
  private textFromCareer(career: any) {
    return [career.title || '', career.description || '', career.category || '']
      .join(' ')
      .toLowerCase();
  }

  private fractionMatch(keywords: string[], text: string): number {
    if (!text || !keywords || keywords.length === 0) return 0;
    const matched = keywords.filter((k) => text.includes(k)).length;
    return Math.min(1, matched / Math.max(1, Math.ceil(keywords.length / 3)));
  }
  /**
   * Calculate personality/work-style match (0-1)
   */
  private calculatePersonalityMatch(
    userPersonalityTokens: string[],
    career: any,
    careerSkills: string[],
    careerInterests: string[]
  ): number {
    if (userPersonalityTokens.length === 0) {
      return 0.5;
    }

    const careerText = [
      String(career.title || ''),
      String(career.description || ''),
      String(career.category || ''),
      ...careerSkills,
      ...careerInterests,
    ]
      .join(' ')
      .toLowerCase();

    const personalityKeywordMap: Record<string, string[]> = {
      analytical: ['analysis', 'data', 'research', 'model', 'statistics'],
      creative: ['design', 'creative', 'ux', 'product', 'brand'],
      collaborative: ['team', 'communication', 'stakeholder', 'product'],
      leadership: ['lead', 'management', 'strategy', 'ownership'],
      detail: ['quality', 'testing', 'security', 'accuracy'],
      practical: ['implementation', 'deployment', 'backend', 'engineering'],
    };

    const normalizedTraits = new Set<string>();
    for (const token of userPersonalityTokens) {
      if (token.includes('analyt')) normalizedTraits.add('analytical');
      else if (token.includes('creativ') || token.includes('design')) normalizedTraits.add('creative');
      else if (token.includes('collab') || token.includes('team') || token.includes('communicat')) normalizedTraits.add('collaborative');
      else if (token.includes('lead') || token.includes('direct') || token.includes('coach')) normalizedTraits.add('leadership');
      else if (token.includes('detail') || token.includes('quality') || token.includes('systematic')) normalizedTraits.add('detail');
      else if (token.includes('practic') || token.includes('hands') || token.includes('build')) normalizedTraits.add('practical');
    }

    if (normalizedTraits.size === 0) {
      return 0.5;
    }

    let matchedTraits = 0;
    for (const trait of normalizedTraits) {
      const keywords = personalityKeywordMap[trait] || [];
      if (keywords.some((kw) => careerText.includes(kw))) {
        matchedTraits += 1;
      }
    }

    return matchedTraits / normalizedTraits.size;
  }

  /**
   * Calculate education level match (0-1)
   */
  private calculateEducationMatch(userEducation: string): number {
    const education = userEducation.toLowerCase();

    if (education.includes('master') || education.includes('phd')) return 1.0;
    if (education.includes('bachelor')) return 0.9;
    if (education.includes('diploma') || education.includes('associate')) return 0.7;
    if (education.includes('high school') || education.includes('12th')) return 0.5;

    return 0.6;
  }

  /**
   * Calculate experience level match (0-1)
   */
  private calculateExperienceMatch(userExperience: string, requiredYears: number): number {
    const experience = userExperience.toLowerCase();

    if (experience.includes('fresher') || experience === 'fresher' || experience === '0') return 0.6;
    if (experience.includes('junior') || experience.includes('1-2') || experience === '1' || experience === '2') {
      return Math.min(1.0, 0.7 + 0.1 * Math.max(0, 2 - requiredYears));
    }
    if (experience.includes('mid') || experience.includes('senior') || experience.includes('3-5')) return 0.9;
    if (experience.includes('5+') || experience.includes('experienced')) return 1.0;

    return 0.7;
  }

  /**
   * Determine confidence level based on match score
   */
  private getConfidenceLevel(score: number): 'high' | 'medium' | 'low' {
    if (score >= 0.8) return 'high';
    if (score >= 0.6) return 'medium';
    return 'low';
  }

  /**
   * Generate human-readable reasons for the match
   */
  private generateReasons(
    skillScore: number,
    interestScore: number,
    personalityScore: number,
    skillMatches: string[],
    _interestMatches: string[],
    careerTitle: string
  ): string[] {
    const reasons: string[] = [];

    if (skillScore > 0.7) {
      reasons.push(`Your skills in ${skillMatches.slice(0, 2).join(', ')} align well with ${careerTitle} requirements`);
    }

    if (interestScore > 0.6) {
      reasons.push(`Your interests match the ${careerTitle} field`);
    }

    if (personalityScore > 0.6) {
      reasons.push(`Your work style and personality align with typical ${careerTitle} responsibilities`);
    }

    if (skillScore > 0.5) {
      reasons.push(`You have strong foundational skills for this role`);
    }

    if (reasons.length === 0) {
      reasons.push(`${careerTitle} could be a potential path for your career development`);
    }

    return reasons;
  }

  /**
   * Save career matches to database
   */
  private async saveCareerMatches(userId: string, matches: CareerMatchResult[]): Promise<void> {
    const client = new MongoClient(this.mongoUrl);

    try {
      await client.connect();
      const db = client.db('Pragyan');
      const collection = db.collection('CareerMatch');

      await Promise.all(
        matches.map((match) =>
          collection.updateOne(
            { userId, careerId: match.careerId },
            {
              $set: {
                userId,
                careerId: match.careerId,
                matchScore: match.matchScore,
                confidenceLevel: match.confidenceLevel,
                careerTitle: match.careerTitle,
                requiredSkills: match.requiredSkills,
                recommendedSkills: match.recommendedSkills,
                skillGaps: match.skillGaps,
                educationMatch: match.educationMatch,
                experienceMatch: match.experienceMatch,
                reasons: match.reasons,
                updatedAt: new Date(),
              },
            },
            { upsert: true }
          )
        )
      );
    } finally {
      await client.close();
    }
  }

  /**
   * Get saved career matches for a user (reads from MongoDB directly for compatibility)
   */
  async getUserCareerMatches(userId: string): Promise<any[]> {
    const client = new MongoClient(this.mongoUrl);

    try {
      await client.connect();
      const db = client.db('Pragyan');

      const matches = await db
        .collection('CareerMatch')
        .find({ userId })
        .sort({ matchScore: -1 })
        .toArray();

      // Enrich with career details from Career collection
      const enriched = await Promise.all(
        matches.map(async (match) => {
          const career = await db.collection('Career').findOne({ _id: match.careerId });
          return {
            ...match,
            career: career || { title: match.careerTitle },
          };
        })
      );

      return enriched;
    } finally {
      await client.close();
    }
  }

  /**
   * Get top career match for a user
   */
  async getTopCareerMatch(userId: string): Promise<any | null> {
    return prisma.careerMatch.findFirst({
      where: { userId },
      include: {
        career: {
          include: {
            skillMappings: true,
            interestMappings: true,
          },
        },
      },
      orderBy: { matchScore: 'desc' },
    });
  }

  /**
   * Get all available careers for reference
   */
  async getAllCareers(): Promise<any[]> {
    return prisma.career.findMany({
      include: {
        skillMappings: true,
        interestMappings: true,
      },
      orderBy: { jobMarketDemand: 'desc' },
    });
  }
}

export const careerMatchingEngine = new CareerMatchingEngine();
