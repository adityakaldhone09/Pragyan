/**
 * Account Activation Service
 * Handles account activation after email verification (Unit 4)
 * 
 * Activation Rules:
 * - Any public signup role → ACTIVE after email verification
 */

import { UserRole, AccountStatus } from "@prisma/client";
import { userRepository } from "../repository";
import { publishEmailVerified } from "../events";

export class AccountActivationService {
  /**
   * Activate account after email verification
   * 
   * Flow:
   * 1. Mark the account as active after email ownership is verified
   * 2. Update user account status
   * 3. Publish EmailVerified event
   * 
   * Returns: User object with new status
   */
  async activateAccount(userId: string): Promise<{ id: string; userRole: UserRole; accountStatus: AccountStatus }> {
    // Fetch user to get role
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    // Email verification is the only activation gate for local signups.
    const updatedUser = await userRepository.update(userId, {
      accountStatus: "ACTIVE",
      status: "ACTIVE",
      emailVerified: true,
      emailVerifiedAt: new Date(),
    });

    // Publish event for audit logging and notifications
    publishEmailVerified({
      userId: updatedUser.id,
      email: updatedUser.email,
      timestamp: new Date(),
    });

    return {
      id: updatedUser.id,
      userRole: updatedUser.userRole!,
      accountStatus: updatedUser.accountStatus as AccountStatus,
    };
  }
}

export const accountActivationService = new AccountActivationService();
