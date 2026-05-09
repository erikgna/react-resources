import { j as jsxRuntimeExports, S as Section, I as Info, P as Pre, R as Row } from './shared-CELB-2z2.js';
import { r as reactExports } from './index-DOy_UqYY.js';

function ToggleBox() {
  const [visible, setVisible] = reactExports.useState(true);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setVisible((v) => !v), style: { padding: "5px 12px", background: "#1e1e1e", border: "1px solid #2a2a2a", color: "#c0c0c0", borderRadius: 3, fontSize: 12 }, children: visible ? "Hide" : "Show" }),
    visible && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { "data-testid": "box", style: { marginLeft: 10, color: "#4caf50" }, children: "I am visible" })
  ] });
}
function DisabledField() {
  const [enabled, setEnabled] = reactExports.useState(false);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 8 }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked: enabled, onChange: (e) => setEnabled(e.target.checked) }),
      " ",
      "Enable field"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "input",
      {
        "data-testid": "controlled-input",
        disabled: !enabled,
        placeholder: "Only when enabled",
        style: { padding: "4px 8px", background: "#111", border: "1px solid #333", color: "#e0e0e0", borderRadius: 3 }
      }
    )
  ] });
}
function CheckboxGroup() {
  const [items, setItems] = reactExports.useState([
    { id: "a", label: "Alpha", checked: false },
    { id: "b", label: "Beta", checked: true },
    { id: "c", label: "Gamma", checked: false }
  ]);
  const toggle = (id) => setItems((prev) => prev.map((i) => i.id === id ? { ...i, checked: !i.checked } : i));
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    items.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { style: { display: "block", marginBottom: 4 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked: item.checked, onChange: () => toggle(item.id) }),
      " ",
      item.label
    ] }, item.id)),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { "data-testid": "checked-count", style: { marginTop: 6, fontSize: 12, color: "#888" }, children: [
      items.filter((i) => i.checked).length,
      " selected"
    ] })
  ] });
}
function ColorBox() {
  const [color, setColor] = reactExports.useState("#4a9eff");
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        "data-testid": "color-box",
        style: { width: 40, height: 40, background: color, borderRadius: 4, marginBottom: 8 }
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        onClick: () => setColor("#ff6b6b"),
        style: { padding: "4px 10px", background: "#1e1e1e", border: "1px solid #2a2a2a", color: "#c0c0c0", borderRadius: 3, fontSize: 12 },
        children: "Turn red"
      }
    )
  ] });
}
function FocusTarget() {
  const [focused, setFocused] = reactExports.useState(false);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "input",
      {
        "data-testid": "focus-input",
        onFocus: () => setFocused(true),
        onBlur: () => setFocused(false),
        placeholder: "Click to focus",
        style: { padding: "4px 8px", background: "#111", border: "1px solid #333", color: "#e0e0e0", borderRadius: 3 }
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { marginLeft: 8, fontSize: 12, color: focused ? "#4caf50" : "#666" }, children: focused ? "focused" : "blurred" })
  ] });
}
function VisibilitySection() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Section, { title: "3.1 — toBeVisible() / toBeHidden()", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { children: "Playwright assertions auto-retry until the condition is met (or timeout). Unlike RTL synchronous throws." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { marginBottom: 10 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(ToggleBox, {}) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Pre, { children: `// Auto-retrying assertions — no await waitFor() needed
await expect(component.getByTestId('box')).toBeVisible()
await expect(component.getByTestId('box')).toBeHidden()

// toBeVisible() passes if element is in DOM and not hidden
// toBeHidden()  passes if element is absent OR has display:none / visibility:hidden

// Negate with .not:
await expect(component.getByText('Error')).not.toBeVisible()` })
  ] });
}
function TextSection() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Section, { title: "3.2 — toHaveText() / toContainText()", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { children: "toHaveText matches the full trimmed text. toContainText matches a substring." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Pre, { children: `await expect(heading).toHaveText('Welcome, Alice')        // exact match
await expect(heading).toHaveText(/welcome/i)               // regex
await expect(container).toContainText('partial string')    // substring

// On a multi-element locator (list), pass an array:
await expect(component.getByRole('listitem'))
  .toHaveText(['Apple', 'Banana', 'Cherry'])                // exact ordered match
await expect(component.getByRole('listitem'))
  .toContainText(['Apple', 'Cherry'])                       // subset match` })
  ] });
}
function ValueSection() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Section, { title: "3.3 — toHaveValue() / toHaveAttribute()", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { children: "toHaveValue reads the current input value. toHaveAttribute checks HTML attributes." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { marginBottom: 10 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(DisabledField, {}) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Pre, { children: `// Input value:
await expect(component.getByLabel('Message')).toHaveValue('Hello')
await expect(component.getByLabel('Message')).toHaveValue(/^Hello/)

// HTML attributes:
await expect(input).toHaveAttribute('type', 'email')
await expect(input).toHaveAttribute('placeholder', /search/i)
await expect(input).not.toHaveAttribute('disabled')

// toBeEnabled() / toBeDisabled() — preferred over attribute check:
await expect(component.getByTestId('controlled-input')).toBeDisabled()
await checkbox.check()
await expect(component.getByTestId('controlled-input')).toBeEnabled()` })
  ] });
}
function CountSection() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Section, { title: "3.4 — toHaveCount() for list assertions", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { children: "toHaveCount verifies the number of elements matched by a locator. Retries until count matches." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { marginBottom: 10 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(CheckboxGroup, {}) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Pre, { children: `await expect(component.getByRole('checkbox')).toHaveCount(3)

// Useful before indexing:
const items = component.getByRole('listitem')
await expect(items).toHaveCount(5)
await items.nth(4).click()          // safe — count verified` })
  ] });
}
function StateSection() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Section, { title: "3.5 — toBeChecked() / toBeFocused() / toBeEnabled()", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { children: "Web-first state assertions — all auto-retry and work in real browser DOM." }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Row, { style: { marginBottom: 10, gap: 24 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CheckboxGroup, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(FocusTarget, {})
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Pre, { children: `// Checkbox state:
await expect(component.getByLabel('Beta')).toBeChecked()
await expect(component.getByLabel('Alpha')).not.toBeChecked()

// Focus state:
await component.getByTestId('focus-input').focus()
await expect(component.getByTestId('focus-input')).toBeFocused()

// Enabled/disabled:
await expect(component.getByTestId('controlled-input')).toBeDisabled()
await component.getByLabel('Enable field').check()
await expect(component.getByTestId('controlled-input')).toBeEnabled()` })
  ] });
}
function CSSSection() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Section, { title: "3.6 — toHaveCSS() for style assertions", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { children: "toHaveCSS checks computed styles. Useful for testing conditional styling without snapshot overhead." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { marginBottom: 10 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(ColorBox, {}) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Pre, { children: `// Computed style (resolved value, not shorthand):
await expect(component.getByTestId('color-box'))
  .toHaveCSS('background-color', 'rgb(74, 158, 255)')

// After interaction:
await component.getByRole('button', { name: 'Turn red' }).click()
await expect(component.getByTestId('color-box'))
  .toHaveCSS('background-color', 'rgb(255, 107, 107)')` })
  ] });
}
function SoftSection() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Section, { title: "3.7 — expect.soft() — collect all failures before throwing", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { children: "Soft assertions don't stop the test on failure — they accumulate and report all failures at the end." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Pre, { children: `// Hard assertion (default): stops test immediately on failure
await expect(heading).toHaveText('Wrong text')  // test stops here

// Soft assertion: continues, collects failures
await expect.soft(heading).toHaveText('Wrong text')
await expect.soft(button).toBeEnabled()
// ... test continues
// All failures reported together at end of test

// Use when you want to check multiple things in one pass
// (e.g. form validation state — many fields may have issues simultaneously)` })
  ] });
}
function AssertionsExperiment() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { style: { fontSize: 18, marginBottom: 6, color: "#e0e0e0" }, children: "03 · Assertions" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { style: { color: "#666", fontSize: 13, marginBottom: 24, lineHeight: 1.6 }, children: [
      "All Playwright ",
      /* @__PURE__ */ jsxRuntimeExports.jsx("code", { children: "expect()" }),
      " assertions are web-first: they auto-retry until the condition is met or timeout is reached. Unlike RTL which throws synchronously, Playwright assertions return Promises."
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(VisibilitySection, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(TextSection, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ValueSection, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(CountSection, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(StateSection, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(CSSSection, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(SoftSection, {})
  ] });
}

export { CheckboxGroup, ColorBox, DisabledField, FocusTarget, ToggleBox, AssertionsExperiment as default };
//# sourceMappingURL=AssertionsExperiment-BpuFiS4y.js.map
