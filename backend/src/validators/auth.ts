// src/validators/auth.ts

import { z } from 'zod';

export const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
  role: z.enum(['STUDENT', 'RECRUITER', 'PLACEMENT_OFFICER']).optional().default('STUDENT'),
  collegeCode: z.string().max(50).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required').optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const verifyResetOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().regex(/^\d{6}$/, 'OTP must be a 6-digit code'),
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters').max(100),
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
  preferences: z.union([
    z.array(z.string().trim().min(1)).max(50),
    z.record(z.unknown()),
  ]).optional(),
  educationEntries: z.array(educationEntrySchema).max(20).optional(),
  experience: z.string().trim().max(1000).optional(),
  experienceType: z.enum(['experienced', 'fresher']).optional(),
  education: z.string().trim().max(1000).optional(),
  bio: z.string().trim().max(2000).optional(),
  githubUrl: z.string().trim().max(200).optional(),
  portfolioWebsite: z.string().trim().max(200).optional(),
  username: z.string().trim().max(80).optional(),
  preferredCareerDomain: z.string().trim().max(120).optional(),
  dateOfBirth: z.union([z.string().trim().max(30), z.date()]).optional(),
  skillLevel: z.string().trim().max(50).optional(),
  tenthBoard: z.string().trim().max(80).optional(),
  tenthScore: z.string().trim().max(30).optional(),
  twelfthBoard: z.string().trim().max(80).optional(),
  twelfthScore: z.string().trim().max(30).optional(),
  currentCourse: z.string().trim().max(160).optional(),
  cgpa: z.string().trim().max(30).optional(),
  // ── Phase 1 profile fields ─────────────────────────────────────────────────
  gender: z.enum(['Male', 'Female', 'Non-binary', 'Prefer not to say']).optional(),
  country: z.string().trim().max(100).optional(),
  state: z.string().trim().max(100).optional(),
  city: z.string().trim().max(100).optional(),
  firstName: z.string().trim().max(50).optional(),
  lastName: z.string().trim().max(50).optional(),
  currentStatus: z.string().trim().max(80).optional(),
  collegeName: z.string().trim().max(200).optional(),
  university: z.string().trim().max(200).optional(),
  degree: z.string().trim().max(120).optional(),
  branch: z.string().trim().max(120).optional(),
  currentYear: z.string().trim().max(20).optional(),
  expectedGraduationYear: z.coerce.number().int().min(2000).max(2040).optional().nullable(),
  programmingExperience: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional(),
  previouslyWorked: z.boolean().optional(),
  yearsOfExperience: z.coerce.number().min(0).max(50).optional().nullable(),
  currentCompany: z.string().trim().max(200).optional(),
  currentRole: z.string().trim().max(120).optional(),
  careerGoal: z.string().trim().max(120).optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one profile field is required',
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type VerifyResetOtpInput = z.infer<typeof verifyResetOtpSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type EducationEntryInput = z.infer<typeof educationEntrySchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
