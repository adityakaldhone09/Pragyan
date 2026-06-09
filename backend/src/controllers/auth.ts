// src/controllers/auth.ts

import { Request, Response } from 'express';
import { authService } from '@/services/auth';
import { sendSuccess, sendError } from '@/utils/response';
import {
  RegisterInput,
  LoginInput,
  ProfileUpdateInput,
  ForgotPasswordInput,
  VerifyResetOtpInput,
  ResetPasswordInput,
} from '@/validators/auth';
import { asyncHandler } from '@/middleware/errorHandler';
import { isGoogleOAuthConfigured, isGitHubOAuthConfigured } from '@/config/passport';
import { config } from '@/config/env';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const input: RegisterInput = req.body;
  const result = await authService.register(input);

  return sendSuccess(res, result, 201, 'User registered successfully');
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const input: LoginInput = req.body;
  const result = await authService.login(input);

  return sendSuccess(res, result, 200, 'Login successful');
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  const user = await authService.getUserById(req.user.id);
  return sendSuccess(res, user, 200, 'User fetched successfully');
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendError(res, 401, 'Unauthorized');
  }

  const input: ProfileUpdateInput = req.body;
  const user = await authService.updateUserProfile(req.user.id, input);

  return sendSuccess(res, user, 200, 'Profile updated successfully');
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.body.refreshToken;

  if (!refreshToken) {
    return sendError(res, 400, 'Refresh token is required');
  }

  await authService.logout(refreshToken);
  return sendSuccess(res, {}, 200, 'Logged out successfully');
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    return sendError(res, 400, 'Refresh token is required');
  }

  const result = await authService.refreshAccessToken(token);
  return sendSuccess(res, result, 200, 'Access token refreshed');
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const input: ForgotPasswordInput = req.body;
  const result = await authService.requestPasswordReset(input);

  return sendSuccess(res, result, 200, result.message);
});

export const verifyResetOtp = asyncHandler(async (req: Request, res: Response) => {
  const input: VerifyResetOtpInput = req.body;
  const result = await authService.verifyResetOtp(input);

  return sendSuccess(res, result, 200, result.message);
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const input: ResetPasswordInput = req.body;
  const result = await authService.resetPassword(input);

  return sendSuccess(res, result, 200, result.message);
});

export const getAuthConfig = asyncHandler(async (_req: Request, res: Response) => {
  return sendSuccess(
    res,
    {
      googleEnabled: isGoogleOAuthConfigured(),
      githubEnabled: isGitHubOAuthConfigured(),
      googleLoginUrl: `${config.apiBaseUrl}/api/auth/google`,
      githubLoginUrl: `${config.apiBaseUrl}/api/auth/github`,
    },
    200,
    'Auth config fetched successfully'
  );
});
