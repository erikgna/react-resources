import { j as jsxRuntimeExports, S as Section, I as Info, P as Pre } from './shared-CELB-2z2.js';
import { r as reactExports } from './index-DOy_UqYY.js';

function GreetingCard({ name, role }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { children: [
      "Welcome, ",
      name
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { "data-testid": "role-label", children: [
      "Role: ",
      role
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("button", { "aria-label": "Close card", children: "×" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: "", alt: "Profile photo" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("input", { placeholder: "Search..." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("label", { htmlFor: "email-input", children: "Email" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("input", { id: "email-input", type: "email", placeholder: "you@example.com" })
  ] });
}
function UserList() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { "data-testid": "user-alice", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Alice" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { children: "Edit" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { "data-testid": "user-bob", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Bob" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { children: "Edit" })
    ] })
  ] });
}
function ProductList() {
  const products = ["Apple", "Banana", "Cherry"];
  return /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { role: "list", children: products.map((name) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { role: "listitem", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: name }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("button", { children: "Add to cart" })
  ] }, name)) });
}
function LocatorPriority() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Section, { title: "1.1 — Locator priority: role > label > text > testId", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { children: "Playwright mirrors RTL's priority. getByRole queries the ARIA tree — same interface a screen reader uses." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { background: "#0f0f0f", border: "1px solid #222", borderRadius: 3, padding: 14, marginBottom: 10 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(GreetingCard, { name: "Alice", role: "Admin" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Pre, { children: `// Priority (highest → lowest)
component.getByRole('heading', { name: /welcome/i })     // 1st: ARIA role
component.getByLabel('Email')                             // 2nd: label association
component.getByPlaceholder('Search...')                   // 3rd: placeholder
component.getByText('Role: Admin')                        // 4th: text content
component.getByAltText('Profile photo')                   // 5th: alt text
component.getByTestId('role-label')                       // Last resort` })
  ] });
}
function LazyLocators() {
  const [show, setShow] = reactExports.useState(false);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Section, { title: "1.2 — Locator is a lazy retrying reference (not a DOM element)", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { children: "Key shift from RTL: a Locator does not resolve immediately. It re-evaluates on every action and assertion, enabling auto-waiting." }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 8, marginBottom: 10 }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => setShow((v) => !v),
          style: { padding: "5px 12px", background: "#1e1e1e", border: "1px solid #2a2a2a", color: "#c0c0c0", borderRadius: 3, fontSize: 12 },
          children: "Toggle element"
        }
      ),
      show && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { "data-testid": "lazy-target", children: "Now visible" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Pre, { children: `// RTL: getByText() returns a DOM element — throws immediately if absent
const el = screen.getByText('Hello')   // Error thrown NOW if missing

// Playwright: getByText() returns a Locator — no error yet
const loc = component.getByText('Hello')  // no evaluation yet

// Evaluation happens at action/assertion time with automatic retrying:
await loc.click()                    // retries until element is clickable
await expect(loc).toBeVisible()      // retries until visible (or timeout)

// This means you can assign locators before the element exists:
const result = component.getByTestId('lazy-target')  // ok even if hidden
await toggle.click()
await expect(result).toBeVisible()   // waits up to 5s by default` })
  ] });
}
function ChainingLocators() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Section, { title: "1.3 — Chaining locators (equivalent to RTL within())", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { children: "Chain locator methods to scope queries to a subtree. Playwright enforces strict mode — getByRole throws if it finds multiple matches." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { background: "#0f0f0f", border: "1px solid #222", borderRadius: 3, padding: 14, marginBottom: 10 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(UserList, {}) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Pre, { children: `// Both rows have an "Edit" button.
// getByRole('button', { name: 'Edit' }) would THROW — strict mode, 2 matches.

// Option A: chain from a unique parent
const aliceRow = component.getByTestId('user-alice')
await aliceRow.getByRole('button', { name: 'Edit' }).click()

// Option B: filter() on a multi-match locator (see 1.4)
const aliceEdit = component.getByRole('listitem')
  .filter({ has: component.getByText('Alice') })
  .getByRole('button', { name: 'Edit' })
await aliceEdit.click()

// RTL equivalent: within(aliceRow).getByRole('button', { name: 'Edit' })` })
  ] });
}
function FilterSection() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Section, { title: "1.4 — filter() for content-based disambiguation", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { children: "filter() narrows a multi-match locator without needing a unique data-testid. Best for dynamic lists." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { background: "#0f0f0f", border: "1px solid #222", borderRadius: 3, padding: 14, marginBottom: 10 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(ProductList, {}) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Pre, { children: `// Three rows, each with "Add to cart". Targeting Banana specifically:
const bananaRow = component.getByRole('listitem')
  .filter({ hasText: 'Banana' })

await expect(bananaRow).toHaveCount(1)
await bananaRow.getByRole('button', { name: 'Add to cart' }).click()

// filter() by locator presence:
const activeRow = component.getByRole('listitem')
  .filter({ has: component.locator('.is-active') })

// filter() chains are composable — each filter() narrows further:
component.getByRole('listitem')
  .filter({ hasText: /Banana/i })
  .filter({ has: component.locator('[data-available]') })` })
  ] });
}
function NthSection() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Section, { title: "1.5 — first() / last() / nth(n)", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { children: "Index-based selection. Prefer filter() when content is available — nth() breaks if list order changes." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Pre, { children: `const items = component.getByRole('listitem')

await expect(items).toHaveCount(3)   // assert length before indexing
await items.first().click()          // 1st match
await items.last().click()           // last match
await items.nth(1).click()           // 0-indexed → 2nd item

// Combine with chaining:
await items.nth(2).getByRole('button').click()` })
  ] });
}
function LocatorsExperiment() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { style: { fontSize: 18, marginBottom: 6, color: "#e0e0e0" }, children: "01 · Locators" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { style: { color: "#666", fontSize: 13, marginBottom: 24, lineHeight: 1.6 }, children: [
      "Playwright Locators are lazy, retrying references — not DOM elements. They re-evaluate on every action and assertion, enabling auto-waiting without manual ",
      /* @__PURE__ */ jsxRuntimeExports.jsx("code", { children: "waitFor" }),
      ". Run ",
      /* @__PURE__ */ jsxRuntimeExports.jsx("code", { children: "npm run test-ct" }),
      " to see the corresponding tests pass."
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(LocatorPriority, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(LazyLocators, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ChainingLocators, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(FilterSection, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(NthSection, {})
  ] });
}

export { GreetingCard, ProductList, UserList, LocatorsExperiment as default };
//# sourceMappingURL=LocatorsExperiment-8MZj4RuF.js.map
