import { PageTitle, Subtitle, Section, Label, Title, Code, Note, Divider } from '../shared'

export default function ConfigExperiment() {
  return (
    <div>
      <PageTitle>Configuration</PageTitle>
      <Subtitle>
        jest.config.ts fields: transform, moduleNameMapper, setup files, globalSetup, projects.
        Source: <code>jest-config/build/Defaults.js</code>
      </Subtitle>

      <Section>
        <Label>4.8.1 — transform</Label>
        <Title>The transform pipeline</Title>
        <Note>
          <code>transform</code> maps file patterns to transformer modules. ts-jest transforms TypeScript,
          babel-jest transforms JavaScript (default). The transformer runs before Jest imports the module —
          this is where mock hoisting occurs for babel-jest.
        </Note>
        <Code>{`// jest.config.ts
{
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: './tsconfig.jest.json',   // override tsconfig per-transform
      diagnostics: { ignoreCodes: ['TS2322'] },  // suppress specific errors
    }],
    '\\.svg$': '<rootDir>/src/__mocks__/svgTransform.ts',  // custom
  },
}

// ts-jest options:
// isolatedModules: true   → faster, skips type-checking (use tsc for that)
// diagnostics: false      → skip all TS errors in tests
// astTransformers           → babel-like plugin support in ts-jest`}</Code>
      </Section>

      <Divider />

      <Section>
        <Label>4.8.2 — moduleNameMapper</Label>
        <Title>Path aliases and asset mocks</Title>
        <Code>{`{
  moduleNameMapper: {
    // Path alias (match tsconfig paths)
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',

    // Static assets → mock module
    '\\.(css|less|scss|sass)$': '<rootDir>/src/__mocks__/fileMock.ts',
    '\\.(jpg|jpeg|png|gif|svg|webp)$': '<rootDir>/src/__mocks__/fileMock.ts',

    // Stub out a specific module
    '^lodash-es$': 'lodash',   // use CJS version in tests
  }
}

// src/__mocks__/fileMock.ts:
module.exports = 'test-file-stub'`}</Code>
      </Section>

      <Divider />

      <Section>
        <Label>4.8.3 — Setup file execution order</Label>
        <Title>globalSetup → setupFiles → setupFilesAfterEnv</Title>
        <Note>
          Three distinct phases, each with a different scope and purpose.
        </Note>
        <Code>{`// Phase 1: globalSetup (once before all test suites, Node context)
// Use for: starting DB, spinning up test server
// Does NOT have access to Jest globals (no expect, jest, etc.)
// globalSetup: './src/test-global-setup.ts'

// Phase 2: setupFiles (before test framework, per worker)
// Use for: polyfills, env variables, jest.setTimeout()
// Has access to Node globals but NOT to jest/describe/expect
// setupFiles: ['./src/test-env.ts']

// Phase 3: setupFilesAfterEnv (after framework is installed, per test file)
// Use for: custom matchers, jest-dom, MSW server setup
// Has full access to jest, expect, beforeEach, etc.
// setupFilesAfterEnv: ['./src/test-setup.ts']

// teardown mirror:
// globalTeardown: './src/test-global-teardown.ts'`}</Code>
      </Section>

      <Divider />

      <Section>
        <Label>4.8.4 — projects</Label>
        <Title>Multi-environment monorepo setup</Title>
        <Code>{`// Run the same test suite in multiple environments:
{
  projects: [
    {
      displayName: 'node',
      testEnvironment: 'node',
      testMatch: ['**/api/**/*.test.ts'],
    },
    {
      displayName: 'jsdom',
      testEnvironment: 'jsdom',
      testMatch: ['**/components/**/*.test.tsx'],
      setupFilesAfterEnv: ['./src/test-setup.ts'],
    },
    {
      displayName: 'integration',
      testEnvironment: 'node',
      testMatch: ['**/integration/**/*.test.ts'],
      globalSetup: './src/integration-setup.ts',
      testTimeout: 30000,
    },
  ],
}

// Also useful for: running the same file under both Node and jsdom
// to surface environment-dependent behavior`}</Code>
      </Section>

      <Divider />

      <Section>
        <Label>4.8.5 — testTimeout and test.each</Label>
        <Title>Useful config options</Title>
        <Code>{`{
  testTimeout: 5000,       // default 5s per test
  maxWorkers: '50%',       // use half the CPU cores
  bail: 1,                 // stop after first failure
  verbose: true,           // print each test name
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
}

// test.each — table-driven tests
test.each([
  [1, 1, 2],
  [2, 3, 5],
  [0, -1, -1],
])('add(%i, %i) = %i', (a, b, expected) => {
  expect(a + b).toBe(expected)
})`}</Code>
      </Section>

      <Divider />

      <Section>
        <Label>Source Reading</Label>
        <Title>Where to look</Title>
        <Code>{`node_modules/jest-config/build/
  Defaults.js     ← all default values (transform, testMatch, etc.)
  index.js        ← normalizeConfig(), reads jest.config.ts

node_modules/jest-runtime/build/
  index.js        ← module loading, mock registry, transform cache`}</Code>
      </Section>
    </div>
  )
}
