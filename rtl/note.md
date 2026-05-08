# React Testing Library — Analysis

## Pros

1. **Encourages accessible markup by default** — getByRole and getByLabelText fail if aria attributes and label associations are missing, catching a11y bugs during development.

2. **Tests are resilient to refactoring** — because queries are semantic (role, text) not structural (CSS class, id), renaming internals doesn't break tests.

3. **Unified API across frameworks** — @testing-library/{react,vue,angular,svelte} share the same query/waitFor model, so knowledge transfers.

4. **userEvent v14 is faithful to real browser behavior** — full event sequence (pointerdown → pointerup → click → focus) catches bugs that fireEvent misses.

5. **renderHook covers hook logic cleanly** — no need to wrap hooks in dummy components; renderHook + act() handles the lifecycle correctly.

6. **cleanup() is automatic** — integrated into afterEach in vitest/jest, preventing DOM leakage between tests.

7. **waitFor + findBy eliminate polling hacks** — MutationObserver-backed retry loops make async assertions deterministic without arbitrary timeouts.

## Cons

1. **act() warnings are cryptic** — when async state updates happen outside React's event system, the warning message doesn't always point to the right place.

2. **Query debugging is hard in large trees** — getByRole walking the full document can match unexpected elements; within() discipline is required but easy to forget.

3. **userEvent is slower than fireEvent** — dispatching the full event sequence per interaction adds up in tests with many interactions. Noticeable in suites with thousands of tests.

4. **No snapshot support for component structure** — intentional, but teams coming from Enzyme miss it for stable presentational components.

5. **getByRole relies on jsdom's ARIA implementation** — jsdom doesn't implement the full ARIA spec; some edge cases (complex widgets, live regions) behave differently from real browsers.

6. **renderHook requires act() discipline** — state updates from hooks must be wrapped in act(); forgetting it produces inconsistent test results.

## When RTL Fits

- Any project that cares about accessibility
- React apps with interactive UI (forms, modals, tabs)
- Teams that want tests to survive UI refactors
- Custom hook development and testing
- Integration-style component tests (full component tree, no shallow)

## When RTL Breaks Down

- Testing animation timing precisely (better with Playwright/Cypress)
- Testing components that depend on real browser layout (getBoundingClientRect returns 0 in jsdom)
- Complex drag-and-drop or canvas interactions
- Visual regression testing (screenshot comparison is outside RTL's scope)
- Deeply embedded third-party component internals

## Performance Notes

From tab 07:
- Synchronous render of a 20-item list: < 5ms in jsdom
- `getAllByRole('listitem')` across 20 items: < 2ms
- `userEvent.type(input, 'hello')`: ~5-10ms (5 full event sequences)
- `waitFor` with 50ms interval adds ~50ms latency per async assertion

## Key Decision Point

**RTL vs Enzyme vs Cypress/Playwright**

RTL fills the unit/integration test layer: components in jsdom, fast, no browser required. Enzyme allowed testing React internals (state, lifecycle methods) — RTL explicitly rejects this. Cypress/Playwright run in real browsers and cover E2E flows but are 10-100x slower and require a running server. The right stack is RTL + Vitest for component tests, Playwright for critical E2E paths.

**RTL vs Storybook interaction tests**

Storybook's `@storybook/test` uses the same RTL + userEvent API but runs stories in a real browser via a Chromium addon. For visual components with layout-dependent behavior, Storybook interaction tests are more accurate. For pure logic and state, RTL in jsdom is faster and sufficient.
