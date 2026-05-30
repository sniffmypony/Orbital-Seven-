import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  // Use a separate tsconfig for Jest — avoids conflicts with Vite's "bundler"
  // module resolution, which Jest does not support.
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.test.json',
    },
  },
  moduleNameMapper: {
    // Stub out CSS imports so Jest doesn't choke on them
    '\\.(css|less|scss|sass)$': '<rootDir>/__mocks__/fileMock.js',
    // Mirror the @/ path alias from tsconfig/vite
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  passWithNoTests: true,
}

export default config
