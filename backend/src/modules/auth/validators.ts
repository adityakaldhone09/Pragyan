/**
 * Auth Module - Zod Validators
 */

import { z } from "zod";
import { zxcvbn } from "zxcvbn-ts";
import { HIBPService } from "@/services/hibp.service";

/**
 * Email validation schema
 */
const emailSchema = z
  .string()
  .email("Invalid email format")
  .toLowerCase()
  .trim();

/**
 * Modern password validation schema
 * Uses zxcvbn for strength scoring instead of arbitrary composition rules
 * 
 * Minimum requirements:
 * - 12 characters long (instead of 8)
 * - Score of at least 3/4 (Strong)
 * - No common passwords
 * - Not found in known breaches (checked during registration, not during validation)
 * 
 * This approach is more user-friendly and secure:
 * - Allows spaces and unicode
 * - Doesn't require artificial composition rules
 * - Accepts passwords like "correct horse battery staple" or "Coffee@home#2024"
 */
const passwordSchema = z
  .string()
  .min(12, "Password must be at least 12 characters")
  .max(128, "Password must not exceed 128 characters")
  .refine(
    (pwd) => {
      // Use zxcvbn to score password strength
      const result = zxcvbn(pwd);
      // Require score of 3 or higher (Strong or Very Strong)
      return result.score >= 3;
    },
    "Password is too weak. Try a longer phrase or mix different character types"
  )
  .refine(
    (pwd) => {
      // Reject common passwords (caught by zxcvbn, but explicit check too)
      const commonPasswords = HIBPService.getCommonPasswords();
      return !commonPasswords.includes(pwd.toLowerCase());
    },
    "This password is too common. Please choose a more unique password"
  );

/**
 * Register Validator
 */
export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    fullName: z
      .string()
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Full name cannot exceed 100 characters")
      .trim(),
    role: z.enum(["STUDENT", "RECRUITER", "PLACEMENT_OFFICER"]),
    collegeCode: z.string().optional(),
    companyInviteToken: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // Passwords must match
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords do not match",
        path: ["confirmPassword"],
      });
    }
    // College code required for students
    if (data.role === "STUDENT" && !data.collegeCode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "College code required for students",
        path: ["collegeCode"],
      });
    }
  });

export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * Login Validator
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Email Verification Validator
 */
export const verifyEmailSchema = z.object({
  token: z.string().min(1, "Verification token required"),
});

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

/**
 * Refresh Token Validator
 */
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token required"),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

/**
 * Forgot Password Validator
 */
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

/**
 * Reset Password Validator
 * New password must meet strength requirements like registration
 */
export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token required"),
    email: emailSchema,
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords do not match",
        path: ["confirmPassword"],
      });
    }
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/**
 * Logout Validator
 */
export const logoutSchema = z.object({
  refreshToken: z.string().optional(),
});

export type LogoutInput = z.infer<typeof logoutSchema>;

/**
 * Change Password Validator
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password required"),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords do not match",
        path: ["confirmPassword"],
      });
    }
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

/**
 * OTP Validator
 */
export const otpSchema = z
  .string()
  .regex(/^\d{6}$/, "OTP must be 6 digits");

/**
 * Validator wrapper for middleware
 * Throws a clean AppError (422) instead of a raw ZodError
 */
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (result.success) return result.data;

  const first = result.error.errors[0];
  const message = first
    ? `${first.path.length ? first.path.join('.') + ': ' : ''}${first.message}`
    : 'Validation failed';

  // Throw a plain Error with a clean message — caught by asyncHandler → errorHandler
  const err = new Error(message) as any;
  err.statusCode = 422;
  err.isValidationError = true;
  throw err;
}
