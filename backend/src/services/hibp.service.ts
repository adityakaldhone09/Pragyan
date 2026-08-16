/**
 * Have I Been Pwned (HIBP) Service
 * Checks if password appears in known data breaches
 * 
 * Privacy-Preserving k-Anonymity Approach:
 * - Only send first 5 characters of SHA-1 hash to HIBP API
 * - HIBP returns all hashes starting with those 5 chars
 * - Verify locally if full hash matches any result
 * - User's full password never leaves the client or server as plaintext
 * 
 * Reference: https://haveibeenpwned.com/API/v3#SearchingPastesWithPwnedPasswords
 */

import crypto from "crypto";

const HIBP_API_URL = "https://api.pwnedpasswords.com/range";
const HIBP_TIMEOUT = 5000; // 5 second timeout
const COMMON_PASSWORDS = [
  "password",
  "123456",
  "123456789",
  "12345678",
  "12345",
  "1234567",
  "password123",
  "123123",
  "1234567890",
  "000000",
  "111111",
  "abc123",
  "qwerty",
  "monkey",
  "1234",
  "admin",
  "letmein",
  "trustno1",
  "dragon",
  "baseball",
];

export class HIBPService {
  /**
   * Check if password has been in known data breaches
   * Uses k-anonymity approach for privacy
   * 
   * @param password Raw password to check
   * @returns Promise<{breached: boolean; count?: number; error?: string}>
   * 
   * @example
   * const result = await HIBPService.checkPassword("myPassword123!");
   * if (result.breached) {
   *   console.log(`Password found in ${result.count} breaches`);
   * }
   */
  static async checkPassword(
    password: string
  ): Promise<{
    breached: boolean;
    count?: number;
    error?: string;
  }> {
    try {
      // Step 1: Check against common passwords locally (fast, no API call)
      if (this.isCommonPassword(password)) {
        return {
          breached: true,
          count: 999999, // Placeholder for very common
        };
      }

      // Step 2: Query HIBP API with k-anonymity approach
      const breachInfo = await this.queryHIBP(password);

      if (breachInfo.breached) {
        return {
          breached: true,
          count: breachInfo.count,
        };
      }

      return {
        breached: false,
      };
    } catch (error) {
      // On error, don't block the registration
      // Log the error but allow password to proceed
      console.warn(
        `HIBP check failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );

      return {
        breached: false, // Assume safe if we can't verify
        error: "Could not verify against breach database",
      };
    }
  }

  /**
   * Query HIBP API using k-anonymity
   * 
   * Privacy approach:
   * 1. Hash password with SHA-1
   * 2. Send only first 5 chars of hash to API
   * 3. API returns all hashes starting with those 5 chars
   * 4. Check locally if full hash is in the response
   * 
   * @private
   */
  private static async queryHIBP(
    password: string
  ): Promise<{
    breached: boolean;
    count?: number;
  }> {
    // SHA-1 hash of password (required by HIBP API)
    const sha1Hash = crypto
      .createHash("sha1")
      .update(password)
      .digest("hex")
      .toUpperCase();

    // Only send first 5 characters
    const prefix = sha1Hash.substring(0, 5);
    const suffix = sha1Hash.substring(5);

    try {
      // Fetch with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), HIBP_TIMEOUT);

      const response = await fetch(`${HIBP_API_URL}/${prefix}`, {
        method: "GET",
        headers: {
          "User-Agent": "Pragyan-AI/1.0 (Career Platform)",
        },
        signal: controller.signal as any,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HIBP API returned ${response.status}`);
      }

      const text = await response.text();
      const hashes = text.split("\r\n");

      // Check if our suffix is in the response
      for (const line of hashes) {
        const [hash, count] = line.split(":");
        if (hash === suffix) {
          return {
            breached: true,
            count: parseInt(count, 10) || 1,
          };
        }
      }

      return {
        breached: false,
      };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("HIBP check timed out");
      }
      throw error;
    }
  }

  /**
   * Check if password is in common passwords list
   * @private
   */
  private static isCommonPassword(password: string): boolean {
    const lower = password.toLowerCase();
    return COMMON_PASSWORDS.includes(lower);
  }

  /**
   * Get list of common passwords (for frontend validation preview)
   * 
   * @returns Array of common passwords
   */
  static getCommonPasswords(): string[] {
    return [...COMMON_PASSWORDS];
  }

  /**
   * Check multiple passwords (for bulk operations)
   * 
   * @param passwords Array of passwords to check
   * @returns Promise<Map<string, boolean>> Map of password to breach status
   */
  static async checkMultiple(
    passwords: string[]
  ): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();

    for (const password of passwords) {
      const result = await this.checkPassword(password);
      results.set(password, result.breached);
    }

    return results;
  }
}
