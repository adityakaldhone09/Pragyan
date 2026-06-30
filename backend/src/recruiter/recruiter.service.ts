import { ObjectId, type Collection, type Db } from 'mongodb';
import { prisma } from '@/lib/prisma';
import { getMongoUrl } from '@/config/mongo';
import { MongoClient } from 'mongodb';
import { comparePasswords, hashPassword } from '@/utils/password';
import { ConflictError, NotFoundError, UnauthorizedError } from '@/utils/errors';
import { generateAccessToken, generateRefreshToken } from '@/utils/jwt';
import { routeAI } from '@/ai/aiRouter';
import type {
  AiSearchInput,
  CandidateSearchInput,
  CompanyInput,
  JobInput,
  RecruiterLoginInput,
  RecruiterRegisterInput,
} from './recruiter.validators';

type AnyDoc = Record<string, any>;

const COMMUNITIES = ['Full Stack', 'AI Engineer', 'Cyber Security', 'Cloud', 'Data Science', 'DevOps', 'UI UX', 'Product Management'];
const PIPELINE = ['APPLIED', 'SCREENING', 'ASSESSMENT', 'INTERVIEW', 'SELECTED', 'OFFER', 'JOINED'];

function toObjectId(id: string) {
  if (!ObjectId.isValid(id)) throw new NotFoundError('Resource not found');
  return new ObjectId(id);
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeList(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return values.map((item) => String(item || '').trim()).filter(Boolean);
}

function asDate(value?: string) {
  return value ? new Date(value) : undefined;
}

function parseJson(value: unknown) {
  if (!value || typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function average(values: number[]) {
  const clean = values.filter((value) => Number.isFinite(value));
  return clean.length ? clean.reduce((sum, value) => sum + value, 0) / clean.length : 0;
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function textIncludes(haystack: string, needle?: string) {
  return !needle || haystack.toLowerCase().includes(needle.toLowerCase());
}

function splitSkills(value?: string) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function readAssessmentScore(result?: AnyDoc | null) {
  if (!result) return 0;
  const parsed = parseJson(result.scores);
  if (typeof parsed === 'number') return clampScore(parsed);
  if (parsed && typeof parsed === 'object') {
    const numericValues = Object.values(parsed).map(Number).filter(Number.isFinite);
    return clampScore(average(numericValues));
  }
  return result.suggestedCareers?.length ? 70 : 0;
}

function categorizeMatch(score: number) {
  if (score >= 85) return 'Top Match';
  if (score >= 70) return 'Strong Match';
  if (score >= 50) return 'Average Match';
  return 'Needs Improvement';
}

function buildSession(user: AnyDoc, refreshToken: string) {
  return {
    user: {
      id: String(user.id || user._id),
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      avatar: user.avatar || null,
      provider: user.provider || 'local',
      emailVerified: Boolean(user.emailVerified),
      location: user.location || null,
      currentTitle: user.currentTitle || null,
      careerTrack: user.careerTrack || null,
      skills: normalizeList(user.skills),
      interests: normalizeList(user.interests),
      preferences: normalizeList(user.preferences),
      xp: Number(user.xp || 0),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    accessToken: generateAccessToken({ id: String(user.id || user._id), email: user.email, role: 'RECRUITER' }),
    refreshToken,
  };
}

function mapCompany(input: Partial<RecruiterRegisterInput & CompanyInput>, recruiterId?: string) {
  return {
    name: input.companyName,
    industry: input.industry || '',
    website: input.website || '',
    companySize: input.companySize || '',
    location: input.location || '',
    recruiterName: input.recruiterName || '',
    designation: input.designation || '',
    logo: input.logo || '',
    description: input.description || '',
    hiringDomains: normalizeList(input.hiringDomains),
    socialLinks: input.socialLinks || {},
    ...(recruiterId ? { ownerRecruiterId: new ObjectId(recruiterId) } : {}),
  };
}

function mapJob(input: JobInput) {
  return {
    title: input.title,
    description: input.description,
    salary: input.salary || '',
    experience: input.experience || '',
    skills: normalizeList(input.skills),
    location: input.location || '',
    deadline: asDate(input.deadline),
    community: input.community || '',
    assessmentRequired: Boolean(input.assessmentRequired),
    status: input.status || 'DRAFT',
  };
}

class RecruiterRepository {
  private client: MongoClient | null = null;

  async db(): Promise<Db> {
    if (!this.client) {
      this.client = new MongoClient(getMongoUrl());
      await this.client.connect();
    }
    return this.client.db('Pragyan');
  }

  async collection<T extends AnyDoc = AnyDoc>(name: string): Promise<Collection<T>> {
    return (await this.db()).collection<T>(name);
  }
}

const repo = new RecruiterRepository();

export class RecruiterService {
  private async issueRefreshToken(userId: string) {
    const token = generateRefreshToken(userId);
    await prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    return token;
  }

  async register(input: RecruiterRegisterInput) {
    const email = normalizeEmail(input.email);
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictError('Email already registered');

    const user = await prisma.user.create({
      data: {
        email,
        fullName: input.recruiterName,
        password: await hashPassword(input.password),
        provider: 'local',
        role: 'RECRUITER',
        skills: [],
        interests: [],
        preferences: [],
        experienceType: 'experienced',
        xp: 0,
        streak: 0,
        currentTitle: input.designation || 'Recruiter',
      },
    });

    const companies = await repo.collection('Company');
    const recruiters = await repo.collection('Recruiter');
    const now = new Date();
    const companyInsert = await companies.insertOne({
      ...mapCompany(input),
      createdAt: now,
      updatedAt: now,
    });
    const recruiterInsert = await recruiters.insertOne({
      userId: new ObjectId(user.id),
      companyId: companyInsert.insertedId,
      name: input.recruiterName,
      designation: input.designation || '',
      email,
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    });
    await companies.updateOne({ _id: companyInsert.insertedId }, { $set: { ownerRecruiterId: recruiterInsert.insertedId } });

    const refreshToken = await this.issueRefreshToken(user.id);
    return {
      ...buildSession(user, refreshToken),
      recruiter: await recruiters.findOne({ _id: recruiterInsert.insertedId }),
      company: await companies.findOne({ _id: companyInsert.insertedId }),
    };
  }

  async login(input: RecruiterLoginInput) {
    const user = await prisma.user.findUnique({ where: { email: normalizeEmail(input.email) } });
    if (!user || user.role !== 'RECRUITER') throw new UnauthorizedError('Invalid recruiter credentials');
    const ok = await comparePasswords(input.password, user.password);
    if (!ok) throw new UnauthorizedError('Invalid recruiter credentials');
    return buildSession(user, await this.issueRefreshToken(user.id));
  }

  async getRecruiter(userId: string) {
    const recruiters = await repo.collection('Recruiter');
    const recruiter = await recruiters.findOne({ userId: toObjectId(userId) });
    if (!recruiter) throw new NotFoundError('Recruiter profile not found');
    return recruiter;
  }

  async getCompany(userId: string) {
    const recruiter = await this.getRecruiter(userId);
    if (!recruiter.companyId) return null;
    return (await repo.collection('Company')).findOne({ _id: recruiter.companyId });
  }

  async updateCompany(userId: string, input: CompanyInput) {
    const recruiter = await this.getRecruiter(userId);
    const companies = await repo.collection('Company');
    const payload = mapCompany(input);
    await companies.updateOne(
      { _id: recruiter.companyId },
      { $set: { ...payload, updatedAt: new Date() } },
      { upsert: true }
    );
    return companies.findOne({ _id: recruiter.companyId });
  }

  private async buildCandidate(user: AnyDoc) {
    const userId = user._id as ObjectId;
    const [projects, certificates, github, assessment, progress, readiness, applications, interviews] = await Promise.all([
      (await repo.collection('UserPortfolioProject')).find({ userId }).sort({ featured: -1, updatedAt: -1 }).toArray(),
      (await repo.collection('UserCertification')).find({ userId }).sort({ issuedAt: -1, updatedAt: -1 }).toArray(),
      (await repo.collection('GithubRepository')).find({ userId }).sort({ stars: -1, pushedAt: -1 }).toArray(),
      (await repo.collection('AssessmentResult')).find({ userId }).sort({ createdAt: -1 }).limit(1).next(),
      (await repo.collection('UserProgress')).find({ userId }).toArray(),
      (await repo.collection('PlacementReadiness')).find({ userId }).sort({ createdAt: -1 }).limit(1).next(),
      (await repo.collection('RecruiterApplication')).find({ candidateId: userId }).toArray(),
      (await repo.collection('InterviewSchedule')).find({ candidateId: userId }).toArray(),
    ]);

    const assessmentScore = readAssessmentScore(assessment);
    const projectScore = clampScore(projects.length * 25);
    const resumeScore = clampScore((user.education ? 25 : 0) + (user.experience ? 25 : 0) + (normalizeList(user.skills).length ? 30 : 0) + (user.currentTitle ? 20 : 0));
    const githubScore = clampScore(github.length * 25 + Math.min(25, github.reduce((sum, repoItem) => sum + Number(repoItem.stars || 0), 0)));
    const certificateScore = clampScore(certificates.length * 34);
    const communityScore = clampScore(Number(user.xp || 0) / 20 + Number(user.level || 1) * 5);
    const interviewScore = clampScore(average(interviews.map((item) => Number(item.rating || 0))) * 20 || (applications.length ? 50 : 0));
    const roadmapScore = clampScore(average(progress.map((item) => Number(item.progressPercentage || item.progress || 0))));
    const placementReadiness = clampScore(Number(readiness?.score || average([assessmentScore, projectScore, resumeScore, roadmapScore])));

    const matchScore = clampScore(
      assessmentScore * 0.3 +
      projectScore * 0.2 +
      resumeScore * 0.15 +
      githubScore * 0.1 +
      certificateScore * 0.1 +
      communityScore * 0.05 +
      interviewScore * 0.05 +
      roadmapScore * 0.05
    );

    return {
      id: String(user._id),
      profilePicture: user.avatar || null,
      name: user.fullName || user.email,
      currentRole: user.currentTitle || user.careerTrack || user.experienceType || 'Student',
      college: user.currentCourse || user.education || 'Not provided',
      location: user.location || 'Not provided',
      skills: normalizeList(user.skills),
      matchScore,
      matchBand: categorizeMatch(matchScore),
      assessmentScore,
      projectCount: projects.length,
      certificateCount: certificates.length,
      githubCount: github.length,
      communityRank: communityScore >= 80 ? 'Gold' : communityScore >= 55 ? 'Silver' : 'Rising',
      placementReadiness,
      resumeScore,
      githubScore,
      roadmapProgress: roadmapScore,
      availability: user.experienceType === 'fresher' ? 'Internship / Entry Level' : 'Open to opportunities',
      projects,
      certificates,
      github,
      assessmentHistory: assessment ? [assessment] : [],
      roadmapProgressItems: progress,
      communityActivity: { xp: user.xp || 0, level: user.level || 1, rank: communityScore >= 80 ? 'Gold' : 'Rising' },
      resume: { score: resumeScore, updatedAt: user.updatedAt },
      aiRecommendation: `${categorizeMatch(matchScore)} for roles matching ${normalizeList(user.skills).slice(0, 4).join(', ') || 'their profile'}.`,
    };
  }

  private filtersFromQuery(input: CandidateSearchInput | AiSearchInput) {
    const query = 'query' in input ? String(input.query || '') : '';
    const lower = query.toLowerCase();
    const inferredSkills = ['React', 'Node', 'MERN', 'MongoDB', 'Data Science', 'Python', 'Cybersecurity', 'Cloud', 'DevOps', 'UI UX']
      .filter((skill) => lower.includes(skill.toLowerCase()));
    return {
      query,
      skills: [...splitSkills((input as CandidateSearchInput).skills), ...inferredSkills],
      location: (input as CandidateSearchInput).location || (lower.includes('pune') ? 'Pune' : ''),
      minAssessmentScore: (input as CandidateSearchInput).minAssessmentScore || (lower.includes('above 85') ? 85 : undefined),
      minProjects: (input as CandidateSearchInput).minProjects || (lower.includes('3 projects') || lower.includes('at least 3') ? 3 : undefined),
      minCertificates: (input as CandidateSearchInput).minCertificates || (lower.includes('certified') ? 1 : undefined),
      availability: (input as CandidateSearchInput).availability || (lower.includes('internship') ? 'internship' : ''),
      goldOnly: lower.includes('gold'),
    };
  }

  async searchCandidates(input: CandidateSearchInput | AiSearchInput) {
    const page = Number((input as any).page || 1);
    const limit = Number((input as any).limit || 20);
    const filters = this.filtersFromQuery(input);
    const users = await (await repo.collection('User'))
      .find({ role: { $ne: 'RECRUITER' } })
      .sort({ updatedAt: -1 })
      .limit(300)
      .toArray();

    const candidates = await Promise.all(users.map((user) => this.buildCandidate(user)));
    const filtered = candidates
      .filter((candidate) => {
        const haystack = [
          candidate.name,
          candidate.currentRole,
          candidate.college,
          candidate.location,
          candidate.skills.join(' '),
          candidate.projects.map((item: AnyDoc) => item.title).join(' '),
          candidate.certificates.map((item: AnyDoc) => item.title).join(' '),
        ].join(' ');
        if (!textIncludes(haystack, filters.query) && filters.query && !filters.skills.length) return false;
        if (filters.skills.length && !filters.skills.some((skill) => textIncludes(haystack, skill))) return false;
        if (filters.location && !textIncludes(candidate.location, filters.location)) return false;
        if (filters.minAssessmentScore && candidate.assessmentScore < filters.minAssessmentScore) return false;
        if (filters.minProjects && candidate.projectCount < filters.minProjects) return false;
        if (filters.minCertificates && candidate.certificateCount < filters.minCertificates) return false;
        if ((input as CandidateSearchInput).minResumeScore && candidate.resumeScore < Number((input as CandidateSearchInput).minResumeScore)) return false;
        if ((input as CandidateSearchInput).minGithubScore && candidate.githubScore < Number((input as CandidateSearchInput).minGithubScore)) return false;
        if ((input as CandidateSearchInput).minRoadmapProgress && candidate.roadmapProgress < Number((input as CandidateSearchInput).minRoadmapProgress)) return false;
        if (filters.availability && !textIncludes(candidate.availability, filters.availability)) return false;
        if (filters.goldOnly && candidate.communityRank !== 'Gold') return false;
        return true;
      })
      .sort((left, right) => right.matchScore - left.matchScore);

    const start = (page - 1) * limit;
    return { data: filtered.slice(start, start + limit), page, limit, total: filtered.length };
  }

  async getCandidate(candidateId: string) {
    const user = await (await repo.collection('User')).findOne({ _id: toObjectId(candidateId) });
    if (!user) throw new NotFoundError('Candidate not found');
    const candidate = await this.buildCandidate(user);
    let aiInsights = {
      strengths: candidate.skills.slice(0, 5),
      weaknesses: candidate.assessmentScore < 70 ? ['Assessment score needs review'] : [],
      missingSkills: [],
      missingCertifications: candidate.certificateCount ? [] : ['Role-specific certification'],
      suggestedInterviewQuestions: candidate.skills.slice(0, 3).map((skill: string) => `Describe a project where you used ${skill}.`),
      recommendedHiringDecision: candidate.matchBand,
      riskAnalysis: candidate.resumeScore < 60 ? 'Resume signal is incomplete.' : 'No major risk signals from available data.',
    };

    try {
      const result = await routeAI('summary', {
        prompt: `Generate concise JSON hiring insights for this candidate. Return keys strengths, weaknesses, missingSkills, missingCertifications, suggestedInterviewQuestions, recommendedHiringDecision, riskAnalysis.\n${JSON.stringify(candidate).slice(0, 6000)}`,
        format: 'json',
      });
      aiInsights = { ...aiInsights, ...JSON.parse(result.value) };
    } catch {
      // deterministic insights above are sufficient
    }

    return { ...candidate, aiInsights };
  }

  async bookmarkCandidate(userId: string, candidateId: string, notes?: string) {
    const recruiter = await this.getRecruiter(userId);
    const bookmarks = await repo.collection('CandidateBookmark');
    await bookmarks.updateOne(
      { recruiterId: recruiter._id, candidateId: toObjectId(candidateId) },
      { $set: { notes: notes || '', updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );
    return { bookmarked: true };
  }

  async listJobs(userId: string) {
    const recruiter = await this.getRecruiter(userId);
    return (await repo.collection('RecruiterJob')).find({ recruiterId: recruiter._id }).sort({ updatedAt: -1 }).toArray();
  }

  async createJob(userId: string, input: JobInput) {
    const recruiter = await this.getRecruiter(userId);
    const jobs = await repo.collection('RecruiterJob');
    const now = new Date();
    const job = {
      recruiterId: recruiter._id,
      companyId: recruiter.companyId,
      ...mapJob(input),
      matchSummary: { topMatch: 0, strongMatch: 0, averageMatch: 0, needsImprovement: 0 },
      createdAt: now,
      updatedAt: now,
    };
    const result = await jobs.insertOne(job);
    const created = await jobs.findOne({ _id: result.insertedId });
    await this.refreshJobMatches(String(result.insertedId));
    return jobs.findOne({ _id: result.insertedId }) || created;
  }

  async updateJob(userId: string, jobId: string, input: Partial<JobInput>) {
    const recruiter = await this.getRecruiter(userId);
    const jobs = await repo.collection('RecruiterJob');
    const update = Object.keys(input).length ? mapJob({ ...(await jobs.findOne({ _id: toObjectId(jobId), recruiterId: recruiter._id })), ...input } as JobInput) : {};
    await jobs.updateOne({ _id: toObjectId(jobId), recruiterId: recruiter._id }, { $set: { ...update, updatedAt: new Date() } });
    await this.refreshJobMatches(jobId);
    return jobs.findOne({ _id: toObjectId(jobId), recruiterId: recruiter._id });
  }

  async deleteJob(userId: string, jobId: string) {
    const recruiter = await this.getRecruiter(userId);
    await (await repo.collection('RecruiterJob')).deleteOne({ _id: toObjectId(jobId), recruiterId: recruiter._id });
    return { deleted: true };
  }

  async refreshJobMatches(jobId: string) {
    const jobs = await repo.collection('RecruiterJob');
    const job = await jobs.findOne({ _id: toObjectId(jobId) });
    if (!job) throw new NotFoundError('Job not found');
    const results = await this.searchCandidates({ query: `${job.title} ${normalizeList(job.skills).join(' ')} ${job.location || ''}`, page: 1, limit: 50 });
    const summary = {
      topMatch: results.data.filter((item) => item.matchScore >= 85).length,
      strongMatch: results.data.filter((item) => item.matchScore >= 70 && item.matchScore < 85).length,
      averageMatch: results.data.filter((item) => item.matchScore >= 50 && item.matchScore < 70).length,
      needsImprovement: results.data.filter((item) => item.matchScore < 50).length,
      recommendedCandidates: results.data.slice(0, 10).map((item) => ({ id: item.id, name: item.name, matchScore: item.matchScore, band: item.matchBand })),
    };
    await jobs.updateOne({ _id: job._id }, { $set: { matchSummary: summary, updatedAt: new Date() } });
    return summary;
  }

  async listApplications(userId: string) {
    const recruiter = await this.getRecruiter(userId);
    return (await repo.collection('RecruiterApplication')).find({ recruiterId: recruiter._id }).sort({ updatedAt: -1 }).toArray();
  }

  async createApplication(userId: string, input: AnyDoc) {
    const recruiter = await this.getRecruiter(userId);
    const apps = await repo.collection('RecruiterApplication');
    const now = new Date();
    await apps.updateOne(
      { jobId: toObjectId(input.jobId), candidateId: toObjectId(input.candidateId) },
      {
        $set: { stage: input.stage || 'APPLIED', notes: input.notes || '', rating: input.rating, updatedAt: now, recruiterId: recruiter._id },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true }
    );
    return apps.findOne({ jobId: toObjectId(input.jobId), candidateId: toObjectId(input.candidateId) });
  }

  async updateApplication(userId: string, applicationId: string, input: AnyDoc) {
    const recruiter = await this.getRecruiter(userId);
    await (await repo.collection('RecruiterApplication')).updateOne(
      { _id: toObjectId(applicationId), recruiterId: recruiter._id },
      { $set: { ...input, updatedAt: new Date() } }
    );
    return (await repo.collection('RecruiterApplication')).findOne({ _id: toObjectId(applicationId), recruiterId: recruiter._id });
  }

  async listInterviews(userId: string) {
    const recruiter = await this.getRecruiter(userId);
    return (await repo.collection('InterviewSchedule')).find({ recruiterId: recruiter._id }).sort({ scheduledAt: 1 }).toArray();
  }

  async scheduleInterview(userId: string, input: AnyDoc) {
    const recruiter = await this.getRecruiter(userId);
    const interviews = await repo.collection('InterviewSchedule');
    const result = await interviews.insertOne({
      recruiterId: recruiter._id,
      candidateId: toObjectId(input.candidateId),
      jobId: input.jobId ? toObjectId(input.jobId) : null,
      scheduledAt: new Date(input.scheduledAt),
      mode: input.mode,
      status: 'SCHEDULED',
      notes: input.notes || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return interviews.findOne({ _id: result.insertedId });
  }

  async generateInterviewFeedback(userId: string, interviewId: string, input: AnyDoc) {
    const recruiter = await this.getRecruiter(userId);
    const interviews = await repo.collection('InterviewSchedule');
    const interview = await interviews.findOne({ _id: toObjectId(interviewId), recruiterId: recruiter._id });
    if (!interview) throw new NotFoundError('Interview not found');
    const candidate = await this.getCandidate(String(interview.candidateId));
    const fallback = {
      summary: input.notes || 'Interview feedback recorded.',
      strengths: candidate.skills.slice(0, 3),
      concerns: candidate.matchScore < 60 ? ['Overall hiring score is below strong-match range.'] : [],
      recommendation: candidate.matchScore >= 70 ? 'Proceed' : 'Hold',
    };
    let aiFeedback = fallback;
    try {
      const result = await routeAI('summary', {
        prompt: `Generate interview feedback JSON with summary, strengths, concerns, recommendation.\nCandidate:${JSON.stringify(candidate).slice(0, 4000)}\nNotes:${input.notes || ''}`,
        format: 'json',
      });
      aiFeedback = { ...fallback, ...JSON.parse(result.value) };
    } catch {
      // fallback retained
    }
    await interviews.updateOne({ _id: interview._id }, { $set: { aiFeedback, rating: input.rating, notes: input.notes || interview.notes, updatedAt: new Date() } });
    return interviews.findOne({ _id: interview._id });
  }

  async listMessages(userId: string) {
    const recruiter = await this.getRecruiter(userId);
    return (await repo.collection('RecruiterMessage')).find({ recruiterId: recruiter._id }).sort({ createdAt: -1 }).toArray();
  }

  async sendMessage(userId: string, input: AnyDoc) {
    const recruiter = await this.getRecruiter(userId);
    const result = await (await repo.collection('RecruiterMessage')).insertOne({
      recruiterId: recruiter._id,
      candidateId: input.candidateId ? toObjectId(input.candidateId) : null,
      community: input.community || '',
      subject: input.subject,
      body: input.body,
      status: 'SENT',
      createdAt: new Date(),
    });
    return (await repo.collection('RecruiterMessage')).findOne({ _id: result.insertedId });
  }

  async communities() {
    const candidates = await this.searchCandidates({ page: 1, limit: 300 });
    return COMMUNITIES.map((name) => ({
      name,
      candidates: candidates.data.filter((candidate) => textIncludes(`${candidate.currentRole} ${candidate.skills.join(' ')}`, name)).length,
      topSkills: candidates.data.flatMap((candidate) => candidate.skills).slice(0, 8),
      hiringReadiness: clampScore(average(candidates.data.map((candidate) => candidate.placementReadiness))),
    }));
  }

  async analytics(userId: string) {
    const recruiter = await this.getRecruiter(userId);
    const [jobs, applications, interviews, messages, candidates] = await Promise.all([
      this.listJobs(userId),
      this.listApplications(userId),
      this.listInterviews(userId),
      this.listMessages(userId),
      this.searchCandidates({ page: 1, limit: 300 }),
    ]);
    return {
      hiringFunnel: PIPELINE.map((stage) => ({ stage, count: applications.filter((app) => app.stage === stage).length })),
      applicationTrend: applications.slice(0, 30).map((app) => ({ date: app.createdAt, count: 1 })),
      skillDistribution: candidates.data.flatMap((candidate) => candidate.skills).reduce((acc: AnyDoc, skill: string) => {
        acc[skill] = (acc[skill] || 0) + 1;
        return acc;
      }, {}),
      topCommunities: await this.communities(),
      assessmentDistribution: candidates.data.map((candidate) => candidate.assessmentScore),
      placementReadiness: clampScore(average(candidates.data.map((candidate) => candidate.placementReadiness))),
      hiringSuccess: applications.length ? clampScore((applications.filter((app) => ['SELECTED', 'OFFER', 'JOINED'].includes(app.stage)).length / applications.length) * 100) : 0,
      offerAcceptance: applications.filter((app) => app.stage === 'OFFER').length
        ? clampScore((applications.filter((app) => app.stage === 'JOINED').length / applications.filter((app) => app.stage === 'OFFER').length) * 100)
        : 0,
      totals: {
        candidates: candidates.total,
        activeJobs: jobs.filter((job) => job.status === 'PUBLISHED').length,
        applications: applications.length,
        interviews: interviews.length,
        offersSent: applications.filter((app) => app.stage === 'OFFER').length,
        communities: COMMUNITIES.length,
        messages: messages.length,
        recruiterId: String(recruiter._id),
      },
    };
  }

  async dashboard(userId: string) {
    const analytics = await this.analytics(userId);
    const jobs = await this.listJobs(userId);
    const applications = await this.listApplications(userId);
    const interviews = await this.listInterviews(userId);
    const communities = await this.communities();
    return {
      cards: {
        totalCandidates: analytics.totals.candidates,
        activeJobs: analytics.totals.activeJobs,
        applications: analytics.totals.applications,
        interviews: analytics.totals.interviews,
        offersSent: analytics.totals.offersSent,
        communities: analytics.totals.communities,
        hiringScore: analytics.hiringSuccess,
      },
      recentActivity: [
        ...jobs.slice(0, 3).map((job) => ({ type: 'Job', label: job.title, at: job.updatedAt })),
        ...applications.slice(0, 3).map((app) => ({ type: 'Application', label: app.stage, at: app.updatedAt })),
        ...interviews.slice(0, 3).map((interview) => ({ type: 'Interview', label: interview.mode, at: interview.scheduledAt })),
      ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, 8),
      communities,
    };
  }
}

export const recruiterService = new RecruiterService();
