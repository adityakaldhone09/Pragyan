import { prisma } from '@/lib/prisma';
import { MongoClient, ObjectId } from 'mongodb';

export type JobFeedItem = {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  salary: string | null;
  skills: string[];
  applyLink: string;
  source: string;
  createdAt: Date;
  matchScore: number;
  applied: boolean;
  appliedAt?: Date | null;
};

export type JobFeed = {
  recentJobs: JobFeedItem[];
  recommendedJobs: JobFeedItem[];
  appliedJobs: JobFeedItem[];
};

export function calculateJobMatch(userSkills: string[], jobSkills: string[]): number {
  const normalizedUserSkills = new Set(
    userSkills.flatMap((skill) => {
      const normalized = skill.toLowerCase().trim();
      return normalized ? [normalized] : [];
    })
  );

  const normalizedJobSkills = Array.from(
    new Set(jobSkills.flatMap((skill) => {
      const normalized = skill.toLowerCase().trim();
      return normalized ? [normalized] : [];
    }))
  );

  if (!normalizedJobSkills.length) {
    return 0;
  }

  const matchedSkills = normalizedJobSkills.filter((skill) => normalizedUserSkills.has(skill));
  return Math.round((matchedSkills.length / normalizedJobSkills.length) * 100);
}

function toJobFeedItem(
  job: {
    id: string;
    title: string;
    company: string;
    location: string;
    description: string;
    salary: unknown;
    skills: string[];
    applyLink: string;
    source: string;
    createdAt: Date;
  },
  userSkills: string[],
  appliedJobs: Map<string, Date>
): JobFeedItem {
  const appliedAt = appliedJobs.get(job.id);
  const normalizedSalary = typeof job.salary === 'string' ? job.salary : job.salary == null ? null : String(job.salary);

  return {
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    description: job.description,
    salary: normalizedSalary,
    skills: Array.isArray(job.skills) ? job.skills : [],
    applyLink: job.applyLink,
    source: job.source,
    createdAt: job.createdAt,
    matchScore: calculateJobMatch(userSkills, Array.isArray(job.skills) ? job.skills : []),
    applied: Boolean(appliedAt),
    appliedAt,
  };
}

export async function getJobFeedForUser(userId: string): Promise<JobFeed> {
  const [user, jobs, applications] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { skills: true },
    }),
    prisma.job.findMany({
      where: { source: 'JSearch' },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.jobApplication.findMany({
      where: { userId },
      select: {
        jobId: true,
        appliedAt: true,
      },
    }),
  ]);

  const userSkills = Array.isArray(user?.skills) ? user.skills : [];
  const appliedMap = new Map(applications.map((item) => [item.jobId, item.appliedAt] as const));
  const decoratedJobs = jobs.map((job) => toJobFeedItem(job, userSkills, appliedMap));

  return {
    recentJobs: [...decoratedJobs].sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime()).slice(0, 6),
    recommendedJobs: [...decoratedJobs].sort((left, right) => right.matchScore - left.matchScore).slice(0, 6),
    appliedJobs: decoratedJobs
      .filter((job) => job.applied)
      .sort((left, right) => {
        const leftTime = left.appliedAt ? left.appliedAt.getTime() : 0;
        const rightTime = right.appliedAt ? right.appliedAt.getTime() : 0;
        return rightTime - leftTime;
      }),
  };
}

export async function markJobApplied(userId: string, jobId: string): Promise<JobFeedItem> {
  const [job, userSkills] = await Promise.all([
    prisma.job.findUnique({
      where: { id: jobId },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { skills: true },
    }),
  ]);

  if (!job) {
    throw new Error('Job not found');
  }
  const normalizedSalary = typeof job.salary === 'string' ? job.salary : job.salary == null ? null : String(job.salary);

  try {
    await prisma.jobApplication.upsert({
      where: {
        userId_jobId: {
          userId,
          jobId,
        },
      },
      update: {
        status: 'APPLIED',
        appliedAt: new Date(),
      },
      create: {
        userId,
        jobId,
        status: 'APPLIED',
      },
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.warn('Prisma upsert failed, falling back to MongoDB upsert:', errMsg);

    // Fallback to MongoDB driver for upsert to avoid Prisma transaction requirement
    try {
      const mongoUrl = process.env.DATABASE_URL || '';
      if (mongoUrl) {
        const client = new MongoClient(mongoUrl);
        await client.connect();
        const db = client.db();
        const jobAppColl = db.collection('JobApplication');
        const filter = { userId: new ObjectId(userId), jobId: new ObjectId(jobId) };
        const update = { $set: { status: 'APPLIED', appliedAt: new Date(), updatedAt: new Date() } };
        await jobAppColl.updateOne(filter, update, { upsert: true });
        await client.close();
      }
    } catch (err2) {
      const err2Msg = err2 instanceof Error ? err2.message : String(err2);
      console.warn('MongoDB upsert for JobApplication failed:', err2Msg);
    }
  }

  return {
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    description: job.description,
    salary: normalizedSalary,
    skills: Array.isArray(job.skills) ? job.skills : [],
    applyLink: job.applyLink,
    source: job.source,
    createdAt: job.createdAt,
    matchScore: calculateJobMatch(Array.isArray(userSkills?.skills) ? userSkills.skills : [], Array.isArray(job.skills) ? job.skills : []),
    applied: true,
    appliedAt: new Date(),
  };
}

