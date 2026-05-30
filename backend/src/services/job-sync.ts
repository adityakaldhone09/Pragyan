import axios from 'axios';
import { prisma } from '@/lib/prisma';
import { config } from '@/config/env';
import { MongoClient } from 'mongodb';

interface RapidApiJob {
  job_title?: string;
  employer_name?: string;
  job_city?: string;
  job_description?: string;
  job_salary?: string;
  job_apply_link?: string;
}

export interface StoredJob {
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
}

async function fetchRapidApiJobs(): Promise<RapidApiJob[]> {
  if (!config.rapidApi.key) {
    throw new Error('RAPID_API_KEY is not configured');
  }

  const response = await axios.get('https://jsearch.p.rapidapi.com/search', {
    params: {
      query: 'software developer jobs',
      page: '1',
      num_pages: '1',
    },
    headers: {
      'X-RapidAPI-Key': config.rapidApi.key,
      'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
    },
  });

  return Array.isArray(response.data?.data) ? response.data.data : [];
}

function normalizeSkillText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9+#./ ]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractJobSkills(
  title: string,
  description: string,
  availableSkills: string[]
): string[] {
  const haystack = normalizeSkillText(`${title} ${description}`);
  const haystackWords = new Set(haystack.split(' '));

  return Array.from(
    new Set(
      availableSkills
        .filter(Boolean)
        .sort((left, right) => right.length - left.length)
        .filter((skill) => {
          const normalizedSkill = normalizeSkillText(skill);
          if (!normalizedSkill || normalizedSkill.length < 2) return false;

          // Exact phrase match (preferred)
          if (haystack.includes(normalizedSkill)) return true;

          // Token intersection: if any significant token of the skill appears in the text
          const tokens = normalizedSkill.split(' ').filter((t) => t.length >= 3);
          for (const t of tokens) {
            if (haystackWords.has(t)) return true;
          }

          // Fallback: partial substring match for longer skills
          if (normalizedSkill.length >= 5 && haystack.includes(normalizedSkill.slice(0, Math.max(3, Math.floor(normalizedSkill.length * 0.6))))) {
            return true;
          }

          return false;
        })
    )
  );
}

export async function storeJobs() {
  const jobs = await fetchRapidApiJobs();
  const skillRecords = await prisma.skill.findMany({
    select: { skillName: true },
  });
  const availableSkills = skillRecords.map((skill) => skill.skillName);
  // If the skill table is empty (common in local/dev), use a small fallback
  // list of common tech skills to improve extraction coverage.
  const fallbackCommonSkills = [
    'javascript','typescript','react','react native','node','python','java','c++','c#','sql','postgresql','mongodb','redis','docker','kubernetes','aws','azure','gcp','html','css','tailwind','graphql','django','flask','spring','go','rust','git','ci/cd'
  ];
  const skillsToUse = availableSkills && availableSkills.length > 0 ? availableSkills : fallbackCommonSkills;

  try {
    await prisma.job.deleteMany({
      where: { source: 'JSearch' },
    });
  } catch (err: any) {
    // On single-node MongoDB setups Prisma may require a replica set for
    // certain operations. If deleteMany fails for that reason, log and continue.
    const msg = typeof err === 'string' ? err : err?.message || String(err);
    console.warn('Skipping prisma.job.deleteMany due to error:', msg);
  }

  const docsToInsert = jobs.map((job) => ({
    title: job.job_title || 'Unknown',
    company: job.employer_name || 'Unknown',
    location: job.job_city || 'Remote',
    description: job.job_description || '',
    salary: job.job_salary || null,
    skills: extractJobSkills(job.job_title || 'Unknown', job.job_description || '', skillsToUse),
    applyLink: job.job_apply_link || '',
    source: 'JSearch',
    createdAt: new Date(),
  }));

  // If Prisma / MongoDB transactions are unavailable (single-node), fall back to
  // inserting documents directly via the MongoDB driver to avoid transaction errors.
  let insertedCount = 0;
  let insertedDocs: any[] = [];

  if (docsToInsert.length > 0) {
    const mongoUrl = config.database.url;
    if (!mongoUrl) {
      throw new Error('DATABASE_URL is not configured');
    }

    const client = new MongoClient(mongoUrl);
    try {
      await client.connect();
      const db = client.db();
      const collection = db.collection('Job');
      const result = await collection.insertMany(docsToInsert);
      insertedCount = result.insertedCount ?? 0;
      // fetch inserted documents' ids and attach back minimal info
      insertedDocs = docsToInsert.map((d, i) => ({ ...d, id: result.insertedIds[i] }));
    } finally {
      await client.close();
    }
  }

  return {
    totalFetched: jobs.length,
    totalStored: insertedCount,
    jobs: insertedDocs,
  };
}

export async function getStoredJobs() {
  return prisma.job.findMany({
    where: { source: 'JSearch' },
    orderBy: { createdAt: 'desc' },
  });
}

export async function ensureJobsSynced() {
  const storedJobs = await getStoredJobs();

  if (storedJobs.length > 0) {
    return {
      synced: false,
      totalFetched: storedJobs.length,
      totalStored: storedJobs.length,
      jobs: storedJobs,
    };
  }

  try {
    return await storeJobs();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn('Lazy job sync failed:', message);
    return {
      synced: false,
      totalFetched: 0,
      totalStored: 0,
      jobs: [],
    };
  }
}