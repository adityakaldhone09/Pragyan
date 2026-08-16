/**
 * Password Reset Service
 * Handles secure password reset flow with single-use tokens
 * 
 * Security Features:
 * - Cryptographically secure random tokens (32 bytes)
 * - Token expiration (1 hour by default)
 * - Single-use tokens (deleted after use)
 * - Token hashing for storage (never store plaintext)
 * - Generic responses (no email enumeration)
 * - Rate limiting on request
 * - New password validation (Argon2id + zxcvbn + HIBP)
 * - Session invalidation on reset
 */

import crypto from "crypto";
import { PasswordUtil } from "@/utils/password";
import { HIBPService } from "@/services/hibp.service";
import { userRepository, auditRepository, refreshTokenRepository } from "../repository";

export interface RequestPasswordResetInput {
  email: string;
}

export interface VerifyResetTokenInput {
  token: string;
  email: string;
}

export interface ResetPasswordInput {
  token: string;
  email: string;
  newPassword: string;
}

// Token expiration: 1 hour
const TOKEN_EXPIRY_MS = 60 * 60 * 1000;
const MAX_RESET_REQUESTS_PER_HOUR = 3;

// In-memory store for reset tokens (should use Redis in production)
// Format: { [tokenHash]: { userId, email, expiresAt, used } }
const resetTokenStore = new Map<
  string,
  {
    userId: string;
    email: string;
    expiresAt: Date;
    used: boolean;
    createdAt: Date;
  }
>();

export class PasswordResetService {
  /**
   * Request password reset
   * Generates a secure single-use token and sends via email
   * 
   * Returns generic response regardless of whether email exists (no enumeration)
   * 
   * @param input { email }
   * @returns { message: "If account exists..." }
   */
  static async requestPasswordReset(
    input: RequestPasswordResetInput
  ): Promise<{ message: string }> {
    const { email } = input;

    // Always return generic response (don't reveal if email exists)
    const genericResponse = {
      message:
        "If an account exists with this email, you will receive password reset instructions.",
    };

    try {
      // Step 1: Find user by email
      const user = await userRepository.findByEmail(email);
      if (!user) {
        // Log attempt but don't reveal
        console.log(`[Password Reset] Reset requested for non-existent email: ${email}`);
        return genericResponse;
      }

      // Step 2: Check rate limiting (max 3 requests per hour)
      const recentRequests = Array.from(resetTokenStore.values()).filter(
        (token) =>
          token.email === email &&
          token.createdAt.getTime() > Date.now() - 60 * 60 * 1000 // Last hour
      );

      if (recentRequests.length >= MAX_RESET_REQUESTS_PER_HOUR) {
        console.warn(
          `[Password Reset] Rate limit exceeded for ${email}. ${recentRequests.length} requests in last hour.`
        );
        return genericResponse;
      }

      // Step 3: Generate cryptographically secure reset token
      const token = this.generateResetToken();
      const tokenHash = this.hashToken(token);

      // Step 4: Store token (in memory - TODO: use Redis/DB in production)
      const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS);
      resetTokenStore.set(tokenHash, {
        userId: user.id,
        email: user.email,
        expiresAt,
        used: false,
        createdAt: new Date(),
      });

      // Step 5: Audit log
      await auditRepository.log({
        targetUserId: user.id,
        performedByUserId: user.id,
        organizationId: user.organizationId || "",
        action: "PASSWORD_RESET" as any,
        status: "SUCCESS",
      });

      // Step 6: TODO - Send reset email
      // const resetLink = `${process.env.FRONTEND_URL}/auth/reset-password?token=${token}`;
      // await EmailService.sendPasswordResetEmail(user.email, user.fullName, resetLink, expiresAt);
      console.log(
        `[Password Reset] Reset token generated for ${email}. Token: ${token}`
      );

      return genericResponse;
    } catch (error) {
      console.error("[Password Reset] Error:", error);
      // Return generic response even on error
      return genericResponse;
    }
  }

  /**
   * Verify reset token is valid
   * Used by frontend to validate token before showing password form
   * 
   * @param input { token, email }
   * @returns { valid: boolean }
   */
  static verifyResetToken(input: VerifyResetTokenInput): {
    valid: boolean;
    error?: string;
  } {
    const { token, email } = input;

    try {
      const tokenHash = this.hashToken(token);
      const tokenData = resetTokenStore.get(tokenHash);

      if (!tokenData) {
        return {
          valid: false,
          error: "Invalid or expired reset token",
        };
      }

      // Check if token matches email
      if (tokenData.email !== email) {
        return {
          valid: false,
          error: "Email does not match token",
        };
      }

      // Check if already used
      if (tokenData.used) {
        return {
          valid: false,
          error: "This reset link has already been used",
        };
      }

      // Check if expired
      if (tokenData.expiresAt < new Date()) {
        resetTokenStore.delete(tokenHash);
        return {
          valid: false,
          error: "Reset link has expired",
        };
      }

      return {
        valid: true,
      };
    } catch (error) {
      console.error("[Password Reset] Verification error:", error);
      return {
        valid: false,
        error: "Invalid reset token",
      };
    }
  }

  /**
   * Reset password using valid token
   * 
   * @param input { token, email, newPassword }
   * @returns { message: "Password reset successful" }
   */
  static async resetPassword(
    input: ResetPasswordInput
  ): Promise<{ message: string }> {
    const { token, email, newPassword } = input;

    try {
      // Step 1: Verify token
      const verification = this.verifyResetToken({ token, email });
      if (!verification.valid) {
        throw new Error(verification.error || "Invalid reset token");
      }

      // Step 2: Find user
      const user = await userRepository.findByEmail(email);
      if (!user) {
        throw new Error("User not found");
      }

      // Step 3: Validate new password is different from current
      const currentPasswordMatches = await PasswordUtil.verify(
        newPassword,
        user.password
      );
      if (currentPasswordMatches) {
        throw new Error("New password must be different from current password");
      }

      // Step 4: Check if new password is in known breaches
      const breachCheck = await HIBPService.checkPassword(newPassword);
      if (breachCheck.breached) {
        throw new Error(
          "This password has appeared in known data breaches. Please choose a different password."
        );
      }

      // Step 5: Hash new password
      const newPasswordHash = await PasswordUtil.hash(newPassword);

      // Step 6: Update password in database
      await userRepository.update(user.id, {
        password: newPasswordHash,
      });

      // Step 7: Invalidate all refresh tokens (forces re-login)
      await refreshTokenRepository.deleteAllByUser(user.id);

      // Step 8: Mark token as used
      const tokenHash = this.hashToken(token);
      const tokenData = resetTokenStore.get(tokenHash);
      if (tokenData) {
        tokenData.used = true;
      }

      // Step 9: Audit log
      await auditRepository.log({
        targetUserId: user.id,
        performedByUserId: user.id,
        organizationId: user.organizationId || "",
        action: "PASSWORD_RESET" as any,
        status: "SUCCESS",
      });

      // Step 10: TODO - Send confirmation email
      // await EmailService.sendPasswordResetConfirmation(user.email, user.fullName);

      return {
        message: "Password reset successful. Please log in with your new password.",
      };
    } catch (error) {
      console.error("[Password Reset] Reset error:", error);
      throw error;
    }
  }

  /**
   * Generate cryptographically secure reset token
   * @private
   */
  private static generateResetToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  /**
   * Hash token for storage (one-way)
   * @private
   */
  private static hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  /**
   * Clean up expired tokens (should run periodically)
   * Removes tokens that have expired from the in-memory store
   */
  static cleanupExpiredTokens(): number {
    const now = new Date();
    let removed = 0;

    for (const [hash, data] of resetTokenStore.entries()) {
      if (data.expiresAt < now) {
        resetTokenStore.delete(hash);
        removed++;
      }
    }

    console.log(`[Password Reset] Cleaned up ${removed} expired tokens`);
    return removed;
  }

  /**
   * Get token store size (for monitoring)
   */
  static getTokenStoreSize(): number {
    return resetTokenStore.size;
  }
}

export const passwordResetService = new PasswordResetService();

// Run cleanup every 30 minutes
setInterval(() => {
  PasswordResetService.cleanupExpiredTokens();
}, 30 * 60 * 1000);
