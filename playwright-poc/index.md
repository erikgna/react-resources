# Playwright CT — Deep POC

## Objective

Deeply understand Playwright's Component Testing API: the Locator model, auto-waiting,
network interception, accessibility testing, Page Object Model, and failure modes.
Understand how Playwright CT differs from RTL and Cypress CT at the architecture level.

## Minimal Setup

1. Install: `npm install`
2. Install browser: `npm run install-browsers`
3. Run tests: `npm run test-ct`
4. Browser demo: `npm run dev`
5. Debug mode: `npm run test-ct:debug`

## Key Conceptual Shift from RTL

| Concept | RTL | Playwright CT |
|---|---|---|
| Query result | DOM element (eager) | Locator (lazy, retrying) |
| Not found | Throws immediately | Waits until timeout |
| Assertions | Synchronous (jest-dom) | Async (auto-retry) |
| Events | jsdom simulation | Real browser events |
| Network | Not accessible | `page.route()` interception |
| Browser | jsdom (fake) | Chromium / Firefox / Safari |
| act() | Manual in async tests | Not needed |

## Implementation Plan

### 4.1 — Locators
- Understand Locator as a lazy retrying reference (vs DOM element in RTL)
- Study query priority: role > label > placeholder > text > altText > testId
- Chaining: `parent.getByRole('button')` ≡ RTL's `within(parent).getByRole('button')`
- `filter()` — narrow multi-match locators by text or contained locator
- `first()`, `last()`, `nth(n)` — index-based selection
- Strict mode — locators throw when multiple elements match
- Read: `node_modules/@playwright/test/lib/locator.js`

### 4.2 — Actions
- Actionability model: visible, stable, enabled, not-obscured, receives-pointer-events
- `click()`, `dblclick()`, `click({ modifiers })`, `click({ position })`
- `fill()` vs `pressSequentially()` — atomic set vs char-by-char
- `press()` for keyboard shortcuts and chord keys
- `hover()`, `dragTo()`, `focus()`, `blur()`
- `check()`, `uncheck()`, `selectOption()` — semantic form actions
- Read: Playwright source `packages/playwright-core/src/client/locator.ts`

### 4.3 — Assertions (expect)
- Web-first assertions: all assertions auto-retry until timeout
- `toBeVisible()`, `toBeHidden()`, `toBeEnabled()`, `toBeDisabled()`
- `toHaveText()`, `toContainText()` — string and regex variants
- `toHaveValue()`, `toHaveAttribute()`, `toHaveCSS()`
- `toHaveCount()` — multi-element locator assertions
- `toBeChecked()`, `toBeFocused()`
- `expect.soft()` — accumulate failures instead of stopping on first

### 4.4 — Async / Auto-waiting
- Auto-waiting eliminates most `waitFor` calls
- `locator.waitFor({ state: 'visible' | 'hidden' | 'attached' | 'detached' })`
- Per-assertion timeout override: `expect(loc).toBeVisible({ timeout: 2000 })`
- Loading state transitions: assert intermediate state exists, then resolves
- Debounce pattern — auto-wait covers debounce window

### 4.5 — Network
- `page.route(url, handler)` — intercept before request leaves browser
- `route.fulfill()` — mock response with status, headers, body
- `route.abort()` — simulate network error
- `route.continue()` — pass through with optional modification
- `page.waitForResponse(url)` — capture response for assertions
- Request inspection: `request.postData()`, `request.headers()`, `request.method()`

### 4.6 — Page Objects
- POM class pattern — locators as getters, interactions as methods
- `test.extend<Fixtures>()` — dependency injection for reusable components
- `hooksConfig` — pass data from test to `beforeMount` in `playwright/index.tsx`
- Use POM for: complex multi-step flows, shared interactions across test files

### 4.7 — Accessibility
- `getByRole` queries the real ARIA tree — fails if markup is inaccessible
- Keyboard navigation: `page.keyboard.press('Tab')` + `toBeFocused()`
- `aria-invalid`, `aria-describedby`, `aria-live` attribute assertions
- `toHaveAccessibilityDescription()` (Playwright 1.46+)
- Focus management in dialogs/modals
- Live region updates via `role="log"` / `aria-live="polite"`

### 4.8 — Failures
- Strict mode: locator resolves to >1 element → Error
- Timeout: element never reaches expected state → TimeoutError
- Actionability: disabled/hidden/obscured element → descriptive Error
- Missing `await`: silent false positives (test always passes)
- `count()`, `allTextContents()`, `innerHTML()` for diagnostic assertions

## Source Code Reading

- `node_modules/@playwright/test/lib/` — core test runner, fixtures, assertions
- `node_modules/@playwright/experimental-ct-react/` — mount adapter, CT hooks
- `node_modules/playwright-core/lib/client/locator.ts` — Locator implementation + auto-wait

## Escalation Challenges

- Implement a custom `renderWithProviders` equivalent using `hooksConfig` + `beforeMount`
- Write tests for a component that uses Suspense + lazy loading
- Probe: what happens if `mount` is called inside a `beforeAll` hook?
- Probe: can you test a component that uses `useId()` for label associations?
- Challenge: implement a `LocatorProxy` class that adds retry logic on top of Playwright locators
- Challenge: write a test that verifies exact Tab order across a complex form

## Deliverables

- [ ] All 8 experiment tabs render in browser (`npm run dev`)
- [ ] All spec files pass (`npm run test-ct`)
- [ ] `note.md` — pros/cons/when-to-use analysis vs RTL and Cypress

## Constraint

No E2E test in this POC. All tests use `@playwright/experimental-ct-react` `mount`.
Components are mounted in isolation — no full page / server required.
