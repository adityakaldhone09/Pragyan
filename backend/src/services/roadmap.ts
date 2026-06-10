// src/services/roadmap.ts

import { Prisma } from '@prisma/client';
import { MongoClient } from 'mongodb';
import { prisma } from '@/lib/prisma';
import { config } from '@/config/env';
import { NotFoundError } from '@/utils/errors';
import { CreateRoadmapInput, SearchRoadmapInput } from '@/validators/roadmap';

function toJsonValue<T>(value: T): Prisma.InputJsonValue {
  return value as unknown as Prisma.InputJsonValue;
}

function mapRoadmapDocument(document: any) {
  return {
    id: String(document._id ?? document.id),
    title: document.title,
    category: document.category,
    careerPath: document.careerPath ?? null,
    difficulty: document.difficulty ?? null,
    description: document.description,
    level: document.level,
    duration: document.duration,
    icon: document.icon,
    estimatedHours: document.estimatedHours,
    requiredSkills: document.requiredSkills ?? [],
    learningStructure: document.learningStructure ?? [],
    milestones: document.milestones ?? [],
    progression: document.progression ?? [],
    tags: document.tags ?? [],
    progress: document.progress ?? undefined,
  };
}

let roadmapMongoClientPromise: Promise<MongoClient> | null = null;

async function getRoadmapCollection() {
  const url = config.database.url;
  if (!url) {
    throw new Error('DATABASE_URL is not configured');
  }

  if (!roadmapMongoClientPromise) {
    const client = new MongoClient(url);
    roadmapMongoClientPromise = client.connect();
  }

  const client = await roadmapMongoClientPromise;
  const dbName = new URL(url).pathname.replace(/^\/+/, '') || 'Pragyan';
  return client.db(dbName).collection('Roadmap');
}

export class RoadmapService {
  async createRoadmap(input: CreateRoadmapInput) {
    const roadmap = await prisma.roadmap.create({
      data: {
        title: input.title,
        category: input.category,
        careerPath: input.careerPath || null,
        difficulty: input.difficulty || input.level,
        description: input.description,
        level: input.level,
        duration: input.duration,
        icon: input.icon || '📚',
        estimatedHours: input.estimatedHours,
        requiredSkills: input.requiredSkills || [],
        ...(input.learningStructure !== undefined ? { learningStructure: toJsonValue(input.learningStructure) } : {}),
        ...(input.milestones !== undefined ? { milestones: toJsonValue(input.milestones) } : {}),
        ...(input.progression !== undefined ? { progression: toJsonValue(input.progression) } : {}),
        tags: input.tags || [],
      },
    });

    return roadmap;
  }

  async getRoadmapById(id: string) {
    const roadmap = await prisma.roadmap.findUnique({
      where: { id },
      include: {
        weeks: {
          include: {
            days: {
              include: {
                tasks: true,
              },
            },
          },
          orderBy: {
            weekNumber: 'asc',
          },
        },
      },
    });

    if (!roadmap) {
      throw new NotFoundError('Roadmap not found');
    }

    return roadmap;
  }

  async getAllRoadmaps(input: SearchRoadmapInput) {
    const { query, category, careerPath, level, page, limit } = input;

    const where: any = {};

    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { category: { contains: query, mode: 'insensitive' } },
        { careerPath: { contains: query, mode: 'insensitive' } },
        { requiredSkills: { hasSome: [query] } },
        { tags: { hasSome: [query] } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (careerPath) {
      where.careerPath = careerPath;
    }

    if (level) {
      where.level = level;
    }

    const [roadmaps, total] = await Promise.all([
      prisma.roadmap.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.roadmap.count({ where }),
    ]);

    return {
      roadmaps,
      total,
      page,
      limit,
    };
  }

  async getRoadmapsByCategory(category: string, page: number = 1, limit: number = 10) {
    const [roadmaps, total] = await Promise.all([
      prisma.roadmap.findMany({
        where: { category },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.roadmap.count({ where: { category } }),
    ]);

    return {
      roadmaps,
      total,
      page,
      limit,
    };
  }

  async updateRoadmap(id: string, input: Partial<CreateRoadmapInput>) {
    const roadmap = await prisma.roadmap.update({
      where: { id },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.category !== undefined ? { category: input.category } : {}),
        ...(input.careerPath !== undefined ? { careerPath: input.careerPath } : {}),
        ...(input.difficulty !== undefined ? { difficulty: input.difficulty } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.level !== undefined ? { level: input.level } : {}),
        ...(input.duration !== undefined ? { duration: input.duration } : {}),
        ...(input.icon !== undefined ? { icon: input.icon } : {}),
        ...(input.estimatedHours !== undefined ? { estimatedHours: input.estimatedHours } : {}),
        ...(input.requiredSkills !== undefined ? { requiredSkills: input.requiredSkills } : {}),
        ...(input.learningStructure !== undefined ? { learningStructure: toJsonValue(input.learningStructure) } : {}),
        ...(input.milestones !== undefined ? { milestones: toJsonValue(input.milestones) } : {}),
        ...(input.progression !== undefined ? { progression: toJsonValue(input.progression) } : {}),
        ...(input.tags !== undefined ? { tags: input.tags } : {}),
      },
    });

    return roadmap;
  }

  async deleteRoadmap(id: string) {
    await prisma.roadmap.delete({
      where: { id },
    });
  }

  async searchRoadmaps(query: string) {
    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      return [];
    }

    try {
      const collection = await getRoadmapCollection();
      const results = await collection
        .find(
          { $text: { $search: normalizedQuery } },
          {
            projection: {
              title: 1,
              category: 1,
              careerPath: 1,
              difficulty: 1,
              description: 1,
              level: 1,
              duration: 1,
              icon: 1,
              estimatedHours: 1,
              requiredSkills: 1,
              learningStructure: 1,
              milestones: 1,
              progression: 1,
              tags: 1,
              score: { $meta: 'textScore' },
            },
          }
        )
        .sort({ score: { $meta: 'textScore' }, updatedAt: -1 })
        .limit(20)
        .toArray();

      return results.map(mapRoadmapDocument);
    } catch {
      const roadmaps = await prisma.roadmap.findMany({
        where: {
          OR: [
            { title: { contains: normalizedQuery, mode: 'insensitive' } },
            { description: { contains: normalizedQuery, mode: 'insensitive' } },
            { category: { contains: normalizedQuery, mode: 'insensitive' } },
            { careerPath: { contains: normalizedQuery, mode: 'insensitive' } },
            { requiredSkills: { hasSome: [normalizedQuery] } },
            { tags: { hasSome: [normalizedQuery] } },
          ],
        },
        take: 20,
      });

      return roadmaps;
    }
  }

  async getCategories() {
    const categories = await prisma.roadmap.findMany({
      distinct: ['category'],
      select: { category: true },
    });

    return categories.map((r) => r.category);
  }
}

export const roadmapService = new RoadmapService();
