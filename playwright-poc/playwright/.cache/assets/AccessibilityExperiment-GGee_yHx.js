import { j as jsxRuntimeExports, S as Section, I as Info, P as Pre } from './shared-CELB-2z2.js';
import { r as reactExports } from './index-DOy_UqYY.js';

function AccessibleForm() {
  const [name, setName] = reactExports.useState("");
  const [email, setEmail] = reactExports.useState("");
  const [errors, setErrors] = reactExports.useState({});
  const [submitted, setSubmitted] = reactExports.useState(false);
  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = "Name is required";
    if (!email.includes("@")) e.email = "Valid email required";
    return e;
  };
  const submit = (ev) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length === 0) setSubmitted(true);
  };
  if (submitted) return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { role: "status", "aria-live": "polite", children: "Form submitted!" }) });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: submit, noValidate: true, style: { display: "flex", flexDirection: "column", gap: 12, maxWidth: 280 }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("label", { htmlFor: "a11y-name", style: { display: "block", fontSize: 12, color: "#aaa", marginBottom: 3 }, children: "Name *" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          id: "a11y-name",
          "aria-describedby": errors.name ? "name-error" : void 0,
          "aria-invalid": !!errors.name,
          value: name,
          onChange: (e) => setName(e.target.value),
          style: { width: "100%", padding: "5px 8px", background: "#111", border: `1px solid ${errors.name ? "#ff6b6b" : "#333"}`, color: "#e0e0e0", borderRadius: 3 }
        }
      ),
      errors.name && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { id: "name-error", role: "alert", style: { fontSize: 11, color: "#ff6b6b" }, children: errors.name })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("label", { htmlFor: "a11y-email", style: { display: "block", fontSize: 12, color: "#aaa", marginBottom: 3 }, children: "Email *" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          id: "a11y-email",
          type: "text",
          "aria-describedby": errors.email ? "email-error" : void 0,
          "aria-invalid": !!errors.email,
          value: email,
          onChange: (e) => setEmail(e.target.value),
          style: { width: "100%", padding: "5px 8px", background: "#111", border: `1px solid ${errors.email ? "#ff6b6b" : "#333"}`, color: "#e0e0e0", borderRadius: 3 }
        }
      ),
      errors.email && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { id: "email-error", role: "alert", style: { fontSize: 11, color: "#ff6b6b" }, children: errors.email })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "submit", style: { padding: "6px 14px", background: "#1e1e1e", border: "1px solid #2a2a2a", color: "#c0c0c0", borderRadius: 3, fontSize: 13 }, children: "Submit" })
  ] });
}
function FocusTrap({ onClose }) {
  const [open, setOpen] = reactExports.useState(false);
  const firstRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    if (open) firstRef.current?.focus();
  }, [open]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        onClick: () => setOpen(true),
        style: { padding: "5px 12px", background: "#1e1e1e", border: "1px solid #2a2a2a", color: "#c0c0c0", borderRadius: 3, fontSize: 12 },
        children: "Open modal"
      }
    ),
    open && /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        role: "dialog",
        "aria-modal": "true",
        "aria-label": "Confirm action",
        style: { marginTop: 12, background: "#1a1a1a", border: "1px solid #333", borderRadius: 6, padding: 16, maxWidth: 280 },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { marginBottom: 12, fontSize: 13, color: "#aaa" }, children: "Are you sure?" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 8 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                ref: firstRef,
                onClick: () => {
                  setOpen(false);
                  onClose?.();
                },
                style: { padding: "5px 12px", background: "#2a1111", border: "1px solid #5a1111", color: "#ff6b6b", borderRadius: 3, fontSize: 12 },
                children: "Confirm"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => setOpen(false),
                style: { padding: "5px 12px", background: "#1e1e1e", border: "1px solid #2a2a2a", color: "#c0c0c0", borderRadius: 3, fontSize: 12 },
                children: "Cancel"
              }
            )
          ] })
        ]
      }
    )
  ] });
}
function LiveRegion() {
  const [messages, setMessages] = reactExports.useState([]);
  const [count, setCount] = reactExports.useState(0);
  const notify = () => {
    const n = count + 1;
    setCount(n);
    setMessages((m) => [...m, `Notification ${n}`]);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        onClick: notify,
        style: { padding: "5px 12px", background: "#1e1e1e", border: "1px solid #2a2a2a", color: "#c0c0c0", borderRadius: 3, fontSize: 12 },
        children: "Add notification"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        role: "log",
        "aria-live": "polite",
        "aria-label": "Notifications",
        "data-testid": "live-region",
        style: { marginTop: 10, background: "#0f0f0f", border: "1px solid #1e1e1e", borderRadius: 3, padding: 10, minHeight: 60, fontSize: 12 },
        children: messages.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { color: "#333" }, children: "No notifications" }) : messages.map((m, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#7ec8a0", lineHeight: 1.6 }, children: m }, i))
      }
    )
  ] });
}
function RoleFirstSection() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Section, { title: "7.1 — getByRole as accessibility signal", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { children: "If getByRole can't find your element, a screen reader can't either. Using role-first locators doubles as an a11y audit." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { marginBottom: 10 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(AccessibleForm, {}) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Pre, { children: `// Every getByRole call validates your ARIA semantics:
component.getByRole('textbox', { name: 'Name *' })     // requires <label> association
component.getByRole('button', { name: 'Submit' })      // requires accessible name
component.getByRole('alert')                           // requires role="alert" or aria-live
component.getByRole('dialog', { name: 'Confirm...' }) // requires aria-label on dialog

// If these fail, your component is inaccessible to screen readers.` })
  ] });
}
function AriaSection() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Section, { title: "7.2 — Asserting ARIA attributes", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { children: "Test that ARIA attributes are wired correctly — aria-invalid, aria-describedby, aria-expanded." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Pre, { children: `// aria-invalid on error:
await component.getByRole('button', { name: 'Submit' }).click()
const nameInput = component.getByRole('textbox', { name: 'Name *' })
await expect(nameInput).toHaveAttribute('aria-invalid', 'true')

// aria-describedby points to error message:
const describedBy = await nameInput.getAttribute('aria-describedby')
expect(describedBy).toBe('name-error')

// toHaveAccessibilityDescription() (Playwright 1.46+):
// await expect(nameInput).toHaveAccessibilityDescription('Name is required')` })
  ] });
}
function KeyboardSection() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Section, { title: "7.3 — Keyboard navigation and focus order", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { children: "Test Tab order and keyboard-only workflows. Real browser makes this accurate." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Pre, { children: `// Tab through form fields:
await component.getByRole('textbox', { name: 'Name *' }).focus()
await page.keyboard.press('Tab')
await expect(component.getByRole('textbox', { name: 'Email *' })).toBeFocused()
await page.keyboard.press('Tab')
await expect(component.getByRole('button', { name: 'Submit' })).toBeFocused()

// Submit via keyboard:
await page.keyboard.press('Enter')
await expect(component.getByRole('alert')).toBeVisible()   // validation error` })
  ] });
}
function FocusSection() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Section, { title: "7.4 — Focus management (dialog/modal)", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { children: "Opening a modal should move focus to the first interactive element inside it." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { marginBottom: 10 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(FocusTrap, {}) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Pre, { children: `// Focus moves to Confirm button when modal opens:
await component.getByRole('button', { name: 'Open modal' }).click()
const dialog = component.getByRole('dialog')
await expect(dialog).toBeVisible()

// First focusable element in dialog has focus:
const confirmBtn = dialog.getByRole('button', { name: 'Confirm' })
await expect(confirmBtn).toBeFocused()

// Close and verify focus returns to trigger:
await dialog.getByRole('button', { name: 'Cancel' }).click()
await expect(dialog).not.toBeVisible()` })
  ] });
}
function LiveRegionSection() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Section, { title: "7.5 — aria-live regions", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { children: "Assert that dynamic content updates are announced via live regions." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { marginBottom: 10 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(LiveRegion, {}) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Pre, { children: `// Verify live region updates after action:
await component.getByRole('button', { name: 'Add notification' }).click()
const log = component.getByRole('log', { name: 'Notifications' })
await expect(log).toContainText('Notification 1')

// Multiple notifications:
await component.getByRole('button', { name: 'Add notification' }).click()
await expect(log).toContainText('Notification 2')` })
  ] });
}
function AccessibilityExperiment() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { style: { fontSize: 18, marginBottom: 6, color: "#e0e0e0" }, children: "07 · Accessibility" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { color: "#666", fontSize: 13, marginBottom: 24, lineHeight: 1.6 }, children: "Playwright runs in a real browser with a real accessibility tree. Role-first locators are simultaneously a11y assertions. Use keyboard navigation tests to verify screen-reader-compatible UX." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(RoleFirstSection, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AriaSection, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(KeyboardSection, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(FocusSection, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(LiveRegionSection, {})
  ] });
}

export { AccessibleForm, FocusTrap, LiveRegion, AccessibilityExperiment as default };
//# sourceMappingURL=AccessibilityExperiment-GGee_yHx.js.map
