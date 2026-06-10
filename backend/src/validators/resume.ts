import { z } from 'zod';

export const generateResumeSchema = z.object({
  regenerate: z.boolean().optional(),
});

export type GenerateResumeInput = z.infer<typeof generateResumeSchema>;
