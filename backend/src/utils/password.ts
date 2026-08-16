/**
 * Password Utility Service
 * Handles secure password hashing and verification with Argon2id
 * 
 * Migration Strategy:
 * - New passwords: Hashed with Argon2id
 * - Existing BCrypt passwords: Verified with BCrypt, optionally rehashed on login
 * - Automatic migration: After successful login, BCrypt hashes are rehashed to Argon2id
 */

import argon2 from "argon2";
import bcrypt from "bcryptjs";

/**
 * Argon2id configuration (OWASP 2023 recommendations)
 * https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
 */
const ARGON2_OPTIONS = {
  type: argon2.argon2id, // Resistant to GPU and ASIC attacks
  memoryCost: 19 * 1024, // 19 MB (OWASP minimum for sensitive data)
  timeCost: 2, // 2 iterations
  parallelism: 1, // Single-threaded
};

/**
 * BCrypt configuration (legacy)
 * Used only for verification of existing passwords
 */

/**
 * Password hashing and verification utility
 * Supports gradual migration from BCrypt to Argon2id
 */
export class PasswordUtil {
  /**
   * Hash password using Argon2id
   * 
   * @param password Raw password string
   * @returns Promise<string> Argon2id hash with parameters encoded
   * @throws Error if hashing fails
   * 
   * @example
   * const hash = await PasswordUtil.hash("myPassword123!");
   * // hash starts with $argon2id$v=19$m=19456,t=2,p=1$...
   */
  static async hash(password: string): Promise<string> {
    try {
      return await argon2.hash(password, ARGON2_OPTIONS);
    } catch (error) {
      throw new Error(
        `Password hashing failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Verify password against hash
   * Supports both Argon2id and BCrypt hashes for backward compatibility
   * 
   * @param password Raw password to verify
   * @param hash Stored password hash (Argon2id or BCrypt)
   * @returns Promise<boolean> true if password matches, false otherwise
   * 
   * @example
   * const matches = await PasswordUtil.verify("myPassword123!", storedHash);
   */
  static async verify(password: string, hash: string): Promise<boolean> {
    try {
      // Try Argon2id first
      if (hash.startsWith("$argon2")) {
        return await argon2.verify(hash, password);
      }

      // Fall back to BCrypt for legacy hashes
      if (hash.startsWith("$2")) {
        return await bcrypt.compare(password, hash);
      }

      // Unknown hash format
      console.warn(`Unknown password hash format: ${hash.substring(0, 20)}...`);
      return false;
    } catch (error) {
      console.error(
        `Password verification error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
      return false;
    }
  }

  /**
   * Check if hash needs rehashing (migration from BCrypt to Argon2id)
   * Returns true if hash is BCrypt (legacy) and should be updated
   * 
   * @param hash Stored password hash
   * @returns boolean true if hash is BCrypt (needs migration)
   * 
   * @example
   * if (PasswordUtil.needsRehash(storedHash)) {
   *   const newHash = await PasswordUtil.hash(password);
   *   await updateUserPassword(userId, newHash);
   * }
   */
  static needsRehash(hash: string): boolean {
    // If it's not Argon2id format, it needs rehashing
    return !hash.startsWith("$argon2");
  }

  /**
   * Safely check password strength (simplified)
   * Full strength checking should use zxcvbn-ts in validators
   * 
   * @param password Password to check
   * @returns object with basic strength metrics
   */
  static checkBasicStrength(
    password: string
  ): {
    isLengthOk: boolean;
    hasVariety: boolean;
    score: number;
  } {
    const isLengthOk = password.length >= 12;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecial = /[@$!%*?&]/.test(password);

    const varietyCount = [
      hasUppercase,
      hasLowercase,
      hasNumbers,
      hasSpecial,
    ].filter(Boolean).length;
    const hasVariety = varietyCount >= 3;

    // Simple score: 0-4 based on variety + length
    let score = varietyCount;
    if (isLengthOk) score += 1;
    score = Math.min(4, score); // Cap at 4

    return {
      isLengthOk,
      hasVariety,
      score,
    };
  }

  /**
   * Get human-readable hash algorithm from hash string
   * 
   * @param hash Password hash
   * @returns string Algorithm name ("argon2id", "bcrypt", or "unknown")
   */
  static getHashAlgorithm(hash: string): string {
    if (hash.startsWith("$argon2id")) return "argon2id";
    if (hash.startsWith("$argon2")) return "argon2i";
    if (hash.startsWith("$2")) return "bcrypt";
    return "unknown";
  }
}
