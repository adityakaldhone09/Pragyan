import { z } from 'zod';

export const completeLearningSchema = z.object({
  roadmapId: z.string().min(1, 'roadmapId is required'),
  dayNumber: z.coerce.number().int().min(1, 'dayNumber must be at least 1'),
});

export const learningDaySchema = z.object({
  roadmapId: z.string().min(1, 'roadmapId is required').optional(),
  dayNumber: z.coerce.number().int().min(1, 'dayNumber must be at least 1').optional(),
});

export const learningDayParamsSchema = z.object({
  dayId: z.string().min(1, 'dayId is required'),
});

export type CompleteLearningInput = z.infer<typeof completeLearningSchema>;
export type LearningDayInput = z.infer<typeof learningDaySchema>;
