/**
 * Auth Module - Controller
 * HTTP request handlers (scaffolded, implementation in Units 3-9)
 */

import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "@/middleware/errorHandler";
import { meService, registerService, verifyEmailService, loginService } from "./services";
import { OAuthService } from "./services/oauth.service";
import { config } from "@/config/env";
import { authService } from "@/services/auth";
import { twoFactorService } from "@/services/twoFactor";

export class AuthController {
  /**
   * GET /api/auth/config
   * Get authentication configuration (OAuth providers)
   */
  static getConfig = asyncHandler(
    async (_req: Request, res: Response, _next: NextFunction) => {
      return res.status(200).json({
        success: true,
        data: {
          googleEnabled: Boolean(config.oauth.googleClientId),
          githubEnabled: Boolean(config.oauth.githubClientId),
          googleLoginUrl: config.oauth.googleClientId ? `${config.apiBaseUrl}/api/auth/google` : null,
          githubLoginUrl: config.oauth.githubClientId ? `${config.apiBaseUrl}/api/auth/github` : null,
        },
      });
    }
  );

  /**
   * POST /api/auth/register
   * Unit 3 implementation
   * 
   * Input: { email, password, confirmPassword, fullName, role, collegeCode?, companyInviteToken? }
   * Returns: 201 Created with { message, email }
   * On error: 400/409 with error details
   */
  static register = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const input = req.body;
      
      const result = await registerService.register(input);
      
      return res.status(201).json({
        success: true,
        message: result.message,
        data: {
          email: result.email,
        },
      });
    }
  );

  /**
   * GET /api/auth/verify-email?token=xxx
   * Unit 4 implementation
   * 
   * Input: token via query param
   * Returns: 200 { message, accountStatus }
   * On error: 400 with "Invalid verification link" (generic, no leaks)
   */
  static verifyEmail = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const { token } = req.query;
      
      const result = await verifyEmailService.verify({ token: token as string });
      
      return res.status(200).json({
        success: true,
        message: result.message,
        data: {
          accountStatus: result.accountStatus,
        },
      });
    }
  );

  /**
   * POST /api/auth/login
   * Unit 5 implementation
   * 
   * Input: { email, password }
   * Returns: 200 { accessToken, refreshToken, user }
   * On error: 401/403 with error message
   */
  static login = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const input = req.body;
      console.log("===== LOGIN REQUEST =====");
      console.log("Full request body:", JSON.stringify(req.body, null, 2));
      console.log("========================");
      
      const ipAddress = req.ip || "";
      const userAgent = req.get("user-agent") || "";
      
      const result = await loginService.login(input, ipAddress, userAgent);
      
      return res.status(200).json({
        success: true,
        message: "Login successful",
        data: result,
      });
    }
  );

  /**
   * POST /api/auth/refresh
   */
  static refresh = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const { readRefreshTokenCookie, setAuthCookies } = await import('@/security');
      const token = req.body.refreshToken || readRefreshTokenCookie(req.headers.cookie);
      if (!token) {
        return res.status(400).json({ success: false, message: 'Refresh token is required' });
      }
      const result = await authService.refreshAccessToken(token);
      setAuthCookies(res, result);
      return res.status(200).json({ success: true, message: 'Access token refreshed', data: result });
    }
  );

  /**
   * POST /api/auth/logout
   */
  static logout = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const { readRefreshTokenCookie, clearAuthCookies } = await import('@/security');
      const refreshToken = req.body.refreshToken || readRefreshTokenCookie(req.headers.cookie);
      if (!refreshToken) {
        return res.status(400).json({ success: false, message: 'Refresh token is required' });
      }
      await authService.logout(refreshToken);
      clearAuthCookies(res);
      return res.status(200).json({ success: true, message: 'Logged out successfully', data: {} });
    }
  );

  /**
   * POST /api/auth/forgot-password
   * Request password reset
   * 
   * Input: { email }
   * Returns: 200 { message: "If account exists..." }
   * 
   * Generic response prevents email enumeration attacks
   */
  static forgotPassword = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const { email } = req.body as { email: string };

      const { PasswordResetService } = await import("./services/password-reset.service");
      
      const result = await PasswordResetService.requestPasswordReset({
        email,
      });

      return res.status(200).json({
        success: true,
        message: result.message,
        data: {},
      });
    }
  );

  /**
   * POST /api/auth/verify-reset-token
   * Verify password reset token
   * 
   * Input: { token, email }
   * Returns: 200 { valid: boolean } or error
   */
  static verifyResetToken = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const { token, email } = req.body as { token: string; email: string };

      const { PasswordResetService } = await import("./services/password-reset.service");

      const result = PasswordResetService.verifyResetToken({ token, email });

      if (!result.valid) {
        return res.status(400).json({
          success: false,
          message: result.error || "Invalid reset token",
          data: { valid: false },
        });
      }

      return res.status(200).json({
        success: true,
        message: "Token verified",
        data: { valid: true },
      });
    }
  );

  /**
   * POST /api/auth/reset-password
   * Reset password with valid token
   * 
   * Input: { token, email, newPassword, confirmPassword }
   * Returns: 200 { message: "Password reset successful" }
   * 
   * Security:
   * - Verifies token
   * - Validates password strength (zxcvbn score 3+)
   * - Checks HIBP for breached passwords
   * - Invalidates all sessions
   */
  static resetPassword = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      const { token, email, newPassword } = req.body as {
        token: string;
        email: string;
        newPassword: string;
      };

      const { PasswordResetService } = await import("./services/password-reset.service");

      const result = await PasswordResetService.resetPassword({
        token,
        email,
        newPassword,
      });

      return res.status(200).json({
        success: true,
        message: result.message,
        data: {},
      });
    }
  );

  /**
   * GET /api/auth/me (requires auth)
   * Get current user profile with all details
   */
  static getMe = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      if (!req.authUser) {
        return res.status(401).json({
          success: false,
          message: "Not authenticated",
        });
      }

      const me = await meService.getMe(req.authUser.userId);
      return res.status(200).json({
        success: true,
        data: me,
        message: "Profile retrieved successfully",
      });
    }
  );

  /**
   * POST /api/auth/change-password (requires auth)
   * Change password for authenticated user
   * 
   * Input: { currentPassword, newPassword, confirmPassword }
   * - Requires current password verification
   * - Validates new password strength (zxcvbn score 3+, 12+ chars)
   * - Checks against breached passwords (HIBP)
   * - Invalidates all existing refresh tokens (forces re-login on all devices)
   * - Sends confirmation email
   * 
   * Returns: 200 { message }
   * On error: 400/401 with error details
   */
  static changePassword = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      if (!req.authUser?.userId) {
        return res.status(401).json({
          success: false,
          message: "Not authenticated",
        });
      }

      const { currentPassword, newPassword } = req.body as {
        currentPassword: string;
        newPassword: string;
      };

      // Import password change service
      const { PasswordChangeService } = await import("./services/password-change.service");

      const result = await PasswordChangeService.changePassword({
        userId: req.authUser.userId,
        currentPassword,
        newPassword,
      });

      return res.status(200).json({
        success: true,
        message: result.message,
        data: {},
      });
    }
  );

  /**
   * PATCH /api/auth/me
   * Update the authenticated user's profile/settings
   */
  static updateProfile = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      if (!req.authUser?.userId) {
        return res.status(401).json({
          success: false,
          message: "Not authenticated",
        });
      }

      const updated = await authService.updateUserProfile(req.authUser.userId, req.body);
      return res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: updated,
      });
    }
  );

  /**
   * DELETE /api/auth/account (requires auth)
   * Permanently delete the authenticated user's account.
   */
  static deleteAccount = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      if (!req.authUser?.userId) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
      }
      const { password } = req.body as { password?: string };
      if (!password) {
        return res.status(400).json({ success: false, message: 'Password is required to confirm account deletion' });
      }
      const result = await authService.deleteAccount(req.authUser.userId, password);
      return res.status(200).json({ success: true, message: result.message, data: result });
    }
  );

  /**
   * GET /api/auth/2fa/status (requires auth)
   */
  static get2FAStatus = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      if (!req.authUser?.userId) return res.status(401).json({ success: false, message: 'Not authenticated' });
      const status = await twoFactorService.getStatus(req.authUser.userId);
      return res.status(200).json({ success: true, data: status });
    }
  );

  /**
   * POST /api/auth/2fa/setup (requires auth)
   * Returns a TOTP secret + QR code. Secret is NOT saved until /enable is called.
   */
  static setup2FA = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      if (!req.authUser?.userId) return res.status(401).json({ success: false, message: 'Not authenticated' });
      const result = await twoFactorService.generateSecret(req.authUser.userId);
      return res.status(200).json({ success: true, data: result });
    }
  );

  /**
   * POST /api/auth/2fa/enable
   * body: { secret, token }  — verify code then persist the secret.
   */
  static enable2FA = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      if (!req.authUser?.userId) return res.status(401).json({ success: false, message: 'Not authenticated' });
      const { secret, token } = req.body as { secret?: string; token?: string };
      if (!secret || !token) return res.status(400).json({ success: false, message: 'secret and token are required' });
      await twoFactorService.enable(req.authUser.userId, secret, token);
      return res.status(200).json({ success: true, data: { enabled: true }, message: '2FA enabled successfully' });
    }
  );

  /**
   * POST /api/auth/2fa/disable
   * body: { token }
   */
  static disable2FA = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      if (!req.authUser?.userId) return res.status(401).json({ success: false, message: 'Not authenticated' });
      const { token } = req.body as { token?: string };
      if (!token) return res.status(400).json({ success: false, message: 'token is required' });
      await twoFactorService.disable(req.authUser.userId, token);
      return res.status(200).json({ success: true, data: { enabled: false }, message: '2FA disabled successfully' });
    }
  );

  /**
   * GET /api/auth/google/callback
   * OAuth Google callback handler
   */
  static googleCallback = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      try {
        console.log("[OAuth:Google:Callback] Starting Google OAuth callback");
        
        if (!req.user) {
          console.error("[OAuth:Google:Callback] No user in request - Passport authentication failed");
          return res.redirect(`${config.frontendUrl}/auth?error=oauth_failed`);
        }

        console.log("[OAuth:Google:Callback] Passport user object:", JSON.stringify(req.user, null, 2));

        const passportUser = req.user as any;
        const ipAddress = req.ip || "";
        const userAgent = req.get("user-agent") || "";

        // Map Passport Google profile to our OAuthProfile interface
        const googleProfile = {
          id: passportUser.providerId || passportUser.id || "",
          email: passportUser.email || "",
          name: passportUser.fullName || passportUser.displayName || "",
          provider: "google" as const,
          picture: passportUser.avatar || passportUser.photo || null,
        };

        console.log("[OAuth:Google:Callback] Mapped profile:", googleProfile);

        const authSession = await OAuthService.handleOAuthLogin(
          googleProfile,
          ipAddress,
          userAgent
        );

        // Redirect to frontend with token
        const frontendUrl = config.frontendUrl || "http://localhost:5173";
        const callbackUrl = `${frontendUrl}/auth/callback?token=${authSession.accessToken}&refresh=${authSession.refreshToken}`;

        console.log("[OAuth:Google:Callback] Redirecting to:", callbackUrl);

        return res.redirect(callbackUrl);
      } catch (error) {
        console.error("[OAuth:Google:Callback] Error:", error);
        return res.redirect(`${config.frontendUrl}/auth?error=oauth_failed`);
      }
    }
  );

  /**
   * GET /api/auth/github/callback
   * OAuth GitHub callback handler
   */
  static githubCallback = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
      try {
        console.log("[OAuth:GitHub:Callback] Starting GitHub OAuth callback");
        
        if (!req.user) {
          console.error("[OAuth:GitHub:Callback] No user in request - Passport authentication failed");
          return res.redirect(`${config.frontendUrl}/auth?error=oauth_failed`);
        }

        console.log("[OAuth:GitHub:Callback] Passport user object:", JSON.stringify(req.user, null, 2));

        const passportUser = req.user as any;
        const ipAddress = req.ip || "";
        const userAgent = req.get("user-agent") || "";

        // Map Passport GitHub profile to our OAuthProfile interface
        const githubProfile = {
          id: passportUser.providerId || passportUser.id || "",
          email: passportUser.email || passportUser.emails?.[0]?.value || "",
          name: passportUser.fullName || passportUser.displayName || passportUser.username || "",
          provider: "github" as const,
          picture: passportUser.avatar || passportUser.photos?.[0]?.value || passportUser.avatar_url || null,
        };

        console.log("[OAuth:GitHub:Callback] Mapped profile:", githubProfile);

        const authSession = await OAuthService.handleOAuthLogin(
          githubProfile,
          ipAddress,
          userAgent
        );

        // Redirect to frontend with token
        const frontendUrl = config.frontendUrl || "http://localhost:5173";
        const callbackUrl = `${frontendUrl}/auth/callback?token=${authSession.accessToken}&refresh=${authSession.refreshToken}`;

        console.log("[OAuth:GitHub:Callback] Redirecting to:", callbackUrl);

        return res.redirect(callbackUrl);
      } catch (error) {
        console.error("[OAuth:GitHub:Callback] Error:", error);
        return res.redirect(`${config.frontendUrl}/auth?error=oauth_failed`);
      }
    }
  );
}

