# Cypress — Deep POC

## Objective

Deeply understand Cypress's selector model, command queue, retry-ability, network interception, component testing mode, and failure patterns. Build intuition for how Cypress differs from jsdom-based testing (RTL + Vitest) by running real Chromium.

## Minimal Setup

1. Install: `npm install`
2. Browser demo: `npm run dev`
3. Open Cypress Test Runner: `npm run cy:open` (requires dev server running)
4. Run E2E headless: `npm run cy:run` (requires dev server running)
5. Component testing: `npm run cy:component` (no dev server needed)

## Implementation Plan

### 4.1 — Selectors
- `data-cy` attribute convention: purpose-built for testing, survives refactors
- `cy.get()` full CSS selector support vs `cy.contains()` text-based
- `.within()` for scoped queries; `.eq()` / `.first()` / `.last()` for indexed selection
- Selector priority: data-cy > aria > data-testid > text > CSS class > position
- Read: `node_modules/cypress/lib/cypress/require.js` — how cy.get() builds the query

### 4.2 — Interactions
- `cy.click()` vs `cy.trigger('click')` — click fires the full event sequence
- `cy.type()` fires keydown/keypress/keyup per character with special key support
- `cy.select()` on native `<select>` elements — by value or display text
- `cy.check()` / `cy.uncheck()` assert element is checkbox/radio before acting
- `.trigger()` for hover, drag-start, custom DOM events

### 4.3 — Assertions
- Chai-based: `.should()` retries until passing or timeout (default 4000ms)
- Existence vs visibility: `exist` vs `be.visible` — `display:none` element exists but isn't visible
- Attribute assertions: `have.attr`, `be.disabled`, `have.class`
- Chaining with `.and()` — multiple assertions on same subject
- Imperative `expect()` inside `.then()` for DOM value extraction

### 4.4 — Network
- `cy.intercept()` intercepts at the network layer — works with fetch + XHR
- `.as('alias')` + `cy.wait('@alias')` — wait for specific request before asserting
- Stubs: static response body, statusCode, delay, forceNetworkError
- Spies: intercept without response body to verify request shape
- `cy.fixture()` — load test data from `cypress/fixtures/*.json`

### 4.5 — Async
- Retry-ability: every cy command retries assertions until passing (not one-shot)
- `cy.clock()` freezes Date/setTimeout/setInterval — controls time without waiting
- `cy.tick(ms)` advances frozen time instantly
- `cy.wait(ms)` — last resort explicit sleep; prefer retry-ability or network aliases
- Timeout customization: `cy.get('[data-cy=x]', { timeout: 10000 })`

### 4.6 — Forms
- Full submit flow: type → validate → error state → fix → success
- `aria-invalid` attribute signals error to assistive tech — testable with `have.attr`
- `role="alert"` on error messages — query by role to assert accessibility
- `cy.stub().as()` + `cy.get('@spy').should('have.been.calledWith', ...)` to verify callbacks
- Label associations (`htmlFor` + `id`) enable accessible selectors

### 4.7 — Component Testing
- `cy.mount(<Component />)` — real Chromium, no server, no `cy.visit()`
- Mount with providers inline or via custom `Cypress.Commands.add('mountWith...')`
- `cypress/support/component.ts` — global import and command registration
- E2E vs Component mode tradeoffs: routing vs speed vs isolation
- Component specs: `*.cy.tsx` in `src/experiments/`

### 4.8 — Failures
- Detached DOM: element re-queried by React between get() and assertion — re-query after action
- `cy.on('uncaught:exception', () => false)` — prevent React errors from failing specs
- Flaky tests from `cy.wait(ms)` — replace with retry-ability or cy.clock()
- Screenshot on failure: automatic in `cypress run`; manual via `cy.screenshot()`
- Race conditions: `cy.clock()` + `cy.tick()` makes non-deterministic timer tests stable

## Source Code Reading

- `node_modules/cypress/lib/` — Cypress internals
- `node_modules/@cypress/browserify-preprocessor/` — how specs are bundled
- Cypress source on GitHub: `packages/driver/src/` — cy command implementation

## Deliverables

- [ ] All 8 experiment tabs render in browser (`npm run dev`)
- [ ] All 8 E2E spec files visible in Cypress Test Runner (`npm run cy:open`)
- [ ] Component specs run (`npm run cy:component`)
- [ ] `note.md` — pros/cons/when-to-use analysis

## Escalation

- Intercept a GraphQL endpoint by inspecting `req.body.operationName`
- Write a custom Cypress command `cy.login()` that sets session cookies directly
- Test drag-and-drop with `@4tw/cypress-drag-drop` plugin
- Probe: what is Cypress's retry-ability limit — can you construct a test that always flakes?
- Challenge: implement `cy.waitForReact()` using `cy.window()` and React DevTools global hook
- Probe: does `cy.clock()` affect `fetch()` response timing or only timers?

## Constraints

No `cy.wait(ms)` unless genuinely necessary. No positional CSS selectors (`nth-child`) as primary strategy. Test through the UI the user sees — same constraint as RTL.
