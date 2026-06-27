import { z } from 'zod';

export const noteFormatSchema = z.enum(['pdf', 'markdown', 'text']);

export const generateNoteSchema = z.object({
  topic: z.string().trim().min(1).max(180).optional(),
  responseText: z.string().trim().min(1).max(12000),
  source: z.string().trim().min(1).max(80).optional().default('ai-counselor'),
  sourceMessageId: z.string().trim().max(120).optional(),
  format: noteFormatSchema,
}).passthrough();

export const listNotesQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  format: noteFormatSchema.optional(),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
}).passthrough();

export type GenerateNoteInput = z.infer<typeof generateNoteSchema>;
export type ListNotesQuery = z.infer<typeof listNotesQuerySchema>;
