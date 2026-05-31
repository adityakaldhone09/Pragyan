// src/validators/auth.ts

import { z } from 'zod';

export const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const educationEntrySchema = z.object({
  qualification: z.string().trim().min(2, 'Qualification is required').max(150),
  city: z.string().trim().min(2, 'City is required').max(100),
  percentage: z.coerce.number().min(0, 'Percentage must be at least 0').max(100, 'Percentage must be at most 100'),
});

export const profileUpdateSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').max(100).optional(),
  avatar: z.string().trim().max(200000).optional().nullable(),
  age: z.coerce.number().int().positive().optional(),
  location: z.string().trim().max(100).optional(),
  phone: z.string().trim().max(30).optional(),
  linkedin: z.string().trim().max(200).optional(),
  currentTitle: z.string().trim().max(120).optional(),
  careerTrack: z.string().trim().max(120).optional(),
  skills: z.array(z.string().trim().min(1)).max(50).optional(),
  interests: z.array(z.string().trim().min(1)).max(50).optional(),
  preferences: z.array(z.string().trim().min(1)).max(50).optional(),
  educationEntries: z.array(educationEntrySchema).max(20).optional(),
  experience: z.string().trim().max(1000).optional(),
  experienceType: z.enum(['experienced', 'fresher']).optional(),
  education: z.string().trim().max(1000).optional(),
  skillLevel: z.string().trim().max(50).optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one profile field is required',
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type EducationEntryInput = z.infer<typeof educationEntrySchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
