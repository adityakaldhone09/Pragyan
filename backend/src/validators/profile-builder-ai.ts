import { z } from 'zod';

export const profileCoachSchema = z.object({
  summary: z.string(),
  completionScore: z.number().min(0).max(100),
  strengths: z.array(z.string()).max(10),
  missingFields: z.array(z.string()).max(10),
  nextSteps: z.array(z.string()).max(8),
  suggestedHeadline: z.string().max(140),
  suggestedCareerTrack: z.string().max(140),
});

export type ProfileCoachResult = z.infer<typeof profileCoachSchema>;
