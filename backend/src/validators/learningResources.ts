import { z } from 'zod';

export const LearningResourceQuerySchema = z.object({
  roadmapId: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  skill: z.string().min(1).optional(),
  topic: z.string().min(1).optional(),
  type: z.string().min(1).optional(),
  difficulty: z.string().min(1).optional(),
  dayNumber: z.coerce.number().int().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(24),
});

export const LearningResourceRecommendationQuerySchema = z.object({
  roadmapId: z.string().min(1),
  category: z.string().min(1).optional(),
  dayNumber: z.coerce.number().int().min(1).optional(),
  refresh: z.coerce.boolean().optional(),
});

export const ResourceHistoryUpsertSchema = z.object({
  resourceId: z.string().min(1),
  roadmapId: z.string().min(1).optional(),
  completed: z.boolean().default(false),
  progressPercent: z.coerce.number().int().min(0).max(100).default(0),
  quizScore: z.coerce.number().int().min(0).max(100).optional(),
  notes: z.string().max(1000).optional(),
  source: z.string().max(50).optional(),
});

export type LearningResourceQueryInput = z.infer<typeof LearningResourceQuerySchema>;
export type LearningResourceRecommendationQueryInput = z.infer<typeof LearningResourceRecommendationQuerySchema>;
export type ResourceHistoryUpsertInput = z.infer<typeof ResourceHistoryUpsertSchema>;

export default {
  LearningResourceQuerySchema,
  LearningResourceRecommendationQuerySchema,
  ResourceHistoryUpsertSchema,
};