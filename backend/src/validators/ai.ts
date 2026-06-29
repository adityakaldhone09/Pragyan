import { z } from 'zod';

const boundedString = (max = 4000) => z.string().trim().min(1).max(max);

export const aiChatSchema = z.object({
  message: boundedString(3000),
  context: z.record(z.unknown()).optional().default({}),
  history: z.array(
    z.object({
      role: z.enum(['user', 'assistant']).optional(),
      content: z.string().max(3000).optional(),
    }).passthrough()
  ).max(12).optional().default([]),
}).passthrough();

export const personalizedRoadmapSchema = z.object({
  careerGoal: boundedString(160),
  skillLevel: boundedString(80),
}).passthrough();

export const dailyPlanSchema = z.object({
  roadmapTitle: boundedString(200),
  roadmapCategory: z.string().max(120).optional(),
  currentDay: z.coerce.number().int().positive().max(1000).optional(),
  completedTopics: z.array(z.string().max(160)).max(200).optional(),
  weakSkills: z.array(z.string().max(120)).max(100).optional(),
  level: z.string().max(80).optional(),
  availableTime: z.coerce.number().int().positive().max(720).optional(),
  missedDays: z.coerce.number().int().min(0).max(365).optional(),
  streak: z.coerce.number().int().min(0).max(3650).optional(),
  currentFocus: z.string().max(200).optional(),
  currentTopics: z.array(z.string().max(160)).max(100).optional(),
  quizScore: z.coerce.number().min(0).max(100).optional(),
}).passthrough();

export const assessmentReportSchema = z.object({
  topMatches: z.array(z.unknown()).min(1).max(20),
  confidence: z.coerce.number().min(0).max(100).optional(),
  strengths: z.array(z.string().max(160)).max(50).optional(),
  weaknesses: z.array(z.string().max(160)).max(50).optional(),
  targetCareer: z.string().max(160).optional(),
}).passthrough();

export const learningRoadmapGenerationSchema = z.object({
  targetCareer: boundedString(160),
  skillGaps: z.array(z.string().max(160)).max(100).optional(),
  timelineWeeks: z.coerce.number().int().positive().max(104).optional(),
  profileSummary: z.string().max(3000).optional(),
}).passthrough();

export const resumeUploadSchema = z.object({
  fileName: z.string().max(255),
  mimeType: z.enum(['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']),
  sizeBytes: z.coerce.number().int().positive().max(5 * 1024 * 1024),
}).passthrough();

export type AIChatInput = z.infer<typeof aiChatSchema>;
