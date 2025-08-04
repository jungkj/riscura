import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  testEnvironment: 'jsdom',
  testMatch: [
    '<rootDir>/src/__tests__/**/*.test.{js,jsx,ts,tsx}',
  ],
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/cypress/',
    '<rootDir>/src/__tests__/e2e/',
    '<rootDir>/src/__tests__/integration/api-integration.test.ts',
    '<rootDir>/src/__tests__/integration/user-workflows.test.ts',
    '<rootDir>/src/__tests__/integration/file-operations.test.ts',
    '<rootDir>/src/__tests__/integration/performance/'
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/__tests__/**',
    '!src/app/**/layout.tsx',
    '!src/app/**/loading.tsx',
    '!src/app/**/error.tsx',
    '!src/app/**/not-found.tsx',
    '!src/app/**/page.tsx',
    '!src/middleware.ts',
    '!src/lib/accessibility/**',
    '!src/lib/keyboard/**',
    '!src/lib/performance/**',
    '!src/lib/theme/**',
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './src/lib/billing/': {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    './src/lib/api/middleware.ts': {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testEnvironmentOptions: {
    url: 'http://localhost:3000',
  },
  setupFiles: ['<rootDir>/src/__tests__/env.setup.ts'],
}

export default createJestConfig(customJestConfig) 