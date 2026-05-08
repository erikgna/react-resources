# React Testing Library — Deep POC

## Objective

Deeply understand RTL's query model, event system, async primitives, hook testing API, and failure modes. Build intuition for what RTL does under the hood by reading source and reimplementing core utilities.

## Minimal Setup

1. Install: `npm install`
2. Run tests: `npm test`
3. Browser demo: `npm run dev`

## Implementation Plan

### 4.1 — Queries
- Study the query priority guide: role > labelText > placeholderText > text > altText > testId
- Understand the three variants: getBy (throw), queryBy (null), findBy (Promise)
- Practice `getAllBy*`, `queryAllBy*`, `within()` scoping
- Read: `@testing-library/dom/src/queries/` in node_modules

### 4.2 — User Events
- Understand userEvent v14 `setup()` API vs legacy `fireEvent`
- Trace what events `userEvent.click()` dispatches vs `fireEvent.click()`
- Test: type, clear, selectOptions, click, hover, tab, keyboard
- Read: `@testing-library/user-event/src/` — especially `setup/` and `pointer/`

### 4.3 — Async
- `waitFor` internals: polling loop with MutationObserver
- `findBy*` as sugar over `waitFor + getBy*`
- `act()` — when React wraps it, when you must wrap it manually
- Fake timers with `vi.useFakeTimers()` + `act(() => vi.advanceTimersByTime())`

### 4.4 — Custom Hooks
- `renderHook` — mounts a minimal host component
- `act()` around state updates in hooks
- `waitFor` for async effects
- `rerender()` with new props

### 4.5 — Providers
- `wrapper` option in `render()`
- Custom `renderWithProviders` utility
- `renderHook` with `wrapper` for context-dependent hooks
- Testing components that throw when used outside providers

### 4.6 — Forms
- Accessibility-first: `getByLabelText`, `getByRole('textbox', { name: '...' })`
- `selectOptions`, radio, checkbox, textarea
- Full submit flow: fill → validate → error state → fix → success
- `aria-invalid`, `aria-describedby`, `role="alert"` patterns

### 4.7 — Performance
- Render count tracking via `useRef` counter
- Behavioral vs snapshot assertions
- `within()` for large UI trees
- Execution timing baselines with `performance.now()`

### 4.8 — Failures
- act() warning causes and correct fixes
- Stale DOM reference after mutation
- Testing implementation details (anti-pattern)
- Async false positives (asserting absence before async op runs)
- `cleanup()` isolation mechanics

## Source Code Reading

- `node_modules/@testing-library/dom/src/` — query engine, waitFor, MutationObserver
- `node_modules/@testing-library/react/src/` — render, renderHook, act wrapper
- `node_modules/@testing-library/user-event/src/` — event dispatch sequences

## Core Reimplementation

`src/core/testing-lib.ts` implements:
- `render()` — createRoot + container management
- `getByText` — DOM text walk
- `getByRole` — implicit ARIA role resolution + accessible name
- `fireEvent` — bubbling DOM events with correct properties
- `waitFor` — polling loop

## Deliverables

- [ ] All 8 experiment tabs render in browser (`npm run dev`)
- [ ] All test files pass (`npm test`)
- [ ] `src/core/testing-lib.ts` — working reimplementation
- [ ] `note.md` — pros/cons/when-to-use analysis

## Escalation

- Implement a custom `renderWithProviders` that wraps React Query + Auth context
- Write tests for a component that uses Suspense + lazy loading
- Test a component that uses `useId()` for label associations
- Probe: what happens when `cleanup()` is NOT called?
- Probe: can you break RTL's act() integration by using a custom render?
- Challenge: reimplement `within()` using `buildQueries(container)` in core

## Constraint

No shallow rendering. No mocking React internals. Test through the DOM — the same interface the user experiences.
