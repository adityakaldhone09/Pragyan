/**
 * Email Verification Service
 * Handles email verification flow (Unit 4)
 * 
 * Flow:
 * 1. Receive token from query params
 * 2. Call verificationTokenRepository.consume() → userId
 * 3. Call accountActivationService.activateAccount() → ACTIVE
 * 4. Log to AuditRepository
 * 5. Publish EmailVerified event
 * 6. Return success response
 */

import type { VerifyEmailInput } from "@/shared/auth";
import { TokenPurpose } from "@prisma/client";
import { verificationTokenRepository } from "../repository";
import { accountActivationService } from "./account-activation.service";

export class VerifyEmailService {
  /**
   * Verify email token
   * 
   * Input: { token: "raw_token_from_query" }
   * Returns: { message, accountStatus }
   * 
   * Throws:
   * - "Invalid verification link" (400) - token invalid/expired/used/wrong purpose
   */
  async verify(input: VerifyEmailInput): Promise<{ message: string; accountStatus: string }> {
    // Step 1: Validate input
    if (!input.token) {
      throw new Error("Token is required");
    }

    // Step 2: Consume token (atomic: lookup + validate + mark used)
    let userId: string;
    try {
      userId = await verificationTokenRepository.consume(input.token, TokenPurpose.EMAIL_VERIFY);
    } catch (error) {
      // Repository throws "Invalid verification link" on any token issue
      // We pass it through as-is (generic, no info leakage)
      throw error;
    }

    // Step 3: Activate account. Email ownership is the only signup activation gate.
    const activatedUser = await accountActivationService.activateAccount(userId);

    // Step 4: Return success
    // Note: AuditRepository.log() and EventBus.publish() already called by accountActivationService
    return {
      message: "Email verified successfully. You can now login.",
      accountStatus: activatedUser.accountStatus,
    };
  }
}

export const verifyEmailService = new VerifyEmailService();
