/**
 * Auth Module - Event Listeners
 * Subscribe to auth events and perform side effects like sending emails
 */

import { EventBus } from "@/services/eventBus";
import { sendVerificationEmail } from "@/services/emailService";
import { AuthEvents, type EmailVerificationRequestedPayload } from "./events";

/**
 * Listen for EMAIL_VERIFICATION_REQUESTED event
 * Sends verification email to the user
 */
EventBus.subscribe(
  AuthEvents.EMAIL_VERIFICATION_REQUESTED,
  async (payload: EmailVerificationRequestedPayload) => {
    try {
      await sendVerificationEmail(
        payload.email,
        payload.fullName,
        payload.verificationLink
      );
      console.info(`[Auth] ✓ Verification email sent to ${payload.email}`);
    } catch (error) {
      console.error(
        `[Auth] ✗ Failed to send verification email to ${payload.email}:`,
        error instanceof Error ? error.message : error
      );
      // Don't throw - email failures shouldn't block registration
    }
  }
);

console.info("[Auth] Event listeners initialized");
