/**
 * Password Service
 * Handles password reset and recovery flows
 */

import { randomInt } from "crypto";
import { prisma } from "@/lib/prisma";
import type { ForgotPasswordInput, ResetPasswordInput } from "@/shared/auth";
import { PasswordUtil } from "@/utils/password";
import { InvalidCredentialsError, WeakPasswordError } from "../errors";
import { PasswordPolicy } from "../policies/password.policy";

export class PasswordService {
  /**
   * Request password reset (scaffolded, implementation in Unit 8)
   */
  async forgotPassword(_input: ForgotPasswordInput) {
    throw new Error("Not implemented in Unit 1 - see Unit 8");
  }

  /**
   * Reset password with OTP (scaffolded, implementation in Unit 9)
   */
  async resetPassword(_input: ResetPasswordInput) {
    throw new Error("Not implemented in Unit 1 - see Unit 9");
  }

  /**
   * Change password (authenticated user)
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const isCurrentPasswordValid = await this.verifyPassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new InvalidCredentialsError("Current password is incorrect");
    }

    PasswordPolicy.validate(newPassword);

    const isSameAsCurrent = await this.verifyPassword(newPassword, user.password);
    if (isSameAsCurrent) {
      throw new WeakPasswordError("New password must be different from the current password");
    }

    const passwordHash = await this.hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: passwordHash, updatedAt: new Date() },
    });

    return { message: "Password changed successfully" };
  }

  /**
   * Helper: Generate OTP (internal)
   */
  protected generateOTP(): string {
    return String(randomInt(100000, 1000000)).padStart(6, "0");
  }

  /**
   * Helper: Hash password (internal)
   */
  protected async hashPassword(password: string): Promise<string> {
    return PasswordUtil.hash(password);
  }

  /**
   * Helper: Verify password (internal)
   */
  protected async verifyPassword(plainPassword: string, hash: string): Promise<boolean> {
    return PasswordUtil.verify(plainPassword, hash);
  }
}

export const passwordService = new PasswordService();
