import { Request, Response } from 'express';
import { prisma } from '@/lib/prisma';
import { MongoClient } from 'mongodb';
import redisClient from '@/lib/redis';
import { asyncHandler } from '@/middleware/errorHandler';
import { sendError, sendSuccess } from '@/utils/response';

const mongoUrl = process.env.DATABASE_URL;
const mongoDbName = process.env.DB_NAME || 'Pragyan';

export const getAdminDashboard = asyncHandler(async (_req: Request, res: Response) => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  let currentUserCount = 0;
  let activeCurrentUserCount = 0;
  let adminUserCount = 0;

  if (mongoUrl) {
    const client = new MongoClient(mongoUrl);
    try {
      await client.connect();
      const db = client.db(mongoDbName);
      const currentUsersCollection = db.collection('CurrentUser');
      const adminUsersCollection = db.collection('AdminUser');
      currentUserCount = await currentUsersCollection.countDocuments();
      activeCurrentUserCount = await currentUsersCollection.countDocuments({ active: true });
      adminUserCount = await adminUsersCollection.countDocuments();
    } finally {
      await client.close();
    }
  }

  const [
    totalUsers,
    activeUsers,
    roadmapCount,
    skillCount,
    assessmentCount,
    resourceCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { updatedAt: { gte: sevenDaysAgo } } }),
    prisma.roadmap.count(),
    prisma.skill.count(),
    prisma.assessmentSession.count(),
    prisma.resource.count(),
  ]);

  return sendSuccess(res, {
    totalUsers,
    activeUsers,
    currentUserCount,
    activeCurrentUserCount,
    adminUserCount,
    roadmapCount,
    skillCount,
    assessmentCount,
    resourceCount,
  }, 200, 'Admin dashboard analytics fetched');
});

export const getUsers = asyncHandler(async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      xp: true,
      streak: true,
      createdAt: true,
      updatedAt: true,
    },
    take: 500,
  });

  return sendSuccess(res, users, 200, 'Users fetched');
});

export const getCurrentUsers = asyncHandler(async (_req: Request, res: Response) => {
  if (!mongoUrl) {
    return sendError(res, 500, 'DATABASE_URL is not configured');
  }

  const client = new MongoClient(mongoUrl);
  try {
    await client.connect();

    const currentUsers = await client
      .db(mongoDbName)
      .collection('CurrentUser')
      .find({})
      .sort({ updatedAt: -1 })
      .limit(500)
      .toArray();

    return sendSuccess(res, currentUsers, 200, 'Current users fetched');
  } finally {
    await client.close();
  }
});

export const updateUserRole = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { role } = req.body as { role?: string };

  if (!role || !['USER', 'ADMIN'].includes(role)) {
    return sendError(res, 400, 'Role must be USER or ADMIN');
  }

  const user = await prisma.user.update({
    where: { id },
    data: { role },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      updatedAt: true,
    },
  });

  if (mongoUrl) {
    const client = new MongoClient(mongoUrl);
    try {
      await client.connect();
      const db = client.db(mongoDbName);
      const adminUsersCollection = db.collection('AdminUser');
      const objectId = new (await import('mongodb')).ObjectId(id);
      const currentUser = await db.collection('User').findOne({ _id: objectId });

      if (role === 'ADMIN' && currentUser) {
        await adminUsersCollection.updateOne(
          { _id: objectId },
          {
            $set: {
              userId: objectId,
              email: currentUser.email,
              fullName: currentUser.fullName,
              role: currentUser.role,
              xp: currentUser.xp ?? 0,
              streak: currentUser.streak ?? 0,
              updatedAt: new Date(),
            },
            $setOnInsert: {
              createdAt: new Date(),
            },
          },
          { upsert: true }
        );
      } else {
        await adminUsersCollection.deleteOne({ _id: objectId });
      }
    } finally {
      await client.close();
    }
  }

  return sendSuccess(res, user, 200, 'User role updated');
});

export const getRoadmapStats = asyncHandler(async (_req: Request, res: Response) => {
  const [roadmaps, userProgress] = await Promise.all([
    prisma.roadmap.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        id: true,
        title: true,
        category: true,
        level: true,
        estimatedHours: true,
        createdAt: true,
      },
    }),
    prisma.userProgress.findMany({
      select: {
        roadmapId: true,
        progressPercentage: true,
        completedTasks: true,
      },
    }),
  ]);

  return sendSuccess(res, { roadmaps, userProgress }, 200, 'Roadmap stats fetched');
});

export const getResources = asyncHandler(async (_req: Request, res: Response) => {
  const resources = await prisma.resource.findMany({
    include: {
      task: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 500,
  });

  return sendSuccess(res, resources, 200, 'Resources fetched');
});

export const createResource = asyncHandler(async (req: Request, res: Response) => {
  const { taskId, title, url, description, platform, type } = req.body as {
    taskId?: string;
    title?: string;
    url?: string;
    description?: string;
    platform?: string;
    type?: string;
  };

  if (!taskId || !title || !url || !platform || !type) {
    return sendError(res, 400, 'taskId, title, url, platform, and type are required');
  }

  const resource = await prisma.resource.create({
    data: {
      taskId,
      title,
      url,
      description,
      platform,
      type,
    },
  });

  return sendSuccess(res, resource, 201, 'Resource created');
});

export const updateResource = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, url, description, platform, type } = req.body as {
    title?: string;
    url?: string;
    description?: string;
    platform?: string;
    type?: string;
  };

  const resource = await prisma.resource.update({
    where: { id },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(url !== undefined ? { url } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(platform !== undefined ? { platform } : {}),
      ...(type !== undefined ? { type } : {}),
    },
  });

  return sendSuccess(res, resource, 200, 'Resource updated');
});

export const deleteResource = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await prisma.resource.delete({ where: { id } });

  return sendSuccess(res, { id }, 200, 'Resource deleted');
});

export const getAssessmentAnalytics = asyncHandler(async (_req: Request, res: Response) => {
  const assessments = await prisma.assessmentSession.findMany({
    orderBy: { completedAt: 'desc' },
    take: 200,
    select: {
      id: true,
      userId: true,
      selectedOptions: true,
      completedAt: true,
      createdAt: true,
    },
  });

  return sendSuccess(res, assessments, 200, 'Assessment analytics fetched');
});

export const getAssessmentCompletionRates = asyncHandler(async (_req: Request, res: Response) => {
  const [totalUsers, completedRows, totalSessions] = await Promise.all([
    prisma.user.count(),
    prisma.assessmentSession.findMany({ select: { userId: true } }),
    prisma.assessmentSession.count(),
  ]);

  const completedUsers = new Set(completedRows.map((row) => row.userId)).size;

  const completionRate = totalUsers ? Math.round((completedUsers / totalUsers) * 100) : 0;

  return sendSuccess(
    res,
    {
      totalUsers,
      completedUsers,
      totalSessions,
      completionRate,
      dropoutRate: 100 - completionRate,
    },
    200,
    'Assessment completion metrics fetched'
  );
});

export const getSecurityMetrics = asyncHandler(async (_req: Request, res: Response) => {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const securityLog = (prisma as any).securityLog;
  const aiUsage = (prisma as any).aIUsage;

  const [
    blockedAIAttacks,
    totalAIRequests,
    rateLimitHits,
    loginFailures,
    replayDetections,
    recentEvents,
    usageToday,
  ] = await Promise.all([
    securityLog.count({ where: { event: 'AI_ATTACK_BLOCKED', createdAt: { gte: since } } }),
    securityLog.count({ where: { event: 'AI_REQUEST', createdAt: { gte: since } } }),
    securityLog.count({ where: { event: 'RATE_LIMIT', createdAt: { gte: since } } }),
    securityLog.count({ where: { event: 'LOGIN_FAILURE', createdAt: { gte: since } } }),
    securityLog.count({ where: { event: 'TOKEN_REPLAY_DETECTED', createdAt: { gte: since } } }),
    securityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 25,
      select: {
        id: true,
        userId: true,
        event: true,
        metadata: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
      },
    }),
    aiUsage.findMany({
      where: { date: new Date().toISOString().slice(0, 10) },
      orderBy: { dailyRequests: 'desc' },
      take: 20,
      select: {
        actorKey: true,
        userId: true,
        dailyRequests: true,
        tokensUsed: true,
        lastRequest: true,
      },
    }),
  ]);

  return sendSuccess(
    res,
    {
      windowHours: 24,
      blockedAIAttacks,
      totalAIRequests,
      suspiciousActivity: loginFailures + replayDetections + blockedAIAttacks,
      rateLimitHits,
      loginFailures,
      replayDetections,
      usageToday,
      recentEvents,
    },
    200,
    'Security metrics fetched'
  );
});

export const createAssessmentQuestion = asyncHandler(async (req: Request, res: Response) => {
  const { assessmentId, questionText, options, category = 'Adaptive' } = req.body || {};
  if (!assessmentId || !questionText || !Array.isArray(options) || !options.length) {
    return sendError(res, 400, 'assessmentId, questionText and options are required');
  }

  const question = await prisma.assessmentQuestion.create({
    data: {
      assessmentId: String(assessmentId),
      questionText: String(questionText),
      options: options.map((item: unknown) => String(item)),
      category: String(category),
    },
  });

  return sendSuccess(res, question, 201, 'Assessment question created');
});

export const upsertDecisionTree = asyncHandler(async (req: Request, res: Response) => {
  const payload = req.body || {};
  await redisClient.set('admin:adaptive:decision-tree', JSON.stringify(payload));
  return sendSuccess(res, { saved: true }, 200, 'Decision tree updated');
});

export const getDecisionTree = asyncHandler(async (_req: Request, res: Response) => {
  const raw = await redisClient.get('admin:adaptive:decision-tree');
  return sendSuccess(res, raw ? JSON.parse(raw) : null, 200, 'Decision tree fetched');
});

export const upsertWeights = asyncHandler(async (req: Request, res: Response) => {
  const payload = req.body || {};
  await redisClient.set('admin:adaptive:weights', JSON.stringify(payload));
  return sendSuccess(res, { saved: true }, 200, 'Adaptive weights updated');
});

export const getWeights = asyncHandler(async (_req: Request, res: Response) => {
  const raw = await redisClient.get('admin:adaptive:weights');
  return sendSuccess(res, raw ? JSON.parse(raw) : null, 200, 'Adaptive weights fetched');
});

export const createCareer = asyncHandler(async (req: Request, res: Response) => {
  const {
    title,
    description,
    category,
    averageSalary,
    jobMarketDemand = 55,
    requiredSkills = [],
    personalityTraits = [],
  } = req.body || {};

  if (!title) {
    return sendError(res, 400, 'title is required');
  }

  const created = await prisma.career.create({
    data: {
      title: String(title),
      description: description ? String(description) : null,
      category: category ? String(category) : null,
      averageSalary: averageSalary ? String(averageSalary) : null,
      jobMarketDemand: Number(jobMarketDemand),
    },
  });

  await Promise.all([
    ...requiredSkills.map((skill: unknown) =>
      prisma.careerSkillMapping.create({
        data: {
          careerId: created.id,
          skill: String(skill),
          importance: 1,
        },
      })
    ),
    ...personalityTraits.map((trait: unknown) =>
      prisma.careerInterestMapping.create({
        data: {
          careerId: created.id,
          interest: String(trait),
          importance: 1,
        },
      })
    ),
  ]);

  return sendSuccess(res, created, 201, 'Career created');
});

export const updateCareerWeights = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { skillWeights = [], interestWeights = [] } = req.body || {};

  await Promise.all([
    ...skillWeights.map((item: any) =>
      prisma.careerSkillMapping.upsert({
        where: { careerId_skill: { careerId: id, skill: String(item.skill) } },
        update: { importance: Number(item.importance || 1) },
        create: {
          careerId: id,
          skill: String(item.skill),
          importance: Number(item.importance || 1),
        },
      })
    ),
    ...interestWeights.map((item: any) =>
      prisma.careerInterestMapping.upsert({
        where: { careerId_interest: { careerId: id, interest: String(item.interest) } },
        update: { importance: Number(item.importance || 1) },
        create: {
          careerId: id,
          interest: String(item.interest),
          importance: Number(item.importance || 1),
        },
      })
    ),
  ]);

  return sendSuccess(res, { updated: true }, 200, 'Career weights updated');
});
