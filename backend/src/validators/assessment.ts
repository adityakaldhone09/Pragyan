/**
 * Assessment Phase Validation Schemas
 */

import { z } from 'zod';

// ── PHASE 1: User Profile Collection ──────────────────────────────────────────

const PersonalInfoSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  age: z.number().int().min(13, 'Age must be at least 13').max(100, 'Age must be less than 100'),
  gender: z.enum(['Male', 'Female', 'Other']),
  country: z.string().min(1, 'Country is required'),
  state: z.string().min(1, 'State is required'),
  city: z.string().min(1, 'City is required'),
});

const EducationSchema = z.object({
  currentStatus: z.enum(['College Student', 'School Student', 'Working Professional', 'Fresher', 'Other']),
  highestQualification: z.string().min(1, 'Highest qualification is required'),
  currentYear: z.string().optional(),
  degree: z.string().optional(),
  branch: z.string().optional(),
  collegeName: z.string().optional(),
  university: z.string().optional(),
  cgpaOrPercentage: z.number().optional(),
  expectedGraduationYear: z.number().optional(),
});

const ExperienceSchema = z.object({
  programmingExperience: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Expert']),
  previouslyWorked: z.boolean(),
  yearsOfExperience: z.number().optional(),
  currentCompany: z.string().optional(),
  currentRole: z.string().optional(),
});

export const phase1Schema = z.object({
  personalInfo: PersonalInfoSchema,
  education: EducationSchema,
  careerGoal: z.string().min(1, 'Career goal is required'),
  experience: ExperienceSchema,
});

export type Phase1Input = z.infer<typeof phase1Schema>;

// ── PHASE 2: Interest & Domain Discovery ──────────────────────────────────────

export const phase2Schema = z.object({
  careerObjective: z.string().min(1, 'Career objective is required'),
  preferredDomains: z.array(z.string()).min(1, 'At least one domain is required'),
  favoriteSubjects: z.array(z.string()).min(3, 'At least 3 subjects are required'),
  skillConfidence: z.number().int().min(1).max(10).optional(),
  workStyle: z.array(z.string()).min(1, 'At least one work style is required'),
  learningStyle: z.array(z.string()).min(1, 'At least one learning style is required'),
  motivation: z.string().min(1, 'Motivation is required'),
});

export type Phase2Input = z.infer<typeof phase2Schema>;

// ── PHASE 3: Adaptive Assessment ──────────────────────────────────────────────

export const phase3AnswerSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  questionId: z.string().min(1, 'Question ID is required'),
  answer: z.string().min(1, 'Answer is required'),
});

export type Phase3Answer = z.infer<typeof phase3AnswerSchema>;

// ── PHASE 4: Technical Assessment ─────────────────────────────────────────────

export const phase4AnswerSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  questionId: z.string().min(1, 'Question ID is required'),
  answer: z.string().min(1, 'Answer is required'),
});

export const phase4SubmitSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
});

export type Phase4Answer = z.infer<typeof phase4AnswerSchema>;
export type Phase4Submit = z.infer<typeof phase4SubmitSchema>;

// ── PHASE 5: Specialization Detection ────────────────────────────────────────

export const phase5AnswerSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  questionId: z.string().min(1, 'Question ID is required'),
  answer: z.string().min(1, 'Answer is required'),
});

export const phase5SubmitSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
});

export type Phase5Answer = z.infer<typeof phase5AnswerSchema>;
export type Phase5Submit = z.infer<typeof phase5SubmitSchema>;

// ── PHASE 6: Confidence Validation ───────────────────────────────────────────

export const phase6AnswerSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  questionId: z.string().min(1, 'Question ID is required'),
  answer: z.string().min(1, 'Answer is required'),
});

export const phase6ValidateSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
});

export type Phase6Answer = z.infer<typeof phase6AnswerSchema>;
export type Phase6Validate = z.infer<typeof phase6ValidateSchema>;

// ── PHASE 7: Final Report ────────────────────────────────────────────────────

// No additional validation needed - just needs authentication

export const assessment = {
  phase1Schema,
  phase2Schema,
  phase3AnswerSchema,
  phase4AnswerSchema,
  phase4SubmitSchema,
  phase5AnswerSchema,
  phase5SubmitSchema,
  phase6AnswerSchema,
  phase6ValidateSchema,
};
