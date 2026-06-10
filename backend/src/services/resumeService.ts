import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { aiProvider } from '@/services/aiProvider';
import { profileBuilderService } from '@/services/profile-builder';
import { journeyService } from '@/modules/journey/journey.service';
import { safeParseAIResponse } from '@/ai/safeParser';
import { resumeSchema } from '@/validators/resume-ai';

type ResumeProject = {
  title: string;
  description?: string | null;
  techStack?: string[];
  highlights?: string[];
  liveUrl?: string | null;
  repoUrl?: string | null;
  featured?: boolean;
};

type ResumeSnapshot = {
  summary: string;
  skills: string[];
  projects: Array<{
    title: string;
    description: string;
    impact: string;
    technologies: string[];
    url?: string | null;
  }>;
  experience: Array<{
    title: string;
    company: string;
    period: string;
    description: string;
    achievements: string[];
  }>;
  education: Array<{
    school: string;
    qualification: string;
    year?: string;
    description?: string;
  }>;
  certifications: Array<{
    title: string;
    issuer: string;
    date?: string;
    url?: string | null;
  }>;
  achievements: string[];
  targetRole?: string;
};

function buildPrompt(snapshot: {
  user: Awaited<ReturnType<typeof profileBuilderService.getProfile>>['user'];
  githubRepositories: Awaited<ReturnType<typeof profileBuilderService.getProfile>>['githubRepositories'];
  projects: Awaited<ReturnType<typeof profileBuilderService.getProfile>>['projects'];
  certifications: Awaited<ReturnType<typeof profileBuilderService.getProfile>>['certifications'];
  journey: Awaited<ReturnType<typeof journeyService.getDashboardJourney>>;
  learningAchievements: string[];
}) {
  return `
You are Gemini creating an ATS-optimized resume for Pragyan.
Return valid JSON only with this structure:
{
  "summary": "string",
  "skills": ["string"],
  "projects": [
    {
      "title": "string",
      "description": "string",
      "impact": "string",
      "technologies": ["string"],
      "url": "string | null"
    }
  ],
  "experience": [
    {
      "title": "string",
      "company": "string",
      "period": "string",
      "description": "string",
      "achievements": ["string"]
    }
  ],
  "education": [
    {
      "school": "string",
      "qualification": "string",
      "year": "string",
      "description": "string"
    }
  ],
  "certifications": [
    {
      "title": "string",
      "issuer": "string",
      "date": "string",
      "url": "string | null"
    }
  ],
  "achievements": ["string"],
  "targetRole": "string"
}

Rules:
- Use only the provided context.
- Keep the summary concise, ATS-friendly, and impact-driven.
- Prefer strong action verbs and quantify if the input supports it.
- Do not invent employers, degrees, or certificates.
- Use GitHub repositories and portfolio projects as proof of work.
- Highlight learning achievements and roadmap progress.

User:
${JSON.stringify(snapshot.user, null, 2)}

GitHub repositories:
${JSON.stringify(snapshot.githubRepositories.slice(0, 6), null, 2)}

Portfolio projects:
${JSON.stringify(snapshot.projects.slice(0, 6), null, 2)}

Certifications:
${JSON.stringify(snapshot.certifications.slice(0, 6), null, 2)}

Journey:
${JSON.stringify({
  careerTitle: snapshot.journey.currentJourney?.careerTitle,
  roadmapTitle: snapshot.journey.currentJourney?.roadmapTitle,
  currentDay: snapshot.journey.currentDay,
  weakSkills: snapshot.journey.weakSkills,
  completedSkills: snapshot.journey.currentJourney?.completedSkills,
  placementReadiness: snapshot.journey.placementReadiness,
}, null, 2)}

Learning achievements:
${JSON.stringify(snapshot.learningAchievements, null, 2)}
`.trim();
}

function fallbackResume(profile: Awaited<ReturnType<typeof profileBuilderService.getProfile>>, journey: Awaited<ReturnType<typeof journeyService.getDashboardJourney>>): ResumeSnapshot {
  const user = profile.user;
  const currentJourney = journey.currentJourney;
  const skills = Array.from(new Set([...(user.skills || []), ...(profile.projects.flatMap((project) => project.techStack || [])), ...(currentJourney?.completedSkills || [])])).slice(0, 18);
  const projects = profile.projects.slice(0, 4).map((project: ResumeProject) => ({
    title: project.title,
    description: project.description || `Built as part of the Pragyan portfolio.`,
    impact: project.featured ? 'Featured portfolio project' : 'Practical build demonstrating role-relevant skills',
    technologies: project.techStack || [],
    url: project.liveUrl || project.repoUrl || null,
  }));

  return {
    summary: `${user.fullName || 'Career builder'} is a pragmatic learner focused on ${currentJourney?.careerTitle || user.careerTrack || 'career growth'} with a strong emphasis on hands-on projects, curated learning, and measurable progress.`,
    skills,
    projects,
    experience: user.experience
      ? [{
          title: user.currentTitle || 'Experience',
          company: user.careerTrack || 'Pragyan',
          period: 'Current',
          description: user.experience,
          achievements: ['Self-directed learning', 'Portfolio-driven execution'],
        }]
      : [],
    education: user.education
      ? [{
          school: user.educationEntries?.[0]?.city || user.location || 'Education',
          qualification: user.education,
          year: '',
          description: 'Educational background provided by the user profile.',
        }]
      : [],
    certifications: profile.certifications.map((cert) => ({
      title: cert.title,
      issuer: cert.issuer,
      date: cert.issuedAt || undefined,
      url: cert.credentialUrl || null,
    })),
    achievements: [
      ...(currentJourney?.currentPlan ? [`Completed learning tasks aligned with ${currentJourney.careerTitle}`] : []),
      ...(journey.streak ? [`Maintained a ${journey.streak}-day learning streak`] : []),
    ],
    targetRole: currentJourney?.careerTitle || user.careerTrack || 'Target role',
  };
}

export class ResumeService {
  async generateResume(userId: string) {
    const [profile, journey, learningRecords, achievements] = await Promise.all([
      profileBuilderService.getProfile(userId),
      journeyService.getDashboardJourney(userId).catch(() => null),
      prisma.dailyLearning.findMany({
        where: { userId, completed: true },
        orderBy: { updatedAt: 'desc' },
        take: 12,
      }),
      prisma.userAchievement.findMany({
        where: { userId },
        orderBy: { unlockedAt: 'desc' },
        take: 12,
      }),
    ]);

    const prompt = buildPrompt({
      user: profile.user,
      githubRepositories: profile.githubRepositories,
      projects: profile.projects,
      certifications: profile.certifications,
      journey: journey || { currentJourney: null, currentDay: 1, xp: 0, streak: 0, aiInsights: [], weakSkills: [], nextAction: '', eligibleJobs: [], placementReadiness: null, trend: [] },
      learningAchievements: [
        ...learningRecords.map((record) => `${record.topic} completed on Day ${record.dayNumber}`),
        ...achievements.map((achievement) => achievement.title),
      ],
    });

    let resume = fallbackResume(profile, journey || { currentJourney: null, currentDay: 1, xp: 0, streak: 0, aiInsights: [], weakSkills: [], nextAction: '', eligibleJobs: [], placementReadiness: null, trend: [] });

    try {
      const raw = await aiProvider.generateJsonRaw(prompt, { timeoutMs: 22000, maxTokens: 1800 });
      resume = safeParseAIResponse(JSON.parse(raw), resumeSchema);
    } catch {
      // fall back to deterministic resume
    }

    const latest = await prisma.resume.findFirst({
      where: { userId },
      orderBy: { version: 'desc' },
    });

    const version = (latest?.version || 0) + 1;
    const stored = await prisma.resume.create({
      data: {
        userId,
        version,
        summary: resume.summary,
        data: resume as unknown as Prisma.InputJsonValue,
      },
    });

    return {
      id: stored.id,
      version: stored.version,
      generatedAt: stored.generatedAt.toISOString(),
      summary: resume.summary,
      data: resume,
    };
  }

  async getLatestResume(userId: string) {
    const resume = await prisma.resume.findFirst({
      where: { userId },
      orderBy: { version: 'desc' },
    });

    if (!resume) {
      return null;
    }

    return {
      id: resume.id,
      version: resume.version,
      generatedAt: resume.generatedAt.toISOString(),
      summary: resume.summary,
      data: resume.data as ResumeSnapshot,
    };
  }
}

export const resumeService = new ResumeService();
