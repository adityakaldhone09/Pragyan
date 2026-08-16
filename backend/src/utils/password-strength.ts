/**
 * Password Strength Estimator
 * Used for frontend feedback on password creation
 */

import { zxcvbn } from "zxcvbn-ts";
import { HIBPService } from "@/services/hibp.service";

export interface PasswordStrengthResult {
  score: 0 | 1 | 2 | 3 | 4; // 0 = very weak, 4 = very strong
  label: "Very Weak" | "Weak" | "Fair" | "Strong" | "Very Strong";
  feedback: string;
  suggestions: string[];
  checks: {
    lengthOk: boolean;
    strengthOk: boolean;
    notCommon: boolean;
  };
}

const STRENGTH_LABELS = [
  "Very Weak",
  "Weak",
  "Fair",
  "Strong",
  "Very Strong",
] as const;

const MIN_LENGTH_FOR_STRONG = 12;
const MIN_SCORE_FOR_REGISTRATION = 3; // Strong or Very Strong

export class PasswordStrengthEstimator {
  /**
   * Estimate password strength
   * Used for real-time feedback on registration form
   * 
   * @param password Password to estimate
   * @param userInputs Optional additional context (e.g., email, full name)
   * @returns PasswordStrengthResult with score, label, and feedback
   */
  static estimate(password: string, userInputs: string[] = []): PasswordStrengthResult {
    // Include common passwords in the userInputs for zxcvbn to check against
    const allInputs = [...userInputs, ...HIBPService.getCommonPasswords()];
    const result = zxcvbn(password, allInputs);

    const lengthOk = password.length >= MIN_LENGTH_FOR_STRONG;
    const strengthOk = result.score >= MIN_SCORE_FOR_REGISTRATION;
    const notCommon = !HIBPService.getCommonPasswords().includes(
      password.toLowerCase()
    );

    let feedback = this.generateFeedback(result, lengthOk, notCommon);
    let suggestions = result.feedback.suggestions || [];

    // Add custom suggestions
    if (!lengthOk) {
      suggestions = [
        "Use at least 12 characters",
        ...suggestions,
      ];
    }

    return {
      score: result.score as 0 | 1 | 2 | 3 | 4,
      label: STRENGTH_LABELS[result.score],
      feedback,
      suggestions: suggestions.slice(0, 3), // Limit to 3 suggestions
      checks: {
        lengthOk,
        strengthOk,
        notCommon,
      },
    };
  }

  /**
   * Check if password meets minimum requirements for registration
   * 
   * @param password Password to check
   * @returns boolean true if password is acceptable
   */
  static isSufficientlyStrong(password: string): boolean {
    const estimate = this.estimate(password);
    return (
      estimate.checks.lengthOk &&
      estimate.checks.strengthOk &&
      estimate.checks.notCommon
    );
  }

  /**
   * Generate human-friendly feedback
   * @private
   */
  private static generateFeedback(
    result: any,
    lengthOk: boolean,
    notCommon: boolean
  ): string {
    if (result.score >= 3) {
      return "Your password is strong";
    }

    if (!notCommon) {
      return "This password is too common. Please choose something more unique";
    }

    if (!lengthOk) {
      return `Your password should be at least ${MIN_LENGTH_FOR_STRONG} characters`;
    }

    return result.feedback?.warning || "Your password could be stronger";
  }

  /**
   * Get visual indicator color for password strength
   * 
   * @param score Password strength score (0-4)
   * @returns Color code for UI display
   */
  static getStrengthColor(score: 0 | 1 | 2 | 3 | 4): string {
    const colors = [
      "#EF4444", // Red - Very Weak
      "#F97316", // Orange - Weak
      "#FBBF24", // Amber - Fair
      "#84CC16", // Lime - Strong
      "#22C55E", // Green - Very Strong
    ];
    return colors[score];
  }

  /**
   * Generate a random strong password for user
   * 
   * @returns string A random 16-character strong password
   */
  static generateStrongPassword(): string {
    // Character sets
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*";

    const allChars = uppercase + lowercase + numbers + symbols;

    let password = "";

    // Ensure at least one from each category
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];

    // Fill remaining 12 characters randomly
    for (let i = 0; i < 12; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password
    return password
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("");
  }
}
