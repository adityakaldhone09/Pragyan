import { z } from 'zod';

export const careerIntelligenceSchema = z.object({
  category: z.string().optional(),
  interest: z.string().optional(),
  interests: z.array(z.string().min(1)).optional(),
  skills: z.array(z.string().min(1)).optional(),
  qualification: z.string().optional(),
  preferredSubjects: z.array(z.string().min(1)).optional(),
  subjects: z.array(z.string().min(1)).optional(),
  personality: z.array(z.string().min(1)).optional(),
  personalityTraits: z.array(z.string().min(1)).optional(),
  goal: z.string().optional(),
  careerGoals: z.array(z.string().min(1)).optional(),
  age: z.number().int().positive().optional(),
  stream: z.string().optional(),
}).partial();
