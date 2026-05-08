import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.jest.json' }],
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/main.tsx',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*Experiment.tsx',
    '!src/core/mini-jest.ts',
  ],
  coverageProvider: 'v8',
  coverageReporters: ['text', 'lcov', 'html'],
}

export default config
