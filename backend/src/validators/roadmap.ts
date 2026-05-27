// src/validators/roadmap.ts

import { z } from 'zod';

const roadmapModuleSchema = z.object({
  title: z.string().min(1),
  completed: z.boolean().optional(),
}).passthrough();

const roadmapMilestoneSchema = z.object({
  week: z.number().int().positive(),
  title: z.string().min(1),
  description: z.string().min(1),
  modules: z.array(roadmapModuleSchema),
}).passthrough();

const roadmapLearningDaySchema = z.object({
  day: z.number().int().positive(),
  focus: z.string().min(1),
  tasks: z.array(z.string().min(1)),
  deliverable: z.string().min(1),
  xp: z.number().int().nonnegative(),
}).passthrough();

const roadmapProgressionSchema = z.object({
  stage: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
  title: z.string().min(1),
  description: z.string().min(1),
}).passthrough();

export const createRoadmapSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  category: z.string().min(1, 'Category is required'),
  careerPath: z.string().min(1).optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
  level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
  duration: z.string().min(1, 'Duration is required'),
  icon: z.string().optional(),
  estimatedHours: z.number().positive('Estimated hours must be positive'),
  requiredSkills: z.array(z.string().min(1)).optional(),
  learningStructure: z.array(roadmapLearningDaySchema).optional(),
  milestones: z.array(roadmapMilestoneSchema).optional(),
  progression: z.array(roadmapProgressionSchema).optional(),
  tags: z.array(z.string()).optional(),
});

export const getRoadmapSchema = z.object({
  id: z.string().cuid(),
});

export const searchRoadmapSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  careerPath: z.string().optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
});

export type CreateRoadmapInput = z.infer<typeof createRoadmapSchema>;
export type SearchRoadmapInput = z.infer<typeof searchRoadmapSchema>;
