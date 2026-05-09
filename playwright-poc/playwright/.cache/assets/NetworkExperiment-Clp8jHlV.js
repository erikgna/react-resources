import { j as jsxRuntimeExports, S as Section, I as Info, P as Pre } from './shared-CELB-2z2.js';
import { r as reactExports } from './index-DOy_UqYY.js';

function UserFeed() {
  const [users, setUsers] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [error, setError] = reactExports.useState(null);
  reactExports.useEffect(() => {
    fetch("/api/users").then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    }).then((data) => {
      setUsers(data);
      setLoading(false);
    }).catch((e) => {
      setError(e.message);
      setLoading(false);
    });
  }, []);
  if (loading) return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { role: "status", children: "Loading users…" }) });
  if (error) return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { role: "alert", "data-testid": "error-msg", children: error }) });
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { "data-testid": "user-list", children: users.map((u) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { "data-testid": `user-${u.id}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: u.name }),
    " — ",
    u.email
  ] }, u.id)) }) });
}
function PostForm() {
  const [title, setTitle] = reactExports.useState("");
  const [status, setStatus] = reactExports.useState("idle");
  const submit = async (e) => {
    e.preventDefault();
    setStatus("submitting");
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title })
      });
      if (!res.ok) throw new Error("Failed");
      setStatus("done");
    } catch {
      setStatus("error");
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: submit, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("label", { htmlFor: "post-title", children: "Post title" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "input",
      {
        id: "post-title",
        value: title,
        onChange: (e) => setTitle(e.target.value),
        style: { marginLeft: 8, padding: "4px 8px", background: "#111", border: "1px solid #333", color: "#e0e0e0", borderRadius: 3 }
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        type: "submit",
        disabled: status === "submitting",
        style: { marginLeft: 8, padding: "4px 10px", background: "#1e1e1e", border: "1px solid #2a2a2a", color: "#c0c0c0", borderRadius: 3 },
        children: "Publish"
      }
    ),
    status === "submitting" && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { role: "status", style: { marginLeft: 8 }, children: "Saving…" }),
    status === "done" && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { "data-testid": "success-msg", style: { marginLeft: 8, color: "#4caf50" }, children: "Published!" }),
    status === "error" && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { role: "alert", style: { marginLeft: 8, color: "#ff6b6b" }, children: "Error" })
  ] });
}
function RouteSection() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Section, { title: "5.1 — page.route() to intercept and mock responses", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { children: "page.route() intercepts fetch/XHR at the network layer — before the request leaves the browser. Only available in real-browser testing (Playwright), not jsdom (RTL)." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { marginBottom: 10 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(UserFeed, {}) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Pre, { children: `test('mocks user list', async ({ mount, page }) => {
  // Intercept BEFORE mounting (route is registered on the page)
  await page.route('/api/users', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([
      { id: 1, name: 'Alice', email: 'alice@example.com' },
      { id: 2, name: 'Bob',   email: 'bob@example.com' },
    ]),
  }))

  const component = await mount(<UserFeed />)
  await expect(component.getByTestId('user-list')).toBeVisible()
  await expect(component.getByText('Alice')).toBeVisible()
  await expect(component.getByText('Bob')).toBeVisible()
})` })
  ] });
}
function ErrorSection() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Section, { title: "5.2 — Mocking error responses", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { children: "Test error states by returning non-2xx status codes or aborting the request." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Pre, { children: `// HTTP error response:
await page.route('/api/users', route => route.fulfill({
  status: 500,
  body: 'Internal Server Error',
}))
const component = await mount(<UserFeed />)
await expect(component.getByRole('alert')).toContainText('HTTP 500')

// Network abort (simulates offline / CORS / DNS failure):
await page.route('/api/users', route => route.abort())
const component = await mount(<UserFeed />)
await expect(component.getByRole('alert')).toBeVisible()` })
  ] });
}
function InspectSection() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Section, { title: "5.3 — Inspecting outgoing requests", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { children: "Capture request details — method, headers, body — to assert what the component sends." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { marginBottom: 10 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(PostForm, {}) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Pre, { children: `test('POST sends correct body', async ({ mount, page }) => {
  let capturedBody: Record<string, unknown> | null = null

  await page.route('/api/posts', async route => {
    capturedBody = JSON.parse(route.request().postData() ?? '{}')
    await route.fulfill({ status: 201, body: '{}' })
  })

  const component = await mount(<PostForm />)
  await component.getByLabel('Post title').fill('My Post')
  await component.getByRole('button', { name: 'Publish' }).click()

  await expect(component.getByTestId('success-msg')).toBeVisible()
  expect(capturedBody).toEqual({ title: 'My Post' })
})` })
  ] });
}
function WaitForResponseSection() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Section, { title: "5.4 — page.waitForResponse() for assertion ordering", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { children: "waitForResponse waits for a matching network response, useful for asserting response contents." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Pre, { children: `test('captures response', async ({ mount, page }) => {
  await page.route('/api/users', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([{ id: 1, name: 'Alice', email: 'a@b.com' }]),
  }))

  // Start waiting BEFORE the action that triggers the request:
  const responsePromise = page.waitForResponse('/api/users')
  const component = await mount(<UserFeed />)
  const response = await responsePromise

  expect(response.status()).toBe(200)
  const data = await response.json()
  expect(data).toHaveLength(1)

  await expect(component.getByText('Alice')).toBeVisible()
})` })
  ] });
}
function NetworkExperiment() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { style: { fontSize: 18, marginBottom: 6, color: "#e0e0e0" }, children: "05 · Network" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { style: { color: "#666", fontSize: 13, marginBottom: 24, lineHeight: 1.6 }, children: [
      "Playwright intercepts the real network stack — fetch, XHR, WebSocket. This is a fundamental capability absent from RTL (jsdom has no network layer) and much more ergonomic than Cypress's ",
      /* @__PURE__ */ jsxRuntimeExports.jsx("code", { children: "cy.intercept()" }),
      "."
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(RouteSection, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ErrorSection, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(InspectSection, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(WaitForResponseSection, {})
  ] });
}

export { PostForm, UserFeed, NetworkExperiment as default };
//# sourceMappingURL=NetworkExperiment-Clp8jHlV.js.map
