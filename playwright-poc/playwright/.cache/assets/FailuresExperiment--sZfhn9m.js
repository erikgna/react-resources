import { j as jsxRuntimeExports, S as Section, I as Info, P as Pre } from './shared-CELB-2z2.js';
import { r as reactExports } from './index-DOy_UqYY.js';

function TwoButtons() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("button", { children: "Save" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("button", { children: "Save draft" })
  ] });
}
function SlowAppear({ delayMs = 6e3 }) {
  const [visible, setVisible] = reactExports.useState(false);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        onClick: () => setTimeout(() => setVisible(true), delayMs),
        style: { padding: "5px 12px", background: "#1e1e1e", border: "1px solid #2a2a2a", color: "#c0c0c0", borderRadius: 3, fontSize: 12 },
        children: "Trigger"
      }
    ),
    visible && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { "data-testid": "result", children: "Appeared" })
  ] });
}
function DisabledButton() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("button", { disabled: true, style: { padding: "5px 12px", background: "#1e1e1e", border: "1px solid #2a2a2a", color: "#555", borderRadius: 3, fontSize: 12 }, children: "Cannot click" }) });
}
function HiddenTarget() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { visibility: "hidden" }, "data-testid": "hidden-span", children: "Hidden text" }) });
}
function StrictModeSection() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Section, { title: "8.1 — Strict mode: multiple matches throw", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { children: "Every locator is strict by default. If multiple elements match, Playwright throws immediately rather than silently returning the first match (as jQuery would)." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { background: "#0f0f0f", border: "1px solid #222", borderRadius: 3, padding: 14, marginBottom: 10 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(TwoButtons, {}) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Pre, { children: `// FAILS — both "Save" and "Save draft" match /save/i:
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
// Error: strict mode violation: getByRole('button') resolved to 2 elements` })
  ] });
}
function TimeoutSection() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Section, { title: "8.2 — Timeout: element never appears", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { children: "Playwright waits up to the timeout (default 5s) before throwing. The error message shows the locator and what was found." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { background: "#0f0f0f", border: "1px solid #222", borderRadius: 3, padding: 14, marginBottom: 10 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(SlowAppear, {}) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Pre, { children: `// Timeout error message:
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
// - Check Playwright Trace Viewer: playwright show-report` })
  ] });
}
function ActionabilitySection() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Section, { title: "8.3 — Actionability failures", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { children: "Playwright checks actionability before every action. Non-actionable elements throw descriptive errors." }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { background: "#0f0f0f", border: "1px solid #222", borderRadius: 3, padding: 14, marginBottom: 10 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DisabledButton, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(HiddenTarget, {})
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Pre, { children: `// Click disabled button:
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
await expect(btn).toBeVisible()    // throws if not visible` })
  ] });
}
function CTScopingSection() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Section, { title: "8.4 — CT locator scopes to INSIDE the component root", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { children: "Playwright CT's component locator searches INSIDE the root element. If your target IS the root element, the locator finds nothing. Always wrap conditional root-level elements in a stable container div." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Pre, { children: `// WRONG — component root IS the target element
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
// CORRECT: if (done) return <div><div data-testid="success">Done!</div></div>` })
  ] });
}
function DebuggingSection5() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Section, { title: "8.4 — Debugging tools", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { children: "Multiple debugging paths: pause(), --debug flag, trace viewer, slowMo, screenshot." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Pre, { children: `// Pause test execution — opens browser DevTools:
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
// In Playwright Inspector: pick locator → element highlights in browser` })
  ] });
}
function MissingAwaitSection6() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Section, { title: "8.5 — Missing await: silent false positives", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { children: "Forgetting await on assertions makes the test pass silently regardless of state. This is the hardest-to-catch bug in Playwright tests." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Pre, { children: `// WRONG — assertion returns Promise, never awaited, always "passes":
expect(component.getByText('Error')).toBeVisible()   // no await!

// CORRECT:
await expect(component.getByText('Error')).toBeVisible()

// WRONG — action not awaited, next line runs before action completes:
component.getByRole('button').click()   // no await!
await expect(component.getByTestId('result')).toBeVisible()  // race condition

// TypeScript helps: enable @typescript-eslint/no-floating-promises
// ESLint rule: "playwright/no-floating-actionability-checks"` })
  ] });
}
function FailuresExperiment() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { style: { fontSize: 18, marginBottom: 6, color: "#e0e0e0" }, children: "08 · Failures" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { color: "#666", fontSize: 13, marginBottom: 24, lineHeight: 1.6 }, children: "Understanding how Playwright fails is essential for writing reliable tests. Strict mode, actionability checks, and async errors have distinct messages and distinct fixes." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(StrictModeSection, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(TimeoutSection, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ActionabilitySection, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(CTScopingSection, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(DebuggingSection5, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(MissingAwaitSection6, {})
  ] });
}

export { DisabledButton, HiddenTarget, SlowAppear, TwoButtons, FailuresExperiment as default };
//# sourceMappingURL=FailuresExperiment--sZfhn9m.js.map
