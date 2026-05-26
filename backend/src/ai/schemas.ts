import { z } from 'zod';

export const QuestionSchema = z.object({
  id: z.string().min(1),
  question: z.string().min(5).max(400),
  options: z.array(z.string().min(1)).max(20).optional(),
  category: z.string().max(100).optional(),
  type: z.string().max(50).optional(),
  hint: z.string().max(120).optional(),
  dataSourced: z.boolean().optional(),
});

export const QuestionArraySchema = z.array(QuestionSchema).min(1).max(200);

export const CareerAdjustmentSchema = z.object({
  careerId: z.string().min(1),
  adjustment: z.number().gte(-0.1).lte(0.1),
  reason: z.string().min(1).max(300).optional(),
});

export const CareerAdjustmentArraySchema = z.array(CareerAdjustmentSchema).max(100);

export const ExplainRoadmapItem = z.object({
  week: z.number().int().gte(1).lte(52),
  items: z.array(z.string().min(1)).max(20),
});

export const ExplainSchema = z.object({
  summary: z.string().min(10).max(2000),
  skillGaps: z.array(z.string().min(1)).max(50),
  roadmap: z.array(ExplainRoadmapItem).max(52),
  nextActions: z.array(z.string().min(5)).max(10),
  targetLevel: z.enum(['junior', 'mid', 'senior']).optional(),
});

export const RoadmapSectionSchema = z.object({
  id: z.string().min(1).max(80),
  title: z.string().min(1).max(120),
  summary: z.string().min(10).max(500),
  priority: z.number().int().min(1).max(10),
  focusPoints: z.array(z.string().min(1)).max(5),
  roadmapIds: z.array(z.string().min(1)).max(8),
});

export const RoadmapSectionResponseSchema = z.object({
  sections: z.array(RoadmapSectionSchema).min(1).max(8),
});

export const RecommendationCareerSchema = z.object({
  career: z.string().min(1),
  match: z.number().min(0).max(100),
  reason: z.string().max(1000).optional(),
  skillsNeeded: z.array(z.string()).optional(),
  recommendedRoadmaps: z.array(z.string()).optional(),
});

export const RecommendationSchema = z.object({
  topCareers: z.array(RecommendationCareerSchema).max(20),
});

export const CareerEnhancementSchema = z.object({
  careerId: z.string().min(1),
  explanation: z.string().min(5).max(2000).optional(),
  learningSuggestions: z.array(z.string().min(3)).max(20).optional(),
  roadmapSummary: z.string().max(2000).optional(),
  preparationTips: z.array(z.string().min(5)).max(20).optional(),
});

export const CareerEnhancementArraySchema = z.array(CareerEnhancementSchema).max(50);

export type Question = z.infer<typeof QuestionSchema>;
export type Explain = z.infer<typeof ExplainSchema>;

export default {
  QuestionSchema,
  QuestionArraySchema,
  CareerAdjustmentSchema,
  CareerAdjustmentArraySchema,
  ExplainSchema,
  RoadmapSectionSchema,
  RoadmapSectionResponseSchema,
  RecommendationSchema,
};
