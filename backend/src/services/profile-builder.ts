import { prisma } from '@/lib/prisma';
import { authService } from '@/services/auth';
import { getMongoUrl } from '@/config/mongo';
import { BadRequestError, NotFoundError } from '@/utils/errors';
import type { CertificationInput, GithubImportInput, PortfolioProjectInput } from '@/validators/profile-builder';
import { Collection, MongoClient, ObjectId } from 'mongodb';

function normalizeTextArray(items?: string[] | null) {
  return (items || []).map((item) => String(item).trim()).filter(Boolean);
}

function computeCompletionScore(profile: {
  fullName?: string | null;
  avatar?: string | null;
  phone?: string | null;
  linkedin?: string | null;
  age?: number | null;
  location?: string | null;
  skills?: string[] | null;
  interests?: string[] | null;
  education?: string | null;
  educationEntries?: unknown;
  experience?: string | null;
  currentTitle?: string | null;
  careerTrack?: string | null;
}, projectCount: number, certificationCount: number, githubCount: number) {
  const sections = [
    { key: 'identity', label: 'Identity', score: profile.fullName ? 20 : 0 },
    { key: 'contact', label: 'Contact', score: profile.phone || profile.location ? 15 : 0 },
    { key: 'story', label: 'Career Story', score: profile.currentTitle || profile.careerTrack || profile.experience ? 15 : 0 },
    { key: 'skills', label: 'Skills', score: (profile.skills || []).length ? 15 : 0 },
    { key: 'interests', label: 'Interests', score: (profile.interests || []).length ? 10 : 0 },
    { key: 'education', label: 'Education', score: profile.education || profile.educationEntries ? 15 : 0 },
    { key: 'proof', label: 'Proof', score: projectCount || certificationCount || githubCount ? 10 : 0 },
  ];

  const rawScore = sections.reduce((total, section) => total + section.score, 0);
  const score = Math.max(0, Math.min(100, rawScore + (profile.avatar ? 5 : 0) + (profile.age ? 0 : 0)));

  return {
    score,
    sections,
    missing: sections.filter((section) => section.score === 0).map((section) => section.label),
  };
}

function buildProjectRecord(userId: string, input: PortfolioProjectInput, source = 'manual') {
  return {
    userId,
    title: input.title.trim(),
    description: input.description?.trim() || null,
    techStack: normalizeTextArray(input.techStack),
    highlights: normalizeTextArray(input.highlights),
    liveUrl: input.liveUrl || null,
    repoUrl: input.repoUrl || null,
    featured: Boolean(input.featured),
    source,
  };
}

function buildCertificationRecord(userId: string, input: CertificationInput) {
  return {
    userId,
    title: input.title.trim(),
    issuer: input.issuer.trim(),
    credentialId: input.credentialId?.trim() || null,
    credentialUrl: input.credentialUrl || null,
    issuedAt: input.issuedAt || null,
    expiresAt: input.expiresAt || null,
    description: input.description?.trim() || null,
  };
}

function toObjectId(id: string) {
  if (!ObjectId.isValid(id)) {
    throw new BadRequestError('Invalid identifier');
  }

  return new ObjectId(id);
}

async function withBuilderCollections<T>(callback: (collections: {
  projects: Collection<any>;
  certifications: Collection<any>;
}) => Promise<T>) {
  const client = new MongoClient(getMongoUrl());

  try {
    await client.connect();
    const db = client.db('Pragyan');
    return await callback({
      projects: db.collection('UserPortfolioProject'),
      certifications: db.collection('UserCertification'),
    });
  } finally {
    await client.close();
  }
}

function mapProjectDocument(project: any) {
  return {
    id: project._id.toString(),
    userId: project.userId.toString(),
    title: project.title,
    description: project.description ?? null,
    techStack: Array.isArray(project.techStack) ? project.techStack : [],
    highlights: Array.isArray(project.highlights) ? project.highlights : [],
    liveUrl: project.liveUrl ?? null,
    repoUrl: project.repoUrl ?? null,
    featured: Boolean(project.featured),
    source: project.source || 'manual',
    createdAt: project.createdAt?.toISOString?.() || new Date().toISOString(),
    updatedAt: project.updatedAt?.toISOString?.() || new Date().toISOString(),
  };
}

function mapCertificationDocument(certification: any) {
  return {
    id: certification._id.toString(),
    userId: certification.userId.toString(),
    title: certification.title,
    issuer: certification.issuer,
    credentialId: certification.credentialId ?? null,
    credentialUrl: certification.credentialUrl ?? null,
    issuedAt: certification.issuedAt ? certification.issuedAt.toISOString() : null,
    expiresAt: certification.expiresAt ? certification.expiresAt.toISOString() : null,
    description: certification.description ?? null,
    createdAt: certification.createdAt?.toISOString?.() || new Date().toISOString(),
    updatedAt: certification.updatedAt?.toISOString?.() || new Date().toISOString(),
  };
}

class ProfileBuilderService {
  async getProfile(userId: string) {
    const [user, linkedAccounts, githubRepositories, snapshot] = await Promise.all([
      authService.getUserById(userId),
      authService.getProviderStatus(userId),
      prisma.githubRepository.findMany({
        where: { userId },
        orderBy: [{ pushedAt: 'desc' }, { updatedAt: 'desc' }],
      }),
      withBuilderCollections(async ({ projects, certifications }) => {
        const userObjectId = toObjectId(userId);
        const [projectDocs, certificationDocs] = await Promise.all([
          projects.find({ userId: userObjectId }).sort({ featured: -1, updatedAt: -1 }).toArray(),
          certifications.find({ userId: userObjectId }).sort({ issuedAt: -1, updatedAt: -1 }).toArray(),
        ]);

        return {
          projects: projectDocs,
          certifications: certificationDocs,
        };
      }),
    ]);

    const { projects, certifications } = snapshot;

    const completion = computeCompletionScore(
      user,
      projects.length,
      certifications.length,
      githubRepositories.length
    );

    return {
      user,
      providerStatus: linkedAccounts,
      completion,
      githubRepositories,
      projects: projects.map(mapProjectDocument),
      certifications: certifications.map(mapCertificationDocument),
    };
  }

  async saveProject(userId: string, input: PortfolioProjectInput, projectId?: string) {
    return withBuilderCollections(async ({ projects }) => {
      const userObjectId = toObjectId(userId);
      if (projectId) {
        const existing = await projects.findOne({ _id: toObjectId(projectId), userId: userObjectId });
        if (!existing) {
          throw new NotFoundError('Project not found');
        }

        const now = new Date();
        await projects.updateOne(
          { _id: existing._id },
          {
            $set: {
              ...buildProjectRecord(userId, input),
              userId: userObjectId,
              updatedAt: now,
            },
          }
        );

        const updated = await projects.findOne({ _id: existing._id });
        return updated ? mapProjectDocument(updated) : null;
      }

      const now = new Date();
      const result = await projects.insertOne({
        ...buildProjectRecord(userId, input),
        userId: userObjectId,
        createdAt: now,
        updatedAt: now,
      });

      const created = await projects.findOne({ _id: result.insertedId });
      return created ? mapProjectDocument(created) : null;
    });
  }

  async deleteProject(userId: string, projectId: string) {
    return withBuilderCollections(async ({ projects }) => {
      const result = await projects.deleteOne({ _id: toObjectId(projectId), userId: toObjectId(userId) });
      if (!result.deletedCount) {
        throw new NotFoundError('Project not found');
      }

      return { deleted: true };
    });
  }

  async saveCertification(userId: string, input: CertificationInput, certificationId?: string) {
    return withBuilderCollections(async ({ certifications }) => {
      const userObjectId = toObjectId(userId);
      if (certificationId) {
        const existing = await certifications.findOne({ _id: toObjectId(certificationId), userId: userObjectId });
        if (!existing) {
          throw new NotFoundError('Certification not found');
        }

        const now = new Date();
        await certifications.updateOne(
          { _id: existing._id },
          {
            $set: {
              ...buildCertificationRecord(userId, input),
              userId: userObjectId,
              updatedAt: now,
            },
          }
        );

        const updated = await certifications.findOne({ _id: existing._id });
        return updated ? mapCertificationDocument(updated) : null;
      }

      const now = new Date();
      const result = await certifications.insertOne({
        ...buildCertificationRecord(userId, input),
        userId: userObjectId,
        createdAt: now,
        updatedAt: now,
      });

      const created = await certifications.findOne({ _id: result.insertedId });
      return created ? mapCertificationDocument(created) : null;
    });
  }

  async deleteCertification(userId: string, certificationId: string) {
    return withBuilderCollections(async ({ certifications }) => {
      const result = await certifications.deleteOne({ _id: toObjectId(certificationId), userId: toObjectId(userId) });
      if (!result.deletedCount) {
        throw new NotFoundError('Certification not found');
      }

      return { deleted: true };
    });
  }

  async importGithubRepositories(userId: string, input: GithubImportInput) {
    const repositories = await prisma.githubRepository.findMany({
      where: {
        userId,
        repoId: { in: input.repoIds },
      },
    });

    if (!repositories.length) {
      throw new BadRequestError('No matching repositories found to import');
    }

    const createdProjects = await Promise.all(
      repositories.map((repository) =>
        this.saveProject(userId, {
          title: repository.name,
          description: repository.description || `Imported from GitHub repository ${repository.fullName}`,
          techStack: repository.language ? [repository.language] : [],
          highlights: repository.defaultBranch ? [`Default branch: ${repository.defaultBranch}`] : [],
          repoUrl: repository.htmlUrl,
          featured: repository.stars > 0,
        }, undefined)
      )
    );

    return createdProjects;
  }
}

export const profileBuilderService = new ProfileBuilderService();
export { computeCompletionScore };
