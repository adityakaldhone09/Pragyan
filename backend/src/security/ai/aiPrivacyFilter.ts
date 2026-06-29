const SECRET_PATTERNS: Array<[RegExp, string]> = [
  [/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[REDACTED_EMAIL]'],
  [/\b(?:\+?91[-.\s]?)?[6-9]\d{9}\b/g, '[REDACTED_PHONE]'],
  [/\b(?:password|passwd|pwd)\s*[:=]\s*("[^"]+"|'[^']+'|[^\s,;]+)/gi, 'password: [REDACTED]'],
  [/\b(api[_-]?key|secret|token|access[_-]?token|refresh[_-]?token)\s*[:=]\s*("[^"]+"|'[^']+'|[A-Za-z0-9._~+/=-]{12,})/gi, '$1: [REDACTED]'],
  [/\bAIza[0-9A-Za-z_-]{20,}\b/g, '[REDACTED_API_KEY]'],
  [/\b(?:sk|pk)_(?:live|test)_[0-9A-Za-z]{16,}\b/g, '[REDACTED_TOKEN]'],
  [/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g, '[REDACTED_JWT]'],
];

export function maskSensitiveText(input: string): string {
  return SECRET_PATTERNS.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), input);
}

export function maskSensitiveValue<T>(value: T): T {
  if (typeof value === 'string') {
    return maskSensitiveText(value) as T;
  }

  if (Array.isArray(value)) {
    return value.map(maskSensitiveValue) as T;
  }

  if (value && typeof value === 'object') {
    const masked: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      masked[key] = maskSensitiveValue(entry);
    }
    return masked as T;
  }

  return value;
}
