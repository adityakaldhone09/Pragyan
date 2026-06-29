// src/config/env.ts

import dotenv from 'dotenv';

dotenv.config();

const requiredEnvVars = [
  'PORT',
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'RAPID_API_KEY',
];

requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    console.warn(`Warning: ${envVar} is not set in environment variables`);
  }
});

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:5000',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  ai: {
    provider: (process.env.AI_PROVIDER || 'gemini').toLowerCase(),
  },

  oauth: {
    googleClientId: process.env.GOOGLE_CLIENT_ID || null,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || null,
    githubClientId: process.env.GITHUB_CLIENT_ID || null,
    githubClientSecret: process.env.GITHUB_CLIENT_SECRET || null,
    sessionSecret: process.env.SESSION_SECRET || process.env.JWT_SECRET || 'change_me_in_production_use_a_unique_session_secret',
  },

  gemini: {
    apiKey: process.env.GEMINI_API_KEY || null,
    model: process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
  },

  groq: {
    apiKey: process.env.GROQ_API_KEY || null,
    model: process.env.GROQ_MODEL || process.env.ROQ_MODEL || process.env.GROQ_REASONING_MODEL || 'openai/gpt-oss-120b',
    reasoningModel: process.env.GROQ_REASONING_MODEL || process.env.GROQ_MODEL || process.env.ROQ_MODEL || 'openai/gpt-oss-120b',
    chatModel: process.env.GROQ_CHAT_MODEL || 'llama-3.3-70b-versatile',
    fastModel: process.env.GROQ_FAST_MODEL || 'llama-3.1-8b-instant',
  },
  
  database: {
    url: process.env.DATABASE_URL,
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'your_jwt_secret_key',
    expiry: process.env.JWT_EXPIRY || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your_jwt_refresh_secret_key',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '30d',
  },
  
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    allowedOrigins: (() => {
      const configuredOrigins = (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:5173,http://127.0.0.1:5173')
        .split(',')
        .flatMap((origin) => {
          const trimmed = origin.trim();
          return trimmed ? [trimmed] : [];
        });

      const expandedOrigins = configuredOrigins.flatMap((origin) => {
        try {
          const url = new URL(origin);
          const port = url.port ? `:${url.port}` : '';

          if (url.hostname === 'localhost') {
            return [origin, `${url.protocol}//127.0.0.1${port}`];
          }

          if (url.hostname === '127.0.0.1') {
            return [origin, `${url.protocol}//localhost${port}`];
          }
        } catch {
          return [origin];
        }

        return [origin];
      });

      return Array.from(new Set(expandedOrigins));
    })(),
  },
  
  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
  },

  email: {
    host: process.env.EMAIL_HOST || null,
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    user: process.env.EMAIL_USER || null,
    password: process.env.EMAIL_PASSWORD || null,
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER || null,
  },

  rapidApi: {
    key: process.env.RAPID_API_KEY,
  },

  redis: {
    url: process.env.REDIS_URL || null,
  },
};

export const hasGeminiKey = Boolean(config.gemini.apiKey);
export const hasGroqKey = Boolean(config.groq.apiKey);
export const isLocalAI = config.ai.provider === 'local';

if (!hasGeminiKey && !hasGroqKey && !isLocalAI) {
  console.warn('Warning: GEMINI_API_KEY and GROQ_API_KEY are not set. AI features will run in fallback/heuristic mode.');
}
