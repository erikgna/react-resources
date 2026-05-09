# Cypress — Analysis

## Pros

1. **Real browser execution** — tests run in actual Chromium/Firefox/WebKit. `getBoundingClientRect()`, scroll position, CSS layout, and hover states behave exactly as in production. RTL's jsdom fakes all of this.

2. **Time-travel debugging** — Cypress pins each command step in the Test Runner. Click any step to see a DOM snapshot at that moment. Unmatched for debugging failures.

3. **cy.intercept() is powerful** — intercept, stub, delay, or spy on any fetch/XHR request at the network layer, without changing application code. Works across frameworks.

4. **Component testing mode** — mount components directly in real Chromium without a server. 3-5x faster than E2E; more realistic than jsdom. The best of both worlds for component-level tests.

5. **Retry-ability eliminates most explicit waits** — every assertion retries until passing. Writing `cy.get('[data-cy=msg]').should('be.visible')` is equivalent to a 4-second polling loop.

6. **cy.clock() makes timer tests deterministic** — takes over Date/setTimeout/setInterval. No more sleeping for animation timers or polling intervals.

7. **Excellent developer experience** — interactive Test Runner with selector playground, command log, and hot reload on spec file save.

## Cons

1. **Slow compared to Vitest/RTL** — E2E tests launch a browser per spec file. 10-100x slower than jsdom-based tests. A suite of 100 E2E tests can take 10+ minutes.

2. **Requires a running server for E2E** — must start `vite dev` before `cypress run`. CI pipelines need `start-server-and-test` or similar.

3. **No native multi-tab support** — Cypress controls one tab per test. Testing flows that open new tabs requires workarounds (stub `window.open`).

4. **Same-origin restriction** — Cypress can't visit multiple origins in one test (`cy.visit('https://external.com')` from a test at `localhost:5173` fails). Use `chromeWebSecurity: false` with caution.

5. **JavaScript-only** — Cypress specs are JS/TS only. Cannot call native OS APIs, filesystem, or non-JS processes without a Cypress task (IPC to Node).

6. **cy.clock() doesn't affect fetch timing** — `cy.tick()` advances setTimeout/setInterval but does NOT delay/speed up actual network requests. Use `cy.intercept()` delay for that.

## When Cypress Fits

- Critical user flows end-to-end (login → checkout, form submission, auth redirect)
- Features that rely on real browser layout (tooltips, dropdowns, modals, scroll triggers)
- Animation and transition testing with `cy.clock()`
- Network error state testing (offline mode, server errors, slow responses)
- Component-level testing where jsdom layout limitations matter
- Visual regression with Percy or Applitools plugins

## When Cypress Breaks Down

- Unit-testing pure functions or hooks — use Vitest + RTL instead
- Testing server-side logic — use supertest / integration tests
- Multi-tab flows — stub `window.open` or use Playwright which supports multi-page
- Cross-origin flows — use Playwright with `page.goto('https://...')` support
- Running thousands of component tests quickly — Vitest + jsdom is 10-100x faster

## Performance Notes

- Cypress E2E spec startup: ~2-5s (browser launch + page load)
- Component test startup: ~500ms-1s (no server, just bundling)
- `cy.intercept()` adds ~0ms overhead — network layer interception
- `cy.tick(5000)` completes instantly — no real time passes
- `cy.wait(1000)` adds 1 real second — avoid

## Key Decision Point

**Cypress vs Playwright**

Both run real browsers. Playwright advantages: multi-tab, multi-origin, built-in `page.waitForSelector` with more granular options, Python/Java/C# bindings. Cypress advantages: time-travel debugging, cy.intercept() ergonomics, component testing mode, JS/TS ecosystem fit. For React SPAs, Cypress is the default choice. For complex multi-page flows or non-JS stacks, Playwright wins.

**Cypress vs RTL**

Not either/or — complementary layers. RTL + Vitest: fast unit/integration tests, hook testing, provider isolation. Cypress E2E: critical paths that require a real browser, network, or routing. Cypress Component: middle ground — real browser at component granularity without a server. The right stack: Vitest + RTL for the bulk, Cypress for smoke + critical E2E.

**Cypress Component vs Storybook interaction tests**

Storybook's `@storybook/test` uses the same RTL/userEvent API in a real browser via a Chromium addon. Cypress component testing uses the full Cypress command API. Cypress wins on network interception (`cy.intercept` in component tests) and debugging (time-travel). Storybook wins on design system documentation and visual comparison across variants.
