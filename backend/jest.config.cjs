module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['**/__tests__/**/*.+(ts|tsx|js)', '**/?(*.)+(spec|test).+(ts|tsx|js)'],
  setupFilesAfterEnv: ['<rootDir>/tests/setupTests.ts'],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/ai/**/*.ts',
    'src/services/aiProvider.ts',
    'src/lib/aiTelemetry.ts',
    'src/lib/redis.ts',
    'src/middleware/rateLimiter.ts',
    'src/middleware/redisRateLimiter.ts',
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text-summary', 'lcov'],
  coverageThreshold: {
    global: {
      branches: 34,
      functions: 45,
      lines: 54,
      statements: 52,
    },
  },
};
