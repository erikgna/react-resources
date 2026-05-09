import { useState } from 'react'
import { Section, Info, Pre } from '../shared'

// ─── Components under test ────────────────────────────────────────────────────

export function TwoButtons() {
  return (
    <div>
      <button>Save</button>
      <button>Save draft</button>
    </div>
  )
}

export function SlowAppear({ delayMs = 6000 }: { delayMs?: number }) {
  const [visible, setVisible] = useState(false)
  return (
    <div>
      <button onClick={() => setTimeout(() => setVisible(true), delayMs)}
        style={{ padding: '5px 12px', background: '#1e1e1e', border: '1px solid #2a2a2a', color: '#c0c0c0', borderRadius: 3, fontSize: 12 }}>
        Trigger
      </button>
      {visible && <span data-testid="result">Appeared</span>}
    </div>
  )
}

export function DisabledButton() {
  // Wrapper required: Playwright CT's component locator scopes to INSIDE the root element.
  // A root-level <button> would be the scope container — nothing would be found inside it.
  return (
    <div>
      <button disabled style={{ padding: '5px 12px', background: '#1e1e1e', border: '1px solid #2a2a2a', color: '#555', borderRadius: 3, fontSize: 12 }}>
        Cannot click
      </button>
    </div>
  )
}

export function HiddenTarget() {
  return (
    <div>
      <span style={{ visibility: 'hidden' }} data-testid="hidden-span">Hidden text</span>
    </div>
  )
}

// ─── 8.1 Strict mode ─────────────────────────────────────────────────────────

function StrictModeSection() {
  return (
    <Section title="8.1 — Strict mode: multiple matches throw">
      <Info>
        Every locator is strict by default. If multiple elements match, Playwright throws
        immediately rather than silently returning the first match (as jQuery would).
      </Info>
      <div style={{ background: '#0f0f0f', border: '1px solid #222', borderRadius: 3, padding: 14, marginBottom: 10 }}>
        <TwoButtons />
      </div>
      <Pre>{`// FAILS — both "Save" and "Save draft" match /save/i:
await component.getByText(/save/i).click()
// Error: strict mode violation: getByText(/save/i) resolved to 2 elements

// FIX 1 — be more specific:
await component.getByRole('button', { name: 'Save' }).click()   // exact match

// FIX 2 — getByText with exact:true:
await component.getByText('Save', { exact: true }).click()

// FIX 3 — first() if order is predictable:
await component.getByText(/save/i).first().click()

// ALSO FAILS — 2 buttons, no name filter:
await component.getByRole('button').click()
// Error: strict mode violation: getByRole('button') resolved to 2 elements`}</Pre>
    </Section>
  )
}

// ─── 8.2 Timeout errors ──────────────────────────────────────────────────────

function TimeoutSection() {
  return (
    <Section title="8.2 — Timeout: element never appears">
      <Info>Playwright waits up to the timeout (default 5s) before throwing. The error message shows the locator and what was found.</Info>
      <div style={{ background: '#0f0f0f', border: '1px solid #222', borderRadius: 3, padding: 14, marginBottom: 10 }}>
        <SlowAppear />
      </div>
      <Pre>{`// Timeout error message:
// TimeoutError: locator.click: Timeout 5000ms exceeded.
//   Call log:
//   - waiting for getByTestId('result')

// COMMON CAUSES:
// 1. Wrong selector — typo in testId, role, or text
// 2. Component never reaches that state (bug)
// 3. Race condition — assert before action completes
// 4. Missing await — forgot await before click()

// DIAGNOSE:
// - Add page.pause() to freeze test and inspect DOM
// - Run with --debug flag: playwright test --debug
// - Check Playwright Trace Viewer: playwright show-report`}</Pre>
    </Section>
  )
}

// ─── 8.3 Actionability failures ──────────────────────────────────────────────

function ActionabilitySection() {
  return (
    <Section title="8.3 — Actionability failures">
      <Info>Playwright checks actionability before every action. Non-actionable elements throw descriptive errors.</Info>
      <div style={{ background: '#0f0f0f', border: '1px solid #222', borderRadius: 3, padding: 14, marginBottom: 10 }}>
        <DisabledButton />
        <HiddenTarget />
      </div>
      <Pre>{`// Click disabled button:
// Error: locator.click: Element is not enabled
//   LocatorAssertionError: Expected to be enabled

// Click hidden element:
// Error: locator.click: Element is not visible

// ACTIONABILITY CHECKLIST (all must pass before action):
// ✓ Attached  — in the DOM
// ✓ Visible   — not display:none, visibility:hidden, opacity:0
// ✓ Stable    — not animating / position not changing
// ✓ Enabled   — not disabled attribute
// ✓ Receives pointer events — not covered by overlay

// To check actionability without acting:
await expect(btn).toBeEnabled()    // throws if not enabled
await expect(btn).toBeVisible()    // throws if not visible`}</Pre>
    </Section>
  )
}

// ─── 8.4 CT component locator scoping ────────────────────────────────────────

function CTScopingSection() {
  return (
    <Section title="8.4 — CT locator scopes to INSIDE the component root">
      <Info>
        Playwright CT's component locator searches INSIDE the root element.
        If your target IS the root element, the locator finds nothing.
        Always wrap conditional root-level elements in a stable container div.
      </Info>
      <Pre>{`// WRONG — component root IS the target element
function AlertBox({ msg }: { msg: string }) {
  return <div role="alert">{msg}</div>   // root element
}
// component.getByRole('alert') → looks INSIDE the div → finds nothing

// CORRECT — target element is inside a wrapper
function AlertBox({ msg }: { msg: string }) {
  return <div><div role="alert">{msg}</div></div>
}
// component.getByRole('alert') → finds the inner div ✓

// Same applies to conditional renders:
// WRONG:  if (done) return <div data-testid="success">Done!</div>
// CORRECT: if (done) return <div><div data-testid="success">Done!</div></div>`}</Pre>
    </Section>
  )
}

// ─── 8.5 Debugging ───────────────────────────────────────────────────────────

function DebuggingSection5() {
  return (
    <Section title="8.4 — Debugging tools">
      <Info>Multiple debugging paths: pause(), --debug flag, trace viewer, slowMo, screenshot.</Info>
      <Pre>{`// Pause test execution — opens browser DevTools:
await page.pause()                 // freezes until you press Resume in overlay

// Run with interactive debug mode:
// npx playwright test --debug
// Opens Playwright Inspector with step-through + locator picker

// Slow down all actions (ms):
// playwright-ct.config.ts: use: { launchOptions: { slowMo: 500 } }

// Trace viewer — captures DOM snapshots, network, console:
// playwright-ct.config.ts: use: { trace: 'on' }
// After run: npx playwright show-report

// Screenshot on failure:
// playwright-ct.config.ts: use: { screenshot: 'only-on-failure' }

// Highlight element without acting:
// In Playwright Inspector: pick locator → element highlights in browser`}</Pre>
    </Section>
  )
}

// ─── 8.6 Missing await ────────────────────────────────────────────────────────

function MissingAwaitSection6() {
  return (
    <Section title="8.5 — Missing await: silent false positives">
      <Info>
        Forgetting await on assertions makes the test pass silently regardless of state.
        This is the hardest-to-catch bug in Playwright tests.
      </Info>
      <Pre>{`// WRONG — assertion returns Promise, never awaited, always "passes":
expect(component.getByText('Error')).toBeVisible()   // no await!

// CORRECT:
await expect(component.getByText('Error')).toBeVisible()

// WRONG — action not awaited, next line runs before action completes:
component.getByRole('button').click()   // no await!
await expect(component.getByTestId('result')).toBeVisible()  // race condition

// TypeScript helps: enable @typescript-eslint/no-floating-promises
// ESLint rule: "playwright/no-floating-actionability-checks"`}</Pre>
    </Section>
  )
}

export default function FailuresExperiment() {
  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 6, color: '#e0e0e0' }}>08 · Failures</h2>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
        Understanding how Playwright fails is essential for writing reliable tests.
        Strict mode, actionability checks, and async errors have distinct messages and distinct fixes.
      </p>
      <StrictModeSection />
      <TimeoutSection />
      <ActionabilitySection />
      <CTScopingSection />
      <DebuggingSection5 />
      <MissingAwaitSection6 />
    </div>
  )
}
