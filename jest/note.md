# Jest — Analysis

## Pros

1. **Battle-tested module isolation** — each test file gets its own module registry. Modules are re-required fresh per file by default, eliminating cross-test singleton pollution without explicit teardown.

2. **jest.mock() hoisting is invisible but powerful** — Babel transforms move `jest.mock()` above imports, so the mock is always in place before the module under test loads. No timing issues to think about.

3. **Snapshot testing is low-ceremony** — `toMatchInlineSnapshot()` rewrites the test file automatically on first run. Snapshots update with `-u`. Zero boilerplate for asserting complex serialized shapes.

4. **Fake timers are comprehensive** — `@sinonjs/fake-timers` replaces `setTimeout`, `setInterval`, `Date`, `performance.now`, and `queueMicrotask` atomically. `advanceTimersByTimeAsync()` correctly interleaves Promise resolution with timer advancement.

5. **Coverage is built in** — no separate tool needed. `--coverage` instruments via babel or v8, produces `lcov`, `html`, and `text` reports. `coverageThresholds` fail the build on regressions.

6. **expect.extend() is composable** — custom matchers integrate cleanly with `.not`, asymmetric combinators, and snapshot serialization. The `{ pass, message }` contract is simple.

7. **`projects` enables monorepo config without duplication** — run browser components in jsdom and API code in node, sharing one `jest` invocation.

## Cons

1. **ESM support is still friction** — Jest's module system is CommonJS-first. Native ESM requires `--experimental-vm-modules`, a Node flag, and `extensionsToTreatAsEsm`. Vitest handles ESM natively with zero config.

2. **Startup is slow for large suites** — Jest spawns worker processes (one per CPU core by default), loads the transform cache, and initializes each worker's module registry. Cold startup on a large repo is noticeably slower than Vitest.

3. **`jest.mock()` hoisting breaks variable capture** — you cannot reference module-scope variables in the factory unless they're prefixed with `mock`. This is a leaky abstraction from the Babel transform that surprises everyone eventually.

4. **TypeScript config requires ts-node** — `jest.config.ts` needs `ts-node` to bootstrap. Alternatively, use `jest.config.js` with JSDoc types, which adds friction compared to Vitest's native TypeScript config.

5. **`babel-jest` as default transform is a dependency assumption** — projects not using Babel have to configure `ts-jest` or `@swc/jest` manually. Vitest uses Vite's transform pipeline, which is already set up.

6. **Test file isolation has a cost** — re-initializing the module registry per file is correct but expensive. Large suites with many small files pay a startup tax per file. Vitest shares the module graph with the dev server.

7. **`jest.useFakeTimers()` leaks across tests if not restored** — `useRealTimers()` in `afterEach`/`afterAll` is required. Forgetting it produces bizarre failures in unrelated tests that use real async operations.

## When Jest Fits

- Projects already using Babel (CRA, Next.js, Expo) — zero additional transform config
- Teams that want snapshot testing with inline rewrites
- Monorepos that need to run tests in multiple environments via `projects`
- CI environments where Node ESM quirks need to be avoided
- Large organizations that need mature ecosystem (custom reporters, plugins, coverage tooling)

## When Jest Breaks Down

- Pure ESM codebases — Vitest or native Node test runner are better fits
- Vite-based projects — Vitest shares the Vite config, eliminating dual transform setup
- Projects requiring sub-second test feedback — Vitest is measurably faster on cold start
- Projects that need real browser testing — use Playwright or Cypress instead

## Jest vs Vitest

| Dimension | Jest | Vitest |
|---|---|---|
| ESM support | `--experimental-vm-modules` required | Native |
| TypeScript config | Requires `ts-node` | Native |
| Cold start | Slower (worker spawn + registry init) | Faster (shared Vite graph) |
| Watch mode | `jest --watch` | `vitest` (instant HMR-style) |
| Config | `jest.config.ts` | `vite.config.ts` (unified) |
| Snapshot | ✓ built-in | ✓ built-in (compatible) |
| Coverage | Built-in via babel/v8 | Built-in via v8/istanbul |
| Ecosystem | Mature, large | Growing, Jest-compatible API |
| Fake timers | `@sinonjs/fake-timers` | Same library |
| Browser mode | jsdom/node only | Experimental browser mode |

## Key Decision Point

**Jest vs Vitest**: If the project uses Vite, use Vitest — it shares the transform config and dev server module graph, making setup trivial and feedback fast. If the project uses webpack/Babel (CRA, Next.js), Jest is the natural fit with less configuration. The APIs are nearly identical at the assertion layer, so switching is low-cost.

**Jest vs Playwright/Cypress**: Jest with jsdom covers unit/integration for pure logic and component behavior without layout. Playwright/Cypress run in a real browser and catch layout-dependent bugs, but are 10-100x slower. Stack both: Jest for component logic, Playwright for critical E2E paths.
