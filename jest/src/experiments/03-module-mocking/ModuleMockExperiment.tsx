import { PageTitle, Subtitle, Section, Label, Title, Code, Note, Divider } from '../shared'

export default function ModuleMockExperiment() {
  return (
    <div>
      <PageTitle>Module Mocking</PageTitle>
      <Subtitle>
        jest.mock(), manual __mocks__, isolateModules, and the hoisting mechanism.
        Source: <code>jest-runtime/build/index.js</code>
      </Subtitle>

      <Section>
        <Label>4.3.1 — jest.mock() and hoisting</Label>
        <Title>Automatic Babel hoisting</Title>
        <Note>
          <code>jest.mock()</code> calls are hoisted to the top of the file by <code>babel-plugin-jest-hoist</code>.
          This means the mock is registered before any <code>import</code> statements execute — even though
          the <code>jest.mock()</code> call appears after them in source code.
        </Note>
        <Code>{`// This is what you write:
import { fetchUser } from './api'
jest.mock('./api')

// This is what Babel transforms it to (conceptually):
jest.mock('./api')           // ← hoisted to top
import { fetchUser } from './api'  // ← now gets the mock

// Consequence: you CANNOT use a variable in jest.mock() factory
// unless it's prefixed with 'mock' (hoist safety check)
const MY_URL = 'http://test'
jest.mock('./api', () => ({
  // fetchUser: () => ({ url: MY_URL })  ← ERROR: MY_URL out of scope
  fetchUser: () => ({ url: 'http://test' }) // ← must be literal
}))

// Exception: variables prefixed with 'mock' are allowed:
const mockUrl = 'http://test'
jest.mock('./api', () => ({
  fetchUser: () => ({ url: mockUrl })  // ← ok
}))`}</Code>
      </Section>

      <Divider />

      <Section>
        <Label>4.3.2 — Factory function</Label>
        <Title>Inline mock implementation</Title>
        <Code>{`jest.mock('./api', () => ({
  fetchUser: jest.fn().mockResolvedValue({ id: 1, name: 'Alice', email: 'a@test.com' }),
  formatUser: jest.fn((user) => \`MOCK: \${user.name}\`),
  BASE_URL: 'https://mock.test',
}))

// Access the mock inside the test:
import { fetchUser } from './api'

test('fetchUser is mocked', async () => {
  const user = await fetchUser(1)
  expect(user.name).toBe('Alice')
  expect(fetchUser).toHaveBeenCalledWith(1)
})`}</Code>
      </Section>

      <Divider />

      <Section>
        <Label>4.3.3 — Manual mocks (__mocks__/)</Label>
        <Title>Persistent mock in __mocks__/ directory</Title>
        <Note>
          For <strong>relative imports</strong>: place <code>__mocks__/api.ts</code> adjacent to <code>api.ts</code>.
          Calling <code>jest.mock('./api')</code> will use this file automatically instead of an auto-mock.<br /><br />
          For <strong>node modules</strong>: place <code>__mocks__/axios.ts</code> adjacent to <code>node_modules/</code>.
          With <code>automock: false</code> (default), you still need to call <code>jest.mock('axios')</code>.
        </Note>
        <Code>{`// File layout for this experiment:
// src/experiments/03-module-mocking/
//   api.ts              ← real module
//   __mocks__/
//     api.ts            ← manual mock
//   module-mock.test.ts

// In the test file:
jest.mock('./api')        // ← uses __mocks__/api.ts automatically

import { fetchUser, formatUser } from './api'

test('uses manual mock', async () => {
  const user = await fetchUser(5)
  expect(user.name).toBe('Mock User 5')
  expect(formatUser(user)).toBe('MOCK: [5] Mock User 5')
})`}</Code>
      </Section>

      <Divider />

      <Section>
        <Label>4.3.4 — isolateModules</Label>
        <Title>Fresh module registry per block</Title>
        <Note>
          <code>jest.isolateModules()</code> creates a fresh module registry inside the callback.
          Use it when you need two <code>require</code> calls to the same module to get separate instances
          — useful for testing modules that store singleton state.
        </Note>
        <Code>{`test('isolateModules gives fresh module instances', () => {
  let instance1: typeof import('./api')
  let instance2: typeof import('./api')

  jest.isolateModules(() => {
    instance1 = require('./api')
  })
  jest.isolateModules(() => {
    instance2 = require('./api')
  })

  // instance1 and instance2 are different module instances
  expect(instance1!).not.toBe(instance2!)
})

// Also useful for testing environment-dependent singletons:
test('module reads env var at import time', () => {
  process.env.API_URL = 'http://staging'
  let mod: typeof import('./api')
  jest.isolateModules(() => {
    mod = require('./api')
  })
  expect(mod!.BASE_URL).toBe('http://staging')
})`}</Code>
      </Section>

      <Divider />

      <Section>
        <Label>Source Reading</Label>
        <Title>Where to look</Title>
        <Code>{`node_modules/jest-runtime/build/index.js
  requireModule()         ← module resolution + mock registry lookup
  _shouldMock()           ← decides if a module should be auto/manual mocked
  _mockRegistry           ← Map<string, ModuleMock>
  _moduleRegistry         ← Map<string, Module> (real modules)

node_modules/babel-plugin-jest-hoist/
  index.js                ← AST transform that lifts jest.mock() calls`}</Code>
      </Section>
    </div>
  )
}
