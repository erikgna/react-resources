import { j as jsxRuntimeExports, S as Section, I as Info, P as Pre } from './shared-CELB-2z2.js';
import { r as reactExports } from './index-DOy_UqYY.js';

function DelayedContent({ delayMs = 300 }) {
  const [loaded, setLoaded] = reactExports.useState(false);
  const [data, setData] = reactExports.useState(null);
  reactExports.useEffect(() => {
    const t = setTimeout(() => {
      setLoaded(true);
      setData("Loaded item");
    }, delayMs);
    return () => clearTimeout(t);
  }, [delayMs]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    !loaded && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { role: "status", "aria-label": "Loading", children: "Loading..." }),
    loaded && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { "data-testid": "result", children: data })
  ] });
}
function SearchDebounce({ debounceMs = 300 }) {
  const [query, setQuery] = reactExports.useState("");
  const [result, setResult] = reactExports.useState("");
  reactExports.useEffect(() => {
    if (!query) {
      setResult("");
      return;
    }
    const t = setTimeout(() => setResult(`Results for: ${query}`), debounceMs);
    return () => clearTimeout(t);
  }, [query, debounceMs]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("label", { htmlFor: "search-input", children: "Search" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "input",
      {
        id: "search-input",
        value: query,
        onChange: (e) => setQuery(e.target.value),
        placeholder: "Type to search...",
        style: { marginLeft: 8, padding: "4px 8px", background: "#111", border: "1px solid #333", color: "#e0e0e0", borderRadius: 3 }
      }
    ),
    result && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { "data-testid": "search-result", style: { marginTop: 8, fontSize: 13, color: "#aaa" }, children: result })
  ] });
}
function StepLoader() {
  const [step, setStep] = reactExports.useState("idle");
  const start = () => {
    setStep("loading");
    setTimeout(() => setStep("done"), 400);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        onClick: start,
        disabled: step !== "idle",
        style: { padding: "5px 12px", background: "#1e1e1e", border: "1px solid #2a2a2a", color: step === "idle" ? "#c0c0c0" : "#555", borderRadius: 3, fontSize: 12 },
        children: "Start"
      }
    ),
    step === "loading" && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { role: "status", style: { marginLeft: 8, color: "#ffa500" }, children: "Loading…" }),
    step === "done" && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { "data-testid": "done-indicator", style: { marginLeft: 8, color: "#4caf50" }, children: "Done!" })
  ] });
}
function AutoWaitSection() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Section, { title: "4.1 — Auto-waiting: no manual waitFor needed", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { children: "Playwright waits automatically. expect().toBeVisible() retries until visible or timeout. click() waits until element is actionable. This is the biggest UX win over RTL." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { marginBottom: 10 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(DelayedContent, {}) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Pre, { children: `// RTL — you must explicit waitFor async state:
const item = await waitFor(() => screen.getByTestId('result'))
expect(item).toHaveTextContent('Loaded item')

// Playwright CT — assertion retries until condition met:
const component = await mount(<DelayedContent />)

// No waitFor() — expect retries automatically up to default 5s timeout:
await expect(component.getByTestId('result')).toBeVisible()
await expect(component.getByTestId('result')).toHaveText('Loaded item')

// The loading spinner disappears — no explicit wait needed:
await expect(component.getByRole('status')).not.toBeVisible()` })
  ] });
}
function LoadingTransitionSection() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Section, { title: "4.2 — Loading → Done state transition", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { children: "Assert intermediate states — loading spinner visible, then gone, then result appears." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { marginBottom: 10 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(StepLoader, {}) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Pre, { children: `const component = await mount(<StepLoader />)

await component.getByRole('button', { name: 'Start' }).click()

// Loading state — may be brief, but Playwright catches it:
await expect(component.getByRole('status')).toBeVisible()

// Final state — auto-waits for loading to finish:
await expect(component.getByTestId('done-indicator')).toBeVisible()
await expect(component.getByRole('status')).not.toBeVisible()

// Button disabled during loading:
await expect(component.getByRole('button', { name: 'Start' })).toBeDisabled()` })
  ] });
}
function DebounceSection() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Section, { title: "4.3 — Debounced input — waitFor custom condition", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { children: "Debounced updates require waiting beyond the debounce window. Use locator.waitFor() for explicit conditions." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { marginBottom: 10 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(SearchDebounce, {}) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Pre, { children: `const component = await mount(<SearchDebounce />)

await component.getByLabel('Search').fill('react')

// Result appears after 300ms debounce — auto-wait handles it:
await expect(component.getByTestId('search-result'))
  .toHaveText('Results for: react')

// Explicit locator.waitFor() — useful when you want to control timeout:
await component.getByTestId('search-result').waitFor({ state: 'visible', timeout: 1000 })

// waitFor({ state }) options: 'attached' | 'detached' | 'visible' | 'hidden'` })
  ] });
}
function TimeoutSection() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Section, { title: "4.4 — Custom timeouts per assertion", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { children: "Override the default 5s timeout per assertion. Useful for known-slow operations or fast-failing tests." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Pre, { children: `// Per-assertion timeout (ms):
await expect(component.getByTestId('result'))
  .toBeVisible({ timeout: 2000 })           // fail after 2s instead of 5s

// Short timeout for elements that should appear fast:
await expect(component.getByRole('button'))
  .toBeEnabled({ timeout: 500 })

// locator.waitFor() with timeout:
await component.getByTestId('result').waitFor({
  state: 'visible',
  timeout: 3000,
})

// Global timeout configured in playwright-ct.config.ts:
// use: { actionTimeout: 10_000, expect: { timeout: 5000 } }` })
  ] });
}
function AsyncExperiment() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { style: { fontSize: 18, marginBottom: 6, color: "#e0e0e0" }, children: "04 · Async" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { style: { color: "#666", fontSize: 13, marginBottom: 24, lineHeight: 1.6 }, children: [
      "Playwright's auto-waiting model eliminates most explicit ",
      /* @__PURE__ */ jsxRuntimeExports.jsx("code", { children: "waitFor" }),
      " calls. Every action waits for actionability; every assertion retries until satisfied. This is a fundamental architectural difference from RTL."
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AutoWaitSection, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(LoadingTransitionSection, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(DebounceSection, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(TimeoutSection, {})
  ] });
}

export { DelayedContent, SearchDebounce, StepLoader, AsyncExperiment as default };
//# sourceMappingURL=AsyncExperiment-DSP3wz2x.js.map
