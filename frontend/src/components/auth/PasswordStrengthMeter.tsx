/**
 * Password Strength Meter Component
 * Real-time password strength feedback with visual indicator
 * 
 * Features:
 * - Live strength scoring (Very Weak → Very Strong)
 * - Visual progress bar with color coding
 * - Password requirements checklist
 * - Suggestions for improvement
 * - Password visibility toggle
 * - Generate strong password option
 */

import { useState, useMemo } from "react";
import { Eye, EyeOff, RefreshCw, Copy, Check } from "lucide-react";

export interface PasswordStrengthResult {
  score: 0 | 1 | 2 | 3 | 4;
  label: "Very Weak" | "Weak" | "Fair" | "Strong" | "Very Strong";
  feedback: string;
  suggestions: string[];
  checks: {
    lengthOk: boolean;
    strengthOk: boolean;
    notCommon: boolean;
  };
}

interface PasswordStrengthMeterProps {
  password: string;
  onPasswordChange?: (password: string) => void;
  onStrengthChange?: (strength: PasswordStrengthResult) => void;
  showSuggestions?: boolean;
  showRequirements?: boolean;
  showGenerateButton?: boolean;
}

const STRENGTH_COLORS = [
  "#EF4444", // Red - Very Weak
  "#F97316", // Orange - Weak
  "#FBBF24", // Amber - Fair
  "#84CC16", // Lime - Strong
  "#22C55E", // Green - Very Strong
];

const STRENGTH_LABELS = [
  "Very Weak",
  "Weak",
  "Fair",
  "Strong",
  "Very Strong",
] as const;

/**
 * Estimate password strength client-side
 * Note: This is a simplified version for UX feedback
 * Full validation happens server-side
 */
function estimatePasswordStrength(password: string): PasswordStrengthResult {
  let score = 0;

  // Length scoring
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  if (password.length >= 24) score++;

  // Character variety
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecial = /[@$!%*?&#^()_\-+=\[\]{};':"\\|,.<>\/]/.test(password);

  const varietyCount = [hasUpper, hasLower, hasNumbers, hasSpecial].filter(
    Boolean
  ).length;

  if (varietyCount >= 3) score++;
  if (varietyCount === 4) score++;

  // Cap score at 4
  score = Math.min(4, score);

  // Determine label and feedback
  const label = STRENGTH_LABELS[score];

  // Common weak passwords
  const commonPasswords = [
    "password",
    "123456",
    "12345678",
    "qwerty",
    "abc123",
  ];
  const isCommon = commonPasswords.includes(password.toLowerCase());

  // Feedback
  let feedback = "";
  switch (score) {
    case 0:
      feedback = "Your password is very weak";
      break;
    case 1:
      feedback = "Your password is weak";
      break;
    case 2:
      feedback = "Your password is fair";
      break;
    case 3:
      feedback = "Your password is strong";
      break;
    case 4:
      feedback = "Your password is very strong";
      break;
  }

  if (isCommon && score < 3) {
    feedback = "This password is too common";
  }

  // Suggestions
  const suggestions: string[] = [];
  if (password.length < 12) {
    suggestions.push("Use at least 12 characters");
  }
  if (!hasUpper) {
    suggestions.push("Add an uppercase letter");
  }
  if (!hasLower) {
    suggestions.push("Add a lowercase letter");
  }
  if (!hasNumbers) {
    suggestions.push("Add a number");
  }
  if (!hasSpecial) {
    suggestions.push("Add a special character");
  }

  return {
    score: score as 0 | 1 | 2 | 3 | 4,
    label,
    feedback,
    suggestions: suggestions.slice(0, 3),
    checks: {
      lengthOk: password.length >= 12,
      strengthOk: score >= 3,
      notCommon: !isCommon,
    },
  };
}

/**
 * Generate a random strong password
 */
function generateStrongPassword(): string {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const special = "!@#$%^&*";

  const allChars = uppercase + lowercase + numbers + special;

  let password = "";

  // Ensure at least one from each category
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Fill remaining 12 characters randomly
  for (let i = 0; i < 12; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

export function PasswordStrengthMeter({
  password,
  onPasswordChange,
  onStrengthChange,
  showSuggestions = true,
  showRequirements = true,
  showGenerateButton = true,
}: PasswordStrengthMeterProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const strength = useMemo(() => {
    const result = estimatePasswordStrength(password);
    onStrengthChange?.(result);
    return result;
  }, [password, onStrengthChange]);

  const handleGeneratePassword = () => {
    const generated = generateStrongPassword();
    onPasswordChange?.(generated);
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!password) {
    return null;
  }

  return (
    <div className="space-y-3 mt-2">
      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-700">
            Password Strength
          </span>
          <span
            className="text-xs font-semibold"
            style={{ color: STRENGTH_COLORS[strength.score] }}
          >
            {strength.label}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${((strength.score + 1) / 5) * 100}%`,
              backgroundColor: STRENGTH_COLORS[strength.score],
            }}
          />
        </div>
      </div>

      {/* Requirements Checklist */}
      {showRequirements && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-700">Requirements:</div>
          <ul className="space-y-1 text-xs">
            <li
              className="flex items-center gap-2"
              style={{
                color: strength.checks.lengthOk ? "#22C55E" : "#9CA3AF",
              }}
            >
              <span
                className={`w-4 h-4 rounded border flex items-center justify-center ${
                  strength.checks.lengthOk
                    ? "bg-green-500 border-green-500"
                    : "border-gray-300"
                }`}
              >
                {strength.checks.lengthOk && (
                  <span className="text-white text-xs">✓</span>
                )}
              </span>
              At least 12 characters
            </li>

            <li
              className="flex items-center gap-2"
              style={{
                color: strength.checks.strengthOk ? "#22C55E" : "#9CA3AF",
              }}
            >
              <span
                className={`w-4 h-4 rounded border flex items-center justify-center ${
                  strength.checks.strengthOk
                    ? "bg-green-500 border-green-500"
                    : "border-gray-300"
                }`}
              >
                {strength.checks.strengthOk && (
                  <span className="text-white text-xs">✓</span>
                )}
              </span>
              Good password strength (Strong or Very Strong)
            </li>

            <li
              className="flex items-center gap-2"
              style={{
                color: strength.checks.notCommon ? "#22C55E" : "#9CA3AF",
              }}
            >
              <span
                className={`w-4 h-4 rounded border flex items-center justify-center ${
                  strength.checks.notCommon
                    ? "bg-green-500 border-green-500"
                    : "border-gray-300"
                }`}
              >
                {strength.checks.notCommon && (
                  <span className="text-white text-xs">✓</span>
                )}
              </span>
              Not a common password
            </li>
          </ul>
        </div>
      )}

      {/* Suggestions */}
      {showSuggestions && strength.suggestions.length > 0 && (
        <div className="space-y-1 bg-amber-50 rounded px-3 py-2">
          <div className="text-xs font-medium text-amber-900">Suggestions:</div>
          <ul className="text-xs text-amber-800 space-y-1">
            {strength.suggestions.map((suggestion, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Password Input Controls */}
      <div className="flex gap-2">
        {/* Visibility Toggle */}
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50 transition-colors"
          title={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4 text-gray-600" />
          ) : (
            <Eye className="h-4 w-4 text-gray-600" />
          )}
        </button>

        {/* Copy Password */}
        {password && (
          <button
            type="button"
            onClick={handleCopyPassword}
            className="px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50 transition-colors flex items-center gap-1"
            title="Copy password to clipboard"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-xs text-green-600">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 text-gray-600" />
                <span className="text-xs text-gray-600">Copy</span>
              </>
            )}
          </button>
        )}

        {/* Generate Password */}
        {showGenerateButton && (
          <button
            type="button"
            onClick={handleGeneratePassword}
            className="px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50 transition-colors flex items-center gap-1"
            title="Generate a strong password"
          >
            <RefreshCw className="h-4 w-4 text-gray-600" />
            <span className="text-xs text-gray-600">Generate</span>
          </button>
        )}
      </div>
    </div>
  );
}

export { estimatePasswordStrength, generateStrongPassword };
