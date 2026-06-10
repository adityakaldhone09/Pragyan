import { z } from 'zod';

export const resumeProjectSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(400),
  impact: z.string().max(250),
  technologies: z.array(z.string().min(1)).max(12),
  url: z.string().url().nullable().optional(),
});

export const resumeExperienceSchema = z.object({
  title: z.string().min(1).max(120),
  company: z.string().min(1).max(120),
  period: z.string().max(80),
  description: z.string().max(500),
  achievements: z.array(z.string().min(1)).max(8),
});

export const resumeEducationSchema = z.object({
  school: z.string().min(1).max(120),
  qualification: z.string().min(1).max(160),
  year: z.string().max(40).optional().default(''),
  description: z.string().max(300).optional().default(''),
});

export const resumeCertificationSchema = z.object({
  title: z.string().min(1).max(160),
  issuer: z.string().min(1).max(160),
  date: z.string().max(80).optional().default(''),
  url: z.string().url().nullable().optional(),
});

export const resumeSchema = z.object({
  summary: z.string().min(20).max(800),
  skills: z.array(z.string().min(1)).max(30),
  projects: z.array(resumeProjectSchema).max(10),
  experience: z.array(resumeExperienceSchema).max(10),
  education: z.array(resumeEducationSchema).max(10),
  certifications: z.array(resumeCertificationSchema).max(10),
  achievements: z.array(z.string().min(1)).max(20),
  targetRole: z.string().max(160),
});

export type ResumeSnapshot = z.infer<typeof resumeSchema>;
