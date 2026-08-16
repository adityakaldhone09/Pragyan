/**
 * Login Service
 * Handles user authentication and token generation (Unit 5)
 * 
 * Login Flow:
 * 1. Check throttle (rate limiting)
 * 2. Find user by email
 * 3. Check email verified (emailVerifiedAt is not null)
 * 4. Check account status = ACTIVE
 * 5. Verify password hash (supports Argon2id and BCrypt with auto-rehashing)
 * 6. Generate JWT access token
 * 7. Generate and store refresh token
 * 8. Audit log
 * 9. Publish LoginSuccess event
 * 10. Return tokens + user info
 * 
 * Note: No auth service should call another auth service directly.
 * Each service has single responsibility: login, register, verify-email, etc.
 */

import type { LoginInput, AuthResponse, AuthUser } from "@/shared/auth";
import { userRepository, auditRepository, refreshTokenRepository } from "../repository";
import { LoginFailureReason } from "../repository/audit.repository";
import { publishLoginSuccess, publishLoginFailed } from "../events";
import { LoginThrottleService } from "./login-throttle.service";
import { generateAccessToken } from "@/utils/jwt";
import { PasswordUtil } from "@/utils/password";
import crypto from "crypto";
import { randomUUID } from "crypto";

export class LoginService {
  /**
   * Login user and return tokens
   * 
   * Returns: { accessToken, refreshToken, user }
   * 
   * Throws:
   * - "Account locked due to too many failed attempts" (429)
   * - "Invalid credentials" (401)
   * - "Email not verified" (401)
   * - "Account not active" (403)
   */
  async login(input: LoginInput, ipAddress: string = "", userAgent: string = ""): Promise<AuthResponse> {
    // Step 0: Check throttle (rate limiting)
    const throttle = LoginThrottleService.isLocked(input.email);
    if (throttle.isLocked) {
      const minutesRemaining = Math.ceil(throttle.remainingMs / 60000);
      throw new Error(`Account locked. Try again in ${minutesRemaining} minutes.`);
    }

    // Step 1: Find user by email
    const user = await userRepository.findByEmail(input.email);
    
    if (!user) {
      // Record failed attempt (throttling)
      LoginThrottleService.recordFailedAttempt(input.email);
      
      // Log failed login attempt with structured reason
      // Note: Use a system user ID since we don't have the user
      await auditRepository.log({
        targetUserId: "system",  // Unknown user
        performedByUserId: "system",
        organizationId: "",
        action: "LOGIN",
        status: "FAILURE",
        failureReason: LoginFailureReason.USER_NOT_FOUND,
        ipAddress,
        userAgent,
      });
      
      // Log failed login attempt
      await publishLoginFailed({
        email: input.email,
        reason: "User not found",
        ipAddress,
        userAgent,
        timestamp: new Date(),
      });
      
      // Generic error message (don't reveal if email exists or not)
      throw new Error("Invalid email or password");
    }

    // Step 2: Email verification check
    // Every local signup must verify email before login.
    if (user.provider === "local" && (!user.emailVerifiedAt || !user.emailVerified)) {
      // Record failed attempt
      LoginThrottleService.recordFailedAttempt(user.email);
      
      // Log with structured reason
      await auditRepository.log({
        targetUserId: user.id,
        performedByUserId: user.id,
        organizationId: user.organizationId || "",
        action: "LOGIN",
        status: "FAILURE",
        failureReason: LoginFailureReason.EMAIL_NOT_VERIFIED,
        ipAddress,
        userAgent,
      });
      
      await publishLoginFailed({
        email: user.email,
        reason: "Email not verified",
        ipAddress,
        userAgent,
        timestamp: new Date(),
      });
      
      throw new Error("Email not verified. Please verify your email first.");
    }

    // Step 3: Check account status
    if (user.accountStatus !== "ACTIVE") {
      LoginThrottleService.recordFailedAttempt(user.email);
      
      const reasonMap: Record<string, LoginFailureReason> = {
        EMAIL_PENDING: LoginFailureReason.EMAIL_NOT_VERIFIED,
        PENDING: LoginFailureReason.ACCOUNT_PENDING,
        REJECTED: LoginFailureReason.ACCOUNT_REJECTED,
        SUSPENDED: LoginFailureReason.ACCOUNT_SUSPENDED,
      };
      const failureReason = reasonMap[user.accountStatus] || "ACCOUNT_NOT_ACTIVE";
      
      await auditRepository.log({
        targetUserId: user.id,
        performedByUserId: user.id,
        organizationId: user.organizationId || "",
        action: "LOGIN",
        status: "FAILURE",
        failureReason,
        ipAddress,
        userAgent,
      });
      
      await publishLoginFailed({
        email: user.email,
        reason: `Account status: ${user.accountStatus}`,
        ipAddress,
        userAgent,
        timestamp: new Date(),
      });
      
      if (user.accountStatus === "EMAIL_PENDING") {
        throw new Error("Email not verified. Please verify your email first.");
      }
      throw new Error(`Account status is ${user.accountStatus}. Please contact support.`);
    }

    // Step 4: Verify password
    // Supports both Argon2id (new) and BCrypt (legacy) hashes
    const passwordMatches = await PasswordUtil.verify(input.password, user.password);

    if (!passwordMatches) {
      // Record failed attempt
      LoginThrottleService.recordFailedAttempt(user.email);
      
      // Log failed login attempt with structured reason
      await auditRepository.log({
        targetUserId: user.id,
        performedByUserId: user.id,
        organizationId: user.organizationId || "",
        action: "LOGIN",
        status: "FAILURE",
        failureReason: LoginFailureReason.INVALID_PASSWORD,
        ipAddress,
        userAgent,
      });
      
      await publishLoginFailed({
        email: user.email,
        reason: "Invalid password",
        ipAddress,
        userAgent,
        timestamp: new Date(),
      });
      
      // Generic error message (don't reveal if email exists)
      throw new Error("Invalid email or password");
    }

    // Step 4a: Auto-rehash if password was hashed with BCrypt (migration to Argon2id)
    if (PasswordUtil.needsRehash(user.password)) {
      try {
        const newHash = await PasswordUtil.hash(input.password);
        await userRepository.update(user.id, { password: newHash });
        // Password migration successful (silent)
      } catch (rehashError) {
        // Don't fail login if rehashing fails - continue with old hash
      }
    }
    // Step 5: Generate access token (JWT)
    // Use native role directly (STUDENT, RECRUITER, PLACEMENT_OFFICER, ADMIN)
    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      role: (user.userRole || "STUDENT") as any,
    });

    // Step 6: Generate and store refresh token
    const familyId = randomUUID();  // New session family
    const refreshTokenValue = crypto.randomBytes(32).toString("hex");
    const refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // ✅ OPTIMIZED: Parallelize database operations
    // These are independent, so run them concurrently instead of sequentially
    await Promise.all([
      // Create refresh token
      refreshTokenRepository.create({
        token: refreshTokenValue,
        familyId,
        userId: user.id,
        expiresAt: refreshTokenExpiresAt,
        deviceId: this.generateDeviceId(userAgent),
        ipAddress,
        userAgent,
      }),
      
      // Update last login metadata
      userRepository.update(user.id, {
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
        lastLoginUserAgent: userAgent,
      }),
      
      // Log audit (non-blocking)
      auditRepository.log({
        targetUserId: user.id,
        performedByUserId: user.id,
        organizationId: user.organizationId || "",
        action: "LOGIN",
        status: "SUCCESS",
        ipAddress,
        userAgent,
      }),
    ]);

    // Step 8: Publish event (non-blocking, after response sent)
    // Don't await this - fire and forget
    publishLoginSuccess({
      userId: user.id,
      email: user.email,
      role: user.userRole || "STUDENT",
      ipAddress,
      userAgent,
      timestamp: new Date(),
    }).catch((err) => {
      console.error("[LoginService] Failed to publish LoginSuccess event:", err);
    });

    // Step 8a: Reset throttle on successful login (non-blocking)
    LoginThrottleService.recordSuccessfulLogin(user.email);

    // Step 9: Build response
    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: (user.userRole || "STUDENT") as any,
      avatar: user.avatar || undefined,
    };

    return {
      accessToken,
      refreshToken: refreshTokenValue,
      user: authUser,
    };
  }

  /**
   * Generate device fingerprint from user agent
   * Used to identify devices for "logout from device X" feature
   */
  private generateDeviceId(userAgent: string): string {
    return crypto.createHash("sha256").update(userAgent).digest("hex").substring(0, 16);
  }
}

export const loginService = new LoginService();
