import { PageTitle, Subtitle, Section, Label, Title, Code, Note, Divider } from '../shared'

export default function CoverageExperiment() {
  return (
    <div>
      <PageTitle>Coverage</PageTitle>
      <Subtitle>
        --coverage flag, babel vs v8 providers, branch coverage, and istanbul pragmas.
        Run: <code>npm run test:coverage</code>
      </Subtitle>

      <Section>
        <Label>4.7.1 — Configuration</Label>
        <Title>collectCoverageFrom and providers</Title>
        <Note>
          <strong>babel provider</strong> (default): instruments code at transform time via babel plugins.
          Works with any test environment. Slower instrumentation.<br />
          <strong>v8 provider</strong>: uses Node.js's built-in V8 coverage. No instrumentation overhead.
          Faster but requires Node 12+. Reports slightly different numbers due to native tracking.
        </Note>
        <Code>{`// jest.config.ts
{
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/main.tsx',          // entry point — not meaningful to cover
    '!src/**/*.test.{ts,tsx}', // test files themselves
    '!src/**/*Experiment.tsx', // UI-only components
  ],
  coverageProvider: 'v8',     // 'babel' | 'v8'
  coverageReporters: ['text', 'lcov', 'html'],
  // text: stdout table
  // lcov: for CI/SonarQube
  // html: opens in browser at coverage/index.html
  coverageThresholds: {
    global: { lines: 80, branches: 75, functions: 80, statements: 80 }
  }
}`}</Code>
      </Section>

      <Divider />

      <Section>
        <Label>4.7.2 — Branch coverage</Label>
        <Title>What counts as a branch</Title>
        <Code>{`// Each of these has two branches (true/false)

// ternary
const label = n > 0 ? 'positive' : 'other'

// logical AND
const result = user && user.role === 'admin'

// nullish coalescing
const name = user?.name ?? 'anonymous'

// optional chaining
const city = user?.address?.city

// if/else
if (flag) { return 'A' }
else      { return 'B' }

// switch — each case is a branch
switch (status) {
  case 'active': return true
  case 'inactive': return false
  default: throw new Error('unknown')
}

// Branch coverage requires testing BOTH sides of each branch.
// Run: jest --coverage and check the "Branch" column.`}</Code>
      </Section>

      <Divider />

      <Section>
        <Label>4.7.3 — Istanbul pragmas</Label>
        <Title>Excluding code from coverage</Title>
        <Note>
          Use sparingly. Acceptable for: framework boilerplate, unreachable error paths,
          platform-specific code, and intentionally untested edge cases with documented rationale.
        </Note>
        <Code>{`/* istanbul ignore next */
export function platformSpecific(): string {
  // excluded from coverage entirely
  return 'platform-only code'
}

export function validate(input: unknown): boolean {
  /* istanbul ignore if */
  if (typeof input !== 'string') {
    throw new TypeError('unreachable in practice')
  }
  return input.length > 0
}

export function parseStatus(s: string): 'on' | 'off' {
  if (s === 'on') return 'on'
  if (s === 'off') return 'off'
  /* istanbul ignore next */
  throw new Error(\`Unknown status: \${s}\`)   // exhaustive guard
}`}</Code>
      </Section>

      <Divider />

      <Section>
        <Label>4.7.4 — Reading the report</Label>
        <Title>Output format</Title>
        <Code>{`# Text report (stdout):
File      | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
----------|---------|----------|---------|---------|-------------------
counter.ts|   88.23 |    71.42 |   85.71 |   88.23 | 38

# 71.42% branch = some if/else or ternary has only one side tested
# Line 38 = the untested else branch

# HTML report: coverage/index.html
# Green = covered, Red = uncovered, Yellow = partial branch`}</Code>
      </Section>
    </div>
  )
}
