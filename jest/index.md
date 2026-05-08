# Jest — Deep POC

## Objective

Deeply understand Jest's primitives: matcher engine, mock system, module registry, fake timers, snapshot serialization, and configuration pipeline. Build intuition for what Jest does under the hood by reading source and reimplementing core utilities.

## Minimal Setup

1. Install: `npm install`
2. Run tests: `npm test`
3. Coverage: `npm run test:coverage`
4. Browser demo: `npm run dev`

## Implementation Plan

### 4.1 — Matchers
- Understand `toBe` uses `Object.is` (handles NaN, -0 correctly)
- Difference: `toEqual` vs `toStrictEqual` (undefined props, class instances)
- Asymmetric matchers: `expect.any()`, `objectContaining()`, `arrayContaining()`, `stringMatching()`
- Custom matchers via `expect.extend()` — `{ pass, message }` contract
- Read: `node_modules/expect/build/matchers.js`, `asymmetricMatchers.js`, `utils.js`

### 4.2 — Mock Functions
- `jest.fn()` — `.mock.calls`, `.mock.results`, `.mock.instances`
- `mockReturnValue`, `mockResolvedValue`, `mockImplementation`, `mockImplementationOnce`
- `jest.spyOn()` — spy without replacing, spy with override, restore with `.mockRestore()`
- Precise difference: `mockReset()` vs `mockClear()` vs `mockRestore()`
- Read: `node_modules/jest-mock/build/index.js` — `_mockState`, `_mockConfigRegistry`

### 4.3 — Module Mocking
- `jest.mock('module')` — automatic hoisting by `babel-plugin-jest-hoist`
- Factory function: `jest.mock('../api', () => ({ fetch: jest.fn() }))`
- Manual mocks: `__mocks__/` directory resolution rules for relative vs node modules
- `jest.unmock()`, `jest.isolateModules()`, `jest.resetModules()`, `jest.requireActual()`
- Read: `node_modules/jest-runtime/build/index.js` — `requireModule`, `_shouldMock`, `_mockRegistry`
- Read: `node_modules/babel-plugin-jest-hoist/` — AST hoisting transform

### 4.4 — Timers
- `jest.useFakeTimers()` — uses `@sinonjs/fake-timers` under the hood
- `jest.advanceTimersByTime(ms)`, `jest.runAllTimers()`, `jest.runOnlyPendingTimers()`
- `jest.setSystemTime(date)` — freeze `Date.now()`
- Microtask queue: `advanceTimersByTime` vs `advanceTimersByTimeAsync`
- Probe: `legacyFakeTimers: true` — differences from modern

### 4.5 — Snapshots
- `.toMatchSnapshot()` — writes to `__snapshots__/` on first run
- `.toMatchInlineSnapshot()` — Jest rewrites the source file
- Custom serializers: `expect.addSnapshotSerializer()`
- Update workflow: `--updateSnapshot` / `-u` flag
- When snapshots help vs when they hide regressions

### 4.6 — Async
- `done` callback — correct pattern with try/catch, false positive pitfall
- Return a Promise — simplest; forgetting `return` = false positive
- `async/await` — cleanest, now default
- `.resolves` / `.rejects` matchers — must be `await`ed
- `expect.assertions(n)` and `expect.hasAssertions()` — guard against skipped paths

### 4.7 — Coverage
- `--coverage` flag, `collectCoverageFrom`, `coverageThresholds`
- Coverage providers: `babel` (instruments at transform time) vs `v8` (native Node)
- Report formats: `lcov`, `text`, `html`
- Branch coverage: ternaries, `&&`, `??`, optional chaining
- `istanbul` pragmas: `/* istanbul ignore next */`, `/* istanbul ignore if */`

### 4.8 — Config
- `jest.config.ts` vs `.js` — TypeScript config requires `ts-node`
- `transform` pipeline — order of patterns, caching, ts-jest options
- `moduleNameMapper` — path aliases, asset mocks
- `globalSetup` → `setupFiles` → `setupFilesAfterEnv` — execution order and scope
- `projects` array — multi-environment monorepo
- `test.each`, `describe.each` — table-driven tests
- Read: `node_modules/jest-config/build/Defaults.js`

## Source Code Reading

- `node_modules/expect/build/` — matcher engine, asymmetric matchers, custom extend
- `node_modules/jest-mock/build/` — fn(), spyOn(), mock state management
- `node_modules/jest-runtime/build/` — module loading, mock registry, transform cache
- `node_modules/jest-circus/build/` — test runner loop, beforeEach/afterEach dispatch
- `node_modules/jest-config/build/Defaults.js` — all default configuration values
- `node_modules/babel-plugin-jest-hoist/` — AST transform for jest.mock() hoisting
- `node_modules/@sinonjs/fake-timers/src/` — the fake timer implementation Jest uses

## Core Reimplementation

`src/core/mini-jest.ts` implements:
- `describe(name, fn)` — nested suite grouping with parent-scoped hooks
- `it(name, fn)` / `test(name, fn)` — test registration
- `beforeEach(fn)` / `afterEach(fn)` / `beforeAll(fn)` / `afterAll(fn)` — lifecycle hooks with ancestor propagation
- `expect(received)` — chainable matchers: `toBe`, `toEqual`, `toThrow`, `toHaveBeenCalled`, `toContain`
- `fn(impl?)` — mock function with `.mock.calls`, `.mock.results`, `mockReturnValue`, `mockImplementation`, `mockImplementationOnce`, `mockClear`, `mockReset`
- `run()` — async runner that returns `TestResult[]` with status, duration, and error

## Deliverables

- [ ] All 8 experiment tabs render in browser (`npm run dev`)
- [ ] All test files pass (`npm test`)
- [ ] `src/core/mini-jest.ts` — working reimplementation with tests
- [ ] `note.md` — pros/cons/when-to-use vs Vitest analysis

## Escalation

- Probe: does `jest.mock()` hoisting break without Babel? Run with `ts-jest` in `isolatedModules: true` mode and call `jest.mock()` after the import. What error?
- Probe: `jest.isolateModules()` — force two `require()` calls to the same module to get separate instances. Verify they hold independent state.
- Challenge: write a custom Jest reporter that outputs results as newline-delimited JSON. Pass it via `--reporters`.
- Challenge: configure `projects` to run the same test file in both `node` and `jsdom` environments. Find one assertion that behaves differently.
- Compare: `jest.useFakeTimers({ legacyFakeTimers: true })` — which features break vs modern?
- Deep read: trace how `babel-plugin-jest-hoist` detects and lifts `jest.mock()` calls in the AST.

## Constraint

No `@testing-library/react` in test files. Jest primitives only. The RTL layer is the subject of `../rtl/`. This POC is about Jest itself: the test runner, the mock system, the configuration engine.
