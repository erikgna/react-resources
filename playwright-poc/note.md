# Playwright CT — Notes

## Core Architecture: Locator vs DOM Element

The biggest conceptual shift from RTL:

**RTL**: `screen.getByRole('button')` evaluates immediately and returns an HTMLElement.
If the element doesn't exist, it throws right now.

**Playwright**: `component.getByRole('button')` returns a `Locator` — a lazy description
of how to find an element. It doesn't touch the DOM yet. Evaluation happens at
action/assertion time, with automatic retry up to the configured timeout.

This means:
- You can define locators before elements exist
- Assertions auto-retry without explicit `waitFor`
- No `act()` wrapping needed — Playwright handles async state

## Auto-Waiting Model

Every action checks "actionability" before executing:
1. **Attached** — element is in the DOM
2. **Visible** — not hidden (display:none, visibility:hidden, opacity:0)
3. **Stable** — position is not changing (not animating)
4. **Enabled** — not disabled attribute
5. **Receives pointer events** — no overlay covering it

RTL's `userEvent` has similar checks but through a different mechanism.
Playwright runs them in real browser, making them more accurate.

## Real Browser vs jsdom

RTL runs in jsdom — a JavaScript DOM implementation.
Playwright CT runs in Chromium (or Firefox/Safari).

Practical differences:
- CSS: jsdom doesn't compute layout/styles. Playwright's `toHaveCSS()` works because
  it reads computed styles from a real rendering engine.
- Network: jsdom has no network layer. RTL must mock fetch at the module level.
  Playwright CT uses `page.route()` at the browser's network layer — no import mocking.
- Events: jsdom simulates events. Playwright dispatches real browser events
  including mousemove, focus, pointer events — matching actual user behavior.
- Accessibility tree: jsdom's ARIA support is incomplete. Playwright uses Chromium's
  real accessibility tree — same tree used by screen readers and assistive technology.

## Strict Mode

Playwright locators are strict by default. If a locator matches more than one element
when an action or assertion executes, it throws:

```
Error: strict mode violation: locator('button') resolved to 2 elements
```

RTL's `getByRole` also throws on multiple matches. Same philosophy, different timing.
RTL throws immediately; Playwright throws when the locator resolves (lazily).

## Network Interception

`page.route()` is the most unique Playwright capability:

```ts
await page.route('/api/users', route => route.fulfill({
  status: 200,
  body: JSON.stringify([...]),
}))
```

RTL alternatives:
- `jest.mock()` or `vi.mock()` — mocks the fetch/axios module entirely
- `msw` (Mock Service Worker) — intercepts at the Service Worker level

Playwright's approach has no mocking infrastructure to set up.
It intercepts at the browser network level — the exact same path real requests take.
You can also abort requests, redirect them, or capture their bodies for inspection.

## Page Object Model

Playwright fixtures replace `beforeEach` + shared state:

```ts
const test = base.extend<{ form: LoginFormPOM }>({
  form: async ({ mount }, use) => {
    const component = await mount(<LoginForm />)
    await use(new LoginFormPOM(component))
  },
})
```

Benefits over RTL's pattern:
- Fixtures compose (fixture B can depend on fixture A)
- Full TypeScript inference on fixture types
- Automatic teardown (fixture is cleaned up after `use` completes)
- No shared mutable state between tests

## Pros

| Strength | Why it matters |
|---|---|
| Real browser | CSS, focus, pointer events, scroll — all accurate |
| Auto-waiting | Eliminates manual `waitFor`, `act()`, timers |
| Network interception | Test fetch-dependent components without module mocking |
| Strict locators | Fails fast on ambiguous selectors |
| Multi-browser | Catch browser-specific bugs (less relevant for CT) |
| Trace viewer | DOM snapshots + network + console per test step |
| Parallel by default | Tests run in parallel workers |

## Cons

| Weakness | Tradeoff |
|---|---|
| Slower than jsdom | Chromium boot adds ~1-2s per worker. RTL tests run in ms. |
| Async everywhere | Every assertion needs `await`. Easy to forget → silent pass. |
| Experimental CT API | `@playwright/experimental-ct-react` is still experimental |
| No snapshot testing | No `toMatchSnapshot` for component DOM (use visual snapshots instead) |
| Browser required | CI must install Chromium. Extra ~300MB CI artifact. |
| `hooksConfig` setup | Provider injection requires extra setup vs RTL's `wrapper` option |

## When to Use Which

**Use RTL when:**
- Unit/integration tests of isolated components
- Fast feedback loop is critical
- Team is already on Vitest/Jest
- No network or CSS assertions needed

**Use Playwright CT when:**
- Component behavior depends on CSS layout (scroll, position, size)
- Component makes fetch calls that need to be mocked at the network layer
- You need to verify focus management, keyboard navigation, or ARIA tree accuracy
- Visual regression testing is needed
- Test runs in multiple browsers

**Use Playwright E2E (not CT) when:**
- Testing full user flows across multiple pages
- Auth, cookies, local storage are involved
- You need to test the app as deployed (real server)

## CT Component Locator Scoping Quirk

Playwright CT's `mount()` returns a `Locator` that scopes to INSIDE the component's root element.
This means the root element itself is never matched — only its descendants are searched.

**Problem**: components that render a single target element as root:

```tsx
// WRONG — target IS the root
function AlertBox() { return <div role="alert">Error!</div> }
mount(<AlertBox />)
component.getByRole('alert')  // returns 0 — looking INSIDE the alert div
```

**Fix**: always wrap target elements in a container:

```tsx
// CORRECT — target is a descendant of root
function AlertBox() { return <div><div role="alert">Error!</div></div> }
mount(<AlertBox />)
component.getByRole('alert')  // finds it ✓
```

This applies to:
- Conditional renders (`if (done) return <div>Done</div>` → needs wrapping div)
- Single-element components (`<button>`, `<ul>`, `<form>` as root)
- Any element where target IS the root rather than inside root

## RTL → Playwright CT Migration Map

| RTL | Playwright CT |
|---|---|
| `render(<C />)` | `await mount(<C />)` |
| `screen.getByRole()` | `component.getByRole()` |
| `within(el).getByRole()` | `locator.getByRole()` (chain) |
| `userEvent.click()` | `await locator.click()` |
| `userEvent.type()` | `await locator.pressSequentially()` |
| `fireEvent.change()` | `await locator.fill()` |
| `waitFor(() => ...)` | usually not needed (auto-wait) |
| `expect(el).toBeInTheDocument()` | `await expect(loc).toBeVisible()` |
| `expect(el).toHaveTextContent()` | `await expect(loc).toHaveText()` |
| `expect(el).toHaveValue()` | `await expect(loc).toHaveValue()` |
| `jest.mock('fetch')` | `page.route('/url', ...)` |
| `render(<C />, { wrapper })` | `mount(<C />, { hooksConfig })` |
