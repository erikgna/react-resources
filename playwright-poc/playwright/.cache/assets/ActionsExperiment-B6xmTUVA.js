import { j as jsxRuntimeExports, S as Section, I as Info, R as Row, L as Log, P as Pre } from './shared-CELB-2z2.js';
import { r as reactExports } from './index-DOy_UqYY.js';

function Counter() {
  const [count, setCount] = reactExports.useState(0);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("button", { "aria-label": "Decrement", onClick: () => setCount((c) => c - 1), children: "−" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { "data-testid": "count", children: count }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("button", { "aria-label": "Increment", onClick: () => setCount((c) => c + 1), children: "+" })
  ] });
}
function TextForm({ onSubmit }) {
  const [value, setValue] = reactExports.useState("");
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: (e) => {
    e.preventDefault();
    onSubmit?.(value);
  }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("label", { htmlFor: "text-input", children: "Message" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "input",
      {
        id: "text-input",
        value,
        onChange: (e) => setValue(e.target.value),
        placeholder: "Type here...",
        style: { marginLeft: 8, padding: "4px 8px", background: "#111", border: "1px solid #333", color: "#e0e0e0", borderRadius: 3 }
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "submit", style: { marginLeft: 8, padding: "4px 10px", background: "#1e1e1e", border: "1px solid #2a2a2a", color: "#c0c0c0", borderRadius: 3 }, children: "Submit" }),
    value && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { "data-testid": "preview", children: [
      " → ",
      value
    ] })
  ] });
}
function SelectForm() {
  const [fruit, setFruit] = reactExports.useState("apple");
  const [agreed, setAgreed] = reactExports.useState(false);
  const [size, setSize] = reactExports.useState("m");
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 10 }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("label", { htmlFor: "fruit-select", children: "Fruit: " }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "select",
        {
          id: "fruit-select",
          value: fruit,
          onChange: (e) => setFruit(e.target.value),
          style: { background: "#111", border: "1px solid #333", color: "#e0e0e0", padding: "3px 6px", borderRadius: 3 },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "apple", children: "Apple" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "banana", children: "Banana" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "cherry", children: "Cherry" })
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { "data-testid": "fruit-display", children: [
        " ",
        fruit
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked: agreed, onChange: (e) => setAgreed(e.target.checked) }),
        " ",
        "I agree"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { "data-testid": "agree-display", children: [
        " ",
        agreed ? "yes" : "no"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { role: "radiogroup", "aria-label": "Size", children: [
      ["s", "m", "l"].map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { style: { marginRight: 10 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "radio", name: "size", value: s, checked: size === s, onChange: () => setSize(s) }),
        " ",
        s.toUpperCase()
      ] }, s)),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { "data-testid": "size-display", children: size })
    ] })
  ] });
}
function HoverCard() {
  const [hovered, setHovered] = reactExports.useState(false);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { position: "relative", display: "inline-block" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        onMouseEnter: () => setHovered(true),
        onMouseLeave: () => setHovered(false),
        style: { padding: "5px 12px", background: "#1e1e1e", border: "1px solid #2a2a2a", color: "#c0c0c0", borderRadius: 3, fontSize: 12 },
        children: "Hover me"
      }
    ),
    hovered && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { role: "tooltip", style: {
      position: "absolute",
      top: "100%",
      left: 0,
      marginTop: 4,
      background: "#222",
      border: "1px solid #333",
      borderRadius: 3,
      padding: "4px 10px",
      fontSize: 12,
      color: "#aaa",
      whiteSpace: "nowrap"
    }, children: "Tooltip content" })
  ] });
}
function ClickSection() {
  const [log, setLog] = reactExports.useState([]);
  const add = (msg) => setLog((l) => [...l, msg]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Section, { title: "2.1 — click() and actionability", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { children: "click() auto-waits for actionability: element must be visible, stable (not animating), enabled, and not obscured. No manual waitFor needed." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { style: { marginBottom: 10 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Counter, {}) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Row, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => add("single click"), style: { padding: "5px 12px", background: "#1e1e1e", border: "1px solid #2a2a2a", color: "#c0c0c0", borderRadius: 3, fontSize: 12 }, children: "Single" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onDoubleClick: () => add("double click"), style: { padding: "5px 12px", background: "#1e1e1e", border: "1px solid #2a2a2a", color: "#c0c0c0", borderRadius: 3, fontSize: 12 }, children: "Double" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Log, { entries: log }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Pre, { children: `await component.getByRole('button', { name: 'Increment' }).click()
await expect(component.getByTestId('count')).toHaveText('1')

// click() options:
await btn.click({ button: 'right' })          // right-click
await btn.click({ modifiers: ['Shift'] })     // Shift+click
await btn.dblclick()                           // double-click
await btn.click({ position: { x: 10, y: 5 } }) // exact position` })
  ] });
}
function FillSection() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Section, { title: "2.2 — fill() vs pressSequentially()", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { children: "fill() clears then sets value atomically. pressSequentially() dispatches real keydown/keypress/keyup events per character." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { marginBottom: 10 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(TextForm, {}) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Pre, { children: `// fill() — clears existing text, sets value, fires input + change events
await component.getByLabel('Message').fill('Hello world')
await expect(component.getByTestId('preview')).toContainText('Hello world')

// pressSequentially() — types one character at a time (tests debounce, IME)
await component.getByLabel('Message').pressSequentially('abc', { delay: 50 })

// clear() — just empties the field
await component.getByLabel('Message').clear()

// RTL equivalent:
// userEvent.type(input, 'text')       ≈ pressSequentially()
// fireEvent.change(input, { target: { value } })  ≈ fill()` })
  ] });
}
function PressSection() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Section, { title: "2.3 — press() for keyboard shortcuts", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { children: "press() sends a single key or chord. Uses Playwright's key naming (e.g. 'Enter', 'Control+A')." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Pre, { children: `// Single keys:
await input.press('Enter')           // submit form
await input.press('Escape')          // close modal
await input.press('Tab')             // move focus

// Key chords:
await input.press('Control+A')       // select all (Windows/Linux)
await input.press('Meta+A')          // select all (macOS)
await input.press('Shift+Tab')       // focus previous

// Key sequences via pressSequentially():
await input.pressSequentially('Hello{Enter}')  // NOT supported — use press() separately` })
  ] });
}
function HoverSection() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Section, { title: "2.4 — hover() for pointer events", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { children: "hover() moves pointer to element center (or given position). Triggers mouseenter/mousemove/mouseover." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { marginBottom: 10 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(HoverCard, {}) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Pre, { children: `await component.getByRole('button', { name: 'Hover me' }).hover()
await expect(component.getByRole('tooltip')).toBeVisible()
await expect(component.getByRole('tooltip')).toHaveText('Tooltip content')

// hover() with offset:
await element.hover({ position: { x: 5, y: 5 } })` })
  ] });
}
function FormControlsSection() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Section, { title: "2.5 — check() / selectOption() for form controls", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { children: "Semantic actions for checkboxes, radios, and selects. check() first verifies the element is a checkbox." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { marginBottom: 10 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectForm, {}) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Pre, { children: `// select dropdown by value, label, or index:
await component.getByLabel('Fruit').selectOption('banana')
await component.getByLabel('Fruit').selectOption({ label: 'Cherry' })
await expect(component.getByTestId('fruit-display')).toHaveText('banana')

// checkbox:
await component.getByLabel('I agree').check()
await expect(component.getByLabel('I agree')).toBeChecked()
await component.getByLabel('I agree').uncheck()

// radio (click or check):
await component.getByRole('radio', { name: 'L' }).check()
await expect(component.getByTestId('size-display')).toHaveText('l')` })
  ] });
}
function ActionsExperiment() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { style: { fontSize: 18, marginBottom: 6, color: "#e0e0e0" }, children: "02 · Actions" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { color: "#666", fontSize: 13, marginBottom: 24, lineHeight: 1.6 }, children: "Every Playwright action auto-waits for actionability before executing. No manual waits needed — Playwright checks visibility, stability, and enabled state." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ClickSection, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(FillSection, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(PressSection, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(HoverSection, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(FormControlsSection, {})
  ] });
}

export { Counter, HoverCard, SelectForm, TextForm, ActionsExperiment as default };
//# sourceMappingURL=ActionsExperiment-B6xmTUVA.js.map
