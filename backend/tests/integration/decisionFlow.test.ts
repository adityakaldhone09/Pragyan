jest.mock('@/lib/redis');

import request from 'supertest';
import app from '@/app';

// In-memory fake for prisma.assessmentPath
const fakeDb: Record<string, any> = {};

jest.mock('@/lib/prisma', () => ({
  prisma: {
    assessmentPath: {
      create: jest.fn(async ({ data }: any) => {
        const id = '000000000000000000000001';
        const rec = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
        fakeDb[id] = rec;
        return rec;
      }),
      update: jest.fn(async ({ where, data }: any) => {
        const id = where.id;
        fakeDb[id] = { ...fakeDb[id], ...data, updatedAt: new Date() };
        return fakeDb[id];
      }),
      findUnique: jest.fn(async ({ where }: any) => {
        return fakeDb[where.id] || null;
      })
    }
  }
}));

// Mock roadmap generator to avoid heavy AI calls
jest.mock('@/services/ai-recommendation', () => ({
  aiRecommendationService: {
    generatePersonalizedRoadmap: jest.fn().mockResolvedValue({ roadmap: 'generated-roadmap' })
  }
}));

import { generateAccessToken } from '@/utils/jwt';

describe('Decision Tree API flow integration', () => {
  let assessmentPathId: string;
  const userId = 'user-integ-1';
  const token = generateAccessToken({ id: userId, role: 'USER' } as any);

  test('start -> next -> complete -> result', async () => {
    // Start
    const startRes = await request(app).get(`/api/assessment/decision/start`).query({ userId });
    expect(startRes.status).toBe(200);
    expect(startRes.body.success).toBe(true);
    assessmentPathId = startRes.body.data.assessmentPathId;
    expect(assessmentPathId).toBeDefined();

    // Answer: choose government
    const next1 = await request(app).post('/api/assessment/decision/next').send({ assessmentPathId, nodeId: 'career_category', answer: 'government' });
    expect(next1.status).toBe(200);
    expect(next1.body.success).toBe(true);
    const node = next1.body.data.next;
    expect(node).toBeDefined();

    // Answer: choose defence
    const next2 = await request(app).post('/api/assessment/decision/next').send({ assessmentPathId, nodeId: 'government_sector', answer: 'defence' });
    expect(next2.status).toBe(200);
    expect(next2.body.success).toBe(true);

    // Answer: choose branch army
    const next3 = await request(app).post('/api/assessment/decision/next').send({ assessmentPathId, nodeId: 'defence_branches', answer: 'army' });
    expect(next3.status).toBe(200);

    // Complete (authenticated)
    const complete = await request(app).post('/api/assessment/decision/complete').set('Authorization', `Bearer ${token}`).send({ assessmentPathId });
    expect(complete.status).toBe(200);
    expect(complete.body.success).toBe(true);
    expect(complete.body.data.result).toBeDefined();
    expect(Array.isArray(complete.body.data.result.recommendedRoles)).toBe(true);

    // Get result (authenticated)
    const getRes = await request(app).get(`/api/assessment/decision/result/${assessmentPathId}`).set('Authorization', `Bearer ${token}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.success).toBe(true);
    expect(getRes.body.data.resolved.careerPath).toBeDefined();
  });
});
